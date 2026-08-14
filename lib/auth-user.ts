import type { UserSchema } from "@insforge/sdk";

export type SyncedAuthUser = {
  insforgeUserId: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  emailVerified: boolean;
  lastAuthenticatedAt: string;
};

export function mapInsforgeUserToSyncPayload(user: UserSchema): SyncedAuthUser {
  return {
    insforgeUserId: user.id,
    email: user.email,
    displayName: user.profile?.name ?? null,
    avatarUrl: user.profile?.avatar_url ?? null,
    emailVerified: user.emailVerified,
    lastAuthenticatedAt: new Date().toISOString(),
  };
}
