import { NextResponse } from "next/server";

import { getAuthenticatedInsforgeUser } from "@/lib/server-insforge-auth";
import {
  findAppUserBillingByInsforgeId,
  getChapterAccessSnapshot,
  getCourseAccessSnapshot,
} from "@/lib/strapi-billing";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");
    const chapterSlug = searchParams.get("chapterSlug");

    if (!slug) {
      return NextResponse.json({ error: "Missing course slug." }, { status: 400 });
    }

    const user = await getAuthenticatedInsforgeUser(request);
    const billingDocument = user ? await findAppUserBillingByInsforgeId(user.id) : null;
    const subscriptionStatus = billingDocument?.stripeSubscriptionStatus ?? null;

    if (chapterSlug) {
      const chapterSnapshot = await getChapterAccessSnapshot(slug, chapterSlug, subscriptionStatus);

      if (!chapterSnapshot) {
        return NextResponse.json({ error: "Chapter not found." }, { status: 404 });
      }

      if (!chapterSnapshot.isUnlocked) {
        return NextResponse.json(
          {
            access: {
              ...chapterSnapshot,
              chapter: null,
              course: chapterSnapshot.course,
            },
            error: chapterSnapshot.lockedReason ?? "This chapter is locked.",
          },
          { status: 403 },
        );
      }

      return NextResponse.json({
        access: chapterSnapshot,
      });
    }

    const courseSnapshot = await getCourseAccessSnapshot(slug, subscriptionStatus);

    if (!courseSnapshot) {
      return NextResponse.json({ error: "Course not found." }, { status: 404 });
    }

    return NextResponse.json({
      access: courseSnapshot,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to load course access." },
      { status: 500 },
    );
  }
}

