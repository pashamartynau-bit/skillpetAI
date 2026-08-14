import { NextResponse } from "next/server";
import { differenceInCalendarDays, parseISO } from "date-fns";

type StrapiAppUserDocument = {
  documentId: string;
  displayName?: string | null;
  email?: string | null;
  gems?: number | null;
  hearts?: number | null;
  insforgeUserId?: string;
  showOnLeaderboard?: boolean | null;
};

type StrapiUserCourseProgressDocument = {
  activityTimestamps?: unknown;
  documentId: string;
  insforgeUserId?: string;
};

type StrapiPaginationMeta = {
  page?: number;
  pageCount?: number;
  pageSize?: number;
  total?: number;
};

type StrapiListResponse<TDocument> = {
  data: TDocument[];
  meta?: {
    pagination?: StrapiPaginationMeta;
  };
};

type AchievementSummary = {
  hearts: number;
  maxStreak: number;
  rank: number;
  totalGems: number;
  totalUsers: number;
};

type AchievementLeaderboardEntry = {
  displayName: string;
  gems: number;
  hearts: number;
  insforgeUserId: string;
  isCurrentUser: boolean;
  rank: number;
};

const STRAPI_BASE_URL = process.env.STRAPI_BASE_URL ?? "http://localhost:1337";
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN;
const STRAPI_USERS_COLLECTION = process.env.STRAPI_USERS_COLLECTION ?? "app-users";
const STRAPI_USER_COURSE_PROGRESS_COLLECTION =
  process.env.STRAPI_USER_COURSE_PROGRESS_COLLECTION ?? "user-course-progresses";

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

async function listAllAppUsers() {
  const pageSize = 100;
  const users: StrapiAppUserDocument[] = [];
  let page = 1;
  let pageCount = 1;

  while (page <= pageCount) {
    const params = new URLSearchParams({
      "pagination[page]": String(page),
      "pagination[pageSize]": String(pageSize),
    });

    const response = await strapiFetch<StrapiListResponse<StrapiAppUserDocument>>(
      `/api/${STRAPI_USERS_COLLECTION}?${params.toString()}`,
      { method: "GET" },
    );

    users.push(...response.data);

    const nextPageCount = response.meta?.pagination?.pageCount;
    pageCount =
      typeof nextPageCount === "number"
        ? nextPageCount
        : response.data.length < pageSize
          ? page
          : page + 1;
    page += 1;
  }

  return users;
}

async function listUserCourseProgressByInsforgeId(insforgeUserId: string) {
  const params = new URLSearchParams({
    "filters[insforgeUserId][$eq]": insforgeUserId,
    "pagination[pageSize]": "200",
  });

  const response = await strapiFetch<StrapiListResponse<StrapiUserCourseProgressDocument>>(
    `/api/${STRAPI_USER_COURSE_PROGRESS_COLLECTION}?${params.toString()}`,
    { method: "GET" },
  );

  return response.data;
}

function getDisplayName(user: StrapiAppUserDocument) {
  const trimmedDisplayName = user.displayName?.trim();

  if (trimmedDisplayName) {
    return trimmedDisplayName;
  }

  const trimmedEmail = user.email?.trim();

  if (trimmedEmail) {
    return trimmedEmail;
  }

  return "Anonymous learner";
}

function getNonNegativeInteger(value: unknown, fallback = 0) {
  return typeof value === "number" ? Math.max(0, Math.floor(value)) : fallback;
}

function getActivityDateKeys(documents: StrapiUserCourseProgressDocument[]) {
  const activityDateKeys = new Set<string>();

  for (const document of documents) {
    if (!Array.isArray(document.activityTimestamps)) {
      continue;
    }

    for (const value of document.activityTimestamps) {
      if (typeof value !== "string") {
        continue;
      }

      const parsed = parseISO(value);

      if (Number.isNaN(parsed.getTime())) {
        continue;
      }

      activityDateKeys.add(parsed.toISOString().slice(0, 10));
    }
  }

  return [...activityDateKeys].sort((left, right) => left.localeCompare(right));
}

function getMaxStreak(activityDateKeys: string[]) {
  if (activityDateKeys.length === 0) {
    return 0;
  }

  let best = 1;
  let current = 1;

  for (let index = 1; index < activityDateKeys.length; index += 1) {
    const previousDate = parseISO(activityDateKeys[index - 1]);
    const currentDate = parseISO(activityDateKeys[index]);
    const dayDiff = differenceInCalendarDays(currentDate, previousDate);

    if (dayDiff === 1) {
      current += 1;
      best = Math.max(best, current);
      continue;
    }

    current = 1;
  }

  return best;
}

function buildLeaderboard(
  users: StrapiAppUserDocument[],
  currentInsforgeUserId: string,
): AchievementLeaderboardEntry[] {
  const visibleUsers = users.filter(
    (user) =>
      user.showOnLeaderboard !== false || user.insforgeUserId === currentInsforgeUserId,
  );

  const sortedUsers = [...visibleUsers].sort((left, right) => {
    const gemDelta = getNonNegativeInteger(right.gems) - getNonNegativeInteger(left.gems);

    if (gemDelta !== 0) {
      return gemDelta;
    }

    return getDisplayName(left).localeCompare(getDisplayName(right));
  });

  let previousGemCount: number | null = null;
  let previousRank = 0;

  return sortedUsers.map((user, index) => {
    const gems = getNonNegativeInteger(user.gems);
    const hearts = getNonNegativeInteger(user.hearts, 3);
    const rank = previousGemCount === gems ? previousRank : index + 1;

    previousGemCount = gems;
    previousRank = rank;

    return {
      displayName: getDisplayName(user),
      gems,
      hearts,
      insforgeUserId: user.insforgeUserId ?? user.documentId,
      isCurrentUser: user.insforgeUserId === currentInsforgeUserId,
      rank,
    };
  });
}

function buildSummary(
  leaderboard: AchievementLeaderboardEntry[],
  maxStreak: number,
  currentInsforgeUserId: string,
): AchievementSummary | null {
  const currentUser = leaderboard.find((entry) => entry.insforgeUserId === currentInsforgeUserId);

  if (!currentUser) {
    return null;
  }

  return {
    hearts: currentUser.hearts,
    maxStreak,
    rank: currentUser.rank,
    totalGems: currentUser.gems,
    totalUsers: leaderboard.length,
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const insforgeUserId = searchParams.get("insforgeUserId");

    if (!insforgeUserId) {
      return NextResponse.json(
        { error: "Missing insforgeUserId query parameter." },
        { status: 400 },
      );
    }

    const [users, courseProgressDocuments] = await Promise.all([
      listAllAppUsers(),
      listUserCourseProgressByInsforgeId(insforgeUserId),
    ]);

    const leaderboard = buildLeaderboard(users, insforgeUserId);
    const summary = buildSummary(
      leaderboard,
      getMaxStreak(getActivityDateKeys(courseProgressDocuments)),
      insforgeUserId,
    );

    if (!summary) {
      return NextResponse.json(
        { error: "User achievements not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({
      leaderboard,
      summary,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to load achievements from Strapi.",
      },
      { status: 500 },
    );
  }
}
