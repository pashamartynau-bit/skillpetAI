"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  BookOpen,
  CreditCard,
  ExternalLink,
  Flame,
  Gem,
  Heart,
  Home,
  Loader2,
  LogOut,
  Sparkles,
  Trophy,
  User,
  UserRound,
} from "lucide-react";
import {
  createContext,
  startTransition,
  use,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import type { AppUserProfile } from "@/lib/app-user-profile";
import {
  createPortalSession,
  fetchBillingStatus,
} from "@/lib/billing-api";
import { isSubscriptionActive } from "@/lib/billing";
import { getInsforgeBrowserClient } from "@/lib/insforge-browser";
import {
  clearLearningProgressState,
  getCurrentStreakCount,
  hydrateLearningProgress,
  readLearningWallet,
  subscribeToLearningProgress,
} from "@/lib/learning-progress";
import { fetchUserProfile } from "@/lib/profile-api";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

const dashboardMenu = [
  { label: "Home", href: "/dashboard", icon: Home },
  { label: "Courses", href: "/dashboard/courses", icon: BookOpen },
  { label: "Progress", href: "/dashboard/progress", icon: BarChart3 },
  { label: "Achievements", href: "/dashboard/achievements", icon: Trophy },
  { label: "Billing", href: "/dashboard/billing", icon: CreditCard },
  { label: "Profile", href: "/dashboard/profile", icon: UserRound },
] as const;

type DashboardProfileContextValue = {
  loadingProfile: boolean;
  profile: AppUserProfile | null;
  setProfile: (profile: AppUserProfile | null) => void;
};

const DashboardProfileContext = createContext<DashboardProfileContextValue | null>(
  null,
);

type DashboardBillingState = Awaited<ReturnType<typeof fetchBillingStatus>>;

export function useDashboardProfile() {
  const context = use(DashboardProfileContext);

  if (!context) {
    throw new Error("useDashboardProfile must be used within DashboardShell.");
  }

  return context;
}

export function DashboardShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [profile, setProfile] = useState<AppUserProfile | null>(null);
  const [billing, setBilling] = useState<DashboardBillingState | null>(null);
  const [billingError, setBillingError] = useState<string | null>(null);
  const [loadingBilling, setLoadingBilling] = useState(true);
  const [pendingBillingAction, setPendingBillingAction] = useState<"portal" | null>(null);
  const [headerStats, setHeaderStats] = useState({
    gems: 0,
    hearts: 0,
    streakCount: 0,
  });

  useEffect(() => {
    const syncLearningStats = () => {
      const wallet = readLearningWallet();
      setHeaderStats({
        gems: wallet.gems,
        hearts: wallet.hearts,
        streakCount: getCurrentStreakCount(),
      });
    };

    syncLearningStats();
    return subscribeToLearningProgress(syncLearningStats);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function hydrateDashboardProfile() {
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

        const nextProfile = await fetchUserProfile(data.user.id);

        if (cancelled) {
          return;
        }

        if (!nextProfile?.character) {
          router.replace("/character-picker");
          return;
        }

        await hydrateLearningProgress(data.user.id);

        if (cancelled) {
          return;
        }

        startTransition(() => {
          setProfile(nextProfile);
          setLoadingProfile(false);
        });
      } catch (error) {
        if (!cancelled) {
          console.error("Failed to load dashboard profile:", error);
          router.replace("/login");
          startTransition(() => {
            setLoadingProfile(false);
          });
        }
      }
    }

    void hydrateDashboardProfile();

    return () => {
      cancelled = true;
    };
  }, [router]);

  useEffect(() => {
    if (loadingProfile || !profile) {
      return;
    }

    let cancelled = false;

    async function hydrateBilling() {
      try {
        const nextBilling = await fetchBillingStatus();

        if (!cancelled) {
          startTransition(() => {
            setBilling(nextBilling);
            setBillingError(null);
            setLoadingBilling(false);
          });
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Failed to load billing status:", error);
          if (error instanceof Error && error.message === "Unauthorized") {
            router.replace("/login");
            return;
          }
          startTransition(() => {
            setBilling(null);
            setBillingError(
              error instanceof Error ? error.message : "Unable to load billing status.",
            );
            setLoadingBilling(false);
          });
        }
      }
    }

    void hydrateBilling();

    return () => {
      cancelled = true;
    };
  }, [loadingProfile, profile, router]);

  async function handleSignOut() {
    setIsSigningOut(true);

    try {
      const client = getInsforgeBrowserClient();
      await client.auth.signOut();
      clearLearningProgressState();
      router.replace("/");
    } catch (error) {
      console.error("Failed to sign out:", error);
    } finally {
      setIsSigningOut(false);
    }
  }

  async function handleManageBilling() {
    try {
      setPendingBillingAction("portal");
      const url = await createPortalSession();
      globalThis.location.assign(url);
    } catch (error) {
      console.error("Failed to open billing portal:", error);
      setBillingError(
        error instanceof Error ? error.message : "Unable to open the billing portal.",
      );
    } finally {
      setPendingBillingAction(null);
    }
  }

  return (
    <TooltipProvider>
      <DashboardProfileContext
        value={{
          loadingProfile,
          profile,
          setProfile,
        }}
      >
        <SidebarProvider
          defaultOpen
          className="bg-[radial-gradient(circle_at_top_left,#fbfff7_0%,#edf5e6_42%,#e5efde_100%)]"
        >
          <DashboardShellInner
            headerStats={headerStats}
            handleSignOut={handleSignOut}
            billing={billing}
            billingError={billingError}
            isSigningOut={isSigningOut}
            loadingBilling={loadingBilling}
            loadingProfile={loadingProfile}
            onManageBilling={handleManageBilling}
            pendingBillingAction={pendingBillingAction}
            pathname={pathname}
            profile={profile}
          >
            {children}
          </DashboardShellInner>
        </SidebarProvider>
      </DashboardProfileContext>
    </TooltipProvider>
  );
}

