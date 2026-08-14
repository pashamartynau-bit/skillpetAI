"use client";

import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { startTransition, useEffect, useState } from "react";
import { CheckCircle2, CreditCard, ExternalLink, Loader2, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useDashboardProfile } from "@/components/dashboard-shell";
import { BILLING_PLANS, isSubscriptionActive, type BillingPlan } from "@/lib/billing";
import {
  createCheckoutSession,
  createPortalSession,
  fetchBillingStatus,
} from "@/lib/billing-api";

type BillingState = Awaited<ReturnType<typeof fetchBillingStatus>>;

export function BillingPageScreen({
  checkoutState,
}: {
  checkoutState?: string;
}) {
  const router = useRouter();
  const { loadingProfile, profile } = useDashboardProfile();
  const [billing, setBilling] = useState<BillingState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  useEffect(() => {
    if (loadingProfile || !profile) {
      return;
    }

    let cancelled = false;

    async function load() {
      try {
        const nextBilling = await fetchBillingStatus();

        if (!cancelled) {
          startTransition(() => {
            setBilling(nextBilling);
            setError(null);
          });
        }
      } catch (loadError) {
        if (!cancelled) {
          if (loadError instanceof Error && loadError.message === "Unauthorized") {
            router.replace("/login");
            return;
          }
          setError(loadError instanceof Error ? loadError.message : "Unable to load billing.");
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [loadingProfile, profile, router]);

  const statusLabel =
    !billing?.stripeSubscriptionStatus || billing.stripeSubscriptionStatus === "none"
      ? "Free tier"
      : billing.stripeSubscriptionStatus.replaceAll("_", " ");

  async function handleSubscribe(plan: BillingPlan) {
      try {
        setPendingAction(plan);
        const url = await createCheckoutSession(plan);
        globalThis.location.assign(url);
    } catch (checkoutError) {
      if (checkoutError instanceof Error && checkoutError.message === "Unauthorized") {
        router.replace("/login");
        return;
      }
      setError(
        checkoutError instanceof Error
          ? checkoutError.message
          : "Unable to start Stripe checkout.",
      );
    } finally {
      setPendingAction(null);
    }
  }

  async function handlePortal() {
      try {
        setPendingAction("portal");
        const url = await createPortalSession();
        globalThis.location.assign(url);
    } catch (portalError) {
      if (portalError instanceof Error && portalError.message === "Unauthorized") {
        router.replace("/login");
        return;
      }
      setError(
        portalError instanceof Error
          ? portalError.message
          : "Unable to open the customer portal.",
      );
    } finally {
      setPendingAction(null);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <section className="rounded-[2rem] border border-white/70 bg-white/88 p-6 shadow-[0_32px_90px_-56px_rgba(34,46,84,0.5)] backdrop-blur md:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-[#eef9f0] px-4 py-2 text-sm font-semibold text-[#2ca949]">
              <Sparkles className="h-4 w-4" />
              Billing
            </div>
            <h1 className="mt-4 text-4xl font-semibold tracking-[-0.06em] text-[#16214d]">
              Subscription & billing
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[#697391]">
              Subscribe with Stripe, unlock paid and freemium content, and manage your plan
              through the customer portal.
            </p>
          </div>

          <div className="rounded-[1.5rem] border border-[#e7ebf3] bg-[#f8fbff] px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7481a8]">
              Current status
            </p>
            <p className="mt-2 text-2xl font-semibold capitalize text-[#1b2559]">{statusLabel}</p>
            {billing?.stripeSubscriptionCurrentPeriodEnd ? (
              <p className="mt-1 text-sm text-[#697391]">
                Renews or expires on{" "}
                {format(new Date(billing.stripeSubscriptionCurrentPeriodEnd), "PPP")}
              </p>
            ) : (
              <p className="mt-1 text-sm text-[#697391]">No active renewal date yet.</p>
            )}
          </div>
        </div>

        {checkoutState === "success" ? (
          <p className="mt-6 rounded-2xl bg-[#eef9f0] px-4 py-3 text-sm font-medium text-[#2b8d3d]">
            Checkout completed. Your subscription will appear here once Stripe sends the webhook.
          </p>
        ) : null}
        {checkoutState === "cancelled" ? (
          <p className="mt-6 rounded-2xl bg-[#fff5ea] px-4 py-3 text-sm font-medium text-[#a15d1c]">
            Checkout was cancelled. Your current plan was not changed.
          </p>
        ) : null}
        {error ? (
          <p className="mt-6 rounded-2xl bg-[#fff1f1] px-4 py-3 text-sm font-medium text-[#b25b5b]">
            {error}
          </p>
        ) : null}

        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {(Object.entries(BILLING_PLANS) as [BillingPlan, (typeof BILLING_PLANS)[BillingPlan]][]).map(
            ([planKey, plan]) => {
              const isCurrentPlan = billing?.stripeBillingPlan === planKey;

              return (
                <article
                  key={planKey}
                  className="rounded-[1.75rem] border border-[#e7ebf3] bg-[linear-gradient(180deg,rgba(250,252,255,0.96),rgba(255,255,255,0.98))] p-6 shadow-[0_18px_54px_-42px_rgba(34,46,84,0.35)]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#6b79a3]">
                        {plan.label}
                      </p>
                      <p className="mt-3 text-4xl font-semibold tracking-[-0.06em] text-[#16214d]">
                        {planKey === "monthly" ? "$5.99" : "$49.99"}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-[#697391]">
                        {planKey === "monthly"
                          ? "Flexible monthly access for all paid and locked freemium chapters."
                          : "Best value annual access for the full SkillPet learning catalog."}
                      </p>
                    </div>

                    {isCurrentPlan ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#eef9f0] px-3 py-1 text-xs font-semibold text-[#2ca949]">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Current plan
                      </span>
                    ) : null}
                  </div>

                  <Button
                    onClick={() => void handleSubscribe(planKey)}
                    disabled={pendingAction !== null}
                    className="mt-6 h-12 w-full rounded-2xl bg-accent px-5 font-semibold text-white hover:bg-accent-strong"
                  >
                    {pendingAction === planKey ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Redirecting to Stripe...
                      </>
                    ) : (
                      <>
                        <CreditCard className="h-4 w-4" />
                        Choose {plan.label}
                      </>
                    )}
                  </Button>
                </article>
              );
            },
          )}
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Button
            onClick={() => void handlePortal()}
            disabled={!billing?.stripeCustomerId || pendingAction !== null}
            className="h-12 rounded-2xl bg-[#eef3ff] px-5 font-semibold text-[#415bd0] hover:bg-[#e3ebff]"
          >
            {pendingAction === "portal" ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Opening portal...
              </>
            ) : (
              <>
                <ExternalLink className="h-4 w-4" />
                Manage in customer portal
              </>
            )}
          </Button>

          {billing ? (
            <div className="flex items-center rounded-2xl bg-[#f5f7fb] px-4 py-3 text-sm text-[#66708f]">
              Latest payment status: {billing.stripeLatestPaymentStatus ?? "not available yet"}
            </div>
          ) : null}
        </div>

        {billing && isSubscriptionActive(billing.stripeSubscriptionStatus) ? (
          <p className="mt-6 text-sm font-medium text-[#2b8d3d]">
            Your subscription is currently active and course access checks should unlock paid
            content on the server.
          </p>
        ) : null}
      </section>
    </div>
  );
}
