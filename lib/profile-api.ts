import type { AppUserProfile } from "@/lib/app-user-profile";

type ProfileResponse = {
  error?: string;
  profile?: AppUserProfile;
};

type ProfileUpdatePayload = {
  insforgeUserId: string;
  characterFileName?: string;
  characterName?: string;
  settings?: Partial<AppUserProfile["settings"]>;
};

export async function fetchUserProfile(insforgeUserId: string) {
  const response = await fetch(
    `/api/profile?insforgeUserId=${encodeURIComponent(insforgeUserId)}`,
    {
      method: "GET",
      cache: "no-store",
    },
  );

  const payload = (await response.json()) as ProfileResponse;

  if (response.status === 404) {
    return null;
  }

  if (!response.ok || !payload.profile) {
    throw new Error(payload.error ?? "Failed to load user profile from Strapi.");
  }

  return payload.profile;
}

export async function updateUserProfile(payload: ProfileUpdatePayload) {
  const response = await fetch("/api/profile", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const result = (await response.json()) as ProfileResponse;

  if (!response.ok || !result.profile) {
    throw new Error(result.error ?? "Failed to save selected character.");
  }

  return result.profile;
}

export async function saveSelectedCharacter(
  payload: Required<Pick<ProfileUpdatePayload, "insforgeUserId" | "characterFileName" | "characterName">>,
) {
  return updateUserProfile(payload);
}
