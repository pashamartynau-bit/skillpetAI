"use client";

import Link from "next/link";
import { startTransition, useEffect, useState } from "react";

import { CourseCard } from "@/components/course-card";
import { Button } from "@/components/ui/button";
import { useDashboardProfile } from "@/components/dashboard-shell";
import {
  WeeklyStreakCalendar,
  type WeeklyStreakDay,
} from "@/components/weekly-streak-calendar";
import { fetchDashboardCourses, type DashboardCourse } from "@/lib/course-api";
import {
  getCourseProgressRecord,
  getCurrentStreakCount,
  getWeeklyStreakDays,
  readEnrolledCourseIds,
  readCourseProgressMap,
  subscribeToLearningProgress,
} from "@/lib/learning-progress";

export default function ProgressPage() {
  const { profile } = useDashboardProfile();
  const [courses, setCourses] = useState<DashboardCourse[]>([]);
  const [coursesError, setCoursesError] = useState<string | null>(null);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [enrolledCourseIds, setEnrolledCourseIds] = useState<string[]>([]);
  const [streakCount, setStreakCount] = useState(0);
  const [trackedCourses, setTrackedCourses] = useState(0);
  const [weeklyStreakDays, setWeeklyStreakDays] = useState<WeeklyStreakDay[]>(getWeeklyStreakDays());

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
    const syncProgress = () => {
      setStreakCount(getCurrentStreakCount());
      setEnrolledCourseIds(readEnrolledCourseIds());
      setTrackedCourses(Object.keys(readCourseProgressMap()).length);
      setWeeklyStreakDays(getWeeklyStreakDays());
    };

    syncProgress();
    return subscribeToLearningProgress(syncProgress);
  }, []);

  const enrolledCourses = courses.filter((course) => enrolledCourseIds.includes(course.id));

  return (
    <section className="mx-auto flex w-full max-w-7xl flex-col gap-6 pb-8">
      <div className="rounded-[2rem] border border-white/70 bg-white/82 p-6 shadow-[0_26px_90px_-58px_rgba(34,46,84,0.42)]">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#8b94ae]">
          Progress
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-[-0.07em] text-[#16214d]">
          {profile?.displayName?.trim() || "Your"} learning progress
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-7 text-[#697391]">
          This page reflects your saved course progress and weekly learning activity.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-[1.75rem] border border-white/70 bg-white/88 p-6 shadow-[0_24px_72px_-52px_rgba(34,46,84,0.42)]">
          <p className="text-lg font-semibold tracking-[-0.04em] text-[#18224d]">
            Active days this week
          </p>
          <p className="mt-4 text-5xl font-semibold tracking-[-0.08em] text-[#7c67ff]">
            {streakCount}
          </p>
          <WeeklyStreakCalendar
            weeklyStreakDays={weeklyStreakDays}
            size="md"
            showStatusText={true}
          />
        </div>

        <div className="rounded-[1.75rem] border border-white/70 bg-white/88 p-6 shadow-[0_24px_72px_-52px_rgba(34,46,84,0.42)]">
          <p className="text-lg font-semibold tracking-[-0.04em] text-[#18224d]">
            Tracked courses
          </p>
          <p className="mt-4 text-5xl font-semibold tracking-[-0.08em] text-[#16214d]">
            {trackedCourses}
          </p>
          <p className="mt-3 text-sm leading-6 text-[#697391]">
            Courses appear here after you start them from the Explore Courses page.
          </p>

          <Button
            render={<Link href="/dashboard/courses" />}
            className="mt-6 h-12 rounded-2xl bg-accent px-5 font-semibold text-white hover:bg-accent-strong"
          >
            Browse Courses
          </Button>
        </div>
      </div>

      <div className="rounded-[2rem] border border-white/70 bg-white/82 p-6 shadow-[0_26px_90px_-58px_rgba(34,46,84,0.42)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#8b94ae]">
              Enrolled Courses
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.06em] text-[#16214d]">
              Keep going where you left off
            </h2>
            <p className="mt-3 max-w-2xl text-base leading-7 text-[#697391]">
              Every enrolled course appears here with its saved progress.
            </p>
          </div>
        </div>

        <div className="mt-6">
          {coursesError ? (
            <p className="text-sm text-[#b25b5b]">{coursesError}</p>
          ) : loadingCourses ? (
            <p className="text-sm leading-6 text-[#697391]">Loading your courses...</p>
          ) : enrolledCourses.length === 0 ? (
            <div className="rounded-[1.75rem] border border-dashed border-[#d9deea] bg-[linear-gradient(180deg,rgba(244,246,252,0.92),rgba(255,255,255,0.96))] p-6">
              <p className="text-xl font-semibold tracking-[-0.04em] text-[#18224d]">
                No enrolled courses yet
              </p>
              <p className="mt-2 max-w-xl text-sm leading-6 text-[#697391]">
                Start a course from the library and it will show up here with your progress.
              </p>
              <Button
                render={<Link href="/dashboard/courses" />}
                className="mt-6 h-12 rounded-2xl bg-accent px-5 font-semibold text-white hover:bg-accent-strong"
              >
                Browse Courses
              </Button>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {enrolledCourses.map((course) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  isEnrolled={true}
                  progressPercent={getCourseProgressRecord(course.id)?.progressPercent ?? 0}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
