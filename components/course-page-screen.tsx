"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, Clock3, Loader2 } from "lucide-react";

import { CourseChaptersProgress } from "@/components/course-chapters-progress";
import { EnrollButton } from "@/components/enroll-button";
import { Button } from "@/components/ui/button";
import { fetchCourseAccess } from "@/lib/course-access-api";
import type { CourseAccessType } from "@/lib/billing";

type CoursePageScreenProps = {
  slug: string;
};

type CourseAccessState = Awaited<ReturnType<typeof fetchCourseAccess>>;

export function CoursePageScreen({ slug }: CoursePageScreenProps) {
  const [data, setData] = useState<CourseAccessState | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const nextData = await fetchCourseAccess(slug);

        if (!cancelled) {
          setData(nextData);
          setError(null);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load course.");
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (!data && !error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_left,#fbfff7_0%,#edf5e6_42%,#e5efde_100%)]">
        <Loader2 className="h-10 w-10 animate-spin text-accent" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_left,#fbfff7_0%,#edf5e6_42%,#e5efde_100%)] px-6 text-center">
        <div>
          <p className="text-xl font-semibold text-[#16214d]">Unable to load course</p>
          <p className="mt-2 text-sm text-[#697391]">{error}</p>
        </div>
      </div>
    );
  }

  const { course } = data;

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#fbfff7_0%,#edf5e6_42%,#e5efde_100%)] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        <div>
          <Button
            render={<Link href="/dashboard" />}
            className="h-11 rounded-2xl bg-transparent px-1 font-semibold text-[#2a9f44] hover:bg-transparent hover:text-[#258a3b]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to dashboard
          </Button>
        </div>

        <section className="grid gap-8 rounded-[2rem] border border-white/70 bg-white/88 p-6 shadow-[0_32px_90px_-56px_rgba(34,46,84,0.5)] backdrop-blur md:grid-cols-[minmax(0,1.1fr)_360px] md:p-8">
          <div className="flex flex-col justify-center">
            <div className="flex flex-wrap gap-3">
              <p className="inline-flex w-fit items-center rounded-full bg-[#eef9f0] px-4 py-2 text-sm font-semibold text-[#2ca949]">
                {course.difficulty}
              </p>
              <CourseAccessBadge accessType={data.courseAccessType} />
            </div>

            <h1 className="mt-3 text-4xl font-semibold tracking-[-0.06em] text-[#16214d] sm:text-[3.25rem] sm:leading-[1.02]">
              {course.name}
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-[#5f6987] sm:text-lg">
              {course.description}
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3 text-sm font-medium text-[#4b5677]">
              {course.estimatedMinutes ? (
                <span className="inline-flex items-center gap-2 rounded-full bg-[#eef8f0] px-4 py-2 text-accent-strong">
                  <Clock3 className="h-4 w-4" />
                  {course.estimatedMinutes} minutes
                </span>
              ) : null}
              <span className="rounded-full bg-[#f3f4f7] px-4 py-2 text-[#55617f]">
                Course slug: {course.slug}
              </span>
            </div>

            {data.lockedReason ? (
              <p className="mt-5 max-w-xl rounded-2xl bg-[#fff5ea] px-4 py-3 text-sm font-medium text-[#a15d1c]">
                {data.lockedReason}
              </p>
            ) : null}

            <div className="mt-8">
              <EnrollButton
                canEnroll={data.canEnroll}
                courseId={course.id}
                lockedReason={data.lockedReason}
              />
            </div>
          </div>

          <div className="relative overflow-hidden rounded-[1.75rem] bg-[linear-gradient(155deg,rgba(237,249,238,0.96)_0%,rgba(229,245,232,0.94)_100%)] p-6">
            <div className="absolute -right-4 -bottom-4 h-28 w-28 rounded-full bg-accent/15 blur-3xl" />
            <Image
              src={course.bannerSrc}
              alt={course.bannerAlt}
              width={course.bannerWidth}
              height={course.bannerHeight}
              priority
              className="relative mx-auto h-auto max-h-[340px] w-auto object-contain"
            />
          </div>
        </section>

        <CourseChaptersProgress
          chapters={course.chapters}
          courseId={course.id}
          unlockedChapterIds={data.unlockedChapterIds}
        />
      </div>
    </main>
  );
}

function CourseAccessBadge({ accessType }: { accessType: CourseAccessType }) {
  const label =
    accessType === "free"
      ? "Free course"
      : accessType === "freemium"
        ? "Freemium"
        : "Subscriber only";

  return (
    <span className="inline-flex w-fit items-center rounded-full bg-[#eef3ff] px-4 py-2 text-sm font-semibold text-[#3558c9]">
      {label}
    </span>
  );
}

