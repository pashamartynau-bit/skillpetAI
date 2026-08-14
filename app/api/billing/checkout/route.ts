import { NextResponse } from "next/server";

import { BILLING_PLANS, isBillingPlan } from "@/lib/billing";
import { requireAuthenticatedInsforgeUser } from "@/lib/server-insforge-auth";
import { getStripe } from "@/lib/stripe";
import {
  findAppUserBillingByInsforgeId,
  updateAppUserBillingDocument,
} from "@/lib/strapi-billing";

type CheckoutPayload = {
  plan?: string;
};

function isCheckoutPayload(value: unknown): value is CheckoutPayload {
  return typeof value === "object" && value !== null;
}

export async function POST(request: Request) {
  try {
    const user = await requireAuthenticatedInsforgeUser(request);
    const body = (await request.json()) as unknown;

    if (!isCheckoutPayload(body) || !isBillingPlan(body.plan)) {
      return NextResponse.json({ error: "Invalid billing plan." }, { status: 400 });
    }

    const appUser = await findAppUserBillingByInsforgeId(user.id);

    if (!appUser) {
      return NextResponse.json({ error: "App user not found in Strapi." }, { status: 404 });
    }

    const stripe = getStripe();
    const plan = BILLING_PLANS[body.plan];
    let customerId = appUser.stripeCustomerId ?? null;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: appUser.email ?? user.email,
        metadata: {
          appUserDocumentId: appUser.documentId,
          insforgeUserId: user.id,
        },
      });
      customerId = customer.id;
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const session = await stripe.checkout.sessions.create({
      cancel_url: `${appUrl}/dashboard/billing?checkout=cancelled`,
      customer: customerId,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              description: `SkillPet ${plan.label} subscription`,
              name: `SkillPet ${plan.label} Plan`,
            },
            recurring: {
              interval: plan.interval,
            },
            unit_amount: plan.priceCents,
          },
          quantity: 1,
        },
      ],
      metadata: {
        appUserDocumentId: appUser.documentId,
        billingPlan: body.plan,
        insforgeUserId: user.id,
      },
      mode: "subscription",
      subscription_data: {
        metadata: {
          appUserDocumentId: appUser.documentId,
          billingPlan: body.plan,
          insforgeUserId: user.id,
        },
      },
      success_url: `${appUrl}/dashboard/billing?checkout=success`,
    });

    await updateAppUserBillingDocument(appUser.documentId, {
      stripeBillingPlan: body.plan,
      stripeCheckoutSessionId: session.id,
      stripeCustomerId: customerId,
    });

    return NextResponse.json({ checkoutUrl: session.url });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to create checkout session.",
      },
      { status: error instanceof Error && error.message === "Unauthorized" ? 401 : 500 },
    );
  }
}

