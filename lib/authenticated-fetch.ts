import { getInsforgeAccessToken } from "@/lib/insforge-browser";

export function buildAuthenticatedHeaders(init?: HeadersInit) {
  const headers = new Headers(init);
  const accessToken = getInsforgeAccessToken();

  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  return headers;
}
