import { NextResponse, type NextRequest } from "next/server";
import { appUrl, isProviderId, PROVIDERS, providerCredentials, redirectUri } from "@/lib/providers";
import { newState, pkce, saveOAuthState } from "@/lib/session";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ provider: string }> }) {
  const { provider } = await params;
  if (!isProviderId(provider)) return NextResponse.json({ error: "Unknown provider" }, { status: 404 });
  const cfg = PROVIDERS[provider];
  const creds = providerCredentials(cfg);
  if (!creds) return NextResponse.redirect(`${appUrl()}/connect?error=${provider}_not_configured`);

  const state = newState();
  const { verifier, challenge } = pkce();
  await saveOAuthState(provider, state, verifier);

  const url = new URL(cfg.authUrl);
  url.search = new URLSearchParams({
    client_id: creds.id,
    redirect_uri: redirectUri(provider),
    response_type: "code",
    scope: cfg.scopes.join(cfg.scopeSeparator),
    state,
    code_challenge: challenge,
    code_challenge_method: "S256",
    ...cfg.extraAuthParams,
  }).toString();
  return NextResponse.redirect(url);
}
