import type Stripe from "stripe";

import {
  FREEMIUM_FREE_CHAPTER_COUNT,
  isSubscriptionActive,
  normalizeCourseAccessType,
  type BillingPlan,
  type CourseAccessType,
} from "@/lib/billing";
import {
  fetchPublishedCourses,
  fetchPublishedCourseBySlug,
  fetchPublishedCourseChapter,
  type CourseRecord,
} from "@/lib/strapi-courses";

type StrapiListResponse<TDocument> = {
  data: TDocument[];
};

type StrapiSingleResponse<TDocument> = {
  data: TDocument;
};

export type StrapiAppUserBillingDocument = {
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

const STRAPI_BASE_URL = process.env.STRAPI_BASE_URL ?? "http://localhost:1337";
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN;
const STRAPI_USERS_COLLECTION = process.env.STRAPI_USERS_COLLECTION ?? "app-users";

function getHeaders() {
  if (!STRAPI_API_TOKEN) {
    throw new Error("Missing STRAPI_API_TOKEN.");
  }

  return {
    Authorization: `Bearer ${STRAPI_API_TOKEN}`,
    "Content-Type": "application/json",
  };
}

async function strapiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(new URL(path, STRAPI_BASE_URL), {
    ...init,
    cache: "no-store",
    headers: {
      ...getHeaders(),
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Strapi request failed with ${response.status}: ${errorText || response.statusText}`,
    );
  }

  return (await response.json()) as T;
}

export async function findAppUserBillingByInsforgeId(insforgeUserId: string) {
  const params = new URLSearchParams({
    "filters[insforgeUserId][$eq]": insforgeUserId,
    "pagination[pageSize]": "1",
  });

  const response = await strapiFetch<StrapiListResponse<StrapiAppUserBillingDocument>>(
    `/api/${STRAPI_USERS_COLLECTION}?${params.toString()}`,
    { method: "GET" },
  );

  return response.data[0] ?? null;
}

export async function findAppUserBillingByStripeCustomerId(stripeCustomerId: string) {
  const params = new URLSearchParams({
    "filters[stripeCustomerId][$eq]": stripeCustomerId,
    "pagination[pageSize]": "1",
  });

  const response = await strapiFetch<StrapiListResponse<StrapiAppUserBillingDocument>>(
    `/api/${STRAPI_USERS_COLLECTION}?${params.toString()}`,
    { method: "GET" },
  );

  return response.data[0] ?? null;
}

export async function updateAppUserBillingDocument(
  documentId: string,
  data: Partial<StrapiAppUserBillingDocument>,
) {
  const response = await strapiFetch<StrapiSingleResponse<StrapiAppUserBillingDocument>>(
    `/api/${STRAPI_USERS_COLLECTION}/${documentId}`,
    {
      body: JSON.stringify({ data }),
      method: "PUT",
    },
  );

  return response.data;
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

export async function getCourseAccessSnapshot(
  slug: string,
  subscriptionStatus: string | null | undefined,
) {
  const course = await fetchPublishedCourseBySlug(slug);

  if (!course) {
    return null;
  }

  const hasActiveSubscription = isSubscriptionActive(subscriptionStatus);
  const courseAccessType = normalizeCourseAccessType(
    (course as CourseRecord & { accessType?: string | null }).accessType,
  );

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
  } satisfies CourseAccessSnapshot;
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

  if (!course) {
    return null;
  }

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
  } satisfies CourseAccessSnapshot;
}
