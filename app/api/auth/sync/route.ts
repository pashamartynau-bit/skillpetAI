import { NextResponse } from "next/server";

import type { SyncedAuthUser } from "@/lib/auth-user";
import { findAppUserByEmail, findAppUserByInsforgeId, upsertAppUser } from "@/lib/cms-users";
import { hasSanityConfig } from "@/lib/sanity";

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

    try {
      if (!hasSanityConfig()) {
        return NextResponse.json({
          ok: true,
          operation: "demo-mode",
          documentId: `demo-${body.insforgeUserId}`,
        });
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
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to sync authenticated user to Sanity.",
      },
      { status: 500 },
    );
  }
}
