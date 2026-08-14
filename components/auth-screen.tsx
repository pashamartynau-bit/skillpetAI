"use client";

import type { UserSchema } from "@insforge/sdk";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { startTransition, useEffect, useEffectEvent, useRef, useState } from "react";
import { 
  Shield, 
  Database, 
  Mail, 
  Lock, 
  User, 
  Loader2, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle,
  Activity
} from "lucide-react";

import type { AppUserProfile } from "@/lib/app-user-profile";
import { getAppUrl, getInsforgeBrowserClient } from "@/lib/insforge-browser";
import { mapInsforgeUserToSyncPayload } from "@/lib/auth-user";

type AuthMode = "sign-in" | "sign-up";

type StatusState = {
  tone: "default" | "success" | "error";
  text: string;
} | null;

const signInFields = {
  email: "",
  password: "",
};

const signUpFields = {
  name: "",
  email: "",
  password: "",
};

function getAuthErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }
  return "Something went wrong. Please try again.";
}

function getInitialStatusState(): StatusState {
  if (typeof window === "undefined") {
    return null;
  }

  const params = new URLSearchParams(window.location.search);
  const authResult = params.get("insforge_status");
  const authType = params.get("insforge_type");
  const authError = params.get("insforge_error");

  if (authResult === "success" && authType === "verify_email") {
    return {
      tone: "success",
      text: "Email verified. Sign in to continue.",
    };
  }

  if (authResult === "error") {
    return {
      tone: "error",
      text: authError ?? "Authentication flow failed.",
    };
  }

  return null;
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
      <path
        d="M21.8 12.2c0-.76-.07-1.48-.2-2.18H12v4.12h5.49a4.7 4.7 0 0 1-2.04 3.08v2.56h3.3c1.93-1.77 3.05-4.39 3.05-7.58Z"
        fill="#4285F4"
      />
      <path
        d="M12 22c2.76 0 5.07-.91 6.76-2.47l-3.3-2.56c-.91.61-2.07.98-3.46.98-2.66 0-4.92-1.79-5.73-4.2H2.87v2.64A10.2 10.2 0 0 0 12 22Z"
        fill="#34A853"
      />
      <path
        d="M6.27 13.75A6.12 6.12 0 0 1 5.95 12c0-.61.11-1.2.32-1.75V7.61H2.87a10.1 10.1 0 0 0 0 8.78l3.4-2.64Z"
        fill="#FBBC05"
      />
      <path
        d="M12 6.05c1.5 0 2.84.51 3.9 1.52l2.92-2.92C17.06 2.99 14.75 2 12 2a10.2 10.2 0 0 0-9.13 5.61l3.4 2.64c.8-2.42 3.07-4.2 5.73-4.2Z"
        fill="#EA4335"
      />
    </svg>
  );
}

