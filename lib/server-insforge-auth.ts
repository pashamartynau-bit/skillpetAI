import { createClient, type UserSchema } from "@insforge/sdk";

const INSFORGE_BASE_URL = process.env.NEXT_PUBLIC_INSFORGE_BASE_URL;
const INSFORGE_ANON_KEY = process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY;

function createDemoUser(): UserSchema {
  const timestamp = new Date().toISOString();

  const demo = {
    created_at: timestamp,
    email: "demo@skillpet.ai",
    emailVerified: true,
    id: "demo-user-1",
    last_sign_in_at: timestamp,
    profile: {
      avatar_url: "/characters/Byte_1.png",
      name: "Demo Learner",
    },
    updated_at: timestamp,
  } as unknown as UserSchema;

  return demo;
}

function getInsforgeConfig() {
  if (!INSFORGE_BASE_URL || !INSFORGE_ANON_KEY) {
    return null;
  }

  return {
    anonKey: INSFORGE_ANON_KEY,
    baseUrl: INSFORGE_BASE_URL,
  };
}

export function getBearerTokenFromRequest(request: Request) {
  const authorization = request.headers.get("authorization")?.trim();

  if (!authorization?.toLowerCase().startsWith("bearer ")) {
    return null;
  }

  const token = authorization.slice("bearer ".length).trim();
  return token || null;
}

export async function getAuthenticatedInsforgeUser(request: Request): Promise<UserSchema | null> {
  const accessToken = getBearerTokenFromRequest(request);

  if (!INSFORGE_BASE_URL || !INSFORGE_ANON_KEY) {
    if (!accessToken || accessToken === "demo-token") {
      return createDemoUser();
    }
    return null;
  }

  if (!accessToken) {
    return null;
  }

  const client = createClient({
    ...getInsforgeConfig(),
    accessToken,
  });
  const { data, error } = await client.auth.getCurrentUser();

  if (error || !data.user) {
    return null;
  }

  return data.user;
}

export async function requireAuthenticatedInsforgeUser(request: Request) {
  const user = await getAuthenticatedInsforgeUser(request);

  if (!user) {
    throw new Error("Unauthorized");
  }

  return user;
}

