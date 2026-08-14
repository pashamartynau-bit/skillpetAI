import { buildAuthenticatedHeaders } from "@/lib/authenticated-fetch";
import type { CourseRecord, CourseChapterRecord } from "@/lib/strapi-courses";
import type { CourseAccessType } from "@/lib/billing";

export type CourseAccessResponse = {
  access?: {
    canAccessCourse: boolean;
    canEnroll: boolean;
    chapter?: CourseChapterRecord | null;
    chapterIndex?: number;
    course: CourseRecord;
    courseAccessType: CourseAccessType;
    hasActiveSubscription: boolean;
    isUnlocked?: boolean;
    lockedReason: string | null;
    unlockedChapterIds: string[];
  };
  error?: string;
};

export async function fetchCourseAccess(slug: string, chapterSlug?: string) {
  const params = new URLSearchParams({ slug });

  if (chapterSlug) {
    params.set("chapterSlug", chapterSlug);
  }

  const response = await fetch(`/api/course-access?${params.toString()}`, {
    cache: "no-store",
    headers: buildAuthenticatedHeaders(),
    method: "GET",
  });
  const payload = (await response.json()) as CourseAccessResponse;

  if (!response.ok || !payload.access) {
    throw new Error(payload.error ?? "Unable to load protected course data.");
  }

  return payload.access;
}

