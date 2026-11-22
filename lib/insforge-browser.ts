import { createClient, type InsForgeClient } from "@insforge/sdk";

import { getInsforgeAnonKey, getInsforgeBaseUrl } from "@/lib/insforge-config";

let browserClient: InsForgeClient | null = null;

export function getInsforgeBrowserClient(): InsForgeClient {
  if (browserClient) {
    return browserClient;
  }

  const anonKey = getInsforgeAnonKey();
  browserClient = createClient({
    baseUrl: getInsforgeBaseUrl(),
    ...(anonKey ? { anonKey } : {}),
  });

  return browserClient;
}

export function getAppUrl() {
  if (typeof window !== "undefined" && window.location.origin) {
    return window.location.origin;
  }

  return process.env.NEXT_PUBLIC_APP_URL?.trim() || "http://localhost:3000";
}

export function getInsforgeAccessToken() {
  const headers = getInsforgeBrowserClient().getHttpClient().getHeaders();
  const authorization = headers.Authorization ?? headers.authorization;

  if (!authorization?.startsWith("Bearer ")) {
    return null;
  }

  return authorization.slice("Bearer ".length).trim() || null;
}
