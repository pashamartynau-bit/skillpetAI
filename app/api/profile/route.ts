import { NextResponse } from "next/server";

import type {
  AppUserProfile,
  AppUserSettings,
  SelectedCharacter,
} from "@/lib/app-user-profile";
import { findAppUserByInsforgeId, upsertAppUser, type AppUserRecord } from "@/lib/cms-users";
import { hasSanityConfig } from "@/lib/sanity";

type ProfileUpdatePayload = {
  insforgeUserId: string;
  characterFileName?: string;
  characterName?: string;
  settings?: Partial<AppUserSettings>;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isProfileUpdatePayload(value: unknown): value is ProfileUpdatePayload {
  if (!isRecord(value)) {
    return false;
  }

  if (typeof value.insforgeUserId !== "string") {
    return false;
  }

  if ("characterFileName" in value && typeof value.characterFileName !== "string") {
    return false;
  }

  if ("characterName" in value && typeof value.characterName !== "string") {
    return false;
  }

  if ("settings" in value) {
    if (!isRecord(value.settings)) {
      return false;
    }

    if (
      "emailRemindersEnabled" in value.settings &&
      typeof value.settings.emailRemindersEnabled !== "boolean"
    ) {
      return false;
    }

    if (
      "showOnLeaderboard" in value.settings &&
      typeof value.settings.showOnLeaderboard !== "boolean"
    ) {
      return false;
    }
  }

  const hasCharacterUpdate =
    typeof value.characterFileName === "string" && typeof value.characterName === "string";
  const hasSettingsUpdate = isRecord(value.settings);

  return hasCharacterUpdate || hasSettingsUpdate;
}

function buildProfileUpdateData(body: ProfileUpdatePayload) {
  const data: Record<string, boolean | string> = {};

  if (body.characterFileName && body.characterName) {
    data.characterFileName = body.characterFileName;
    data.characterName = body.characterName;
  }

  if (body.settings) {
    if (typeof body.settings.emailRemindersEnabled === "boolean") {
      data.emailRemindersEnabled = body.settings.emailRemindersEnabled;
    }

    if (typeof body.settings.showOnLeaderboard === "boolean") {
      data.showOnLeaderboard = body.settings.showOnLeaderboard;
    }
  }

  return data;
}

function toSelectedCharacter(document: AppUserRecord): SelectedCharacter | null {
  if (!document.characterFileName || !document.characterName) {
    return null;
  }

  return {
    fileName: document.characterFileName,
    name: document.characterName,
  };
}

function toAppUserSettings(document: AppUserRecord): AppUserSettings {
  return {
    emailRemindersEnabled: document.emailRemindersEnabled ?? true,
    showOnLeaderboard: document.showOnLeaderboard ?? true,
  };
}

function toAppUserProfile(document: AppUserRecord): AppUserProfile {
  return {
    documentId: document._id,
    insforgeUserId: document.insforgeUserId ?? "",
    email: document.email ?? null,
    displayName: document.displayName ?? null,
    avatarUrl: document.avatarUrl ?? null,
    emailVerified: document.emailVerified ?? false,
    lastAuthenticatedAt: document.lastAuthenticatedAt ?? null,
    character: toSelectedCharacter(document),
    settings: toAppUserSettings(document),
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const insforgeUserId = searchParams.get("insforgeUserId");

    if (!insforgeUserId) {
      return NextResponse.json(
        { error: "Missing insforgeUserId query parameter." },
        { status: 400 },
      );
    }

    try {
      if (!hasSanityConfig()) {
        throw new Error("Missing SANITY_API_TOKEN.");
      }

      const user = await findAppUserByInsforgeId(insforgeUserId);

      if (!user) {
        return NextResponse.json({ error: "User profile not found." }, { status: 404 });
      }

      return NextResponse.json({ profile: toAppUserProfile(user) });
    } catch (cmsError) {
      console.error("Failed to fetch profile from Sanity:", cmsError);
      return NextResponse.json(
        {
          error:
            cmsError instanceof Error
              ? cmsError.message
              : "Unable to load user profile from Sanity.",
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
            : "Unable to load the user profile.",
      },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();

    if (!isProfileUpdatePayload(body)) {
      return NextResponse.json(
        { error: "Invalid character selection payload." },
        { status: 400 },
      );
    }

    try {
      if (!hasSanityConfig()) {
        throw new Error("Missing SANITY_API_TOKEN.");
      }

      const existingUser = await findAppUserByInsforgeId(body.insforgeUserId);

      if (!existingUser) {
        return NextResponse.json({ error: "User profile not found." }, { status: 404 });
      }

      const updated = await upsertAppUser(body.insforgeUserId, buildProfileUpdateData(body));

      return NextResponse.json({ profile: toAppUserProfile(updated) });
    } catch (cmsError) {
      console.error("Failed to save character selection to Sanity:", cmsError);
      return NextResponse.json(
        {
          error:
            cmsError instanceof Error
              ? cmsError.message
              : "Unable to save character selection to Sanity.",
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
            : "Unable to save the selected character.",
      },
      { status: 500 },
    );
  }
}
