import { NextResponse, type NextRequest } from "next/server";
import { buildWeek } from "@/lib/pipeline";
import { safeTimeZone } from "@/lib/week";

// 5 reweaves per hour per client. In-memory is enough for a single instance;
// v1.1 moves this to a shared store.
const hits = new Map<string, number[]>();

export async function POST(req: NextRequest) {
  const id = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const now = Date.now();
  const recent = (hits.get(id) ?? []).filter((t) => now - t < 3_600_000);
  if (recent.length >= 5) {
    return NextResponse.json({ error: "You can reweave 5 times an hour. Try again soon." }, { status: 429 });
  }
  hits.set(id, [...recent, now]);
  const demo = req.nextUrl.searchParams.get("demo") === "1";
  const tz = safeTimeZone(req.nextUrl.searchParams.get("tz") ?? req.cookies.get("weft_tz")?.value);
  return NextResponse.json(await buildWeek({ demo, tz, force: true }));
}
