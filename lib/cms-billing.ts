import type Stripe from "stripe";

import {
  FREEMIUM_FREE_CHAPTER_COUNT,
  isSubscriptionActive,
  normalizeCourseAccessType,
  type BillingPlan,
  type CourseAccessType,
} from "@/lib/billing";
import {
  fetchPublishedCourseBySlug,
  fetchPublishedCourseChapter,
  fetchPublishedCourses,
  type CourseRecord,
} from "@/lib/cms-courses";
import {
  findAppUserByInsforgeId,
  findAppUserByStripeCustomerId,
  upsertAppUser,
  type AppUserRecord,
} from "@/lib/cms-users";

export type AppUserBillingRecord = {
  documentId: string;
  email?: string | null;
  stripeBillingPlan?: BillingPlan | null;
  stripeCheckoutSessionId?: string | null;
  stripeCustomerId?: string | null;
  stripeLatestPaymentStatus?: string | null;
  stripeSubscriptionCurrentPeriodEnd?: string | null;
  stripeSubscriptionId?: string | null;
  stripeSubscriptionStartDate?: string | null;
  stripeSubscriptionStatus?: string | null;
};

function toBillingRecord(user: AppUserRecord): AppUserBillingRecord {
  return {
    documentId: user._id,
    email: user.email,
    stripeBillingPlan: user.stripeBillingPlan ?? null,
    stripeCheckoutSessionId: user.stripeCheckoutSessionId ?? null,
    stripeCustomerId: user.stripeCustomerId ?? null,
    stripeLatestPaymentStatus: user.stripeLatestPaymentStatus ?? null,
    stripeSubscriptionCurrentPeriodEnd: user.stripeSubscriptionCurrentPeriodEnd ?? null,
    stripeSubscriptionId: user.stripeSubscriptionId ?? null,
    stripeSubscriptionStartDate: user.stripeSubscriptionStartDate ?? null,
    stripeSubscriptionStatus: user.stripeSubscriptionStatus ?? null,
  };
}

export async function findAppUserBillingByInsforgeId(insforgeUserId: string) {
  const user = await findAppUserByInsforgeId(insforgeUserId);
  return user ? toBillingRecord(user) : null;
}

export async function findAppUserBillingByStripeCustomerId(stripeCustomerId: string) {
  const user = await findAppUserByStripeCustomerId(stripeCustomerId);
  return user ? toBillingRecord(user) : null;
}

export async function updateAppUserBillingDocument(
  documentId: string,
  data: Partial<AppUserBillingRecord>,
) {
  const user = await findAppUserByInsforgeIdFromDocument(documentId);

  if (!user) {
    throw new Error("Learner billing record was not found in Sanity.");
  }

  const { documentId: _ignored, ...fields } = data;
  const updated = await upsertAppUser(user.insforgeUserId, fields);
  return toBillingRecord(updated);
}

async function findAppUserByInsforgeIdFromDocument(documentId: string) {
  const { getSanityClient } = await import("@/lib/sanity");
  return getSanityClient().fetch<AppUserRecord | null>(
    `*[_type == "appUser" && _id == $documentId][0]{ _id, insforgeUserId }`,
    { documentId },
  );
}

export function getBillingPlanFromStripePrice(
  price: Stripe.Price | string | null | undefined,
): BillingPlan | null {
  if (!price || typeof price === "string") {
    return null;
  }

  if (price.recurring?.interval === "month") {
    return "monthly";
  }

  if (price.recurring?.interval === "year") {
    return "yearly";
  }

  return null;
}

