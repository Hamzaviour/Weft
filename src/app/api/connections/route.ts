import { NextResponse } from "next/server";
import { PROVIDERS, PROVIDER_IDS, providerCredentials } from "@/lib/providers";
import { connectedProviders } from "@/lib/session";
import { llmConfigured } from "@/lib/story/llm";

export async function GET() {
  const connected = await connectedProviders();
  return NextResponse.json({
    llm: llmConfigured(),
    providers: PROVIDER_IDS.map((id) => ({
      id,
      source: PROVIDERS[id].source,
      name: PROVIDERS[id].name,
      reads: PROVIDERS[id].reads,
      scopes: PROVIDERS[id].scopes,
      configured: Boolean(providerCredentials(PROVIDERS[id])),
      connected: connected.includes(id),
    })),
  });
}
