"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { BookOpen, ArrowRight, Loader2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Progress,
  ProgressIndicator,
  ProgressTrack,
} from "@/components/ui/progress";
import type { DashboardCourse } from "@/lib/course-api";

interface CourseCardProps {
  course: DashboardCourse;
  isEnrolled: boolean;
  progressPercent: number;
  onBeforeNavigate?: () => void | Promise<unknown>;
}

export function CourseCard({
  course,
  isEnrolled,
  progressPercent,
  onBeforeNavigate,
}: CourseCardProps) {
  return (
    <article
      className="flex h-full flex-col rounded-[1.75rem] border border-white/70 bg-white/86 p-5 shadow-[0_24px_72px_-52px_rgba(34,46,84,0.45)]"
    >
      <div className="flex min-h-[176px] items-center justify-center overflow-hidden rounded-[1.5rem] ">
        <Image
          src={course.bannerSrc}
          alt={course.bannerAlt}
          width={course.bannerWidth}
          height={course.bannerHeight}
          className="h-[206px] w-auto object-contain"
        />
      </div>

      <div className="mt-5 flex flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-2xl font-semibold tracking-[-0.05em] text-[#18224d]">
            {course.name}
          </h2>
          <span className="rounded-full bg-[#eef3ff] px-3 py-1 text-xs font-semibold text-[#5667d8]">
            {course.difficulty}
          </span>
        </div>

        <p className="mt-3 line-clamp-2 text-sm leading-6 text-[#697391]">
          {course.description}
        </p>

        <div className="mt-5">
          {isEnrolled ? (
            <>
              <Progress value={progressPercent} className="gap-2">
                <ProgressTrack className="h-2 rounded-full bg-[#edf0f7]">
                  <ProgressIndicator className="bg-[linear-gradient(90deg,#7c67ff_0%,#9f8cff_100%)]" />
                </ProgressTrack>
                <div className="ml-auto text-xs font-semibold text-[#697391]">
                  {progressPercent}%
                </div>
              </Progress>
              <CourseActionButton
                href={course.href}
                label="Continue"
                variant="continue"
                onBeforeNavigate={onBeforeNavigate}
              />
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 text-sm text-[#697391]">
                <BookOpen className="h-4 w-4 text-[#8b94ae]" />
                <span>Not started yet</span>
              </div>
              <CourseActionButton
                href={course.href}
                label="Start"
                variant="start"
                onBeforeNavigate={onBeforeNavigate}
              />
            </>
          )}
        </div>
      </div>
    </article>
  );
}

function CourseActionButton({
  href,
  label,
  onBeforeNavigate,
  variant,
}: {
  href: string;
  label: string;
  onBeforeNavigate?: () => void | Promise<unknown>;
  variant: "continue" | "start";
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleClick = async (e: React.MouseEvent) => {
    if (onBeforeNavigate) {
      e.preventDefault();
      setLoading(true);
      try {
        await onBeforeNavigate();
      } catch (error) {
        console.error("Failed onBeforeNavigate:", error);
      } finally {
        setLoading(false);
      }
    }
    router.push(href);
  };

  return (
    <Button
      onClick={handleClick}
      disabled={loading}
      className={
        variant === "continue"
          ? "mt-4 h-12 w-full rounded-2xl bg-[#efeaff] font-semibold text-[#6b4eff] hover:bg-[#e6deff]"
          : "mt-4 h-12 w-full rounded-2xl bg-accent px-5 font-semibold text-white hover:bg-accent-strong"
      }
    >
      {loading ? (
        <>
          <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
          Loading...
        </>
      ) : (
        <>
          {label}
          <ArrowRight className="h-4 w-4" />
        </>
      )}
    </Button>
  );
}
