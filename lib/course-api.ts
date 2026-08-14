import type { CourseRecord as DashboardCourse } from "@/lib/strapi-courses";

export type { DashboardCourse };

type CoursesResponse = {
  courses?: DashboardCourse[];
  error?: string;
};

export async function fetchDashboardCourses() {
  const response = await fetch("/api/courses", {
    method: "GET",
    cache: "no-store",
  });

  const payload = (await response.json()) as CoursesResponse;

  if (!response.ok || !payload.courses) {
    throw new Error(payload.error ?? "Failed to load courses from Strapi.");
  }

  return payload.courses;
}
