import { NextResponse } from "next/server";

import type { SyncedAuthUser } from "@/lib/auth-user";
import { findAppUserByEmail, findAppUserByInsforgeId, upsertAppUser } from "@/lib/cms-users";
import { hasSanityConfig } from "@/lib/sanity";
import { requireAuthenticatedInsforgeUser } from "@/lib/server-insforge-auth";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isSyncedAuthUser(value: unknown): value is SyncedAuthUser {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.insforgeUserId === "string" &&
    typeof value.email === "string" &&
    typeof value.emailVerified === "boolean" &&
    typeof value.lastAuthenticatedAt === "string"
  );
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!isSyncedAuthUser(body)) {
      return NextResponse.json(
        { error: "Invalid auth user payload." },
        { status: 400 },
      );
    }

    const authenticatedUser = await requireAuthenticatedInsforgeUser(request);

    if (authenticatedUser.id !== body.insforgeUserId || authenticatedUser.email !== body.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
      if (!hasSanityConfig()) {
        throw new Error("Missing SANITY_API_TOKEN.");
      }

      const existingDocument =
        (await findAppUserByInsforgeId(body.insforgeUserId)) ??
        (await findAppUserByEmail(body.email));
      const saved = await upsertAppUser(existingDocument?.insforgeUserId ?? body.insforgeUserId, {
        avatarUrl: body.avatarUrl,
        displayName: body.displayName,
        email: body.email,
        emailVerified: body.emailVerified,
        insforgeUserId: body.insforgeUserId,
        lastAuthenticatedAt: body.lastAuthenticatedAt,
      });

      return NextResponse.json({
        ok: true,
        operation: existingDocument ? "updated" : "created",
        documentId: saved._id,
      });
    } catch (cmsError) {
      console.error("Failed to sync user to Sanity:", cmsError);
      return NextResponse.json(
        {
          error:
            cmsError instanceof Error
              ? cmsError.message
              : "Unable to sync user to Sanity.",
        },
        { status: 500 },
      );
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to sync authenticated user to Sanity.";
    return NextResponse.json(
      { error: message },
      { status: message === "Unauthorized" ? 401 : 500 },
    );
  }
}
