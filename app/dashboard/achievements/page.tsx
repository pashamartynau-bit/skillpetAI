"use client";

import Image from "next/image";
import { startTransition, useEffect, useState, type ReactNode } from "react";

import { useDashboardProfile } from "@/components/dashboard-shell";
import {
  fetchAchievements,
  type AchievementLeaderboardEntry,
  type AchievementSummary,
} from "@/lib/achievements-api";
import { cn } from "@/lib/utils";

type AchievementsState = {
  leaderboard: AchievementLeaderboardEntry[];
  summary: AchievementSummary | null;
};

type AchievementCardTone = {
  iconBg: string;
  valueColor: string;
};

const leaderboardAvatarTones = [
  "from-[#d7ffe9] via-[#baf1d0] to-[#8ce5b5]",
  "from-[#ece6ff] via-[#d7c9ff] to-[#baa7ff]",
  "from-[#fff0c9] via-[#ffd98a] to-[#ffbb55]",
  "from-[#d9ebff] via-[#c0dcff] to-[#95bcff]",
  "from-[#ffe0ea] via-[#ffc0d4] to-[#ff93b8]",
  "from-[#d9fbff] via-[#b2f3fb] to-[#88dff1]",
];

export default function AchievementsPage() {
  const { loadingProfile, profile } = useDashboardProfile();
  const [achievements, setAchievements] = useState<AchievementsState>({
    leaderboard: [],
    summary: null,
  });
  const [loadingAchievements, setLoadingAchievements] = useState(true);
  const [achievementsError, setAchievementsError] = useState<string | null>(null);
  const insforgeUserId = profile?.insforgeUserId ?? null;

  useEffect(() => {
    if (!insforgeUserId) {
      if (!loadingProfile) {
        setLoadingAchievements(false);
      }
      return;
    }

    const userId = insforgeUserId;
    let cancelled = false;

    async function loadAchievements() {
      try {
        const nextAchievements = await fetchAchievements(userId);

        if (cancelled) {
          return;
        }

        startTransition(() => {
          setAchievements(nextAchievements);
          setAchievementsError(null);
          setLoadingAchievements(false);
        });
      } catch (error) {
        if (cancelled) {
          return;
        }

        startTransition(() => {
          setAchievements({ leaderboard: [], summary: null });
          setAchievementsError(
            error instanceof Error ? error.message : "Failed to load achievements.",
          );
          setLoadingAchievements(false);
        });
      }
    }

    setLoadingAchievements(true);
    void loadAchievements();

    return () => {
      cancelled = true;
    };
  }, [insforgeUserId, loadingProfile]);

  const summary = achievements.summary;
  const leaderboard = achievements.leaderboard;

  return (
    <section className="mx-auto flex w-full max-w-7xl flex-col gap-6 pb-8">
      <div className="rounded-[2rem] border border-white/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(244,249,255,0.88))] p-6 shadow-[0_32px_90px_-60px_rgba(25,45,94,0.4)] sm:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-4xl font-semibold tracking-[-0.08em] text-[#16214d] sm:text-5xl">
              Achievements
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-[#6c7590] sm:text-lg">
              Track your progress, rewards, and ranking. ✨
            </p>
          </div>

          <div className="self-start rounded-full border border-white/80 bg-white/88 px-4 py-3 text-sm text-[#68728d] shadow-[0_24px_60px_-40px_rgba(27,44,90,0.35)]">
            Updated today
          </div>
        </div>
      </div>

      {achievementsError ? (
        <div className="rounded-[1.75rem] border border-[#f0d5d5] bg-[#fff7f7] p-6 text-sm text-[#b25b5b]">
          {achievementsError}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AchievementCard
          caption="Keep it up! You're on fire!"
          icon={
            <Image
              src="/streak.png"
              alt="Streak icon"
              width={40}
              height={40}
              className="h-10 w-10 object-contain"
            />
          }
          label="Longest Streak"
          loading={loadingAchievements}
          suffix={summary ? `day${summary.maxStreak === 1 ? "" : "s"}` : undefined}
          tone={{
            iconBg: "bg-[radial-gradient(circle_at_30%_30%,#fff8ec_0%,#ffe7bf_70%,#ffd28a_100%)]",
            valueColor: "text-[#12a653]",
          }}
          value={summary?.maxStreak ?? 0}
        />
        <AchievementCard
          caption="Keep learning, earn more!"
          icon={
            <Image
              src="/gems.png"
              alt="Gems icon"
              width={40}
              height={40}
              className="h-10 w-10 object-contain"
            />
          }
          label="Total Gems"
          loading={loadingAchievements}
          suffix="gems"
          tone={{
            iconBg: "bg-[radial-gradient(circle_at_30%_30%,#f7f2ff_0%,#eadfff_68%,#d8c2ff_100%)]",
            valueColor: "text-[#12a653]",
          }}
          value={summary?.totalGems ?? 0}
        />
        <AchievementCard
          caption="Use hearts to keep going!"
          icon={
            <Image
              src="/heart.png"
              alt="SkillPet icon"
              width={40}
              height={40}
              className="h-10 w-10 object-contain"
            />
          }
          label="Hearts / Hints"
          loading={loadingAchievements}
          suffix={summary ? `heart${summary.hearts === 1 ? "" : "s"}` : undefined}
          tone={{
            iconBg: "bg-[radial-gradient(circle_at_30%_30%,#fff4f7_0%,#ffdce8_65%,#ffc5d7_100%)]",
            valueColor: "text-[#12a653]",
          }}
          value={summary?.hearts ?? 0}
        />
        <AchievementCard
          caption={
            summary?.totalUsers
              ? `Among ${formatNumber(summary.totalUsers)} learners`
              : "Climb the board"
          }
          icon={
            <Image
              src="/ranking-badge.png"
              alt="Ranking badge icon"
              width={40}
              height={40}
              className="h-10 w-10 object-contain"
            />
          }
          label="Current Rank"
          loading={loadingAchievements}
          prefix="#"
          tone={{
            iconBg: "bg-[radial-gradient(circle_at_30%_30%,#fff9e8_0%,#ffefb1_68%,#ffe17b_100%)]",
            valueColor: "text-[#12a653]",
          }}
          value={summary?.rank ?? 0}
        />
      </div>

      <section className="overflow-hidden rounded-[2rem] border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(249,251,255,0.92))] shadow-[0_32px_90px_-60px_rgba(25,45,94,0.4)]">
        <div className="flex flex-col gap-4 border-b border-[#eef1f6] px-5 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[radial-gradient(circle_at_35%_35%,#e9fff0_0%,#ccf6d9_65%,#a4e8bf_100%)] text-[#18aa57] shadow-[0_18px_36px_-26px_rgba(24,170,87,0.5)]">
              <Image
                src="/ranking-badge.png"
                alt="Leaderboard icon"
                width={28}
                height={28}
                className="h-7 w-7 object-contain"
              />
            </div>
            <div>
              <h2 className="text-2xl font-semibold tracking-[-0.06em] text-[#16214d]">
                Top 10 Leaderboard
              </h2>
              <p className="mt-1 text-sm text-[#6c7590]">
                Ranked by gems earned across all learners.
              </p>
            </div>
          </div>

          <div className="text-sm text-[#6c7590]">Updated today</div>
        </div>

        <div className="px-3 pb-3 pt-4 sm:px-4 sm:pb-4">
          <div className="overflow-hidden rounded-[1.5rem] border border-[#edf0f5] bg-white/90">
            <div className="hidden grid-cols-[88px_minmax(0,1.4fr)_140px_120px] gap-4 bg-[linear-gradient(180deg,#f8fafc_0%,#f3f6fb_100%)] px-5 py-4 text-sm font-medium text-[#60708f] md:grid">
              <span>Rank</span>
              <span>User</span>
              <span>Gems</span>
              <span>Hearts</span>
            </div>

            {loadingAchievements ? (
              <div className="space-y-3 p-4">
                {Array.from({ length: 7 }).map((_, index) => (
                  <div
                    key={`achievement-row-${index}`}
                    className="h-20 animate-pulse rounded-[1.25rem] bg-[#f4f6fa]"
                  />
                ))}
              </div>
            ) : leaderboard.length === 0 ? (
              <div className="p-6 text-sm text-[#697391]">No leaderboard data available yet.</div>
            ) : (
              <div className="divide-y divide-[#eef1f6]">
                {leaderboard.map((entry, index) => {
                  const currentUserCharacter = entry.isCurrentUser ? profile?.character : null;
                  const avatarTone = leaderboardAvatarTones[index % leaderboardAvatarTones.length];

                  return (
                    <div
                      key={`${entry.insforgeUserId}-${entry.rank}`}
                      className={cn(
                        "grid gap-3 px-4 py-4 transition-colors md:grid-cols-[88px_minmax(0,1.4fr)_140px_120px] md:items-center md:px-5",
                        entry.isCurrentUser
                          ? "bg-[linear-gradient(90deg,rgba(232,251,238,0.94),rgba(242,255,247,0.88))] shadow-[inset_0_0_0_1px_rgba(60,201,113,0.55)]"
                          : "bg-white/95",
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <RankBadge rank={entry.rank} />
                        <div className="text-sm font-semibold text-[#415171] md:hidden">
                          Rank #{entry.rank}
                        </div>
                      </div>

                      <div className="flex min-w-0 items-center gap-3">
                        <div
                          className={cn(
                            "flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br text-sm font-semibold text-[#16314f] shadow-[0_12px_24px_-18px_rgba(23,38,76,0.4)]",
                            avatarTone,
                          )}
                        >
                          {currentUserCharacter ? (
                            <Image
                              src={`/characters/${currentUserCharacter.fileName}`}
                              alt={currentUserCharacter.name}
                              width={48}
                              height={48}
                              className="h-12 w-12 rounded-full object-contain"
                            />
                          ) : (
                            getInitials(entry.displayName)
                          )}
                        </div>

                        <div className="min-w-0">
                          <p
                            className={cn(
                              "truncate text-base font-semibold tracking-[-0.04em]",
                              entry.isCurrentUser ? "text-[#10934a]" : "text-[#18224d]",
                            )}
                          >
                            {entry.isCurrentUser ? `You (${entry.displayName})` : entry.displayName}
                          </p>
                          <p className="mt-1 text-sm text-[#73809d]">
                            {entry.isCurrentUser ? "Your current position" : "SkillPet learner"}
                          </p>
                        </div>
                      </div>

                      <StatCell
                        icon={
                          <Image
                            src="/gems.png"
                            alt="Gems icon"
                            width={16}
                            height={16}
                            className="h-4 w-4 object-contain"
                          />
                        }
                        label="Gems"
                        value={formatNumber(entry.gems)}
                      />

                      <StatCell
                        icon={
                          <Image
                            src="/logo.png"
                            alt="SkillPet icon"
                            width={16}
                            height={16}
                            className="h-4 w-4 object-contain"
                          />
                        }
                        label="Hearts"
                        value={formatNumber(entry.hearts)}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <p className="px-4 pb-2 pt-5 text-center text-base font-medium text-[#17a14f] sm:text-lg">
            Climb the ranks and earn amazing rewards!{" "}
            <span role="img" aria-label="rocket">
              🚀
            </span>
          </p>
        </div>
      </section>
    </section>
  );
}

function AchievementCard({
  caption,
  icon,
  label,
  loading,
  prefix,
  suffix,
  tone,
  value,
}: {
  caption: string;
  icon: ReactNode;
  label: string;
  loading: boolean;
  prefix?: string;
  suffix?: string;
  tone: AchievementCardTone;
  value: number;
}) {
  return (
    <section className="rounded-[1.75rem] border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(248,251,255,0.9))] p-6 shadow-[0_28px_76px_-56px_rgba(34,46,84,0.42)]">
      <div className="flex items-start gap-4">
        <div
          className={cn(
            "flex h-[4.5rem] w-[4.5rem] shrink-0 items-center justify-center rounded-[1.4rem] shadow-[0_18px_36px_-28px_rgba(38,48,78,0.45)]",
            tone.iconBg,
          )}
        >
          {icon}
        </div>

        <div className="min-w-0 pt-2">
          <p className="text-lg font-semibold tracking-[-0.04em] text-[#18224d]">{label}</p>
        </div>
      </div>

      <div className={cn("mt-6", loading && "animate-pulse")}>
        <p className={cn("text-4xl font-semibold tracking-[-0.08em] sm:text-5xl", tone.valueColor)}>
          {prefix ? <span>{prefix}</span> : null}
          {formatNumber(value)}
          {suffix ? <span className="ml-2 text-2xl font-semibold sm:text-3xl">{suffix}</span> : null}
        </p>
        <p className="mt-4 text-base text-[#76819d]">{caption}</p>
      </div>
    </section>
  );
}

function RankBadge({ rank }: { rank: number }) {
  const rankStyle = getRankStyle(rank);

  return (
    <div
      className={cn(
        "flex h-12 w-12 shrink-0 items-center justify-center rounded-full border text-base font-bold shadow-[0_14px_26px_-20px_rgba(23,38,76,0.4)]",
        rankStyle.className,
      )}
    >
      {rankStyle.label}
    </div>
  );
}

function StatCell({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl bg-[#f8fafc] px-4 py-3 md:bg-transparent md:px-0 md:py-0">
      <div className="flex items-center gap-2 text-sm text-[#6c7590] md:hidden">
        {icon}
        <span>{label}</span>
      </div>
      <div className="hidden items-center gap-2 text-base font-semibold text-[#18224d] md:flex">
        {icon}
        <span>{value}</span>
      </div>
      <div className="text-base font-semibold text-[#18224d] md:hidden">{value}</div>
    </div>
  );
}

function getRankStyle(rank: number) {
  if (rank === 1) {
    return {
      className: "border-[#f5cf67] bg-[linear-gradient(180deg,#ffe88d_0%,#ffc940_100%)] text-[#ad6500]",
      label: "1",
    };
  }

  if (rank === 2) {
    return {
      className: "border-[#d3dbe6] bg-[linear-gradient(180deg,#edf2f8_0%,#c9d3df_100%)] text-[#6c7b8e]",
      label: "2",
    };
  }

  if (rank === 3) {
    return {
      className: "border-[#e2ba94] bg-[linear-gradient(180deg,#f8dfc7_0%,#d9975b_100%)] text-[#9a5d27]",
      label: "3",
    };
  }

  return {
    className: "border-[#e2e8f2] bg-[#f4f7fb] text-[#425272]",
    label: String(rank),
  };
}

function getInitials(value: string) {
  const segments = value
    .split(/\s+/)
    .map((segment) => segment.trim())
    .filter(Boolean);

  if (segments.length === 0) {
    return "SP";
  }

  return segments
    .slice(0, 2)
    .map((segment) => segment[0]?.toUpperCase() ?? "")
    .join("");
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}
