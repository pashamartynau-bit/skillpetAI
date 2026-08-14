"use client";

import Image from "next/image";
import { ArrowLeft, ArrowRight, Check, LoaderCircle, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { startTransition, useEffect, useState } from "react";

import type { CharacterOption } from "@/lib/character-options";
import { getInsforgeBrowserClient } from "@/lib/insforge-browser";
import { fetchUserProfile, saveSelectedCharacter } from "@/lib/profile-api";

type CharacterPickerScreenProps = {
  characters: CharacterOption[];
};

type StatusState = {
  tone: "default" | "error";
  text: string;
} | null;

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Something went wrong. Please try again.";
}

export function CharacterPickerScreen({
  characters,
}: CharacterPickerScreenProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedCharacterFileName, setSelectedCharacterFileName] = useState<
    string | null
  >(null);
  const [status, setStatus] = useState<StatusState>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      try {
        const client = getInsforgeBrowserClient();
        const { data, error } = await client.auth.getCurrentUser();

        if (cancelled) {
          return;
        }

        if (error || !data.user) {
          router.replace("/login");
          return;
        }

        setUserId(data.user.id);
        const profile = await fetchUserProfile(data.user.id);

        if (cancelled) {
          return;
        }

        if (profile?.character) {
          router.replace("/dashboard");
          return;
        }

        setLoading(false);
      } catch (error) {
        if (!cancelled) {
          setStatus({ tone: "error", text: getErrorMessage(error) });
          setLoading(false);
        }
      }
    }

    void hydrate();

    return () => {
      cancelled = true;
    };
  }, [router]);

  async function handleBack() {
    try {
      const client = getInsforgeBrowserClient();
      await client.auth.signOut();
    } catch (error) {
      console.error("Failed to sign out from character picker:", error);
    } finally {
      router.replace("/");
    }
  }

  async function handleContinue() {
    const selectedCharacter = characters.find(
      (character) => character.fileName === selectedCharacterFileName,
    );

    if (!userId || !selectedCharacter) {
      return;
    }

    setSaving(true);
    setStatus(null);

    try {
      await saveSelectedCharacter({
        insforgeUserId: userId,
        characterFileName: selectedCharacter.fileName,
        characterName: selectedCharacter.name,
      });

      startTransition(() => {
        router.replace("/dashboard");
      });
    } catch (error) {
      setStatus({ tone: "error", text: getErrorMessage(error) });
      setSaving(false);
    }
  }

  return (
    <main className="h-screen w-screen bg-[#fafbfc] overflow-hidden relative flex flex-col justify-between p-6 sm:p-8 bg-[radial-gradient(circle_at_top,rgba(54,200,68,0.04)_0%,transparent_35%),radial-gradient(circle_at_bottom_right,rgba(168,85,247,0.05)_0%,transparent_40%)]">
      {/* Top Header */}
      <header className="w-full flex-shrink-0 flex items-center justify-between relative h-14">
        {/* Back Button */}
        <button
          type="button"
          onClick={handleBack}
          className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-700 shadow-[0_4px_12px_rgba(0,0,0,0.03)] transition duration-200 hover:bg-gray-50 active:scale-95 cursor-pointer"
          aria-label="Back"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>

        {/* Onboarding Progress Indicators */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-2">
          {/* Top progress bar */}
          <div className="h-1.5 w-32 overflow-hidden rounded-full bg-gray-200/60">
            <div className="h-full w-[38%] rounded-full bg-[#36c844]" />
          </div>
          {/* 5 dash segments */}
          <div className="flex items-center justify-center gap-1.5">
            <span className="h-1 w-5 rounded-full bg-gray-200/60" />
            <span className="h-1 w-5 rounded-full bg-[#36c844]" />
            <span className="h-1 w-5 rounded-full bg-gray-200/60" />
            <span className="h-1 w-5 rounded-full bg-gray-200/60" />
            <span className="h-1 w-5 rounded-full bg-gray-200/60" />
          </div>
        </div>

        {/* Placeholder to balance the flex items */}
        <div className="h-11 w-11 shrink-0" aria-hidden="true" />
      </header>

      {/* Main Content Area: Title + Grid */}
      <div className="flex-grow flex flex-col justify-center items-center max-w-6xl mx-auto w-full min-h-0 py-4">
        {/* Title Block */}
        <div className="text-center space-y-2 mb-6 flex-shrink-0">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 font-heading">
            Choose your study buddy
          </h1>
          <p className="inline-flex items-center justify-center gap-1 text-sm sm:text-base text-gray-500 font-medium">
            <span>Your buddy will cheer you on and grow with you!</span>
            <Sparkles className="h-4 w-4 text-[#a855f7] fill-[#a855f7]" />
          </p>
        </div>

        {/* Error Status Indicator */}
        {status ? (
          <div
            className={`w-full max-w-xl rounded-2xl border px-4 py-2.5 mb-4 text-xs sm:text-sm text-center ${
              status.tone === "error"
                ? "border-red-200 bg-red-50 text-red-600"
                : "border-gray-200 bg-white text-gray-700"
            }`}
          >
            {status.text}
          </div>
        ) : null}

        {/* Character Selection Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 w-full max-w-5xl items-center justify-center">
          {characters.map((character) => {
            const isSelected = selectedCharacterFileName === character.fileName;

            return (
              <button
                key={character.fileName}
                type="button"
                onClick={() => setSelectedCharacterFileName(character.fileName)}
                disabled={loading || saving}
                className={`group flex flex-col items-center justify-between p-3.5 pb-4.5 pt-3.5 rounded-[2rem] border bg-white cursor-pointer relative transition-all duration-300 w-full aspect-[4/5] h-[min(16vh,180px)] md:h-[min(25vh,275px)] ${
                  isSelected
                    ? "border-2 border-[#36c844] shadow-[0_12px_28px_rgba(54,200,68,0.12)]"
                    : "border-gray-200/80 shadow-[0_4px_12px_rgba(0,0,0,0.01)] hover:border-[#36c844]/40"
                }`}
              >
                {/* Selected Checkmark Badge */}
                {isSelected ? (
                  <span className="absolute right-3 top-3 inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#36c844] text-white shadow-[0_4px_10px_rgba(54,200,68,0.3)]">
                    <Check className="h-4 w-4" strokeWidth={3} />
                  </span>
                ) : null}

                {/* Character Image wrapper with zoom effect */}
                <div className="flex-grow w-full flex items-center justify-center min-h-0 relative">
                  <Image
                    src={character.imageSrc}
                    alt={character.name}
                    width={240}
                    height={240}
                    className="max-h-full w-auto max-w-[95%] object-contain transition-transform duration-300 group-hover:scale-105"
                    priority
                  />
                </div>

                {/* Character Name */}
                <p className="mt-3 text-lg sm:text-xl font-bold tracking-tight text-gray-900">
                  {character.name}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom Footer Actions */}
      <footer className="w-full flex-shrink-0 flex justify-center py-4 sm:py-6">
        <button
          type="button"
          onClick={handleContinue}
          disabled={loading || saving || !selectedCharacterFileName}
          className="inline-flex min-w-[280px] items-center justify-center gap-2 rounded-full bg-[#36c844] px-8 py-3.5 text-lg font-semibold text-white shadow-[0_10px_30px_rgba(54,200,68,0.25)] transition duration-300 hover:bg-[#2fb53c] hover:scale-[1.01] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
        >
          {saving ? <LoaderCircle className="h-5 w-5 animate-spin" /> : null}
          Continue
          <ArrowRight className="h-5 w-5" />
        </button>
      </footer>
    </main>
  );
}
