import { NextResponse, type NextRequest } from "next/server";
import { appUrl, isProviderId } from "@/lib/providers";
import { exchangeCode, saveToken, takeOAuthState } from "@/lib/session";

export async function GET(req: NextRequest, { params }: { params: Promise<{ provider: string }> }) {
  const { provider } = await params;
  const back = (q: string) => NextResponse.redirect(`${appUrl()}/connect?${q}`);
  if (!isProviderId(provider)) return back("error=unknown_provider");

  const sp = req.nextUrl.searchParams;
  const saved = await takeOAuthState(provider);
  if (sp.get("error")) return back(`error=${provider}_denied`);
  if (!saved || saved.state !== sp.get("state")) return back(`error=${provider}_state_mismatch`);
  const code = sp.get("code");
  if (!code) return back(`error=${provider}_no_code`);

  try {
    await saveToken(provider, await exchangeCode(provider, code, saved.verifier));
    return back(`connected=${provider}`);
  } catch (err) {
    console.error(`[weft] ${provider} token exchange failed`, err);
    return back(`error=${provider}_exchange_failed`);
  }
}
