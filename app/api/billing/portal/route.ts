import { NextResponse } from "next/server";

import { requireAuthenticatedInsforgeUser } from "@/lib/server-insforge-auth";
import { getStripe } from "@/lib/stripe";
import { findAppUserBillingByInsforgeId } from "@/lib/strapi-billing";

export async function POST(request: Request) {
  try {
    const user = await requireAuthenticatedInsforgeUser(request);
    const appUser = await findAppUserBillingByInsforgeId(user.id);

    if (!appUser?.stripeCustomerId) {
      return NextResponse.json(
        { error: "No Stripe customer is associated with this user yet." },
        { status: 400 },
      );
    }

    const stripe = getStripe();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const session = await stripe.billingPortal.sessions.create({
      customer: appUser.stripeCustomerId,
      return_url: `${appUrl}/dashboard/billing`,
    });

    return NextResponse.json({ portalUrl: session.url });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to create portal session.",
      },
      { status: error instanceof Error && error.message === "Unauthorized" ? 401 : 500 },
    );
  }
}

