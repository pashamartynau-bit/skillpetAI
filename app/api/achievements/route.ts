import { NextResponse } from "next/server";
import { differenceInCalendarDays, parseISO } from "date-fns";

import {
  listAppUsers,
  listCourseProgressByInsforgeId,
  type AppUserRecord,
  type CourseProgressRecord,
} from "@/lib/cms-users";

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

function getDisplayName(user: AppUserRecord) {
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

function getActivityDateKeys(documents: CourseProgressRecord[]) {
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
  users: AppUserRecord[],
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
      insforgeUserId: user.insforgeUserId ?? user._id,
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
      listAppUsers(),
      listCourseProgressByInsforgeId(insforgeUserId),
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
            : "Unable to load achievements from Sanity.",
      },
      { status: 500 },
    );
  }
}
