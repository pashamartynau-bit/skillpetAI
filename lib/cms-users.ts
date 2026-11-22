import { getSanityClient, sanityDocumentId } from "@/lib/sanity";

export type AppUserRecord = {
  _id: string;
  avatarUrl?: string | null;
  characterFileName?: string | null;
  characterName?: string | null;
  dailyStreakCount?: number | null;
  displayName?: string | null;
  email?: string | null;
  emailRemindersEnabled?: boolean | null;
  emailVerified?: boolean | null;
  gems?: number | null;
  hearts?: number | null;
  insforgeUserId: string;
  lastAuthenticatedAt?: string | null;
  lastDailyStreakAwardedOn?: string | null;
  showOnLeaderboard?: boolean | null;
  stripeBillingPlan?: "monthly" | "yearly" | null;
  stripeCheckoutSessionId?: string | null;
  stripeCustomerId?: string | null;
  stripeLatestPaymentStatus?: string | null;
  stripeSubscriptionCurrentPeriodEnd?: string | null;
  stripeSubscriptionId?: string | null;
  stripeSubscriptionStartDate?: string | null;
  stripeSubscriptionStatus?: string | null;
};

export type CourseProgressRecord = {
  _id: string;
  activityTimestamps?: unknown;
  chapterProgressMap?: unknown;
  courseId?: string | null;
  currentChapterId?: string | null;
  enrolledAt?: string | null;
  insforgeUserId?: string | null;
  isCompleted?: boolean | null;
  isEnrolled?: boolean | null;
  lastActivityAt?: string | null;
  progressPercent?: number | null;
};

const appUserProjection = `{
  _id,
  avatarUrl,
  characterFileName,
  characterName,
  dailyStreakCount,
  displayName,
  email,
  emailRemindersEnabled,
  emailVerified,
  gems,
  hearts,
  insforgeUserId,
  lastAuthenticatedAt,
  lastDailyStreakAwardedOn,
  showOnLeaderboard,
  stripeBillingPlan,
  stripeCheckoutSessionId,
  stripeCustomerId,
  stripeLatestPaymentStatus,
  stripeSubscriptionCurrentPeriodEnd,
  stripeSubscriptionId,
  stripeSubscriptionStartDate,
  stripeSubscriptionStatus
}`;

export function appUserDocumentId(insforgeUserId: string) {
  return sanityDocumentId("appUser", insforgeUserId);
}

export function courseProgressDocumentId(insforgeUserId: string, courseId: string) {
  return sanityDocumentId("progress", insforgeUserId, courseId);
}

export async function findAppUserByInsforgeId(insforgeUserId: string) {
  return getSanityClient().fetch<AppUserRecord | null>(
    `*[_type == "appUser" && insforgeUserId == $insforgeUserId][0]${appUserProjection}`,
    { insforgeUserId },
  );
}

export async function findAppUserByEmail(email: string) {
  return getSanityClient().fetch<AppUserRecord | null>(
    `*[_type == "appUser" && email == $email][0]${appUserProjection}`,
    { email },
  );
}

export async function findAppUserByStripeCustomerId(stripeCustomerId: string) {
  return getSanityClient().fetch<AppUserRecord | null>(
    `*[_type == "appUser" && stripeCustomerId == $stripeCustomerId][0]${appUserProjection}`,
    { stripeCustomerId },
  );
}

export async function listAppUsers() {
  return getSanityClient().fetch<AppUserRecord[]>(
    `*[_type == "appUser"] | order(displayName asc) ${appUserProjection}`,
  );
}

export async function listCourseProgressByInsforgeId(insforgeUserId: string) {
  return getSanityClient().fetch<CourseProgressRecord[]>(
    `*[_type == "userCourseProgress" && insforgeUserId == $insforgeUserId]{
      _id,
      activityTimestamps,
      chapterProgressMap,
      courseId,
      currentChapterId,
      enrolledAt,
      insforgeUserId,
      isCompleted,
      isEnrolled,
      lastActivityAt,
      progressPercent
    }`,
    { insforgeUserId },
  );
}

export async function upsertAppUser(
  insforgeUserId: string,
  set: Record<string, unknown>,
) {
  const client = getSanityClient();
  const _id = appUserDocumentId(insforgeUserId);

  await client
    .transaction()
    .createIfNotExists({
      _id,
      _type: "appUser",
      dailyStreakCount: 0,
      emailRemindersEnabled: true,
      gems: 0,
      hearts: 3,
      insforgeUserId,
      showOnLeaderboard: true,
    })
    .patch(_id, (patch) =>
      patch.set({
        insforgeUserId,
        ...Object.fromEntries(Object.entries(set).filter(([, value]) => value !== undefined)),
      }),
    )
    .commit();

  const user = await findAppUserByInsforgeId(insforgeUserId);

  if (!user) {
    throw new Error("Sanity did not return the saved learner.");
  }

  return user;
}

export async function replaceCourseProgress(
  insforgeUserId: string,
  courseId: string,
  fields: Omit<CourseProgressRecord, "_id" | "insforgeUserId" | "courseId">,
) {
  const _id = courseProgressDocumentId(insforgeUserId, courseId);

  await getSanityClient().createOrReplace({
    ...fields,
    _id,
    _type: "userCourseProgress",
    courseId,
    insforgeUserId,
  });
}
