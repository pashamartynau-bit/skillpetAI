"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, Loader2, Lock } from "lucide-react";

import { ChapterLearningScreen } from "@/components/chapter-learning-screen";
import { Button } from "@/components/ui/button";
import { fetchCourseAccess } from "@/lib/course-access-api";

type CourseChapterPageScreenProps = {
  chapterSlug: string;
  slug: string;
};

type ChapterAccessState = Awaited<ReturnType<typeof fetchCourseAccess>>;

export function CourseChapterPageScreen({
  chapterSlug,
  slug,
}: CourseChapterPageScreenProps) {
  const [data, setData] = useState<ChapterAccessState | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const nextData = await fetchCourseAccess(slug, chapterSlug);

        if (!cancelled) {
          setData(nextData);
          setError(null);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error ? loadError.message : "Unable to load this chapter.",
          );
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [chapterSlug, slug]);

  if (!data && !error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_left,#fbfff7_0%,#edf5e6_42%,#e5efde_100%)]">
        <Loader2 className="h-10 w-10 animate-spin text-accent" />
      </div>
    );
  }

  if (!data?.chapter) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_left,#fbfff7_0%,#edf5e6_42%,#e5efde_100%)] px-6">
        <div className="max-w-lg rounded-[2rem] border border-white/70 bg-white/90 p-8 text-center shadow-[0_32px_90px_-56px_rgba(34,46,84,0.5)]">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#fff4eb] text-[#d87a19]">
            <Lock className="h-6 w-6" />
          </div>
          <p className="mt-5 text-2xl font-semibold tracking-[-0.04em] text-[#16214d]">
            Chapter locked
          </p>
          <p className="mt-3 text-sm leading-6 text-[#697391]">
            {error ?? data?.lockedReason ?? "You do not have access to this chapter yet."}
          </p>
          <div className="mt-6 flex justify-center">
            <Button
              render={<Link href={`/courses/${encodeURIComponent(slug)}`} />}
              className="h-12 rounded-2xl bg-accent px-6 font-semibold text-white hover:bg-accent-strong"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to course
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ChapterLearningScreen
      chapter={data.chapter}
      chapterIndex={data.chapterIndex ?? 0}
      course={data.course}
    />
  );
}

