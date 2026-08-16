import { createClient, type InsForgeClient, type UserSchema } from "@insforge/sdk";

const DEMO_USER_KEY = "skillpet-demo-user";
const DEMO_ACCESS_TOKEN = "demo-token";

let browserClient: InsForgeClient | null = null;

function hasInsforgeConfig() {
  return Boolean(
    process.env.NEXT_PUBLIC_INSFORGE_BASE_URL && process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY,
  );
}

function createDemoUser(overrides: Partial<UserSchema> = {}): UserSchema {
  const timestamp = new Date().toISOString();
  const baseUser = {
    id: "demo-user-1",
    created_at: timestamp,
    email: "demo@skillpet.ai",
    emailVerified: true,
    last_sign_in_at: timestamp,
    updated_at: timestamp,
    profile: {
      avatar_url: "/characters/Byte_1.png",
      name: "Demo Learner",
    },
    ...overrides,
  } as unknown as UserSchema;

  return baseUser;
}

function readStoredDemoUser(): UserSchema | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(DEMO_USER_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as Partial<UserSchema>;
    return parsed?.id ? (parsed as UserSchema) : null;
  } catch {
    return null;
  }
}

function persistDemoUser(user: UserSchema) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(DEMO_USER_KEY, JSON.stringify(user));
}

function clearStoredDemoUser() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(DEMO_USER_KEY);
}

function createDemoClient(): InsForgeClient {
  const getCurrentUser = async () => ({
    data: { user: readStoredDemoUser() ?? null },
    error: null,
  });

  const signInWithPassword = async (payload: { email: string; password: string }) => {
    const user = createDemoUser({
      email: payload.email,
      profile: {
        avatar_url: "/characters/Byte_1.png",
        name: payload.email.split("@")[0] || "Demo Learner",
      },
    });
    persistDemoUser(user);

    return {
      data: { accessToken: DEMO_ACCESS_TOKEN, user },
      error: null,
    };
  };

  const signUp = async (payload: {
    email: string;
    password: string;
    name?: string;
    redirectTo?: string;
  }) => {
    const user = createDemoUser({
      email: payload.email,
      profile: {
        avatar_url: "/characters/Pip_1.png",
        name: payload.name || payload.email.split("@")[0] || "Demo Learner",
      },
    });
    persistDemoUser(user);

    return {
      data: {
        accessToken: DEMO_ACCESS_TOKEN,
        requireEmailVerification: false,
        user,
      },
      error: null,
    };
  };

  const signInWithOAuth = async (_provider: string, _options?: unknown) => {
    const user = readStoredDemoUser() ?? createDemoUser();
    persistDemoUser(user);

    return {
      data: { accessToken: DEMO_ACCESS_TOKEN, user },
      error: null,
    };
  };

  const signOut = async () => {
    clearStoredDemoUser();
    return { error: null };
  };

  return {
    auth: {
      getCurrentUser,
      signInWithOAuth,
      signInWithPassword,
      signOut,
      signUp,
    },
    getHttpClient: () => ({
      getHeaders: () => ({ Authorization: 'Bearer ******' }),
    }),
  } as unknown as InsForgeClient;
}

export function getInsforgeBrowserClient(): InsForgeClient {
  if (!hasInsforgeConfig()) {
    browserClient ??= createDemoClient();
    return browserClient;
  }

  const baseUrl = process.env.NEXT_PUBLIC_INSFORGE_BASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY;

  if (!baseUrl || !anonKey) {
    browserClient ??= createDemoClient();
    return browserClient;
  }

  browserClient ??= createClient({
    anonKey,
    baseUrl,
  });

  return browserClient;
}

export function getAppUrl() {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

export function getInsforgeAccessToken() {
  if (!hasInsforgeConfig()) {
    const user = readStoredDemoUser();
    return user ? DEMO_ACCESS_TOKEN : null;
  }

  const headers = getInsforgeBrowserClient().getHttpClient().getHeaders();
  const authorization = headers.Authorization ?? headers.authorization;

  if (!authorization?.startsWith("Bearer ")) {
    return null;
  }

  return authorization.slice("Bearer ".length).trim() || null;
}
