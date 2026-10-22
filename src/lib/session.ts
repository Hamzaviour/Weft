import "server-only";
import { EncryptJWT, jwtDecrypt } from "jose";
import { cookies } from "next/headers";
import { createHash, randomBytes } from "node:crypto";
import { PROVIDERS, type ProviderId, providerCredentials, redirectUri } from "./providers";

export interface TokenSet {
  access_token: string;
  refresh_token?: string;
  expires_at?: number; // epoch seconds
}

const COOKIE_PREFIX = "weft_";
const MAX_AGE = 60 * 60 * 24 * 60; // 60 days

function key() {
  const secret = process.env.WEFT_SECRET;
  if (!secret && process.env.NODE_ENV === "production") {
    throw new Error("WEFT_SECRET must be set in production");
  }
  return createHash("sha256").update(secret || "weft-dev-secret-do-not-use-in-prod").digest();
}

export async function seal(payload: Record<string, unknown>, ttlSeconds = MAX_AGE) {
  return new EncryptJWT(payload)
    .setProtectedHeader({ alg: "dir", enc: "A256GCM" })
    .setIssuedAt()
    .setExpirationTime(`${ttlSeconds}s`)
    .encrypt(key());
}

export async function unseal<T>(token: string | undefined): Promise<T | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtDecrypt(token, key());
    return payload as T;
  } catch {
    return null;
  }
}

const cookieOpts = (maxAge: number) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge,
});

export async function getToken(p: ProviderId): Promise<TokenSet | null> {
  const jar = await cookies();
  const tokens = await unseal<TokenSet>(jar.get(COOKIE_PREFIX + p)?.value);
  if (!tokens) return null;
  if (tokens.expires_at && tokens.expires_at - 60 < Date.now() / 1000 && tokens.refresh_token) {
    const refreshed = await refresh(p, tokens.refresh_token).catch(() => null);
    if (!refreshed) return null;
    // Cookies can only be written in route handlers / server actions; the pipeline runs in one.
    await saveToken(p, refreshed).catch(() => {});
    return refreshed;
  }
  return tokens;
}

export async function saveToken(p: ProviderId, t: TokenSet) {
  const jar = await cookies();
  jar.set(COOKIE_PREFIX + p, await seal({ ...t }), cookieOpts(MAX_AGE));
}

export async function clearToken(p: ProviderId) {
  const jar = await cookies();
  jar.delete(COOKIE_PREFIX + p);
}

export async function connectedProviders(): Promise<ProviderId[]> {
  const jar = await cookies();
  return (Object.keys(PROVIDERS) as ProviderId[]).filter((p) => jar.has(COOKIE_PREFIX + p));
}

// ---------- OAuth helpers ----------

const b64url = (buf: Buffer) => buf.toString("base64url");

export function pkce() {
  const verifier = b64url(randomBytes(32));
  const challenge = b64url(createHash("sha256").update(verifier).digest());
  return { verifier, challenge };
}

export async function saveOAuthState(p: ProviderId, state: string, verifier: string) {
  const jar = await cookies();
  jar.set(`${COOKIE_PREFIX}oauth_${p}`, await seal({ state, verifier }, 600), cookieOpts(600));
}

export async function takeOAuthState(p: ProviderId) {
  const jar = await cookies();
  const name = `${COOKIE_PREFIX}oauth_${p}`;
  const v = await unseal<{ state: string; verifier: string }>(jar.get(name)?.value);
  jar.delete(name);
  return v;
}

export function newState() {
  return b64url(randomBytes(16));
}

interface TokenResponse {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  error?: string;
  error_description?: string;
}

async function tokenRequest(p: ProviderId, params: Record<string, string>): Promise<TokenSet> {
  const cfg = PROVIDERS[p];
  const creds = providerCredentials(cfg);
  if (!creds) throw new Error(`${cfg.name} is not configured`);
  const body = new URLSearchParams(params);
  const headers: Record<string, string> = {
    "Content-Type": "application/x-www-form-urlencoded",
    Accept: "application/json",
  };
  if (cfg.authStyle === "basic") {
    headers.Authorization = `Basic ${Buffer.from(`${creds.id}:${creds.secret}`).toString("base64")}`;
  } else {
    body.set("client_id", creds.id);
    body.set("client_secret", creds.secret);
  }
  const res = await fetch(cfg.tokenUrl, { method: "POST", headers, body, signal: AbortSignal.timeout(10_000) });
  const json = (await res.json().catch(() => ({}))) as TokenResponse;
  if (!res.ok || !json.access_token) {
    throw new Error(json.error_description || json.error || `Token request failed (${res.status})`);
  }
  return {
    access_token: json.access_token,
    refresh_token: json.refresh_token ?? params.refresh_token,
    expires_at: json.expires_in ? Math.floor(Date.now() / 1000) + json.expires_in : undefined,
  };
}

export function exchangeCode(p: ProviderId, code: string, verifier: string) {
  return tokenRequest(p, {
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri(p),
    code_verifier: verifier,
  });
}

function refresh(p: ProviderId, refreshToken: string) {
  return tokenRequest(p, { grant_type: "refresh_token", refresh_token: refreshToken });
}
