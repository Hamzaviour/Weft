import type { HealthSummary } from "../types";
import { addDays } from "../week";
import { getJson, round1, type DayPatch, type WeekRange } from "./shared";

const API = "https://api.ouraring.com/v2/usercollection";

interface Paged<T> { data: T[] }

export async function fetchOura(token: string, r: WeekRange) {
  const q = `start_date=${r.weekStart}&end_date=${addDays(r.weekEnd, 1)}`;
  const [activity, readiness, sleep] = await Promise.all([
    getJson<Paged<{ day: string; steps: number }>>(`${API}/daily_activity?${q}`, token, "health"),
    getJson<Paged<{ day: string; score: number | null }>>(`${API}/daily_readiness?${q}`, token, "health").catch(() => ({ data: [] })),
    getJson<Paged<{ day: string; type: string; total_sleep_duration: number | null }>>(`${API}/sleep?${q}`, token, "health"),
  ]);

  const patches: Record<string, DayPatch> = {};
  for (const d of r.days) patches[d] = { sleepHours: null, steps: null, readiness: null };
  for (const a of activity.data) if (patches[a.day]) patches[a.day].steps = a.steps;
  for (const x of readiness.data) if (patches[x.day]) patches[x.day].readiness = x.score;
  // Oura files a night's sleep under the day you woke up.
  const sleepByDay: Record<string, number> = {};
  for (const s of sleep.data) {
    if (!s.total_sleep_duration || (s.type !== "long_sleep" && s.type !== "sleep")) continue;
    sleepByDay[s.day] = (sleepByDay[s.day] ?? 0) + s.total_sleep_duration / 3600;
  }
  for (const [day, h] of Object.entries(sleepByDay)) if (patches[day]) patches[day].sleepHours = round1(h);

  const sleeps = r.days.filter((d) => patches[d].sleepHours != null);
  const steps = r.days.map((d) => patches[d].steps ?? 0);
  const ready = r.days.map((d) => patches[d].readiness).filter((x): x is number => x != null);
  if (!sleeps.length && !steps.some(Boolean)) return { patches, summary: null };

  const bySleep = [...sleeps].sort((a, b) => patches[b].sleepHours! - patches[a].sleepHours!);
  const summary: HealthSummary = {
    avgSleepHours: sleeps.length ? round1(sleeps.reduce((a, d) => a + patches[d].sleepHours!, 0) / sleeps.length) : 0,
    bestSleepDay: bySleep[0] ?? r.weekStart,
    worstSleepDay: bySleep.at(-1) ?? r.weekStart,
    avgSteps: Math.round(steps.reduce((a, b) => a + b, 0) / 7),
    totalSteps: steps.reduce((a, b) => a + b, 0),
    avgReadiness: ready.length ? Math.round(ready.reduce((a, b) => a + b, 0) / ready.length) : null,
  };
  return { patches, summary };
}
