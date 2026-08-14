"use client";

import Image from "next/image";
import { CheckCircle2, LoaderCircle, LogOut, Mail, ShieldCheck, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { startTransition, useMemo, useState } from "react";

import { useDashboardProfile } from "@/components/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { clearLearningProgressState } from "@/lib/learning-progress";
import type { CharacterOption } from "@/lib/character-options";
import { getInsforgeBrowserClient } from "@/lib/insforge-browser";
import { updateUserProfile } from "@/lib/profile-api";

type ProfilePageScreenProps = {
  characters: CharacterOption[];
};

type StatusState = {
  tone: "success" | "error";
  text: string;
} | null;

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Something went wrong. Please try again.";
}

function getInitials(value: string | null | undefined) {
  const trimmedValue = value?.trim();

  if (!trimmedValue) {
    return "SP";
  }

  const parts = trimmedValue.split(/\s+/).filter(Boolean);

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0]?.[0] ?? ""}${parts[1]?.[0] ?? ""}`.toUpperCase();
}

function formatLastSeen(value: string | null) {
  if (!value) {
    return "Unavailable";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unavailable";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function ProfilePageScreen({ characters }: ProfilePageScreenProps) {
  const router = useRouter();
  const { loadingProfile, profile, setProfile } = useDashboardProfile();
  const [characterOverride, setCharacterOverride] = useState<string | null>(null);
  const [settingsOverride, setSettingsOverride] = useState<{
    emailRemindersEnabled: boolean;
    showOnLeaderboard: boolean;
  } | null>(null);
  const [saving, setSaving] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [status, setStatus] = useState<StatusState>(null);

  const settings = settingsOverride ?? profile?.settings ?? null;
  const selectedCharacterFileName =
    characterOverride ?? profile?.character?.fileName ?? characters[0]?.fileName ?? null;

  const selectedCharacter = useMemo(
    () =>
      characters.find((character) => character.fileName === selectedCharacterFileName) ??
      characters[0] ??
      null,
    [characters, selectedCharacterFileName],
  );

  const hasCharacterChanges =
    !!profile &&
    !!selectedCharacter &&
    selectedCharacter.fileName !== (profile.character?.fileName ?? null);

  const hasSettingsChanges =
    !!profile &&
    !!settings &&
    (settings.emailRemindersEnabled !== profile.settings.emailRemindersEnabled ||
      settings.showOnLeaderboard !== profile.settings.showOnLeaderboard);

  const hasChanges = hasCharacterChanges || hasSettingsChanges;

  async function handleSave() {
    if (!profile || !selectedCharacter || !settings || !hasChanges) {
      return;
    }

    setSaving(true);
    setStatus(null);

    try {
      const updatedProfile = await updateUserProfile({
        insforgeUserId: profile.insforgeUserId,
        ...(hasCharacterChanges
          ? {
              characterFileName: selectedCharacter.fileName,
              characterName: selectedCharacter.name,
            }
          : {}),
        ...(hasSettingsChanges ? { settings } : {}),
      });

      startTransition(() => {
        setProfile(updatedProfile);
        setCharacterOverride(null);
        setSettingsOverride(null);
        setStatus({ tone: "success", text: "Profile changes saved." });
      });
    } catch (error) {
      setStatus({ tone: "error", text: getErrorMessage(error) });
    } finally {
      setSaving(false);
    }
  }

  async function handleSignOut() {
    setSigningOut(true);

    try {
      const client = getInsforgeBrowserClient();
      await client.auth.signOut();
      clearLearningProgressState();
      router.replace("/");
    } catch (error) {
      setStatus({ tone: "error", text: getErrorMessage(error) });
      setSigningOut(false);
    }
  }

  if (loadingProfile || !profile || !settings) {
    return (
      <section className="mx-auto grid w-full max-w-6xl gap-6 md:grid-cols-2">
        <div className="h-56 animate-pulse rounded-[1.75rem] border border-white/70 bg-white/70" />
        <div className="h-56 animate-pulse rounded-[1.75rem] border border-white/70 bg-white/70" />
        <div className="h-72 animate-pulse rounded-[1.75rem] border border-white/70 bg-white/70 md:col-span-2" />
      </section>
    );
  }

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-6 pb-8">
      <div className="flex flex-col gap-4 rounded-[1.9rem] border border-white/70 bg-white/78 p-6 shadow-[0_26px_80px_-56px_rgba(34,46,84,0.32)] backdrop-blur sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-[#6a7593]">
            Profile
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.06em] text-[#18224d]">
            Account, companion, and app settings
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#697391]">
            Review your synced profile details, switch your selected character, and
            manage the settings that shape how SkillPet works for you.
          </p>
        </div>

        <Button
          type="button"
          onClick={() => void handleSave()}
          disabled={saving || !hasChanges}
          className="h-11 rounded-2xl bg-accent px-5 font-semibold text-white hover:bg-accent-strong"
        >
          {saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
          Save Changes
        </Button>
      </div>

      {status ? (
        <div
          className={`rounded-2xl border px-4 py-3 text-sm ${
            status.tone === "success"
              ? "border-[#caeccf] bg-[#f4fbf4] text-[#246238]"
              : "border-[#f2d2d6] bg-[#fff6f7] text-[#a33f4f]"
          }`}
        >
          {status.text}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        <Card className="rounded-[1.75rem] border border-white/75 bg-white/88 shadow-[0_24px_80px_-56px_rgba(34,46,84,0.34)]">
          <CardHeader className="pb-0">
            <CardTitle className="text-xl tracking-[-0.04em] text-[#18224d]">
              Profile details
            </CardTitle>
            <CardDescription className="text-[#697391]">
              Synced from your authenticated account and Strapi profile record.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-[1.6rem] bg-[linear-gradient(180deg,#ebf9ec,#d8f1dd)] text-2xl font-semibold text-accent-strong">
                {getInitials(profile.displayName ?? profile.email)}
              </div>
              <div className="min-w-0">
                <p className="text-2xl font-semibold tracking-[-0.05em] text-[#18224d]">
                  {profile.displayName?.trim() || "SkillPet learner"}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-[#697391]">
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#f3f6fb] px-3 py-1">
                    <Mail className="h-3.5 w-3.5" />
                    {profile.email ?? "No email available"}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#eef7ef] px-3 py-1 text-[#246238]">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    {profile.emailVerified ? "Email verified" : "Email not verified"}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <DetailTile label="Account ID" value={profile.insforgeUserId} />
              <DetailTile label="Last sign-in sync" value={formatLastSeen(profile.lastAuthenticatedAt)} />
              <DetailTile label="Leaderboard status" value={settings.showOnLeaderboard ? "Visible" : "Hidden"} />
              <DetailTile
                label="Reminder emails"
                value={settings.emailRemindersEnabled ? "Enabled" : "Paused"}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[1.75rem] border border-white/75 bg-white/88 shadow-[0_24px_80px_-56px_rgba(34,46,84,0.34)]">
          <CardHeader className="pb-0">
            <CardTitle className="text-xl tracking-[-0.04em] text-[#18224d]">
              Current companion
            </CardTitle>
            <CardDescription className="text-[#697391]">
              Your selected character appears across the dashboard and learning views.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="rounded-[1.6rem] bg-[linear-gradient(160deg,rgba(236,249,239,0.96)_0%,rgba(227,244,229,0.92)_50%,rgba(242,249,240,0.95)_100%)] p-5">
              <div className="relative mx-auto flex min-h-[240px] items-center justify-center overflow-hidden rounded-[1.4rem]">
                <div className="absolute right-2 top-2 rounded-full bg-white/85 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-accent-strong">
                  Active
                </div>
                {selectedCharacter ? (
                  <Image
                    src={selectedCharacter.imageSrc}
                    alt={selectedCharacter.name}
                    width={220}
                    height={220}
                    className="h-auto max-h-[230px] w-auto object-contain drop-shadow-[0_18px_28px_rgba(60,199,79,0.18)]"
                    priority
                  />
                ) : null}
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-2xl font-semibold tracking-[-0.05em] text-[#18224d]">
                  {selectedCharacter?.name ?? "No character selected"}
                </p>
                <p className="mt-1 text-sm text-[#697391]">
                  Pick a new buddy below and save when you&apos;re ready.
                </p>
              </div>
              {hasCharacterChanges ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-[#eef7ef] px-3 py-1 text-sm font-medium text-[#246238]">
                  <Sparkles className="h-3.5 w-3.5" />
                  Pending change
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-[#f3f6fb] px-3 py-1 text-sm font-medium text-[#697391]">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Saved
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-[1.75rem] border border-white/75 bg-white/88 shadow-[0_24px_80px_-56px_rgba(34,46,84,0.34)]">
        <CardHeader className="pb-0">
          <CardTitle className="text-xl tracking-[-0.04em] text-[#18224d]">
            Essential settings
          </CardTitle>
          <CardDescription className="text-[#697391]">
            The app uses these preferences for reminders and leaderboard visibility.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 pt-6">
          <SettingRow
            checked={settings.emailRemindersEnabled}
            description="Keep weekly email reminders on so SkillPet can nudge you back into a course."
            label="Email reminders"
            onCheckedChange={(checked) => {
              setSettingsOverride({
                ...settings,
                emailRemindersEnabled: checked,
              });
            }}
          />
          <SettingRow
            checked={settings.showOnLeaderboard}
            description="Let your progress appear in the Achievements leaderboard. Turning this off hides you from other learners."
            label="Show on leaderboard"
            onCheckedChange={(checked) => {
              setSettingsOverride({
                ...settings,
                showOnLeaderboard: checked,
              });
            }}
          />
        </CardContent>
      </Card>

      <Card className="rounded-[1.75rem] border border-white/75 bg-white/88 shadow-[0_24px_80px_-56px_rgba(34,46,84,0.34)]">
        <CardHeader className="pb-0">
          <CardTitle className="text-xl tracking-[-0.04em] text-[#18224d]">
            Change character
          </CardTitle>
          <CardDescription className="text-[#697391]">
            Choose a different companion without leaving the dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {characters.map((character) => {
              const isSelected = selectedCharacterFileName === character.fileName;

              return (
                <button
                  key={character.fileName}
                  type="button"
                  onClick={() => setCharacterOverride(character.fileName)}
                  className={`group relative flex min-h-[220px] cursor-pointer flex-col items-center justify-between rounded-[1.6rem] border p-4 text-left transition-all ${
                    isSelected
                      ? "border-[#36c844] bg-[#f7fdf7] shadow-[0_14px_34px_-24px_rgba(54,200,68,0.35)]"
                      : "border-[#e6ebf4] bg-white hover:border-[#bfd7c2] hover:bg-[#fbfdfb]"
                  }`}
                >
                  {isSelected ? (
                    <span className="absolute right-3 top-3 inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#36c844] text-white shadow-[0_4px_10px_rgba(54,200,68,0.3)]">
                      <CheckCircle2 className="h-4 w-4" />
                    </span>
                  ) : null}
                  <div className="flex min-h-[150px] w-full items-center justify-center">
                    <Image
                      src={character.imageSrc}
                      alt={character.name}
                      width={180}
                      height={180}
                      className="h-auto max-h-[150px] w-auto object-contain transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                  <p className="mt-3 text-lg font-semibold tracking-[-0.04em] text-[#18224d]">
                    {character.name}
                  </p>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-[1.75rem] border border-white/75 bg-white/88 shadow-[0_24px_80px_-56px_rgba(34,46,84,0.34)]">
        <CardHeader className="pb-0">
          <CardTitle className="text-xl tracking-[-0.04em] text-[#18224d]">
            Account actions
          </CardTitle>
          <CardDescription className="text-[#697391]">
            Use this when you want to leave the app on this device.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-base font-semibold text-[#18224d]">Sign out of SkillPet</p>
            <p className="mt-1 text-sm leading-6 text-[#697391]">
              This clears your local session and learning progress cache on this browser.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => void handleSignOut()}
            disabled={signingOut}
            className="h-11 rounded-2xl px-5"
          >
            {signingOut ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <LogOut />}
            {signingOut ? "Signing out..." : "Sign Out"}
          </Button>
        </CardContent>
      </Card>
    </section>
  );
}

function DetailTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.2rem] border border-[#edf0f6] bg-[#fafbfd] p-4">
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#7b84a0]">{label}</p>
      <p className="mt-2 break-all text-sm font-medium text-[#18224d]">{value}</p>
    </div>
  );
}

function SettingRow({
  checked,
  description,
  label,
  onCheckedChange,
}: {
  checked: boolean;
  description: string;
  label: string;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-[1.2rem] border border-[#edf0f6] bg-[#fafbfd] p-4">
      <div className="min-w-0">
        <p className="text-base font-semibold text-[#18224d]">{label}</p>
        <p className="mt-1 text-sm leading-6 text-[#697391]">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}
