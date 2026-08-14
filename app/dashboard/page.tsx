"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BookOpen, PlayCircle, Sparkles, Zap } from "lucide-react";
import { startTransition, useEffect, useState } from "react";

import { useDashboardProfile } from "@/components/dashboard-shell";
import { WeeklyStreakCalendar } from "@/components/weekly-streak-calendar";
import { Button } from "@/components/ui/button";
import { fetchDashboardCourses, type DashboardCourse } from "@/lib/course-api";
import {
  getCurrentStreakCount,
  getWeeklyStreakDays,
  readEnrolledCourseIds,
  subscribeToLearningProgress,
} from "@/lib/learning-progress";

const CHARACTER_VARIANT_BY_NAME: Record<string, string> = {
  byte: "Byte_1.png",
  hedge: "Hedge_1.png",
  kumo: "Kumo_1.png",
  milo: "Milo_1.png",
  nimbus: "Nimbus_1.png",
  pip: "Pip_1.png",
  rexi: "Rexi_1.png",
  uni: "Uni_1.png",
};

export default function DashboardPage() {
  const { loadingProfile, profile } = useDashboardProfile();
  const [courses, setCourses] = useState<DashboardCourse[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [coursesError, setCoursesError] = useState<string | null>(null);
  const [enrolledCourseIds, setEnrolledCourseIds] = useState<string[]>([]);
  const [weeklyStreakDays, setWeeklyStreakDays] = useState(getWeeklyStreakDays());
  const [completedStreakDays, setCompletedStreakDays] = useState(0);

  const userName = getUserName(profile?.displayName, profile?.email);
  const selectedCharacterImage = getSelectedCharacterVariant(profile?.character?.name);

  const continueLearningCourse = courses.find((c) => enrolledCourseIds.includes(c.id)) ?? null;
  const recommendedCourses = courses.filter((c) => !enrolledCourseIds.includes(c.id));

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
      setCompletedStreakDays(getCurrentStreakCount());
    };

    syncLearningState();
    return subscribeToLearningProgress(syncLearningState);
  }, []);

  return (
    <section className="mx-auto flex w-full max-w-7xl flex-col gap-3 pb-6">
      <div className="relative overflow-hidden px-2 py-2 sm:px-3 sm:py-3">
        <div className="absolute -top-20 right-8 h-56 w-56 rounded-full bg-accent/12 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-40 w-40 rounded-full bg-[#61d48c]/12 blur-3xl" />

        <div className="relative grid items-center gap-4 lg:grid-cols-[minmax(0,1.35fr)_240px] lg:gap-6">
          <div className="max-w-3xl">
            <p className="text-base font-medium tracking-[-0.03em] text-[#53607e] sm:text-lg">
              Good Morning,{" "}
              <span className="font-semibold text-[#1b2559]">{userName}</span>
            </p>
            <h1 className="mt-3 max-w-xl text-3xl font-semibold tracking-[-0.06em] text-[#16214d] sm:text-[2.7rem] sm:leading-[1.05]">
              Let&apos;s learn something amazing today.
            </h1>
          </div>

          <div className="mx-auto flex w-full max-w-[240px] justify-center lg:justify-end">
            <div className="relative flex h-[190px] w-full items-end justify-center p-1">
              <Image
                src={selectedCharacterImage}
                alt={profile?.character?.name ?? "Selected character"}
                width={210}
                height={210}
                priority
                className="h-auto max-h-[190px] w-auto object-contain drop-shadow-[0_18px_28px_rgba(60,199,79,0.18)]"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-8">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
          <section className="rounded-[1.75rem] border border-white/70 bg-white/85 p-6 shadow-[0_26px_80px_-54px_rgba(34,46,84,0.45)] backdrop-blur">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xl font-semibold tracking-[-0.04em] text-[#18224d]">
                  Daily Streak
                </p>
                <p className="mt-2 text-sm leading-6 text-[#697391]">
                  A day counts toward your streak after you make progress in a course.
                </p>
              </div>
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent-soft text-accent">
                <Zap className="h-7 w-7 fill-current" />
              </div>
            </div>

            <div className="mt-6 flex items-end gap-3">
              <span className="text-5xl font-semibold tracking-[-0.08em] text-accent-strong">
                {completedStreakDays}
              </span>
              <span className="pb-2 text-sm font-medium text-[#66708f]">
                days completed this week
              </span>
            </div>

            <WeeklyStreakCalendar
              weeklyStreakDays={weeklyStreakDays}
              size="md"
              showStatusText={true}
            />
          </section>

          <section className="rounded-[1.75rem] border border-white/70 bg-white/85 p-6 shadow-[0_26px_80px_-54px_rgba(34,46,84,0.45)] backdrop-blur">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xl font-semibold tracking-[-0.04em] text-[#18224d]">
                Continue Learning
              </p>
              {continueLearningCourse ? (
                <Link
                  href={continueLearningCourse.href}
                  className="text-sm font-medium text-accent-strong transition hover:text-accent"
                >
                  See all
                </Link>
              ) : null}
            </div>

            {continueLearningCourse ? (
              <div className="mt-6 grid gap-5 md:grid-cols-[180px_minmax(0,1fr)]">
                <div className="relative overflow-hidden rounded-[1.5rem] bg-[linear-gradient(160deg,rgba(236,249,239,0.96)_0%,rgba(227,244,229,0.92)_50%,rgba(242,249,240,0.95)_100%)] p-5">
                  <div className="absolute right-0 bottom-0 h-20 w-20 rounded-full bg-accent/12 blur-2xl" />
                  <Image
                    src={continueLearningCourse.bannerSrc}
                    alt={continueLearningCourse.bannerAlt}
                    width={continueLearningCourse.bannerWidth}
                    height={continueLearningCourse.bannerHeight}
                    className="relative mx-auto h-auto max-h-[152px] w-auto object-contain"
                  />
                </div>

                <div className="flex min-w-0 flex-col justify-center">
                  <p className="text-2xl font-semibold tracking-[-0.05em] text-[#18224d]">
                    {continueLearningCourse.name}
                  </p>
                  <p className="mt-2 text-base text-[#697391]">
                    {getCourseSummary(continueLearningCourse)}
                  </p>

                  <div className="mt-6">
                    <p className="text-sm leading-6 text-[#697391]">
                      {continueLearningCourse.description}
                    </p>
                  </div>

                  <div className="mt-6">
                    <Button
                      render={<Link href={continueLearningCourse.href} />}
                      className="h-11 rounded-2xl bg-accent-soft px-5 font-semibold text-accent-strong hover:bg-accent-soft/80"
                    >
                      <PlayCircle className="h-4 w-4" />
                      Explore Course
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-6 flex  flex-col items-start justify-center rounded-[1.5rem] border border-dashed border-[#d9deea] bg-[linear-gradient(180deg,rgba(244,246,252,0.92),rgba(255,255,255,0.96))] p-6">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent-soft text-accent-strong">
                  <BookOpen className="h-6 w-6" />
                </div>
                <p className="mt-5 text-2xl font-semibold tracking-[-0.05em] text-[#18224d]">
                  Start learning your first course
                </p>
                <p className="mt-2 max-w-md text-sm leading-6 text-[#697391]">
                  Enroll in an AI course to unlock guided chapters, track progress,
                  and keep your learning streak moving.
                </p>
                <Button
                  render={<Link href="/dashboard/courses" />}
                  className="mt-6 h-11 rounded-2xl bg-accent px-5 font-semibold text-white hover:bg-accent-strong"
                >
                  <Sparkles className="h-4 w-4" />
                  Explore All AI Courses
                </Button>
              </div>
            )}
          </section>
        </div>

        <section className="rounded-[1.75rem] border border-white/70 bg-white/72 p-6 shadow-[0_26px_80px_-56px_rgba(34,46,84,0.32)] backdrop-blur">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xl font-semibold tracking-[-0.04em] text-[#18224d]">
                Recommended For You
              </p>
              <p className="mt-2 text-sm leading-6 text-[#697391]">
                Short, practical AI courses chosen to keep your momentum up.
              </p>
            </div>
          </div>

          <div className="mt-6 overflow-x-auto pb-2">
            {recommendedCourses.length > 0 ? (
              <div className="grid auto-cols-[minmax(260px,320px)] grid-flow-col gap-5">
                {recommendedCourses.map((course) => (
                  <article
                    key={course.id}
                    className="flex h-full min-h-[340px] flex-col rounded-[1.5rem] border border-[#edf0f6] bg-white/92 p-5 shadow-[0_20px_60px_-54px_rgba(34,46,84,0.45)]"
                  >
                    <div className="relative overflow-hidden rounded-[1.35rem] ">
                      <div className="absolute top-3 right-3 rounded-full bg-white/80 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-accent-strong">
                        AI
                      </div>
                      <Image
                        src={course.bannerSrc}
                        alt={course.bannerAlt}
                        width={course.bannerWidth}
                        height={course.bannerHeight}
                        className="mx-auto h-[150px] w-auto object-contain"
                      />
                    </div>

                    <div className="mt-5 flex flex-1 flex-col">
                      <p className="text-2xl font-semibold tracking-[-0.05em] text-[#18224d]">
                        {course.name}
                      </p>
                      <p className="mt-3 flex-1 text-sm font-medium text-accent-strong">
                        {getCourseSummary(course)}
                      </p>

                      <Button
                        render={<Link href={course.href} />}
                        className="mt-5 h-11 rounded-2xl bg-accent-soft px-4 font-semibold text-accent-strong hover:bg-accent-soft/80"
                      >
                        Explore Course
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </article>
                ))}
              </div>
            ) : !loadingCourses && !coursesError ? (
              courses.length === 0 ? (
                <div className="rounded-[1.5rem] border border-dashed border-[#d9deea] bg-[linear-gradient(180deg,rgba(244,246,252,0.92),rgba(255,255,255,0.96))] p-6">
                  <p className="text-lg font-semibold tracking-[-0.04em] text-[#18224d]">
                    No published courses available yet
                  </p>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-[#697391]">
                    Publish one or more course entries in Strapi to show them on the
                    dashboard and enable `/courses/[slug]` pages.
                  </p>
                </div>
              ) : (
                <div className="rounded-[1.5rem] border border-dashed border-[#d9deea] bg-[linear-gradient(180deg,rgba(244,246,252,0.92),rgba(255,255,255,0.96))] p-6">
                  <p className="text-lg font-semibold tracking-[-0.04em] text-[#18224d]">
                    You&apos;ve enrolled in all available courses!
                  </p>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-[#697391]">
                    Check your &quot;Continue Learning&quot; section above to access your courses and track your progress.
                  </p>
                </div>
              )
            ) : null}
          </div>
        </section>

        {loadingProfile ? (
          <p className="text-sm text-[#6b7595]">Loading your dashboard...</p>
        ) : null}
        {loadingCourses ? (
          <p className="text-sm text-[#6b7595]">Loading courses from Strapi...</p>
        ) : null}
        {coursesError ? (
          <p className="text-sm text-[#b25b5b]">{coursesError}</p>
        ) : null}
      </div>
    </section>
  );
}



function getCourseSummary(course: DashboardCourse) {
  if (course.estimatedMinutes) {
    return `${course.difficulty} • ${course.estimatedMinutes} min`;
  }

  return course.difficulty;
}

function getUserName(displayName: string | null | undefined, email: string | null | undefined) {
  if (displayName?.trim()) {
    return displayName.trim();
  }

  if (email?.trim()) {
    return email.split("@")[0];
  }

  return "Learner";
}

function getSelectedCharacterVariant(characterName: string | null | undefined) {
  const normalizedName = characterName?.trim().toLowerCase();

  if (normalizedName && CHARACTER_VARIANT_BY_NAME[normalizedName]) {
    return `/characters/${CHARACTER_VARIANT_BY_NAME[normalizedName]}`;
  }

  return "/characters/Pip_1.png";
}
