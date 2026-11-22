import { createClient, type UserSchema } from "@insforge/sdk";

import { getInsforgeAnonKey, getInsforgeBaseUrl } from "@/lib/insforge-config";

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

  if (!accessToken || accessToken === "demo-token") {
    return null;
  }

  const anonKey = getInsforgeAnonKey();
  const client = createClient({
    accessToken,
    baseUrl: getInsforgeBaseUrl(),
    ...(anonKey ? { anonKey } : {}),
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
