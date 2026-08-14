import { NextResponse } from "next/server";
import type Stripe from "stripe";

import { getStripe } from "@/lib/stripe";
import {
  findAppUserBillingByStripeCustomerId,
  syncStripeSubscriptionForUser,
} from "@/lib/strapi-billing";

async function syncFromSubscription(
  subscription: Stripe.Subscription,
  extra?: {
    checkoutSessionId?: string | null;
    latestPaymentStatus?: string | null;
  },
) {
  const customerId =
    typeof subscription.customer === "string" ? subscription.customer : subscription.customer?.id;

  if (!customerId) {
    return;
  }

  const appUser = await findAppUserBillingByStripeCustomerId(customerId);

  if (!appUser) {
    return;
  }

  await syncStripeSubscriptionForUser(appUser.documentId, subscription, {
    ...extra,
    stripeCustomerId: customerId,
  });
}

export async function POST(request: Request) {
  try {
    const stripe = getStripe();
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      throw new Error("Missing STRIPE_WEBHOOK_SECRET.");
    }

    const signature = request.headers.get("stripe-signature");

    if (!signature) {
      return NextResponse.json({ error: "Missing Stripe signature." }, { status: 400 });
    }

    const body = await request.text();
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const subscriptionId =
          typeof session.subscription === "string" ? session.subscription : session.subscription?.id;

        if (!subscriptionId || typeof session.customer !== "string") {
          break;
        }

        const appUser = await findAppUserBillingByStripeCustomerId(session.customer);
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);

        if (appUser) {
          await syncStripeSubscriptionForUser(appUser.documentId, subscription, {
            checkoutSessionId: session.id,
            latestPaymentStatus: session.payment_status ?? null,
            stripeBillingPlan:
              session.metadata?.billingPlan === "monthly" || session.metadata?.billingPlan === "yearly"
                ? session.metadata.billingPlan
                : null,
            stripeCustomerId: session.customer,
          });
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        await syncFromSubscription(event.data.object as Stripe.Subscription);
        break;
      }
      case "invoice.payment_succeeded":
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice & {
          subscription?: string | Stripe.Subscription | null;
        };
        const subscriptionId =
          typeof invoice.subscription === "string" ? invoice.subscription : invoice.subscription?.id;

        if (!subscriptionId) {
          break;
        }

        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        await syncFromSubscription(subscription, {
          latestPaymentStatus: invoice.status ?? event.type,
        });
        break;
      }
      default:
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Stripe webhook failed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Webhook handling failed." },
      { status: 400 },
    );
  }
}
