import { NextResponse } from "next/server";

import { fetchPublishedCourses } from "@/lib/strapi-courses";

export async function GET() {
  try {
    const courses = await fetchPublishedCourses();
    return NextResponse.json({ courses });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to load courses from Strapi.",
      },
      { status: 500 },
    );
  }
}
