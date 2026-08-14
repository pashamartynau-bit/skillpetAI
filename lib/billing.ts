export const BILLING_PLANS = {
  monthly: {
    interval: "month",
    label: "Monthly",
    priceCents: 599,
    priceDisplay: "$5.99/month",
  },
  yearly: {
    interval: "year",
    label: "Yearly",
    priceCents: 4999,
    priceDisplay: "$49.99/year",
  },
} as const;

export const COURSE_ACCESS_TYPES = {
  free: "free",
  freemium: "freemium",
  paid: "paid",
} as const;

export const FREEMIUM_FREE_CHAPTER_COUNT = 3;

export type BillingPlan = keyof typeof BILLING_PLANS;
export type CourseAccessType = keyof typeof COURSE_ACCESS_TYPES;

export type StripeSubscriptionStatus =
  | "active"
  | "canceled"
  | "incomplete"
  | "incomplete_expired"
  | "past_due"
  | "paused"
  | "trialing"
  | "unpaid"
  | "none";

export function isBillingPlan(value: string | null | undefined): value is BillingPlan {
  return value === "monthly" || value === "yearly";
}

export function isCourseAccessType(value: string | null | undefined): value is CourseAccessType {
  return value === "free" || value === "freemium" || value === "paid";
}

export function normalizeCourseAccessType(value: string | null | undefined): CourseAccessType {
  return isCourseAccessType(value) ? value : "free";
}

export function isSubscriptionActive(status: string | null | undefined) {
  return status === "active" || status === "trialing";
}

