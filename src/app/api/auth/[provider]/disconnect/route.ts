import { NextResponse } from "next/server";
import { isProviderId } from "@/lib/providers";
import { clearToken } from "@/lib/session";

export async function POST(_req: Request, { params }: { params: Promise<{ provider: string }> }) {
  const { provider } = await params;
  if (!isProviderId(provider)) return NextResponse.json({ error: "Unknown provider" }, { status: 404 });
  await clearToken(provider);
  return NextResponse.json({ ok: true });
}
