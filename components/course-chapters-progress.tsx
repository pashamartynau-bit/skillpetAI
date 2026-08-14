"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, Lock } from "lucide-react";

import {
  Progress,
  ProgressIndicator,
  ProgressTrack,
} from "@/components/ui/progress";
import type { CourseChapterRecord } from "@/lib/strapi-courses";
import { getCourseProgressRecord, subscribeToLearningProgress } from "@/lib/learning-progress";
import { cn } from "@/lib/utils";

type ChapterStatus = "available" | "completed" | "in-progress" | "locked";

type CourseChaptersProgressProps = {
  chapters: CourseChapterRecord[];
  courseId: string;
  unlockedChapterIds: string[];
};

export function CourseChaptersProgress({
  chapters,
  courseId,
  unlockedChapterIds,
}: CourseChaptersProgressProps) {
  const [progressPercent, setProgressPercent] = useState(0);

  useEffect(() => {
    const syncProgress = () => {
      const savedProgress = getCourseProgressRecord(courseId)?.progressPercent ?? 0;
      setProgressPercent(savedProgress);
    };

    syncProgress();
    return subscribeToLearningProgress(syncProgress);
  }, [courseId]);

  const chapterProgress = buildChapterProgress(chapters, progressPercent, unlockedChapterIds);

  return (
    <section
      id="course-chapters"
      className="rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-[0_32px_90px_-56px_rgba(34,46,84,0.5)] backdrop-blur md:p-8"
    >
      <div className="flex flex-col gap-4 border-b border-[#e7ebf3] pb-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-[1.75rem] font-semibold tracking-[-0.05em] text-[#16214d]">
            Course Chapters
          </h2>
          <p className="mt-2 text-sm leading-6 text-[#697391]">
            Track your progress chapter by chapter as you move through the course.
          </p>
        </div>

        <div className="w-full max-w-[560px]">
          <div className="flex items-center justify-between gap-4 text-sm">
            <span className="font-medium text-[#6c7694]">Overall Progress</span>
            <span className="text-lg font-semibold text-[#27a844]">{progressPercent}%</span>
          </div>
          <Progress value={progressPercent} className="mt-3 block">
            <ProgressTrack className="h-3 rounded-full bg-[#edf1f6]">
              <ProgressIndicator className="rounded-full bg-[linear-gradient(90deg,#34b53a_0%,#57ca5d_100%)]" />
            </ProgressTrack>
          </Progress>
        </div>
      </div>

      <div className="mt-7 space-y-1">
        {chapterProgress.map((chapter, index) => (
          <article
            key={chapter.id}
            className="grid grid-cols-[88px_minmax(0,1fr)_auto] gap-4 py-4 sm:grid-cols-[110px_minmax(0,1fr)_auto]"
          >
            <div className="relative flex justify-center">
              {index < chapters.length - 1 ? (
                <div
                  aria-hidden="true"
                  className={cn(
                    "absolute top-[4.8rem] bottom-[-1.4rem] left-1/2 -translate-x-1/2 border-l-2 border-dashed",
                    chapter.status === "completed"
                      ? "border-[#5ec96b]"
                      : chapter.status === "in-progress"
                        ? "border-[#8ebeff]"
                        : "border-[#d8dde8]",
                  )}
                />
              ) : null}

              <div className="relative">
                <div
                  className={cn(
                    "flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-full border-4 bg-white shadow-[0_18px_44px_-34px_rgba(34,46,84,0.45)] sm:h-20 sm:w-20",
                    chapter.status === "completed" && "border-[#58c262]",
                    chapter.status === "in-progress" && "border-[#57a2ff]",
                    chapter.status === "locked" && "border-[#d8dde8]",
                    chapter.status === "available" && "border-[#d9e8ff]",
                  )}
                >
                  {chapter.status === "locked" ? (
                    <div className="relative flex items-center justify-center">
                      <span className="text-[2.25rem] leading-none sm:text-[2.75rem] opacity-35 grayscale select-none">
                        {chapter.emoji || "📖"}
                      </span>
                      <Lock className="absolute h-7 w-7 text-[#8e97af]" />
                    </div>
                  ) : (
                    <span className="text-[2.25rem] leading-none sm:text-[2.75rem] select-none">
                      {chapter.emoji || "📖"}
                    </span>
                  )}
                </div>

                {chapter.status === "completed" ? (
                  <div className="absolute top-0 right-0 flex h-7 w-7 items-center justify-center rounded-full bg-[#39b54a] text-white shadow-[0_12px_24px_-16px_rgba(57,181,74,0.95)]">
                    <Check className="h-4 w-4" />
                  </div>
                ) : null}
              </div>
            </div>

            <div className="min-w-0 pt-3">
              {chapter.status === "locked" ? (
                <div className="min-w-0">
                  <h3 className="text-xl font-semibold tracking-[-0.04em] text-[#16214d]">
                    {chapter.name}
                  </h3>
                  <p className="mt-2 line-clamp-1 text-sm leading-6 text-[#697391]">
                    {chapter.description}
                  </p>
                </div>
              ) : (
                <Link
                  href={chapter.href}
                  className="group block min-w-0 rounded-[1.4rem] px-3 py-2 -mx-3 -my-2 transition-colors hover:bg-[#f7fbff]"
                >
                  <h3 className="text-xl font-semibold tracking-[-0.04em] text-[#16214d] transition-colors group-hover:text-[#245eac]">
                    {chapter.name}
                  </h3>
                  <p className="mt-2 line-clamp-1 text-sm leading-6 text-[#697391]">
                    {chapter.description}
                  </p>
                </Link>
              )}
            </div>

            <div className="flex items-start pt-3">
              {chapter.status === "locked" ? (
                <span
                  className={cn(
                    "inline-flex min-w-[110px] items-center justify-center rounded-full px-4 py-2 text-sm font-semibold bg-[#f3f5f8] text-[#98a2b7]",
                  )}
                >
                  Locked
                </span>
              ) : (
                <Link
                  href={chapter.href}
                  className={cn(
                    "inline-flex min-w-[142px] items-center justify-center rounded-full px-4 py-2 text-sm font-semibold transition-all",
                    chapter.status === "completed" &&
                      "bg-[#eef9f0] text-[#2ca949] hover:bg-[#e3f6e7]",
                    chapter.status === "in-progress" &&
                      "bg-[#eef5ff] text-[#2a73f4] hover:bg-[#e3eeff]",
                    chapter.status === "available" &&
                      "bg-[#f1f6ff] text-[#466ccf] hover:bg-[#e7efff]",
                  )}
                >
                  {chapter.status === "completed"
                    ? "Review Chapter"
                    : chapter.status === "in-progress"
                      ? "Start Chapter"
                      : "Open Chapter"}
                </Link>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function buildChapterProgress(
  chapters: CourseChapterRecord[],
  progressPercent: number,
  unlockedChapterIds: string[],
) {
  const boundedProgress = Math.max(0, Math.min(100, progressPercent));
  const chapterCount = chapters.length;

  if (!chapterCount) {
    return [];
  }

  const completedCount =
    boundedProgress >= 100 ? chapterCount : Math.floor((boundedProgress / 100) * chapterCount);
  const inProgressIndex = boundedProgress >= 100 ? -1 : Math.min(completedCount, chapterCount - 1);
  const unlockedChapterIdSet = new Set(unlockedChapterIds);

  return chapters.map((chapter, index) => {
    let status: ChapterStatus = "locked";

    if (!unlockedChapterIdSet.has(chapter.id)) {
      status = "locked";
    } else if (index < completedCount) {
      status = "completed";
    } else if (index === inProgressIndex) {
      status = "in-progress";
    } else {
      status = "available";
    }

    return {
      ...chapter,
      status,
    };
  });
}
