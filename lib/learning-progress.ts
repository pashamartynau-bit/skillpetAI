"use client";

import { format } from "date-fns";

import { buildAuthenticatedHeaders } from "@/lib/authenticated-fetch";
import {
  appendActivityTimestamp,
  buildChapterProgressKey,
  clampProgress,
  createDefaultLearningProgressSnapshot,
  getCurrentStreakCountFromSnapshot,
  getWeeklyStreakDaysFromSnapshot,
  normalizeLearningProgressSnapshot,
  type ChapterProgressRecord,
  type LearningProgressSnapshot,
  type LearningRewardSnapshot,
} from "@/lib/learning-progress-shared";

export type {
  ChapterProgressRecord,
  CourseProgressRecord,
  LearningProgressSnapshot,
  LearningRewardSnapshot,
  LearningWallet,
  WeeklyStreakDay,
} from "@/lib/learning-progress-shared";

const LEARNING_PROGRESS_UPDATED_EVENT = "skillpet:learning-progress-updated";

let activeInsforgeUserId: string | null = null;
let progressSnapshot = createDefaultLearningProgressSnapshot();
let hydrationPromise: Promise<LearningProgressSnapshot> | null = null;
let persistQueue = Promise.resolve<LearningProgressSnapshot>(progressSnapshot);

type LearningProgressResponse = {
  snapshot?: LearningProgressSnapshot;
  error?: string;
};

function dispatchLearningProgressUpdate() {
  window.dispatchEvent(new Event(LEARNING_PROGRESS_UPDATED_EVENT));
}

function readSnapshot() {
  return progressSnapshot;
}

function setSnapshot(nextSnapshot: LearningProgressSnapshot) {
  progressSnapshot = normalizeLearningProgressSnapshot(nextSnapshot);
  dispatchLearningProgressUpdate();
  return progressSnapshot;
}

async function readResponsePayload(response: Response) {
  const payload = (await response.json()) as LearningProgressResponse;

  if (!response.ok || !payload.snapshot) {
    throw new Error(payload.error ?? "Failed to sync learning progress.");
  }

  return payload.snapshot;
}

function requireActiveUserId() {
  if (!activeInsforgeUserId) {
    throw new Error("Learning progress is not ready because no authenticated user is active.");
  }

  return activeInsforgeUserId;
}

async function persistSnapshot(nextSnapshot: LearningProgressSnapshot) {
  const insforgeUserId = requireActiveUserId();

  persistQueue = persistQueue
    .catch(() => progressSnapshot)
    .then(async () => {
      const response = await fetch("/api/learning-progress", {
        method: "PATCH",
        headers: buildAuthenticatedHeaders({
          "Content-Type": "application/json",
        }),
        body: JSON.stringify({
          insforgeUserId,
          snapshot: nextSnapshot,
        }),
      });

      const savedSnapshot = normalizeLearningProgressSnapshot(
        await readResponsePayload(response),
      );

      if (activeInsforgeUserId === insforgeUserId) {
        setSnapshot(savedSnapshot);
      }

      return savedSnapshot;
    });

  return persistQueue;
}

function applySnapshotUpdate(
  updater: (currentSnapshot: LearningProgressSnapshot) => LearningProgressSnapshot,
) {
  const nextSnapshot = normalizeLearningProgressSnapshot(updater(readSnapshot()));
  setSnapshot(nextSnapshot);
  return nextSnapshot;
}

export function clearLearningProgressState() {
  activeInsforgeUserId = null;
  hydrationPromise = null;
  persistQueue = Promise.resolve(createDefaultLearningProgressSnapshot());
  setSnapshot(createDefaultLearningProgressSnapshot());
}

