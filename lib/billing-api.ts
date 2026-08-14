import { buildAuthenticatedHeaders } from "@/lib/authenticated-fetch";

import type { BillingPlan } from "@/lib/billing";

type BillingStatusResponse = {
  billing?: {
    stripeBillingPlan: BillingPlan | null;
    stripeCheckoutSessionId: string | null;
    stripeCustomerId: string | null;
    stripeLatestPaymentStatus: string | null;
    stripeSubscriptionCurrentPeriodEnd: string | null;
    stripeSubscriptionId: string | null;
    stripeSubscriptionStartDate: string | null;
    stripeSubscriptionStatus: string | null;
  };
  error?: string;
};

async function readJson<T>(response: Response) {
  return (await response.json()) as T;
}

export async function fetchBillingStatus() {
  const response = await fetch("/api/billing/status", {
    cache: "no-store",
    headers: buildAuthenticatedHeaders(),
    method: "GET",
  });
  const payload = await readJson<BillingStatusResponse>(response);

  if (!response.ok || !payload.billing) {
    throw new Error(payload.error ?? "Unable to load billing status.");
  }

  return payload.billing;
}

export async function createCheckoutSession(plan: BillingPlan) {
  const response = await fetch("/api/billing/checkout", {
    body: JSON.stringify({ plan }),
    headers: buildAuthenticatedHeaders({
      "Content-Type": "application/json",
    }),
    method: "POST",
  });
  const payload = await readJson<{ checkoutUrl?: string; error?: string }>(response);

  if (!response.ok || !payload.checkoutUrl) {
    throw new Error(payload.error ?? "Unable to create checkout session.");
  }

  return payload.checkoutUrl;
}

export async function createPortalSession() {
  const response = await fetch("/api/billing/portal", {
    headers: buildAuthenticatedHeaders(),
    method: "POST",
  });
  const payload = await readJson<{ portalUrl?: string; error?: string }>(response);

  if (!response.ok || !payload.portalUrl) {
    throw new Error(payload.error ?? "Unable to create customer portal session.");
  }

  return payload.portalUrl;
}