function DashboardShellInner({
  children,
  headerStats,
  handleSignOut,
  billing,
  billingError,
  isSigningOut,
  loadingBilling,
  loadingProfile,
  onManageBilling,
  pendingBillingAction,
  pathname,
  profile,
}: {
  children: ReactNode;
  headerStats: { gems: number; streakCount: number; hearts: number };
  handleSignOut: () => Promise<void>;
  billing: DashboardBillingState | null;
  billingError: string | null;
  isSigningOut: boolean;
  loadingBilling: boolean;
  loadingProfile: boolean;
  onManageBilling: () => Promise<void>;
  pendingBillingAction: "portal" | null;
  pathname: string;
  profile: AppUserProfile | null;
}) {
  const { isMobile, state } = useSidebar();
  const isCollapsed = !isMobile && state === "collapsed";
  const hasStripeCustomer = Boolean(billing?.stripeCustomerId);
  const hasActiveSubscription = isSubscriptionActive(billing?.stripeSubscriptionStatus);
  const showManageBilling = hasStripeCustomer;
  const showUpgradeCard = !loadingBilling && !showManageBilling && !hasActiveSubscription;

  return (
    <>
      <Sidebar collapsible="icon" className="border-sidebar-border/70">
        <SidebarHeader className={cn("py-4", isCollapsed ? "px-2" : "px-3")}>
          <Link
            href="/dashboard"
            className={cn(
              "flex items-center rounded-2xl transition hover:bg-sidebar-accent",
              isCollapsed ? "justify-center p-0" : "gap-3 px-0 py-0",
            )}
          >
            <Image
              src="/logo.png"
              alt="SkillPet logo"
              width={isCollapsed ? 40 : 48}
              height={isCollapsed ? 40 : 48}
              className="object-contain"
            />
            {!isCollapsed ? (
              <div className="min-w-0">
                <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-sidebar-foreground/55">
                  Learn Mode
                </p>
                <h1 className="font-heading text-2xl leading-none tracking-[-0.05em] text-sidebar-foreground">
                  SkillPet
                </h1>
              </div>
            ) : null}
          </Link>
        </SidebarHeader>

        <SidebarSeparator />

        <SidebarContent className={cn("py-4", isCollapsed ? "px-2" : "px-3")}>
          <SidebarGroup className="p-0">
            <SidebarMenu className="gap-2">
              {dashboardMenu.map((item) => (
                <SidebarMenuItem key={item.label}>
                  <SidebarMenuButton
                    render={<Link href={item.href} />}
                    isActive={
                      item.href === "/dashboard"
                        ? pathname === item.href
                        : pathname.startsWith(item.href)
                    }
                    size="lg"
                    tooltip={item.label}
                    className={cn(
                      "rounded-2xl font-medium [&_svg]:size-5",
                      isCollapsed ? "justify-center px-0" : "px-4",
                    )}
                  >
                    <item.icon />
                    {!isCollapsed ? <span className="text-base">{item.label}</span> : null}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className={cn("mt-auto pb-4", isCollapsed ? "px-2" : "px-3")}>
          {loadingBilling ? (
            <div
              className={cn(
                "rounded-[1.5rem] border border-sidebar-border/80 bg-[linear-gradient(180deg,rgba(232,255,230,0.95),rgba(213,245,212,0.95))] text-sidebar-foreground shadow-[0_18px_40px_-28px_rgba(16,35,18,0.35)]",
                isCollapsed ? "p-2" : "p-4",
              )}
            >
              <div
                className={cn(
                  "flex",
                  isCollapsed ? "justify-center" : "items-start gap-3",
                )}
              >
                <Skeleton className="h-10 w-10 rounded-2xl bg-white/70" />
                {!isCollapsed ? (
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-28 bg-white/70" />
                    <Skeleton className="h-4 w-full bg-white/60" />
                    <Skeleton className="h-4 w-4/5 bg-white/60" />
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}

          {showUpgradeCard ? (
            <div
              className={cn(
                "rounded-[1.5rem] border border-sidebar-border/80 bg-[linear-gradient(180deg,rgba(232,255,230,0.95),rgba(213,245,212,0.95))] text-sidebar-foreground shadow-[0_18px_40px_-28px_rgba(16,35,18,0.35)]",
                isCollapsed ? "p-2" : "p-4",
              )}
            >
              <div
                className={cn(
                  "flex",
                  isCollapsed ? "justify-center" : "items-start gap-3",
                )}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/80 text-accent-strong">
                  <Sparkles className="h-5 w-5" />
                </div>
                {!isCollapsed ? (
                  <div className="min-w-0">
                    <p className="font-heading text-lg tracking-[-0.04em]">
                      Upgrade to Pro
                    </p>
                    <p className="mt-1 text-sm leading-5 text-sidebar-foreground/70">
                      Unlock the full SkillPet catalog and premium lessons.
                    </p>
                    <Button
                      render={<Link href="/dashboard/billing" />}
                      className="mt-4 h-10 rounded-xl bg-accent px-4 text-sm font-semibold text-white hover:bg-accent-strong"
                    >
                      View plans
                    </Button>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}

          {showManageBilling ? (
            <div
              className={cn(
                "rounded-[1.5rem] border border-sidebar-border/80 bg-white/80 text-sidebar-foreground shadow-[0_18px_40px_-28px_rgba(16,35,18,0.2)]",
                isCollapsed ? "p-2" : "p-4",
              )}
            >
              <div
                className={cn(
                  "flex items-center",
                  isCollapsed ? "justify-center" : "items-start gap-3",
                )}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#eef3ff] text-[#415bd0]">
                  <CreditCard className="h-5 w-5" />
                </div>
                {!isCollapsed ? (
                  <div className="min-w-0">
                    <p className="font-heading text-lg tracking-[-0.04em]">
                      Manage billing
                    </p>

                    <Button
                      type="button"
                      onClick={() => void onManageBilling()}
                      disabled={pendingBillingAction !== null}
                      className="mt-4 h-10 rounded-xl bg-[#eef3ff] px-4 text-sm font-semibold text-[#415bd0] hover:bg-[#e3ebff]"
                    >
                      {pendingBillingAction === "portal" ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Opening...
                        </>
                      ) : (
                        <>
                          <ExternalLink className="h-4 w-4" />
                          Manage billing
                        </>
                      )}
                    </Button>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}

          {billingError && !isCollapsed ? (
            <p className="pt-2 text-xs leading-5 text-sidebar-foreground/65">
              {billingError}
            </p>
          ) : null}

          <SidebarMenu className="pt-2">
            <SidebarMenuItem>
              <SidebarMenuButton
                type="button"
                onClick={() => void handleSignOut()}
                size="lg"
                tooltip="Sign Out"
                className={cn(
                  "rounded-2xl font-medium [&_svg]:size-5",
                  isCollapsed ? "justify-center px-0" : "px-4",
                )}
              >
                <LogOut />
                {!isCollapsed ? (
                  <span className="text-base">
                    {isSigningOut ? "Signing out..." : "Sign Out"}
                  </span>
                ) : null}
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>

        <SidebarRail />
      </Sidebar>

      <SidebarInset className="min-h-svh bg-transparent">
        <header className="sticky top-0 z-30 w-full border-b border-border/60 bg-[rgba(238,244,230,0.82)] backdrop-blur-xl">
          <div className="flex min-h-20 items-center justify-between gap-4 px-4 py-4 md:px-8">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="h-11 w-11 rounded-full border border-border/80 bg-white/80 text-foreground shadow-sm hover:bg-white" />
              <div className="hidden sm:block">
                <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-muted">
                  Dashboard
                </p>
                <p className="font-heading text-2xl tracking-[-0.05em] text-foreground">
                  SkillPet
                </p>
              </div>
            </div>

            <div className="ml-auto flex items-center justify-end gap-2 sm:gap-3">
              <HoverCard>
                <HoverCardTrigger
                  render={
                    <HeaderStat
                      iconSrc="/streak.png"
                      alt="Streak icon"
                      value={headerStats.streakCount}
                    />
                  }
                />
                <HoverCardContent
                  align="end"
                  className="w-80 p-5 rounded-2xl bg-white/95 border border-border/80 shadow-[0_20px_50px_rgba(16,35,18,0.15)] backdrop-blur-xl"
                >
                  <div className="flex flex-col gap-3 text-left">
                    <div className="flex items-center gap-2 pb-2 border-b border-border/60">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-50 text-orange-500">
                        <Flame className="h-5 w-5 fill-orange-500" />
                      </div>
                      <h3 className="font-heading text-base tracking-[-0.03em] font-bold text-foreground">
                        Daily Streak
                      </h3>
                    </div>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      Complete at least one chapter every day to keep your streak going!
                    </p>
                    <div className="rounded-xl bg-orange-50/70 border border-orange-100/70 p-3 text-xs text-orange-800 leading-relaxed font-medium">
                      ⚠️ If you miss a day, your streak will reset to 0. Keep it active!
                    </div>
                  </div>
                </HoverCardContent>
              </HoverCard>

              <HoverCard>
                <HoverCardTrigger
                  render={
                    <HeaderStat
                      iconSrc="/gems.png"
                      alt="Gems icon"
                      value={headerStats.gems}
                    />
                  }
                />
                <HoverCardContent
                  align="end"
                  className="w-80 p-5 rounded-2xl bg-white/95 border border-border/80 shadow-[0_20px_50px_rgba(16,35,18,0.15)] backdrop-blur-xl"
                >
                  <div className="flex flex-col gap-3 text-left">
                    <div className="flex items-center gap-2 pb-2 border-b border-border/60">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
                        <Gem className="h-5 w-5 fill-purple-200" />
                      </div>
                      <h3 className="font-heading text-base tracking-[-0.03em] font-bold text-foreground">
                        Your Gems
                      </h3>
                    </div>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      Gems are premium rewards granted for practice and complete exercises.
                    </p>
                    <div className="rounded-xl bg-purple-50/70 border border-purple-100/70 p-3 text-xs text-purple-800 leading-relaxed font-medium">
                      💎 Each chapter exercise you finish earns you gems!
                    </div>
                  </div>
                </HoverCardContent>
              </HoverCard>

              <HoverCard>
                <HoverCardTrigger
                  render={
                    <HeaderStat
                      icon={<Heart className="h-5 w-5 fill-[#ea4f74] text-[#ea4f74]" />}
                      value={headerStats.hearts}
                    />
                  }
                />
                <HoverCardContent
                  align="end"
                  className="w-80 p-5 rounded-2xl bg-white/95 border border-border/80 shadow-[0_20px_50px_rgba(16,35,18,0.15)] backdrop-blur-xl"
                >
                  <div className="flex flex-col gap-3 text-left">
                    <div className="flex items-center gap-2 pb-2 border-b border-border/60">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-500">
                        <Heart className="h-5 w-5 fill-rose-500 text-rose-500" />
                      </div>
                      <h3 className="font-heading text-base tracking-[-0.03em] font-bold text-foreground">
                        Hearts & Hints
                      </h3>
                    </div>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      Hearts allow you to request hints when stuck on tricky exercise questions.
                    </p>
                    <div className="rounded-xl bg-rose-50/70 border border-rose-100/70 p-3 text-xs text-rose-800 leading-relaxed font-medium">
                      ❤️ Completing each chapter earns you 1 heart. Keep them for difficult challenges!
                    </div>
                  </div>
                </HoverCardContent>
              </HoverCard>

              <ProfileAvatarPopover
                loadingProfile={loadingProfile}
                profile={profile}
                handleSignOut={handleSignOut}
                isSigningOut={isSigningOut}
              />
            </div>
          </div>
        </header>

        <div className="flex-1 px-4 pb-8 pt-4 md:px-8 md:pb-10 md:pt-5">
          {children}
        </div>
      </SidebarInset>
    </>
  );
}

function HeaderStat({
  alt,
  iconSrc,
  icon,
  value,
  className,
  ...props
}: {
  alt?: string;
  iconSrc?: string;
  icon?: ReactNode;
  value: number;
  className?: string;
} & React.ComponentPropsWithoutRef<"button">) {
  return (
    <button
      type="button"
      className={cn(
        "flex h-11 min-w-11 items-center justify-center gap-1.5 rounded-full border border-border/70 bg-white/78 px-3 shadow-[0_14px_34px_-26px_rgba(16,35,18,0.32)] cursor-pointer hover:bg-white hover:scale-102 hover:shadow-[0_10px_25px_-15px_rgba(16,35,18,0.25)] transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
        className
      )}
      {...props}
    >
      {iconSrc ? (
        <Image src={iconSrc} alt={alt || ""} width={20} height={20} className="h-5 w-5 object-contain" />
      ) : (
        icon
      )}
      <p className="text-sm font-semibold text-foreground">{value}</p>
    </button>
  );
}

function SelectedCharacterAvatar({
  loading,
  profile,
  className,
  ...props
}: {
  loading: boolean;
  profile: AppUserProfile | null;
  className?: string;
} & React.ComponentPropsWithoutRef<"button">) {
  const character = profile?.character;

  return (
    <button
      type="button"
      className={cn(
        "flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border border-border/70 bg-white/82 shadow-[0_18px_40px_-28px_rgba(16,35,18,0.32)] cursor-pointer hover:bg-white hover:scale-102 hover:shadow-[0_10px_25px_-15px_rgba(16,35,18,0.25)] transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
        loading && "animate-pulse",
        className
      )}
      {...props}
    >
      {character ? (
        <Image
          src={`/characters/${character.fileName}`}
          alt={character.name}
          width={44}
          height={44}
          className="h-11 w-11 rounded-full bg-accent-soft object-contain"
        />
      ) : (
        <div className="h-5 w-5 rounded-full bg-accent/35" />
      )}
    </button>
  );
}

function ProfileAvatarPopover({
  loadingProfile,
  profile,
  handleSignOut,
  isSigningOut,
}: {
  loadingProfile: boolean;
  profile: AppUserProfile | null;
  handleSignOut: () => Promise<void>;
  isSigningOut: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <HoverCard open={open} onOpenChange={setOpen}>
      <HoverCardTrigger
        render={
          <SelectedCharacterAvatar loading={loadingProfile} profile={profile} />
        }
      />
      <HoverCardContent
        align="end"
        className="w-72 p-4 rounded-2xl bg-white/95 border border-border/80 shadow-[0_20px_50px_rgba(16,35,18,0.15)] backdrop-blur-xl"
      >
        <div className="flex flex-col gap-3 text-left">
          <div className="flex items-center gap-3 pb-3 border-b border-border/60">
            {profile?.character ? (
              <Image
                src={`/characters/${profile.character.fileName}`}
                alt={profile.character.name}
                width={40}
                height={40}
                className="h-10 w-10 rounded-full bg-accent-soft object-contain border border-accent/20"
              />
            ) : (
              <div className="h-10 w-10 rounded-full bg-accent-soft" />
            )}
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-sm truncate text-foreground leading-tight">
                {profile?.displayName || "SkillPet Learner"}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {profile?.email}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <Link
              href="/dashboard/profile"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-foreground hover:bg-slate-50 transition-colors"
            >
              <User className="h-4 w-4 text-muted-foreground" />
              Account Settings
            </Link>
            <Link
              href="/dashboard/billing"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm font-medium text-foreground hover:bg-slate-50 transition-colors cursor-pointer w-full"
            >
              <CreditCard className="h-4 w-4 text-muted-foreground" />
              Billing & Plan
            </Link>
          </div>

          <div className="h-px bg-border/60 my-1" />

          <button
            onClick={() => {
              setOpen(false);
              void handleSignOut();
            }}
            disabled={isSigningOut}
            className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm font-medium text-destructive hover:bg-rose-50/50 transition-colors cursor-pointer w-full disabled:opacity-50"
          >
            <LogOut className="h-4 w-4" />
            {isSigningOut ? "Signing out..." : "Sign Out"}
          </button>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
