import type { Source } from "./types";

export type ProviderId = "google" | "spotify" | "github" | "oura";

export interface ProviderConfig {
  id: ProviderId;
  source: Source;
  name: string;
  reads: string;
  authUrl: string;
  tokenUrl: string;
  scopes: string[];
  scopeSeparator: string;
  authStyle: "basic" | "body";
  extraAuthParams?: Record<string, string>;
  env: { id: string; secret: string };
}

export const PROVIDERS: Record<ProviderId, ProviderConfig> = {
  google: {
    id: "google",
    source: "calendar",
    name: "Google Calendar",
    reads: "Event times and durations. Titles are reduced to categories and never stored.",
    authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    scopes: ["https://www.googleapis.com/auth/calendar.readonly"],
    scopeSeparator: " ",
    authStyle: "body",
    extraAuthParams: { access_type: "offline", prompt: "consent", include_granted_scopes: "true" },
    env: { id: "GOOGLE_CLIENT_ID", secret: "GOOGLE_CLIENT_SECRET" },
  },
  spotify: {
    id: "spotify",
    source: "spotify",
    name: "Spotify",
    reads: "Recently played tracks and your short-term top artists.",
    authUrl: "https://accounts.spotify.com/authorize",
    tokenUrl: "https://accounts.spotify.com/api/token",
    scopes: ["user-read-recently-played", "user-top-read"],
    scopeSeparator: " ",
    authStyle: "basic",
    env: { id: "SPOTIFY_CLIENT_ID", secret: "SPOTIFY_CLIENT_SECRET" },
  },
  github: {
    id: "github",
    source: "github",
    name: "GitHub",
    reads: "Your contribution calendar, commits, pull requests and reviews.",
    authUrl: "https://github.com/login/oauth/authorize",
    tokenUrl: "https://github.com/login/oauth/access_token",
    scopes: ["read:user"],
    scopeSeparator: " ",
    authStyle: "body",
    env: { id: "GITHUB_CLIENT_ID", secret: "GITHUB_CLIENT_SECRET" },
  },
  oura: {
    id: "oura",
    source: "health",
    name: "Oura",
    reads: "Daily sleep, activity and readiness scores.",
    authUrl: "https://cloud.ouraring.com/oauth/authorize",
    tokenUrl: "https://api.ouraring.com/oauth/token",
    scopes: ["daily", "personal"],
    scopeSeparator: " ",
    authStyle: "basic",
    env: { id: "OURA_CLIENT_ID", secret: "OURA_CLIENT_SECRET" },
  },
};

export const PROVIDER_IDS = Object.keys(PROVIDERS) as ProviderId[];

export function isProviderId(x: string): x is ProviderId {
  return x in PROVIDERS;
}

export function providerCredentials(p: ProviderConfig) {
  const id = process.env[p.env.id];
  const secret = process.env[p.env.secret];
  return id && secret ? { id, secret } : null;
}

export function appUrl() {
  return (process.env.APP_URL || "http://localhost:3000").replace(/\/$/, "");
}

export function redirectUri(p: ProviderId) {
  return `${appUrl()}/api/auth/${p}/callback`;
}
