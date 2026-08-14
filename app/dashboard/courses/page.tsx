"use client";

import Image from "next/image";
import Link from "next/link";
import { Search, ArrowRight } from "lucide-react";
import { startTransition, useEffect, useState } from "react";

import { useDashboardProfile } from "@/components/dashboard-shell";
import { WeeklyStreakCalendar } from "@/components/weekly-streak-calendar";
import { CourseCard } from "@/components/course-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchDashboardCourses, type DashboardCourse } from "@/lib/course-api";
import {
  getCourseProgressRecord,
  getCurrentStreakCount,
  getWeeklyStreakDays,
  readEnrolledCourseIds,
  subscribeToLearningProgress,
} from "@/lib/learning-progress";

const ALL_DIFFICULTIES = "all";

export default function ExploreCoursesPage() {
  const { loadingProfile, profile } = useDashboardProfile();
  const [courses, setCourses] = useState<DashboardCourse[]>([]);
  const [coursesError, setCoursesError] = useState<string | null>(null);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState(ALL_DIFFICULTIES);
  const [enrolledCourseIds, setEnrolledCourseIds] = useState<string[]>([]);
  const [streakCount, setStreakCount] = useState(0);
  const [weeklyStreakDays, setWeeklyStreakDays] = useState(getWeeklyStreakDays());

  useEffect(() => {
    let cancelled = false;

    async function loadCourses() {
      try {
        const nextCourses = await fetchDashboardCourses();
        if (cancelled) {
          return;
        }

        startTransition(() => {
          setCourses(nextCourses);
          setCoursesError(null);
          setLoadingCourses(false);
        });
      } catch (error) {
        if (cancelled) {
          return;
        }

        startTransition(() => {
          setCourses([]);
          setCoursesError(
            error instanceof Error ? error.message : "Failed to load courses from Strapi.",
          );
          setLoadingCourses(false);
        });
      }
    }

    void loadCourses();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const syncLearningState = () => {
      setEnrolledCourseIds(readEnrolledCourseIds());
      setWeeklyStreakDays(getWeeklyStreakDays());
      setStreakCount(getCurrentStreakCount());
    };

    syncLearningState();
    return subscribeToLearningProgress(syncLearningState);
  }, []);

  const difficultyOptions = [ALL_DIFFICULTIES, ...new Set(courses.map((course) => course.difficulty))];
  const normalizedSearchQuery = searchQuery.trim().toLowerCase();
  const visibleCourses = courses.filter((course) => {
    const matchesSearch =
      normalizedSearchQuery.length === 0 ||
      course.name.toLowerCase().includes(normalizedSearchQuery) ||
      course.description.toLowerCase().includes(normalizedSearchQuery);
    const matchesDifficulty =
      selectedDifficulty === ALL_DIFFICULTIES || course.difficulty === selectedDifficulty;
    return matchesSearch && matchesDifficulty;
  });

  const selectedCharacterSrc = profile?.character
    ? `/characters/${profile.character.fileName}`
    : "/characters/Pip_1.png";

  return (
    <section className="mx-auto w-full max-w-[1440px] pb-8">
      {loadingCourses ? (
        <ExploreCoursesSkeleton />
      ) : (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="min-w-0">
            <div className="rounded-[2rem] border border-white/70 bg-white/78 p-6 shadow-[0_26px_90px_-58px_rgba(34,46,84,0.42)] backdrop-blur">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#8b94ae]">
                Course Library
              </p>
              <h1 className="mt-3 text-4xl font-semibold tracking-[-0.07em] text-[#16214d]">
                Explore Courses
              </h1>
              <p className="mt-3 max-w-2xl text-base leading-7 text-[#697391]">
                Choose a path and keep building your AI skills with live course data
                from Strapi.
              </p>

              <div className="mt-6 flex flex-col gap-3 lg:flex-row">
                <label className="relative block flex-1">
                  <Search className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-[#8b94ae]" />
                  <Input
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Search courses by title or description"
                    className="h-12 rounded-2xl border-[#e6eaf3] bg-white pl-11 text-sm shadow-[0_14px_34px_-28px_rgba(34,46,84,0.32)]"
                  />
                </label>

                <Select
                  value={selectedDifficulty}
                  onValueChange={(value) => setSelectedDifficulty(value ?? ALL_DIFFICULTIES)}
                >
                  <SelectTrigger className="h-12 min-h-12 w-full rounded-2xl border-[#e6eaf3] bg-white px-4 py-0 text-sm shadow-[0_14px_34px_-28px_rgba(34,46,84,0.32)] lg:w-[220px]">
                    <SelectValue placeholder="Filter by difficulty" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    {difficultyOptions.map((difficulty) => (
                      <SelectItem key={difficulty} value={difficulty}>
                        {difficulty === ALL_DIFFICULTIES ? "All difficulties" : difficulty}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="mt-6">
              {coursesError ? (
                <p className="text-sm text-[#b25b5b]">{coursesError}</p>
              ) : visibleCourses.length === 0 ? (
                <div className="rounded-[1.75rem] border border-dashed border-[#d9deea] bg-[linear-gradient(180deg,rgba(244,246,252,0.92),rgba(255,255,255,0.96))] p-6">
                  <p className="text-lg font-semibold tracking-[-0.04em] text-[#18224d]">
                    No courses match this search
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[#697391]">
                    Try a different keyword or difficulty filter.
                  </p>
                </div>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 2xl:grid-cols-3">
                  {visibleCourses.map((course) => {
                    const isEnrolled = enrolledCourseIds.includes(course.id);
                    const progressRecord = getCourseProgressRecord(course.id);
                    const progressPercent = isEnrolled ? progressRecord?.progressPercent ?? 0 : 0;

                    return (
                      <CourseCard
                        key={course.id}
                        course={course}
                        isEnrolled={isEnrolled}
                        progressPercent={progressPercent}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <aside className="flex flex-col gap-6">
            <section className="rounded-[1.75rem] border border-white/70 bg-white/88 p-6 shadow-[0_24px_72px_-52px_rgba(34,46,84,0.42)]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-lg font-semibold tracking-[-0.04em] text-[#18224d]">
                    Weekly Streak
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[#697391]">
                    Active days are based on your saved course progress.
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft">
                  <Image
                    src="/streak.png"
                    alt="Streak icon"
                    width={22}
                    height={22}
                    className="h-[22px] w-[22px] object-contain"
                  />
                </div>
              </div>

              <div className="mt-6 flex items-end gap-2">
                <span className="text-5xl font-semibold tracking-[-0.08em] text-[#7c67ff]">
                  {streakCount}
                </span>
                <span className="pb-2 text-sm font-medium text-[#697391]">
                  active day{streakCount === 1 ? "" : "s"} this week
                </span>
              </div>

              <WeeklyStreakCalendar
                weeklyStreakDays={weeklyStreakDays}
                size="sm"
              />
            </section>

            <section className="overflow-hidden rounded-[1.75rem] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(243,240,255,0.9))] p-6 shadow-[0_24px_72px_-52px_rgba(34,46,84,0.42)]">
              <p className="text-xl font-semibold tracking-[-0.05em] text-[#18224d]">
                Keep Going
              </p>
              <p className="mt-2 text-sm leading-6 text-[#697391]">
                Pick up where you left off and keep your learning momentum moving.
              </p>

              <div className="mt-6 flex justify-center rounded-[1.5rem] bg-[radial-gradient(circle_at_top,rgba(246,242,255,0.98),rgba(236,244,255,0.9))] p-4">
                <Image
                  src={selectedCharacterSrc}
                  alt={profile?.character?.name ?? "Selected character"}
                  width={220}
                  height={220}
                  className="h-auto max-h-[220px] w-auto object-contain"
                  priority={!loadingProfile}
                />
              </div>

              <Button
                render={<Link href="/dashboard/progress" />}
                className="mt-6 h-12 w-full rounded-2xl bg-[#efeaff] font-semibold text-[#6b4eff] hover:bg-[#e6deff]"
              >
                Go to Progress
                <ArrowRight className="h-4 w-4" />
              </Button>
            </section>
          </aside>
        </div>
      )}
    </section>
  );
}

function ExploreCoursesSkeleton() {
  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="min-w-0">
        <div className="rounded-[2rem] border border-white/70 bg-white/78 p-6 shadow-[0_26px_90px_-58px_rgba(34,46,84,0.42)] backdrop-blur">
          <Skeleton className="h-4 w-28 rounded-full" />
          <Skeleton className="mt-4 h-12 w-72 rounded-2xl" />
          <Skeleton className="mt-4 h-4 w-full max-w-2xl rounded-full" />
          <Skeleton className="mt-2 h-4 w-5/6 max-w-xl rounded-full" />
          <div className="mt-6 flex flex-col gap-3 lg:flex-row">
            <Skeleton className="h-12 flex-1 rounded-2xl" />
            <Skeleton className="h-12 w-full rounded-2xl lg:w-[220px]" />
          </div>
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-2 2xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={`course-skeleton-${index}`}
              className="rounded-[1.75rem] border border-white/70 bg-white/86 p-5 shadow-[0_24px_72px_-52px_rgba(34,46,84,0.45)]"
            >
              <Skeleton className="h-[176px] rounded-[1.5rem]" />
              <div className="mt-5 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <Skeleton className="h-8 w-40 rounded-xl" />
                  <Skeleton className="h-7 w-24 rounded-full" />
                </div>
                <Skeleton className="h-4 w-full rounded-full" />
                <Skeleton className="h-4 w-5/6 rounded-full" />
                <div className="pt-3">
                  <Skeleton className="h-3 w-full rounded-full" />
                  <Skeleton className="mt-4 h-12 w-full rounded-2xl" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <aside className="flex flex-col gap-6">
        <div className="rounded-[1.75rem] border border-white/70 bg-white/88 p-6 shadow-[0_24px_72px_-52px_rgba(34,46,84,0.42)]">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-3">
              <Skeleton className="h-6 w-36 rounded-xl" />
              <Skeleton className="h-4 w-52 rounded-full" />
            </div>
            <Skeleton className="h-12 w-12 rounded-full" />
          </div>
          <Skeleton className="mt-6 h-12 w-24 rounded-xl" />
          <div className="mt-6 grid grid-cols-7 gap-2">
            {Array.from({ length: 7 }).map((_, index) => (
              <div key={`streak-skeleton-${index}`} className="flex flex-col items-center gap-2">
                <Skeleton className="h-10 w-10 rounded-full" />
                <Skeleton className="h-3 w-4 rounded-full" />
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[1.75rem] border border-white/70 bg-white/88 p-6 shadow-[0_24px_72px_-52px_rgba(34,46,84,0.42)]">
          <Skeleton className="h-7 w-32 rounded-xl" />
          <Skeleton className="mt-3 h-4 w-full rounded-full" />
          <Skeleton className="mt-2 h-4 w-5/6 rounded-full" />
          <Skeleton className="mt-6 h-[252px] rounded-[1.5rem]" />
          <Skeleton className="mt-6 h-12 w-full rounded-2xl" />
        </div>
      </aside>
    </div>
  );
}
