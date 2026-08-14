import { NextResponse } from "next/server";

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
import { getAuthenticatedInsforgeUser } from "@/lib/server-insforge-auth";
import {
  findAppUserBillingByInsforgeId,
  getCourseAccessSnapshotByDocumentId,
} from "@/lib/strapi-billing";

type StrapiCourseRelation = {
  documentId: string;
};

type StrapiChapterRelation = {
  documentId: string;
};

type StrapiAppUserDocument = {
  dailyStreakCount?: number | null;
  documentId: string;
  gems?: number | null;
  hearts?: number | null;
  insforgeUserId?: string;
  lastDailyStreakAwardedOn?: string | null;
};

type StrapiUserCourseProgressDocument = {
  activityTimestamps?: unknown;
  chapterProgressMap?: unknown;
  course?: StrapiCourseRelation | null;
  currentChapter?: StrapiChapterRelation | null;
  documentId: string;
  enrolledAt?: string | null;
  insforgeUserId?: string;
  isCompleted?: boolean | null;
  isEnrolled?: boolean | null;
  lastActivityAt?: string | null;
  progressPercent?: number | null;
};

type StrapiListResponse<TDocument> = {
  data: TDocument[];
};

type StrapiSingleResponse<TDocument> = {
  data: TDocument;
};

type LearningProgressPayload = {
  insforgeUserId: string;
  snapshot: LearningProgressSnapshot;
};

