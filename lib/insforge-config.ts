const DEFAULT_INSFORGE_BASE_URL = "https://p38xiybh.us-west.insforge.app";

export function getInsforgeBaseUrl() {
  const configured = process.env.NEXT_PUBLIC_INSFORGE_BASE_URL?.trim().replace(/\/$/, "");

  if (!configured || configured.includes("your-app.insforge.app")) {
    return DEFAULT_INSFORGE_BASE_URL;
  }

  return configured;
}

export function getInsforgeAnonKey() {
  const configured = process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY?.trim();

  if (!configured || configured === "ik_your_anon_key_here") {
    return undefined;
  }

  return configured;
}
