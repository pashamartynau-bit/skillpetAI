import { NextResponse } from "next/server";

import { findAppUserBillingByInsforgeId } from "@/lib/strapi-billing";
import { requireAuthenticatedInsforgeUser } from "@/lib/server-insforge-auth";

export async function GET(request: Request) {
  try {
    const user = await requireAuthenticatedInsforgeUser(request);
    const billingDocument = await findAppUserBillingByInsforgeId(user.id);

    if (!billingDocument) {
      return NextResponse.json({ error: "Billing profile not found." }, { status: 404 });
    }

    return NextResponse.json({
      billing: {
        stripeBillingPlan: billingDocument.stripeBillingPlan ?? null,
        stripeCheckoutSessionId: billingDocument.stripeCheckoutSessionId ?? null,
        stripeCustomerId: billingDocument.stripeCustomerId ?? null,
        stripeLatestPaymentStatus: billingDocument.stripeLatestPaymentStatus ?? null,
        stripeSubscriptionCurrentPeriodEnd:
          billingDocument.stripeSubscriptionCurrentPeriodEnd ?? null,
        stripeSubscriptionId: billingDocument.stripeSubscriptionId ?? null,
        stripeSubscriptionStartDate: billingDocument.stripeSubscriptionStartDate ?? null,
        stripeSubscriptionStatus: billingDocument.stripeSubscriptionStatus ?? "none",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to load billing status.",
      },
      { status: error instanceof Error && error.message === "Unauthorized" ? 401 : 500 },
    );
  }
}