export async function syncStripeSubscriptionForUser(
  appUserDocumentId: string,
  subscription: Stripe.Subscription | null,
  extra?: {
    checkoutSessionId?: string | null;
    latestPaymentStatus?: string | null;
    stripeBillingPlan?: BillingPlan | null;
    stripeCustomerId?: string | null;
  },
) {
  const typedSubscription = subscription as
    | (Stripe.Subscription & {
        current_period_end?: number;
        start_date?: number;
      })
    | null;
  const lineItemPrice = subscription?.items.data[0]?.price;
  const inferredPlan = getBillingPlanFromStripePrice(lineItemPrice);

  return updateAppUserBillingDocument(appUserDocumentId, {
    stripeBillingPlan: extra?.stripeBillingPlan ?? inferredPlan ?? null,
    stripeCheckoutSessionId: extra?.checkoutSessionId ?? undefined,
    stripeCustomerId:
      extra?.stripeCustomerId ??
      (typeof subscription?.customer === "string" ? subscription.customer : null),
    stripeLatestPaymentStatus: extra?.latestPaymentStatus ?? null,
    stripeSubscriptionCurrentPeriodEnd: typedSubscription?.current_period_end
      ? new Date(typedSubscription.current_period_end * 1000).toISOString()
      : null,
    stripeSubscriptionId: subscription?.id ?? null,
    stripeSubscriptionStartDate: typedSubscription?.start_date
      ? new Date(typedSubscription.start_date * 1000).toISOString()
      : null,
    stripeSubscriptionStatus: subscription?.status ?? "none",
  });
}

export type CourseAccessSnapshot = {
  canAccessCourse: boolean;
  canEnroll: boolean;
  course: CourseRecord;
  courseAccessType: CourseAccessType;
  hasActiveSubscription: boolean;
  lockedReason: string | null;
  unlockedChapterIds: string[];
};

function buildAccessSnapshot(
  course: CourseRecord,
  subscriptionStatus: string | null | undefined,
): CourseAccessSnapshot {
  const hasActiveSubscription = isSubscriptionActive(subscriptionStatus);
  const courseAccessType = normalizeCourseAccessType(course.accessType);
  let unlockedChapterIds = course.chapters.map((chapter) => chapter.id);
  let canEnroll = true;
  let canAccessCourse = true;
  let lockedReason: string | null = null;

  if (courseAccessType === "freemium" && !hasActiveSubscription) {
    unlockedChapterIds = course.chapters
      .slice(0, FREEMIUM_FREE_CHAPTER_COUNT)
      .map((chapter) => chapter.id);
    lockedReason = "Upgrade to unlock all chapters in this freemium course.";
  }

  if (courseAccessType === "paid" && !hasActiveSubscription) {
    unlockedChapterIds = [];
    canEnroll = false;
    canAccessCourse = false;
    lockedReason = "An active subscription is required for this paid course.";
  }

  return {
    canAccessCourse,
    canEnroll,
    course,
    courseAccessType,
    hasActiveSubscription,
    lockedReason,
    unlockedChapterIds,
  };
}

export async function getCourseAccessSnapshot(
  slug: string,
  subscriptionStatus: string | null | undefined,
) {
  const course = await fetchPublishedCourseBySlug(slug);
  return course ? buildAccessSnapshot(course, subscriptionStatus) : null;
}

export async function getChapterAccessSnapshot(
  courseSlug: string,
  chapterSlug: string,
  subscriptionStatus: string | null | undefined,
) {
  const [courseSnapshot, courseChapter] = await Promise.all([
    getCourseAccessSnapshot(courseSlug, subscriptionStatus),
    fetchPublishedCourseChapter(courseSlug, chapterSlug),
  ]);

  if (!courseSnapshot || !courseChapter) {
    return null;
  }

  const isUnlocked = courseSnapshot.unlockedChapterIds.includes(courseChapter.chapter.id);

  return {
    ...courseSnapshot,
    chapter: courseChapter.chapter,
    chapterIndex: courseChapter.chapterIndex,
    isUnlocked,
  };
}

export async function getCourseAccessSnapshotByDocumentId(
  courseDocumentId: string,
  subscriptionStatus: string | null | undefined,
) {
  const courses = await fetchPublishedCourses();
  const course = courses.find((candidate) => candidate.documentId === courseDocumentId) ?? null;
  return course ? buildAccessSnapshot(course, subscriptionStatus) : null;
}