export async function hydrateLearningProgress(insforgeUserId: string) {
  if (!insforgeUserId) {
    clearLearningProgressState();
    return createDefaultLearningProgressSnapshot();
  }

  if (activeInsforgeUserId !== insforgeUserId) {
    activeInsforgeUserId = insforgeUserId;
    hydrationPromise = null;
    persistQueue = Promise.resolve(readSnapshot());
    setSnapshot(createDefaultLearningProgressSnapshot());
  }

  if (!hydrationPromise) {
    hydrationPromise = (async () => {
      const response = await fetch(
        `/api/learning-progress?insforgeUserId=${encodeURIComponent(insforgeUserId)}`,
        {
          headers: buildAuthenticatedHeaders(),
          method: "GET",
          cache: "no-store",
        },
      );

      const nextSnapshot = normalizeLearningProgressSnapshot(
        await readResponsePayload(response),
      );

      if (activeInsforgeUserId === insforgeUserId) {
        setSnapshot(nextSnapshot);
      }

      return nextSnapshot;
    })().catch((error) => {
      hydrationPromise = null;
      throw error;
    });
  }

  return hydrationPromise;
}

export function readEnrolledCourseIds() {
  return readSnapshot().enrolledCourseIds;
}

export function readCourseProgressMap() {
  return readSnapshot().courseProgressMap;
}

export function readChapterProgressMap() {
  return readSnapshot().chapterProgressMap;
}

export function readLearningWallet() {
  return readSnapshot().wallet;
}

export async function ensureCourseEnrollment(courseId: string) {
  const nextSnapshot = applySnapshotUpdate((currentSnapshot) => {
    const enrolledCourseIds = currentSnapshot.enrolledCourseIds.includes(courseId)
      ? currentSnapshot.enrolledCourseIds
      : [...currentSnapshot.enrolledCourseIds, courseId];
    const currentRecord = currentSnapshot.courseProgressMap[courseId];

    return {
      ...currentSnapshot,
      enrolledCourseIds,
      courseProgressMap: {
        ...currentSnapshot.courseProgressMap,
        [courseId]:
          currentRecord ?? {
            activityTimestamps: [],
            enrolledAt: new Date().toISOString(),
            lastProgressAt: null,
            progressPercent: 0,
          },
      },
    };
  });

  return persistSnapshot(nextSnapshot);
}

export async function saveCourseProgress(
  courseId: string,
  progressPercent: number,
  at = new Date(),
) {
  const timestamp = at.toISOString();
  const nextSnapshot = applySnapshotUpdate((currentSnapshot) => {
    const currentRecord = currentSnapshot.courseProgressMap[courseId];
    const activityTimestamps = appendActivityTimestamp(
      currentRecord?.activityTimestamps ?? [],
      timestamp,
    );
    const enrolledCourseIds = currentSnapshot.enrolledCourseIds.includes(courseId)
      ? currentSnapshot.enrolledCourseIds
      : [...currentSnapshot.enrolledCourseIds, courseId];

    return {
      ...currentSnapshot,
      enrolledCourseIds,
      courseProgressMap: {
        ...currentSnapshot.courseProgressMap,
        [courseId]: {
          activityTimestamps,
          enrolledAt: currentRecord?.enrolledAt ?? timestamp,
          lastProgressAt: timestamp,
          progressPercent: clampProgress(progressPercent),
        },
      },
    };
  });

  return persistSnapshot(nextSnapshot);
}

export function getCourseProgressRecord(courseId: string) {
  return readCourseProgressMap()[courseId] ?? null;
}

export function getChapterProgressRecord(chapterKey: string) {
  return readChapterProgressMap()[chapterKey] ?? null;
}

export { buildChapterProgressKey };

export async function saveChapterProgress(
  chapterKey: string,
  record: Partial<ChapterProgressRecord>,
) {
  const currentSnapshot = readSnapshot();
  const currentRecord = currentSnapshot.chapterProgressMap[chapterKey];
  const nextRecord = {
    activeContentIndex:
      typeof record.activeContentIndex === "number"
        ? Math.max(0, Math.floor(record.activeContentIndex))
        : currentRecord?.activeContentIndex ?? 0,
    completedAt:
      record.completedAt === undefined ? currentRecord?.completedAt ?? null : record.completedAt,
    earnedGemItemKeys:
      record.earnedGemItemKeys ?? currentRecord?.earnedGemItemKeys ?? [],
    incorrectAttemptItemKeys:
      record.incorrectAttemptItemKeys ?? currentRecord?.incorrectAttemptItemKeys ?? [],
    updatedAt: record.updatedAt ?? new Date().toISOString(),
  } satisfies ChapterProgressRecord;

  const nextSnapshot = normalizeLearningProgressSnapshot({
    ...currentSnapshot,
    chapterProgressMap: {
      ...currentSnapshot.chapterProgressMap,
      [chapterKey]: nextRecord,
    },
  });

  return persistSnapshot(nextSnapshot);
}

