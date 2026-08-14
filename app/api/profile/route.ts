import { NextResponse } from "next/server";

import type {
  AppUserProfile,
  AppUserSettings,
  SelectedCharacter,
} from "@/lib/app-user-profile";

type StrapiDocument = {
  documentId: string;
  insforgeUserId?: string;
  email?: string | null;
  displayName?: string | null;
  avatarUrl?: string | null;
  emailVerified?: boolean | null;
  lastAuthenticatedAt?: string | null;
  characterFileName?: string | null;
  characterName?: string | null;
  emailRemindersEnabled?: boolean | null;
  showOnLeaderboard?: boolean | null;
};

type StrapiListResponse = {
  data: StrapiDocument[];
};

type StrapiSingleResponse = {
  data: StrapiDocument;
};

type ProfileUpdatePayload = {
  insforgeUserId: string;
  characterFileName?: string;
  characterName?: string;
  settings?: Partial<AppUserSettings>;
};

const STRAPI_BASE_URL = process.env.STRAPI_BASE_URL ?? "http://localhost:1337";
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN;
const STRAPI_USERS_COLLECTION = process.env.STRAPI_USERS_COLLECTION ?? "app-users";

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

function getHeaders() {
  if (!STRAPI_API_TOKEN) {
    throw new Error("Missing STRAPI_API_TOKEN.");
  }

  return {
    Authorization: `Bearer ${STRAPI_API_TOKEN}`,
    "Content-Type": "application/json",
  };
}

async function strapiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(new URL(path, STRAPI_BASE_URL), {
    ...init,
    headers: {
      ...getHeaders(),
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Strapi request failed with ${response.status}: ${errorText || response.statusText}`,
    );
  }

  return (await response.json()) as T;
}

async function findUserByInsforgeId(insforgeUserId: string) {
  const params = new URLSearchParams({
    "filters[insforgeUserId][$eq]": insforgeUserId,
    "pagination[pageSize]": "1",
  });

  const response = await strapiFetch<StrapiListResponse>(
    `/api/${STRAPI_USERS_COLLECTION}?${params.toString()}`,
    { method: "GET" },
  );

  return response.data[0] ?? null;
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

function toSelectedCharacter(document: StrapiDocument): SelectedCharacter | null {
  if (!document.characterFileName || !document.characterName) {
    return null;
  }

  return {
    fileName: document.characterFileName,
    name: document.characterName,
  };
}

function toAppUserSettings(document: StrapiDocument): AppUserSettings {
  return {
    emailRemindersEnabled: document.emailRemindersEnabled ?? true,
    showOnLeaderboard: document.showOnLeaderboard ?? true,
  };
}

function toAppUserProfile(document: StrapiDocument): AppUserProfile {
  return {
    documentId: document.documentId,
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
      if (!STRAPI_API_TOKEN) {
        throw new Error("Missing STRAPI_API_TOKEN.");
      }
      const user = await findUserByInsforgeId(insforgeUserId);

      if (!user) {
        return NextResponse.json({ error: "User profile not found." }, { status: 404 });
      }

      return NextResponse.json({ profile: toAppUserProfile(user) });
    } catch (strapiError) {
      console.error("Failed to fetch profile from Strapi:", strapiError);
      return NextResponse.json(
        {
          error:
            strapiError instanceof Error
              ? strapiError.message
              : "Unable to load user profile from Strapi.",
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
      if (!STRAPI_API_TOKEN) {
        throw new Error("Missing STRAPI_API_TOKEN.");
      }

      const existingUser = await findUserByInsforgeId(body.insforgeUserId);

      if (!existingUser) {
        return NextResponse.json({ error: "User profile not found." }, { status: 404 });
      }

      const updated = await strapiFetch<StrapiSingleResponse>(
        `/api/${STRAPI_USERS_COLLECTION}/${existingUser.documentId}`,
        {
          method: "PUT",
          body: JSON.stringify({
            data: buildProfileUpdateData(body),
          }),
        },
      );

      return NextResponse.json({ profile: toAppUserProfile(updated.data) });
    } catch (strapiError) {
      console.error("Failed to save character selection to Strapi:", strapiError);
      return NextResponse.json(
        {
          error:
            strapiError instanceof Error
              ? strapiError.message
              : "Unable to save character selection to Strapi.",
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
