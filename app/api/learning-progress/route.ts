import { NextResponse } from "next/server";

import {
  findAppUserBillingByInsforgeId,
  getCourseAccessSnapshotByDocumentId,
} from "@/lib/cms-billing";
import {
  findAppUserByInsforgeId,
  listCourseProgressByInsforgeId,
  replaceCourseProgress,
  upsertAppUser,
  type AppUserRecord,
  type CourseProgressRecord,
} from "@/lib/cms-users";
import {
  buildChapterProgressKey,
  createDefaultLearningProgressSnapshot,
  createDefaultLearningWallet,
  normalizeChapterProgressMap,
  normalizeLearningProgressSnapshot,
  type ChapterProgressRecord,
  type LearningProgressSnapshot,
  type LearningWallet,
} from "@/lib/learning-progress-shared";
import { requireAuthenticatedInsforgeUser } from "@/lib/server-insforge-auth";

type LearningProgressPayload = {
  insforgeUserId: string;
  snapshot: LearningProgressSnapshot;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isLearningProgressPayload(value: unknown): value is LearningProgressPayload {
  return (
    isRecord(value) &&
    typeof value.insforgeUserId === "string" &&
    "snapshot" in value
  );
}

function toWallet(appUser: AppUserRecord | null): LearningWallet {
  const defaultWallet = createDefaultLearningWallet();

  if (!appUser) {
    return defaultWallet;
  }

  return {
    dailyStreakCount:
      typeof appUser.dailyStreakCount === "number" ? Math.max(0, appUser.dailyStreakCount) : 0,
    gems: typeof appUser.gems === "number" ? Math.max(0, appUser.gems) : 0,
    hearts:
      typeof appUser.hearts === "number" ? Math.max(0, appUser.hearts) : defaultWallet.hearts,
    lastDailyStreakAwardedOn:
      typeof appUser.lastDailyStreakAwardedOn === "string"
        ? appUser.lastDailyStreakAwardedOn
        : null,
  };
}

function toGlobalChapterProgressMap(
  courseId: string,
  chapterProgressMap: unknown,
): Record<string, ChapterProgressRecord> {
  const normalized = normalizeChapterProgressMap(chapterProgressMap);
  const nextEntries = Object.entries(normalized).map(([chapterId, record]) => [
    buildChapterProgressKey(courseId, chapterId),
    record,
  ] as const);

  return Object.fromEntries(nextEntries);
}

function toSnapshot(
  appUser: AppUserRecord | null,
  courseProgressDocuments: CourseProgressRecord[],
) {
  const snapshot = createDefaultLearningProgressSnapshot();

  for (const document of courseProgressDocuments) {
    const courseId = document.courseId;

    if (!courseId) {
      continue;
    }

    if (document.isEnrolled !== false) {
      snapshot.enrolledCourseIds.push(courseId);
    }

    snapshot.courseProgressMap[courseId] = {
      activityTimestamps: Array.isArray(document.activityTimestamps)
        ? document.activityTimestamps.filter(
            (timestamp): timestamp is string => typeof timestamp === "string",
          )
        : [],
      enrolledAt:
        typeof document.enrolledAt === "string"
          ? document.enrolledAt
          : document.lastActivityAt ?? new Date().toISOString(),
      lastProgressAt:
        typeof document.lastActivityAt === "string" ? document.lastActivityAt : null,
      progressPercent:
        typeof document.progressPercent === "number"
          ? Math.max(0, Math.min(100, Math.round(document.progressPercent)))
          : 0,
    };

    Object.assign(
      snapshot.chapterProgressMap,
      toGlobalChapterProgressMap(courseId, document.chapterProgressMap),
    );
  }

  snapshot.wallet = toWallet(appUser);

  return normalizeLearningProgressSnapshot(snapshot);
}

function getCourseChapterProgressEntries(
  snapshot: LearningProgressSnapshot,
  courseId: string,
) {
  return Object.entries(snapshot.chapterProgressMap)
    .filter(([chapterKey]) => chapterKey.startsWith(`${courseId}:`))
    .map(([chapterKey, record]) => [chapterKey.slice(courseId.length + 1), record] as const);
}

function getCurrentChapterDocumentId(
  snapshot: LearningProgressSnapshot,
  courseId: string,
) {
  const chapterEntries = getCourseChapterProgressEntries(snapshot, courseId);

  if (chapterEntries.length === 0) {
    return null;
  }

  const sortedEntries = [...chapterEntries].sort((left, right) =>
    right[1].updatedAt.localeCompare(left[1].updatedAt),
  );

  return sortedEntries[0]?.[0] ?? null;
}

export async function GET(request: Request) {
  try {
    const authenticatedUser = await requireAuthenticatedInsforgeUser(request);
    const insforgeUserId = authenticatedUser.id;

    const [appUser, courseProgressDocuments] = await Promise.all([
      findAppUserByInsforgeId(insforgeUserId),
      listCourseProgressByInsforgeId(insforgeUserId),
    ]);

    return NextResponse.json({
      snapshot: toSnapshot(appUser, courseProgressDocuments),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to load learning progress from Sanity.";
    return NextResponse.json(
      { error: message },
      { status: message === "Unauthorized" ? 401 : 500 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const authenticatedUser = await requireAuthenticatedInsforgeUser(request);

    if (!isLearningProgressPayload(body)) {
      return NextResponse.json(
        { error: "Invalid learning progress payload." },
        { status: 400 },
      );
    }

    if (authenticatedUser.id !== body.insforgeUserId) {
      return NextResponse.json(
        { error: "Authenticated user does not match the supplied learning progress payload." },
        { status: 403 },
      );
    }

    const snapshot = normalizeLearningProgressSnapshot(body.snapshot);
    const billingDocument = await findAppUserBillingByInsforgeId(authenticatedUser.id);
    const subscriptionStatus = billingDocument?.stripeSubscriptionStatus ?? null;

    const targetCourseIds = new Set([
      ...snapshot.enrolledCourseIds,
      ...Object.keys(snapshot.courseProgressMap),
    ]);

    for (const courseId of targetCourseIds) {
      const accessSnapshot = await getCourseAccessSnapshotByDocumentId(courseId, subscriptionStatus);

      if (accessSnapshot && !accessSnapshot.canEnroll) {
        return NextResponse.json(
          {
            error:
              accessSnapshot.lockedReason ??
              "This course requires an active subscription before enrollment.",
          },
          { status: 403 },
        );
      }
    }

    await upsertAppUser(body.insforgeUserId, {
      dailyStreakCount: snapshot.wallet.dailyStreakCount,
      gems: snapshot.wallet.gems,
      hearts: snapshot.wallet.hearts,
      lastDailyStreakAwardedOn: snapshot.wallet.lastDailyStreakAwardedOn,
    });

    for (const courseId of targetCourseIds) {
      const courseRecord = snapshot.courseProgressMap[courseId];
      const chapterEntries = getCourseChapterProgressEntries(snapshot, courseId);

      await replaceCourseProgress(body.insforgeUserId, courseId, {
        activityTimestamps: courseRecord?.activityTimestamps ?? [],
        chapterProgressMap: Object.fromEntries(chapterEntries),
        currentChapterId: getCurrentChapterDocumentId(snapshot, courseId),
        enrolledAt: courseRecord?.enrolledAt ?? new Date().toISOString(),
        isCompleted: (courseRecord?.progressPercent ?? 0) >= 100,
        isEnrolled: snapshot.enrolledCourseIds.includes(courseId),
        lastActivityAt: courseRecord?.lastProgressAt ?? null,
        progressPercent: courseRecord?.progressPercent ?? 0,
      });
    }

    const [updatedAppUser, updatedCourseProgressDocuments] = await Promise.all([
      findAppUserByInsforgeId(body.insforgeUserId),
      listCourseProgressByInsforgeId(body.insforgeUserId),
    ]);

    return NextResponse.json({
      snapshot: toSnapshot(updatedAppUser, updatedCourseProgressDocuments),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to save learning progress to Sanity.";
    return NextResponse.json(
      { error: message },
      { status: message === "Unauthorized" ? 401 : 500 },
    );
  }
}
