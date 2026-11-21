import { createClient, type SanityClient } from "@sanity/client";

const apiVersion = "2024-01-01";

export function hasSanityConfig() {
  return Boolean(process.env.SANITY_API_TOKEN);
}

export function getSanityConfig() {
  const token = process.env.SANITY_API_TOKEN;

  if (!token) {
    throw new Error("Missing SANITY_API_TOKEN.");
  }

  return {
    apiVersion,
    dataset: process.env.SANITY_DATASET?.trim() || "production",
    projectId: process.env.SANITY_PROJECT_ID?.trim() || "njws1rbr",
    token,
  };
}

let cachedClient: SanityClient | null = null;

export function getSanityClient() {
  if (cachedClient) {
    return cachedClient;
  }

  const config = getSanityConfig();
  cachedClient = createClient({
    apiVersion: config.apiVersion,
    dataset: config.dataset,
    projectId: config.projectId,
    token: config.token,
    useCdn: false,
  });

  return cachedClient;
}

export function sanityDocumentId(prefix: string, ...parts: string[]) {
  const safeParts = parts.map((part) =>
    part.replace(/[^A-Za-z0-9._-]/g, "-").replace(/^-+/, "").slice(0, 40),
  );
  const id = [prefix, ...safeParts].filter(Boolean).join(".");

  return id.slice(0, 128);
}
