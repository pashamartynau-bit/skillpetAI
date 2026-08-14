export type AchievementSummary = {
  hearts: number;
  maxStreak: number;
  rank: number;
  totalGems: number;
  totalUsers: number;
};

export type AchievementLeaderboardEntry = {
  displayName: string;
  gems: number;
  hearts: number;
  insforgeUserId: string;
  isCurrentUser: boolean;
  rank: number;
};

type AchievementsResponse = {
  error?: string;
  leaderboard?: AchievementLeaderboardEntry[];
  summary?: AchievementSummary;
};

export async function fetchAchievements(insforgeUserId: string) {
  const response = await fetch(
    `/api/achievements?insforgeUserId=${encodeURIComponent(insforgeUserId)}`,
    {
      method: "GET",
      cache: "no-store",
    },
  );

  const payload = (await response.json()) as AchievementsResponse;

  if (!response.ok || !payload.summary || !payload.leaderboard) {
    throw new Error(payload.error ?? "Failed to load achievements from Strapi.");
  }

  return {
    leaderboard: payload.leaderboard,
    summary: payload.summary,
  };
}
