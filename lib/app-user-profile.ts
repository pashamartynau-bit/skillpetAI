export type SelectedCharacter = {
  fileName: string;
  name: string;
};

export type AppUserSettings = {
  emailRemindersEnabled: boolean;
  showOnLeaderboard: boolean;
};

export type AppUserProfile = {
  documentId: string;
  insforgeUserId: string;
  email: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  emailVerified: boolean;
  lastAuthenticatedAt: string | null;
  character: SelectedCharacter | null;
  settings: AppUserSettings;
};