function GradientGridIllustration({ mode }: { mode: AuthMode }) {
  return (
    <div className="relative mt-8 rounded-3xl border border-border/80 bg-white/40 dark:bg-neutral-900/40 backdrop-blur-md p-6 overflow-hidden shadow-[0_20px_50px_-20px_rgba(0,0,0,0.05)] select-none">
      {/* Inner grid styling */}
      <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none" />
      
      {/* Animated Glowing blobs */}
      <div className="absolute -top-12 -left-12 h-40 w-40 rounded-full bg-accent/20 blur-3xl animate-pulse" style={{ animationDuration: '6s' }} />
      <div className="absolute -bottom-16 -right-16 h-48 w-48 rounded-full bg-purple-500/15 blur-3xl animate-pulse" style={{ animationDuration: '9s' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-32 w-32 rounded-full bg-blue-500/10 blur-2xl animate-pulse" style={{ animationDuration: '12s' }} />

      {/* Decorative Mock Browser Header */}
      <div className="flex items-center justify-between border-b border-border/40 pb-3 mb-6">
        <div className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-yellow-400/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-green-400/80" />
        </div>
        <span className="font-mono text-[10px] text-muted bg-black/[0.03] dark:bg-white/[0.03] px-3 py-0.5 rounded-md border border-border/20">
          skillpet.ai/auth
        </span>
        <div className="w-10" />
      </div>

      {/* Grid of steps */}
      <div className="relative grid gap-5 md:grid-cols-3">
        {/* Step 1: InsForge Browser Auth */}
        <div className={`relative rounded-2xl border p-4 transition-all duration-300 ${
          mode === "sign-in" || mode === "sign-up" 
            ? "border-accent/40 bg-white/80 dark:bg-neutral-900/80 shadow-[0_8px_30px_rgba(60,199,79,0.06)]"
            : "border-border/60 bg-white/40 dark:bg-neutral-900/40"
        }`}>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/10 text-accent">
            <Shield className="h-4.5 w-4.5" />
          </div>
          <div className="mt-4">
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-[10px] font-bold text-accent">01</span>
              <span className="text-[10px] uppercase font-bold tracking-wider text-muted/80">Auth</span>
            </div>
            <h4 className="mt-1 font-semibold text-foreground text-xs leading-none">InsForge Auth</h4>
            <p className="mt-2 text-[10px] leading-relaxed text-muted">
              Clientside token security.
            </p>
          </div>
        </div>

        {/* Step 2: Google OAuth */}
        <div className={`relative rounded-2xl border p-4 transition-all duration-300 ${
          mode === "sign-in"
            ? "border-blue-500/40 bg-white/80 dark:bg-neutral-900/80 shadow-[0_8px_30px_rgba(59,130,246,0.06)]"
            : "border-border/60 bg-white/40 dark:bg-neutral-900/40"
        }`}>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500">
            <GoogleMark />
          </div>
          <div className="mt-4">
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-[10px] font-bold text-blue-500">02</span>
              <span className="text-[10px] uppercase font-bold tracking-wider text-muted/80">OAuth</span>
            </div>
            <h4 className="mt-1 font-semibold text-foreground text-xs leading-none">Google Login</h4>
            <p className="mt-2 text-[10px] leading-relaxed text-muted">
              Direct social callback.
            </p>
          </div>
        </div>

        {/* Step 3: Strapi User Sync */}
        <div className="relative rounded-2xl border border-border/60 bg-white/40 dark:bg-neutral-900/40 p-4 group transition-all duration-300">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/10 text-purple-500">
            <Database className="h-4.5 w-4.5" />
          </div>
          <div className="mt-4">
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-[10px] font-bold text-purple-500">03</span>
              <span className="text-[10px] uppercase font-bold tracking-wider text-muted/80">Sync</span>
            </div>
            <h4 className="mt-1 font-semibold text-foreground text-xs leading-none">Strapi Sync</h4>
            <p className="mt-2 text-[10px] leading-relaxed text-muted">
              REST database hook.
            </p>
          </div>
        </div>
      </div>

      {/* Connection Flow Diagram in SVG (visible in desktop grid view) */}
      <div className="hidden md:block absolute top-[90px] left-[30%] right-[30%] h-6 pointer-events-none overflow-visible">
        <svg className="w-full h-full" fill="none">
          <path d="M -20,10 H 120" stroke="rgba(16, 35, 18, 0.08)" strokeWidth="1.5" strokeDasharray="3 3" />
          <path d="M -20,10 H 120" stroke="url(#active-flow-1)" strokeWidth="2" className="animate-line-flow" />
          
          <defs>
            <linearGradient id="active-flow-1" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#3cc74f" stopOpacity="0" />
              <stop offset="50%" stopColor="#3cc74f" stopOpacity="1" />
              <stop offset="100%" stopColor="#3cc74f" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Database sync status info card */}
      <div className="mt-6 flex items-center justify-between rounded-xl border border-border/50 bg-black/[0.02] dark:bg-white/[0.02] p-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
          </span>
          <span className="text-muted font-mono font-medium">Strapi Hook Connection:</span>
          <span className="text-foreground font-semibold">Active Ready</span>
        </div>
        <span className="text-[10px] text-accent font-mono bg-accent/10 px-2 py-0.5 rounded">REST API</span>
      </div>
    </div>
  );
}

export function AuthScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("sign-in");
  const [status, setStatus] = useState<StatusState>(getInitialStatusState);
  const [currentUser, setCurrentUser] = useState<UserSchema | null>(null);
  const [profile, setProfile] = useState<AppUserProfile | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [submittingEmailAuth, setSubmittingEmailAuth] = useState(false);
  const [startingGoogleAuth, setStartingGoogleAuth] = useState(false);
  const [signInForm, setSignInForm] = useState(signInFields);
  const [signUpForm, setSignUpForm] = useState(signUpFields);
  const syncedUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    void (async () => {
      await hydrateCurrentUser();
    })();
  }, []);

  const hydrateCurrentUser = useEffectEvent(async () => {
    setLoadingSession(true);

    try {
      const client = getInsforgeBrowserClient();
      const { data, error } = await client.auth.getCurrentUser();

      if (error) {
        // "No refresh token provided" or "Refresh token cookie is missing" means the user is not logged in.
        // We should handle this silently rather than displaying an error message to a guest user.
        const isUnauthenticated =
          error.statusCode === 401 ||
          error.error === "AUTH_UNAUTHORIZED" ||
          error.message?.toLowerCase().includes("refresh token");

        if (!isUnauthenticated) {
          setStatus({ tone: "error", text: error.message });
        }
        setCurrentUser(null);
        syncedUserIdRef.current = null;
        return;
      }

      setCurrentUser(data.user);

      if (data.user) {
        await syncAndHydrateUser(data.user);
      }
    } catch (error) {
      setStatus({ tone: "error", text: getAuthErrorMessage(error) });
    } finally {
      setLoadingSession(false);
    }
  });

  async function syncUserToStrapi(user: UserSchema) {
    if (syncedUserIdRef.current === user.id) {
      return;
    }

    const response = await fetch("/api/auth/sync", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(mapInsforgeUserToSyncPayload(user)),
    });

    const payload = (await response.json()) as {
      error?: string;
      operation?: string;
    };

    if (!response.ok) {
      throw new Error(payload.error ?? "Failed to save user data to Strapi.");
    }

    syncedUserIdRef.current = user.id;
    setStatus({
      tone: "success",
      text: `Authenticated and ${payload.operation ?? "synced"} in Strapi.`,
    });
  }

  function routeToDashboard() {
    startTransition(() => {
      router.replace("/dashboard");
    });
  }

  async function loadUserProfile(insforgeUserId: string) {
    setLoadingProfile(true);

    try {
      const response = await fetch(
        `/api/profile?insforgeUserId=${encodeURIComponent(insforgeUserId)}`,
        {
          method: "GET",
          cache: "no-store",
        },
      );

      const payload = (await response.json()) as {
        error?: string;
        profile?: AppUserProfile;
      };

      if (response.status === 404) {
        setProfile(null);
        return null;
      }

      if (!response.ok || !payload.profile) {
        throw new Error(payload.error ?? "Failed to load user profile from Strapi.");
      }

      setProfile(payload.profile);
      return payload.profile;
    } finally {
      setLoadingProfile(false);
    }
  }

  async function syncAndHydrateUser(user: UserSchema) {
    await syncUserToStrapi(user);
    await loadUserProfile(user.id);

    setStatus({
      tone: "success",
      text: "Redirecting to the dashboard.",
    });
    routeToDashboard();
  }

  async function handleEmailAuthSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmittingEmailAuth(true);
    setStatus(null);

    try {
      const client = getInsforgeBrowserClient();

      if (mode === "sign-in") {
        const { data, error } = await client.auth.signInWithPassword(signInForm);

        if (error || !data?.user) {
          throw error ?? new Error("Unable to sign in.");
        }

        setCurrentUser(data.user);
        await syncAndHydrateUser(data.user);
        return;
      }

      const { data, error } = await client.auth.signUp({
        email: signUpForm.email,
        password: signUpForm.password,
        name: signUpForm.name,
        redirectTo: `${getAppUrl()}/login`,
      });

      if (error) {
        throw error;
      }

      if (data?.user && data.accessToken) {
        setCurrentUser(data.user);
        await syncAndHydrateUser(data.user);
        setStatus({
          tone: "success",
          text: "Account created and signed in.",
        });
        setSignUpForm(signUpFields);
        return;
      }

      setMode("sign-in");
      setStatus({
        tone: "success",
        text:
          data?.requireEmailVerification === true
            ? "Account created. Check your email, then sign in after verification."
            : "Account created. Sign in to continue.",
      });
    } catch (error) {
      setStatus({ tone: "error", text: getAuthErrorMessage(error) });
    } finally {
      setSubmittingEmailAuth(false);
    }
  }

  async function handleGoogleAuth() {
    setStartingGoogleAuth(true);
    setStatus(null);

    try {
      const client = getInsforgeBrowserClient();
      const { error } = await client.auth.signInWithOAuth("google", {
        redirectTo: `${getAppUrl()}/login`,
        additionalParams: { prompt: "select_account" },
      });

      if (error) {
        throw error;
      }
    } catch (error) {
      setStatus({ tone: "error", text: getAuthErrorMessage(error) });
      setStartingGoogleAuth(false);
    }
  }

  async function handleSignOut() {
    try {
      const client = getInsforgeBrowserClient();
      const { error } = await client.auth.signOut();

      if (error) {
        throw error;
      }

      setCurrentUser(null);
      setProfile(null);
      syncedUserIdRef.current = null;
      setStatus({
        tone: "default",
        text: "Signed out.",
      });
    } catch (error) {
      setStatus({ tone: "error", text: getAuthErrorMessage(error) });
    }
  }

  return (
    <main className="relative min-h-screen w-full flex items-center justify-center overflow-hidden px-4 py-16 sm:px-6 lg:px-8 bg-background">
      <style>{`
        @keyframes pulseSlow {
          0%, 100% { transform: translate(0px, 0px) scale(1); opacity: 0.3; }
          50% { transform: translate(40px, -40px) scale(1.2); opacity: 0.55; }
        }
        @keyframes pulseSlowReverse {
          0%, 100% { transform: translate(0px, 0px) scale(1); opacity: 0.2; }
          50% { transform: translate(-30px, 40px) scale(1.1); opacity: 0.45; }
        }
        @keyframes lineFlow {
          to { stroke-dashoffset: -20; }
        }
        .animate-pulse-slow {
          animation: pulseSlow 15s ease-in-out infinite;
        }
        .animate-pulse-slow-reverse {
          animation: pulseSlowReverse 20s ease-in-out infinite;
        }
        .animate-line-flow {
          stroke-dasharray: 5 5;
          animation: lineFlow 1.5s linear infinite;
        }
        .grid-bg {
          background-size: 40px 40px;
          background-image: 
            linear-gradient(to right, rgba(16, 35, 18, 0.04) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(16, 35, 18, 0.04) 1px, transparent 1px);
        }
        .dark .grid-bg {
          background-image: 
            linear-gradient(to right, rgba(255, 255, 255, 0.04) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.04) 1px, transparent 1px);
        }
      `}</style>

      {/* Grid Pattern overlaying the entire background */}
      <div className="absolute inset-0 grid-bg pointer-events-none z-0" />
      
      {/* Floating abstract gradient blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[radial-gradient(circle,rgba(60,199,79,0.22),transparent_70%)] blur-3xl animate-pulse-slow z-0 pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-[radial-gradient(circle,rgba(37,165,58,0.18),transparent_70%)] blur-3xl animate-pulse-slow-reverse z-0 pointer-events-none" />
      <div className="absolute top-[30%] right-[10%] w-[35%] h-[35%] rounded-full bg-[radial-gradient(circle,rgba(59,130,246,0.12),transparent_70%)] blur-3xl animate-pulse-slow z-0 pointer-events-none" />

      <div className="relative z-10 grid w-full max-w-6xl gap-12 lg:grid-cols-12 items-center">
        {/* Left Column: Copy & illustration */}
        <div className="lg:col-span-7 space-y-8">
          <div className="space-y-6">
            <span className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-white/80 dark:bg-neutral-900/80 px-3 py-1 font-mono text-xs uppercase tracking-[0.24em] text-muted shadow-sm backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-accent animate-pulse" />
              SkillPet AI
            </span>
            <div className="space-y-4">
              <h1 className="max-w-2xl text-4xl font-semibold tracking-[-0.05em] text-foreground sm:text-5xl lg:text-6xl font-heading leading-[1.05]">
                Authentication that lands cleanly in your app and your CMS.
              </h1>
              <p className="max-w-xl text-base leading-relaxed text-muted sm:text-lg">
                Email/password and Google authentication run through InsForge,
                while authenticated users are synced into Strapi over the CMS
                REST API.
              </p>
            </div>
          </div>

          {/* Flow Illustration */}
          <GradientGridIllustration mode={mode} />
        </div>

        {/* Right Column: Form */}
        <div className="lg:col-span-5">
          <section className="rounded-3xl border border-border bg-white/70 dark:bg-neutral-900/70 p-6 sm:p-8 shadow-[0_30px_90px_-24px_rgba(16,35,18,0.12)] backdrop-blur-xl transition-all duration-300">
            <div className="space-y-6">
              {/* Tab Switcher */}
              {!currentUser && (
                <div className="relative flex rounded-full bg-neutral-100 dark:bg-neutral-800/60 p-1.5 select-none border border-border/40">
                  <div
                    className="absolute top-1.5 bottom-1.5 left-1.5 rounded-full bg-white dark:bg-neutral-800 shadow-[0_4px_12px_rgba(0,0,0,0.06)] transition-all duration-300 ease-out"
                    style={{
                      width: "calc(50% - 6px)",
                      transform: mode === "sign-in" ? "translateX(0%)" : "translateX(100%)",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setMode("sign-in")}
                    className={`relative z-10 flex-1 rounded-full py-2.5 text-center text-sm font-semibold transition-colors duration-200 ${
                      mode === "sign-in" ? "text-foreground" : "text-muted"
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode("sign-up")}
                    className={`relative z-10 flex-1 rounded-full py-2.5 text-center text-sm font-semibold transition-colors duration-200 ${
                      mode === "sign-up" ? "text-foreground" : "text-muted"
                    }`}
                  >
                    Sign Up
                  </button>
                </div>
              )}

              {/* Status Banner */}
              {status ? (
                <div
                  className={`flex items-start gap-3 rounded-2xl border p-4 text-sm leading-relaxed animate-fade-in ${
                    status.tone === "error"
                      ? "border-danger/20 bg-red-500/10 text-danger"
                      : status.tone === "success"
                        ? "border-accent/20 bg-accent-soft text-foreground"
                        : "border-border bg-white/90 dark:bg-neutral-900/90 text-foreground"
                  }`}
                >
                  {status.tone === "error" ? (
                    <AlertCircle className="h-5 w-5 shrink-0 text-danger mt-0.5" />
                  ) : (
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-accent mt-0.5" />
                  )}
                  <span>{status.text}</span>
                </div>
              ) : null}

              {currentUser ? (
                /* Authenticated State */
                <div className="space-y-6">
                  <div className="space-y-4 rounded-2xl border border-border/80 bg-gradient-to-b from-white to-neutral-50/50 dark:from-neutral-900 dark:to-neutral-900/50 p-6 shadow-sm">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">
                          {loadingProfile ? "Checking profile..." : "Active session"}
                        </p>
                        <h2 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
                          {currentUser.profile?.name ?? currentUser.email}
                        </h2>
                        <p className="text-sm text-muted">{currentUser.email}</p>
                      </div>
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-soft px-3 py-1 text-xs font-semibold text-accent-strong">
                        <Activity className="h-3.5 w-3.5 animate-pulse" />
                        Authenticated
                      </span>
                    </div>

                    <dl className="grid gap-3 text-xs sm:grid-cols-2">
                      <div className="rounded-xl border border-border/60 bg-white/80 dark:bg-neutral-950/40 p-3">
                        <dt className="font-mono uppercase tracking-wider text-muted">
                          InsForge ID
                        </dt>
                        <dd className="mt-1 break-all text-foreground font-semibold">
                          {currentUser.id}
                        </dd>
                      </div>
                      <div className="rounded-xl border border-border/60 bg-white/80 dark:bg-neutral-950/40 p-3">
                        <dt className="font-mono uppercase tracking-wider text-muted">
                          Providers
                        </dt>
                        <dd className="mt-1 text-foreground font-semibold">
                          {(currentUser.providers ?? ["email"]).join(", ")}
                        </dd>
                      </div>
                    </dl>

                    {profile?.character ? (
                      <div className="rounded-xl border border-accent/25 bg-accent-soft/80 px-4 py-3 text-sm text-foreground flex items-center justify-between">
                        <span className="text-muted">Selected character:</span>
                        <span className="font-semibold text-accent-strong">{profile.character.name}</span>
                      </div>
                    ) : null}
                  </div>

                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="flex w-full items-center justify-center rounded-2xl border border-border/80 bg-white hover:bg-neutral-50 dark:bg-neutral-950 dark:hover:bg-neutral-900 px-4 py-3.5 text-sm font-semibold text-foreground transition-all duration-200 shadow-sm"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                /* Unauthenticated Forms */
                <form className="space-y-4" onSubmit={handleEmailAuthSubmit}>
                  {mode === "sign-up" ? (
                    <div className="relative rounded-2xl border border-border/80 bg-white/40 dark:bg-neutral-950/30 px-4 py-3 transition-all duration-200 focus-within:border-accent focus-within:ring-4 focus-within:ring-accent-soft">
                      <span className="block text-[10px] font-bold text-muted uppercase tracking-wider font-mono">
                        Full Name
                      </span>
                      <div className="flex items-center gap-2.5 mt-1">
                        <User className="h-4 w-4 text-muted shrink-0" />
                        <input
                          required
                          value={signUpForm.name}
                          onChange={(event) =>
                            setSignUpForm((current) => ({
                              ...current,
                              name: event.target.value,
                            }))
                          }
                          className="w-full bg-transparent text-sm text-foreground placeholder:text-muted/60 outline-none border-none p-0"
                          placeholder="Ava Bennett"
                        />
                      </div>
                    </div>
                  ) : null}

                  <div className="relative rounded-2xl border border-border/80 bg-white/40 dark:bg-neutral-950/30 px-4 py-3 transition-all duration-200 focus-within:border-accent focus-within:ring-4 focus-within:ring-accent-soft">
                    <span className="block text-[10px] font-bold text-muted uppercase tracking-wider font-mono">
                      Email Address
                    </span>
                    <div className="flex items-center gap-2.5 mt-1">
                      <Mail className="h-4 w-4 text-muted shrink-0" />
                      <input
                        type="email"
                        required
                        value={mode === "sign-in" ? signInForm.email : signUpForm.email}
                        onChange={(event) =>
                          mode === "sign-in"
                            ? setSignInForm((current) => ({
                                ...current,
                                email: event.target.value,
                              }))
                            : setSignUpForm((current) => ({
                                ...current,
                                email: event.target.value,
                              }))
                        }
                        className="w-full bg-transparent text-sm text-foreground placeholder:text-muted/60 outline-none border-none p-0"
                        placeholder="petlover@example.com"
                      />
                    </div>
                  </div>

                  <div className="relative rounded-2xl border border-border/80 bg-white/40 dark:bg-neutral-950/30 px-4 py-3 transition-all duration-200 focus-within:border-accent focus-within:ring-4 focus-within:ring-accent-soft">
                    <span className="block text-[10px] font-bold text-muted uppercase tracking-wider font-mono">
                      Password
                    </span>
                    <div className="flex items-center gap-2.5 mt-1">
                      <Lock className="h-4 w-4 text-muted shrink-0" />
                      <input
                        type="password"
                        required
                        minLength={8}
                        value={
                          mode === "sign-in" ? signInForm.password : signUpForm.password
                        }
                        onChange={(event) =>
                          mode === "sign-in"
                            ? setSignInForm((current) => ({
                                ...current,
                                password: event.target.value,
                              }))
                            : setSignUpForm((current) => ({
                                ...current,
                                password: event.target.value,
                              }))
                        }
                        className="w-full bg-transparent text-sm text-foreground placeholder:text-muted/60 outline-none border-none p-0"
                        placeholder="Minimum 8 characters"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={submittingEmailAuth || loadingSession}
                    className="group relative flex w-full items-center justify-center gap-2 rounded-2xl bg-accent px-4 py-3.5 text-sm font-semibold text-white hover:bg-accent-strong transition-all duration-200 shadow-[0_12px_30px_-10px_rgba(60,199,79,0.35)] disabled:cursor-not-allowed disabled:opacity-60 overflow-hidden"
                  >
                    {submittingEmailAuth ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <span>{mode === "sign-in" ? "Sign In with Email" : "Create Account"}</span>
                        <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                      </>
                    )}
                  </button>
                </form>
              )}

              {!currentUser ? (
                <>
                  <div className="flex items-center gap-3">
                    <div className="h-px flex-1 bg-border" />
                    <span className="font-mono text-[9px] uppercase tracking-widest text-muted">
                      Or continue with
                    </span>
                    <div className="h-px flex-1 bg-border" />
                  </div>

                  <button
                    type="button"
                    onClick={handleGoogleAuth}
                    disabled={startingGoogleAuth || loadingSession}
                    className="flex w-full items-center justify-center gap-3 rounded-2xl border border-border/80 bg-white/60 dark:bg-neutral-950/40 hover:bg-neutral-50 dark:hover:bg-neutral-900 px-4 py-3.5 text-sm font-semibold text-foreground transition-all duration-200 shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {startingGoogleAuth ? (
                      <Loader2 className="h-5 w-5 animate-spin text-muted" />
                    ) : (
                      <>
                        <GoogleMark />
                        <span>Continue with Google</span>
                      </>
                    )}
                  </button>
                </>
              ) : null}

              <p className="text-center text-xs text-muted">
                {currentUser
                  ? "Need another account?"
                  : mode === "sign-in"
                    ? "New to SkillPet?"
                    : "Already have an account?"}{" "}
                <button
                  type="button"
                  onClick={
                    currentUser
                      ? handleSignOut
                      : () =>
                          setMode((current) =>
                            current === "sign-in" ? "sign-up" : "sign-in",
                          )
                  }
                  className="font-semibold text-accent-strong hover:text-accent transition-colors duration-150 underline decoration-dotted decoration-accent-strong/40 underline-offset-4"
                >
                  {currentUser
                    ? "Sign out"
                    : mode === "sign-in"
                      ? "Create one"
                      : "Sign in instead"}
                </button>
              </p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