const STRAPI_BASE_URL = process.env.STRAPI_BASE_URL ?? "http://localhost:1337";
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN;
const STRAPI_USERS_COLLECTION = process.env.STRAPI_USERS_COLLECTION ?? "app-users";
const STRAPI_USER_COURSE_PROGRESS_COLLECTION =
  process.env.STRAPI_USER_COURSE_PROGRESS_COLLECTION ?? "user-course-progresses";

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
    headers: {
      ...getHeaders(),
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Strapi request failed with ${response.status}: ${errorText || response.statusText}`,
    );
  }

  return (await response.json()) as T;
}

async function findAppUserByInsforgeId(insforgeUserId: string) {
  const params = new URLSearchParams({
    "filters[insforgeUserId][$eq]": insforgeUserId,
    "pagination[pageSize]": "1",
  });

  const response = await strapiFetch<StrapiListResponse<StrapiAppUserDocument>>(
    `/api/${STRAPI_USERS_COLLECTION}?${params.toString()}`,
    { method: "GET" },
  );

  return response.data[0] ?? null;
}

async function listUserCourseProgressByInsforgeId(insforgeUserId: string) {
  const params = new URLSearchParams({
    "filters[insforgeUserId][$eq]": insforgeUserId,
    "pagination[pageSize]": "200",
    populate: "course,currentChapter",
  });

  const response = await strapiFetch<StrapiListResponse<StrapiUserCourseProgressDocument>>(
    `/api/${STRAPI_USER_COURSE_PROGRESS_COLLECTION}?${params.toString()}`,
    { method: "GET" },
  );

  return response.data;
}

function toWallet(appUser: StrapiAppUserDocument | null): LearningWallet {
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
  appUser: StrapiAppUserDocument | null,
  courseProgressDocuments: StrapiUserCourseProgressDocument[],
) {
  const snapshot = createDefaultLearningProgressSnapshot();

  for (const document of courseProgressDocuments) {
    const courseId = document.course?.documentId;

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

function buildAppUserWalletPayload(wallet: LearningWallet) {
  return {
    dailyStreakCount: wallet.dailyStreakCount,
    gems: wallet.gems,
    hearts: wallet.hearts,
    lastDailyStreakAwardedOn: wallet.lastDailyStreakAwardedOn,
  };
}

function buildUserCourseProgressPayload(
  insforgeUserId: string,
  courseId: string,
  snapshot: LearningProgressSnapshot,
) {
  const courseRecord = snapshot.courseProgressMap[courseId];
  const chapterEntries = getCourseChapterProgressEntries(snapshot, courseId);
  const chapterProgressMap = Object.fromEntries(chapterEntries);
  const currentChapterDocumentId = getCurrentChapterDocumentId(snapshot, courseId);

  return {
    data: {
      activityTimestamps: courseRecord?.activityTimestamps ?? [],
      chapterProgressMap,
      course: courseId,
      currentChapter: currentChapterDocumentId,
      enrolledAt: courseRecord?.enrolledAt ?? new Date().toISOString(),
      insforgeUserId,
      isCompleted: (courseRecord?.progressPercent ?? 0) >= 100,
      isEnrolled: snapshot.enrolledCourseIds.includes(courseId),
      lastActivityAt: courseRecord?.lastProgressAt ?? null,
      progressPercent: courseRecord?.progressPercent ?? 0,
    },
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const authenticatedUser = await getAuthenticatedInsforgeUser(request);
    const requestedUserId = searchParams.get("insforgeUserId");
    const insforgeUserId = authenticatedUser?.id ?? requestedUserId;

    if (!insforgeUserId) {
      return NextResponse.json(
        { error: "Missing insforgeUserId query parameter." },
        { status: 400 },
      );
    }

    const [appUser, courseProgressDocuments] = await Promise.all([
      findAppUserByInsforgeId(insforgeUserId),
      listUserCourseProgressByInsforgeId(insforgeUserId),
    ]);

    return NextResponse.json({
      snapshot: toSnapshot(appUser, courseProgressDocuments),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to load learning progress from Strapi.",
      },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const authenticatedUser = await getAuthenticatedInsforgeUser(request);

    if (!isLearningProgressPayload(body)) {
      return NextResponse.json(
        { error: "Invalid learning progress payload." },
        { status: 400 },
      );
    }

    if (authenticatedUser && authenticatedUser.id !== body.insforgeUserId) {
      return NextResponse.json(
        { error: "Authenticated user does not match the supplied learning progress payload." },
        { status: 403 },
      );
    }

    const snapshot = normalizeLearningProgressSnapshot(body.snapshot);
    const billingDocument = authenticatedUser
      ? await findAppUserBillingByInsforgeId(authenticatedUser.id)
      : null;
    const subscriptionStatus = billingDocument?.stripeSubscriptionStatus ?? null;
    const [existingAppUser, existingCourseProgressDocuments] = await Promise.all([
      findAppUserByInsforgeId(body.insforgeUserId),
      listUserCourseProgressByInsforgeId(body.insforgeUserId),
    ]);

    const appUserPayload = JSON.stringify({
      data: {
        insforgeUserId: body.insforgeUserId,
        ...buildAppUserWalletPayload(snapshot.wallet),
      },
    });

    if (existingAppUser) {
      await strapiFetch<StrapiSingleResponse<StrapiAppUserDocument>>(
        `/api/${STRAPI_USERS_COLLECTION}/${existingAppUser.documentId}`,
        {
          method: "PUT",
          body: appUserPayload,
        },
      );
    } else {
      await strapiFetch<StrapiSingleResponse<StrapiAppUserDocument>>(
        `/api/${STRAPI_USERS_COLLECTION}`,
        {
          method: "POST",
          body: appUserPayload,
        },
      );
    }

    const existingByCourseId = new Map(
      existingCourseProgressDocuments
        .map((document) => [document.course?.documentId, document] as const)
        .filter(([courseId]) => Boolean(courseId)),
    );

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

    for (const courseId of targetCourseIds) {
      const payload = JSON.stringify(
        buildUserCourseProgressPayload(body.insforgeUserId, courseId, snapshot),
      );
      const existingDocument = existingByCourseId.get(courseId);

      if (existingDocument) {
        await strapiFetch<StrapiSingleResponse<StrapiUserCourseProgressDocument>>(
          `/api/${STRAPI_USER_COURSE_PROGRESS_COLLECTION}/${existingDocument.documentId}`,
          {
            method: "PUT",
            body: payload,
          },
        );
      } else {
        await strapiFetch<StrapiSingleResponse<StrapiUserCourseProgressDocument>>(
          `/api/${STRAPI_USER_COURSE_PROGRESS_COLLECTION}`,
          {
            method: "POST",
            body: payload,
          },
        );
      }
    }

    const [updatedAppUser, updatedCourseProgressDocuments] = await Promise.all([
      findAppUserByInsforgeId(body.insforgeUserId),
      listUserCourseProgressByInsforgeId(body.insforgeUserId),
    ]);

    return NextResponse.json({
      snapshot: toSnapshot(updatedAppUser, updatedCourseProgressDocuments),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to save learning progress to Strapi.",
      },
      { status: 500 },
    );
  }
}
