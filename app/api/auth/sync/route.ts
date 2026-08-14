import { NextResponse } from "next/server";

import type { SyncedAuthUser } from "@/lib/auth-user";

type StrapiDocument = {
  documentId: string;
  insforgeUserId?: string;
  email?: string;
};

type StrapiListResponse = {
  data: StrapiDocument[];
};

const STRAPI_BASE_URL = process.env.STRAPI_BASE_URL ?? "http://localhost:1337";
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN;
const STRAPI_USERS_COLLECTION = process.env.STRAPI_USERS_COLLECTION ?? "app-users";

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

async function findExistingDocument(
  user: SyncedAuthUser,
): Promise<StrapiDocument | null> {
  const byUserId = new URLSearchParams({
    "filters[insforgeUserId][$eq]": user.insforgeUserId,
    "pagination[pageSize]": "1",
  });

  const userIdMatch = await strapiFetch<StrapiListResponse>(
    `/api/${STRAPI_USERS_COLLECTION}?${byUserId.toString()}`,
    { method: "GET" },
  );

  if (userIdMatch.data[0]) {
    return userIdMatch.data[0];
  }

  const byEmail = new URLSearchParams({
    "filters[email][$eq]": user.email,
    "pagination[pageSize]": "1",
  });

  const emailMatch = await strapiFetch<StrapiListResponse>(
    `/api/${STRAPI_USERS_COLLECTION}?${byEmail.toString()}`,
    { method: "GET" },
  );

  return emailMatch.data[0] ?? null;
}

function buildStrapiPayload(user: SyncedAuthUser) {
  return {
    data: {
      insforgeUserId: user.insforgeUserId,
      email: user.email,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      emailVerified: user.emailVerified,
      lastAuthenticatedAt: user.lastAuthenticatedAt,
    },
  };
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
      if (!STRAPI_API_TOKEN) {
        return NextResponse.json({
          ok: true,
          operation: "demo-mode",
          documentId: `demo-${body.insforgeUserId}`,
        });
      }

      const existingDocument = await findExistingDocument(body);
      const payload = JSON.stringify(buildStrapiPayload(body));

      if (existingDocument) {
        const updated = await strapiFetch<{ data: StrapiDocument }>(
          `/api/${STRAPI_USERS_COLLECTION}/${existingDocument.documentId}`,
          {
            method: "PUT",
            body: payload,
          },
        );

        return NextResponse.json({
          ok: true,
          operation: "updated",
          documentId: updated.data.documentId,
        });
      }

      const created = await strapiFetch<{ data: StrapiDocument }>(
        `/api/${STRAPI_USERS_COLLECTION}`,
        {
          method: "POST",
          body: payload,
        },
      );

      return NextResponse.json({
        ok: true,
        operation: "created",
        documentId: created.data.documentId,
      });
    } catch (strapiError) {
      console.error("Failed to sync user to Strapi:", strapiError);
      return NextResponse.json(
        {
          error:
            strapiError instanceof Error
              ? strapiError.message
              : "Unable to sync user to Strapi.",
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
            : "Unable to sync authenticated user to Strapi.",
      },
      { status: 500 },
    );
  }
}
