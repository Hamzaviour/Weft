import { NextResponse, type NextRequest } from "next/server";
import { buildWeek } from "@/lib/pipeline";
import { safeTimeZone } from "@/lib/week";

export async function GET(req: NextRequest) {
  const demo = req.nextUrl.searchParams.get("demo") === "1";
  const tz = safeTimeZone(req.nextUrl.searchParams.get("tz") ?? req.cookies.get("weft_tz")?.value);
  const started = Date.now();
  const payload = await buildWeek({ demo, tz });
  return NextResponse.json(payload, {
    headers: { "Server-Timing": `pipeline;dur=${Date.now() - started}` },
  });
}
