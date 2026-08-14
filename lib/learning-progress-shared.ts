import {
  eachDayOfInterval,
  endOfWeek,
  format,
  isSameDay,
  parseISO,
  startOfWeek,
} from "date-fns";

export type CourseProgressRecord = {
  activityTimestamps: string[];
  enrolledAt: string;
  lastProgressAt: string | null;
  progressPercent: number;
};

export type ChapterProgressRecord = {
  activeContentIndex: number;
  completedAt: string | null;
  earnedGemItemKeys: string[];
  incorrectAttemptItemKeys: string[];
  updatedAt: string;
};

export type LearningRewardSnapshot = {
  dailyStreakAwarded: boolean;
  gemDelta: number;
  heartDelta: number;
};

export type LearningWallet = {
  dailyStreakCount: number;
  gems: number;
  hearts: number;
  lastDailyStreakAwardedOn: string | null;
};

export type LearningProgressSnapshot = {
  chapterProgressMap: Record<string, ChapterProgressRecord>;
  courseProgressMap: Record<string, CourseProgressRecord>;
  enrolledCourseIds: string[];
  wallet: LearningWallet;
};

export type WeeklyStreakDay = {
  active: boolean;
  dateKey: string;
  dayLabel: string;
};

export const DEFAULT_HEART_COUNT = 3;

export function buildChapterProgressKey(courseId: string, chapterId: string) {
  return `${courseId}:${chapterId}`;
}

export function clampProgress(progressPercent: number) {
  return Math.min(100, Math.max(0, Math.round(progressPercent)));
}

export function createDefaultLearningWallet(): LearningWallet {
  return {
    dailyStreakCount: 0,
    gems: 0,
    hearts: DEFAULT_HEART_COUNT,
    lastDailyStreakAwardedOn: null,
  };
}

export function createDefaultLearningProgressSnapshot(): LearningProgressSnapshot {
  return {
    chapterProgressMap: {},
    courseProgressMap: {},
    enrolledCourseIds: [],
    wallet: createDefaultLearningWallet(),
  };
}

export function normalizeLearningWallet(value: unknown): LearningWallet {
  if (!value || typeof value !== "object") {
    return createDefaultLearningWallet();
  }

  const record = value as Partial<LearningWallet>;

  return {
    dailyStreakCount:
      typeof record.dailyStreakCount === "number"
        ? Math.max(0, Math.floor(record.dailyStreakCount))
        : 0,
    gems: typeof record.gems === "number" ? Math.max(0, Math.floor(record.gems)) : 0,
    hearts:
      typeof record.hearts === "number"
        ? Math.max(0, Math.floor(record.hearts))
        : DEFAULT_HEART_COUNT,
    lastDailyStreakAwardedOn:
      typeof record.lastDailyStreakAwardedOn === "string"
        ? record.lastDailyStreakAwardedOn
        : null,
  };
}

export function normalizeCourseProgressMap(
  value: unknown,
): Record<string, CourseProgressRecord> {
  if (!value || typeof value !== "object") {
    return {};
  }

  const nextEntries = Object.entries(value).flatMap(([courseId, rawRecord]) => {
    if (!rawRecord || typeof rawRecord !== "object") {
      return [];
    }

    const record = rawRecord as Partial<CourseProgressRecord>;
    const enrolledAt =
      typeof record.enrolledAt === "string" ? record.enrolledAt : new Date().toISOString();
    const lastProgressAt =
      typeof record.lastProgressAt === "string" ? record.lastProgressAt : null;
    const progressPercent =
      typeof record.progressPercent === "number" ? clampProgress(record.progressPercent) : 0;
    const activityTimestamps = Array.isArray(record.activityTimestamps)
      ? record.activityTimestamps.filter(
          (timestamp): timestamp is string => typeof timestamp === "string",
        )
      : [];

    return [
      [
        courseId,
        {
          activityTimestamps,
          enrolledAt,
          lastProgressAt,
          progressPercent,
        } satisfies CourseProgressRecord,
      ] as const,
    ];
  });

  return Object.fromEntries(nextEntries);
}

export function normalizeChapterProgressMap(
  value: unknown,
): Record<string, ChapterProgressRecord> {
  if (!value || typeof value !== "object") {
    return {};
  }

  const nextEntries = Object.entries(value).flatMap(([chapterKey, rawRecord]) => {
    if (!rawRecord || typeof rawRecord !== "object") {
      return [];
    }

    const record = rawRecord as Partial<ChapterProgressRecord>;

    return [
      [
        chapterKey,
        {
          activeContentIndex:
            typeof record.activeContentIndex === "number"
              ? Math.max(0, Math.floor(record.activeContentIndex))
              : 0,
          completedAt: typeof record.completedAt === "string" ? record.completedAt : null,
          earnedGemItemKeys: Array.isArray(record.earnedGemItemKeys)
            ? record.earnedGemItemKeys.filter(
                (itemKey): itemKey is string => typeof itemKey === "string",
              )
            : [],
          incorrectAttemptItemKeys: Array.isArray(record.incorrectAttemptItemKeys)
            ? record.incorrectAttemptItemKeys.filter(
                (itemKey): itemKey is string => typeof itemKey === "string",
              )
            : [],
          updatedAt:
            typeof record.updatedAt === "string"
              ? record.updatedAt
              : new Date().toISOString(),
        } satisfies ChapterProgressRecord,
      ] as const,
    ];
  });

  return Object.fromEntries(nextEntries);
}

export function normalizeEnrolledCourseIds(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((courseId): courseId is string => typeof courseId === "string");
}

export function normalizeLearningProgressSnapshot(
  value: unknown,
): LearningProgressSnapshot {
  if (!value || typeof value !== "object") {
    return createDefaultLearningProgressSnapshot();
  }

  const record = value as Partial<LearningProgressSnapshot>;

  return {
    chapterProgressMap: normalizeChapterProgressMap(record.chapterProgressMap),
    courseProgressMap: normalizeCourseProgressMap(record.courseProgressMap),
    enrolledCourseIds: normalizeEnrolledCourseIds(record.enrolledCourseIds),
    wallet: normalizeLearningWallet(record.wallet),
  };
}

export function appendActivityTimestamp(activityTimestamps: string[], timestamp: string) {
  const nextDate = parseISO(timestamp);
  const hasSameDayActivity = activityTimestamps.some((value) =>
    isSameDay(parseISO(value), nextDate),
  );

  if (hasSameDayActivity) {
    return activityTimestamps;
  }

  return [...activityTimestamps, timestamp].sort((left, right) => left.localeCompare(right));
}

export function getWeeklyStreakDaysFromSnapshot(
  snapshot: LearningProgressSnapshot,
  referenceDate = new Date(),
): WeeklyStreakDay[] {
  const activityDates = Object.values(snapshot.courseProgressMap).flatMap((record) =>
    record.activityTimestamps.map((timestamp) => parseISO(timestamp)),
  );

  const interval = {
    start: startOfWeek(referenceDate, { weekStartsOn: 0 }),
    end: endOfWeek(referenceDate, { weekStartsOn: 0 }),
  };

  return eachDayOfInterval(interval).map((date) => ({
    active: activityDates.some((activityDate) => isSameDay(activityDate, date)),
    dateKey: format(date, "yyyy-MM-dd"),
    dayLabel: format(date, "EEEEE"),
  }));
}

export function getCurrentStreakCountFromSnapshot(
  snapshot: LearningProgressSnapshot,
  referenceDate = new Date(),
) {
  return getWeeklyStreakDaysFromSnapshot(snapshot, referenceDate).filter((day) => day.active)
    .length;
}