export async function consumeHeart() {
  const wallet = readLearningWallet();

  if (wallet.hearts <= 0) {
    return false;
  }

  const nextSnapshot = applySnapshotUpdate((currentSnapshot) => ({
    ...currentSnapshot,
    wallet: {
      ...currentSnapshot.wallet,
      hearts: currentSnapshot.wallet.hearts - 1,
    },
  }));

  await persistSnapshot(nextSnapshot);
  return true;
}

export async function completeChapterWithRewards({
  chapterKey,
  courseId,
  nextActiveContentIndex,
  totalChapterCount,
  completedChapterIndex,
  earnedGemItemKeys,
  incorrectAttemptItemKeys,
  completedAt = new Date(),
}: {
  chapterKey: string;
  completedChapterIndex: number;
  courseId: string;
  earnedGemItemKeys: string[];
  incorrectAttemptItemKeys: string[];
  nextActiveContentIndex: number;
  totalChapterCount: number;
  completedAt?: Date;
}) {
  const completedTimestamp = completedAt.toISOString();
  const dateKey = format(completedAt, "yyyy-MM-dd");
  const wallet = readLearningWallet();
  const gemDelta = earnedGemItemKeys.length;
  const heartDelta = 1;
  const dailyStreakAwarded = wallet.lastDailyStreakAwardedOn !== dateKey;

  const currentSnapshot = readSnapshot();
  const currentCourseProgress = currentSnapshot.courseProgressMap[courseId];
  const activityTimestamps = appendActivityTimestamp(
    currentCourseProgress?.activityTimestamps ?? [],
    completedTimestamp,
  );

  const nextSnapshot = normalizeLearningProgressSnapshot({
    ...currentSnapshot,
    enrolledCourseIds: currentSnapshot.enrolledCourseIds.includes(courseId)
      ? currentSnapshot.enrolledCourseIds
      : [...currentSnapshot.enrolledCourseIds, courseId],
    chapterProgressMap: {
      ...currentSnapshot.chapterProgressMap,
      [chapterKey]: {
        activeContentIndex: nextActiveContentIndex,
        completedAt: completedTimestamp,
        earnedGemItemKeys,
        incorrectAttemptItemKeys,
        updatedAt: completedTimestamp,
      },
    },
    courseProgressMap: {
      ...currentSnapshot.courseProgressMap,
      [courseId]: {
        activityTimestamps,
        enrolledAt: currentCourseProgress?.enrolledAt ?? completedTimestamp,
        lastProgressAt: completedTimestamp,
        progressPercent:
          totalChapterCount > 0
            ? ((completedChapterIndex + 1) / totalChapterCount) * 100
            : 100,
      },
    },
    wallet: {
      dailyStreakCount: dailyStreakAwarded
        ? currentSnapshot.wallet.dailyStreakCount + 1
        : currentSnapshot.wallet.dailyStreakCount,
      gems: currentSnapshot.wallet.gems + gemDelta,
      hearts: currentSnapshot.wallet.hearts + heartDelta,
      lastDailyStreakAwardedOn: dailyStreakAwarded
        ? dateKey
        : currentSnapshot.wallet.lastDailyStreakAwardedOn,
    },
  });

  await persistSnapshot(nextSnapshot);

  return {
    dailyStreakAwarded,
    gemDelta,
    heartDelta,
  } satisfies LearningRewardSnapshot;
}

export function getWeeklyStreakDays(referenceDate = new Date()) {
  return getWeeklyStreakDaysFromSnapshot(readSnapshot(), referenceDate);
}

export function getCurrentStreakCount(referenceDate = new Date()) {
  return getCurrentStreakCountFromSnapshot(readSnapshot(), referenceDate);
}

export function subscribeToLearningProgress(onChange: () => void) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  window.addEventListener(LEARNING_PROGRESS_UPDATED_EVENT, onChange);

  return () => {
    window.removeEventListener(LEARNING_PROGRESS_UPDATED_EVENT, onChange);
  };
}
