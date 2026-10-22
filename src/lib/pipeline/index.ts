import "server-only";
import { createHash } from "node:crypto";
import { fetchCalendar } from "../connectors/calendar";
import { fetchGithub } from "../connectors/github";
import { fetchOura } from "../connectors/oura";
import type { DayPatch, WeekRange } from "../connectors/shared";
import { fetchSpotify } from "../connectors/spotify";
import { demoSnapshot } from "../demo";
import { PROVIDERS, type ProviderId } from "../providers";
import { getToken, type TokenSet } from "../session";
import { llmConfigured, llmStory } from "../story/llm";
import { templateCards, templateStory } from "../story/template";
import { groundStory } from "../story/validate";
import type { DaySignals, Source, WeekPayload, WeekSnapshot } from "../types";
import { lastCompletedWeek } from "../week";
import { findAngles } from "./angles";

const VERSION = "1";
const cache = new Map<string, WeekPayload>();
const CACHE_MAX = 64;

function remember(key: string, value: WeekPayload) {
  cache.delete(key);
  cache.set(key, value);
  if (cache.size > CACHE_MAX) cache.delete(cache.keys().next().value!);
}

// ---------- collect + normalize ----------

const COLLECTORS = {
  google: fetchCalendar,
  spotify: fetchSpotify,
  github: fetchGithub,
  oura: fetchOura,
} as const;

function blankDay(date: string): DaySignals {
  return {
    date,
    meetingsMinutes: 0,
    focusMinutes: 0,
    events: 0,
    listeningMinutes: 0,
    tracksPlayed: 0,
    lateNightPlays: 0,
    commits: 0,
    prs: 0,
    commitHours: Array(24).fill(0),
    sleepHours: null,
    steps: null,
    readiness: null,
  };
}

async function collect(tokens: Partial<Record<ProviderId, TokenSet>>, tz: string): Promise<WeekSnapshot> {
  const range: WeekRange = { tz, ...lastCompletedWeek(tz) };
  const days = range.days.map(blankDay);
  const snapshot: WeekSnapshot = {
    weekStart: range.weekStart,
    weekEnd: range.weekEnd,
    timezone: tz,
    demo: false,
    sources: [],
    days,
    warnings: [],
  };

  const entries = Object.entries(tokens) as [ProviderId, TokenSet][];
  const results = await Promise.allSettled(entries.map(([p, t]) => COLLECTORS[p](t.access_token, range)));

  results.forEach((res, i) => {
    const p = entries[i][0];
    const source: Source = PROVIDERS[p].source;
    if (res.status === "rejected") {
      snapshot.warnings.push(`${PROVIDERS[p].name} couldn't be read this time (${String(res.reason?.message ?? res.reason)}).`);
      return;
    }
    const { patches, summary } = res.value as { patches: Record<string, DayPatch>; summary: unknown };
    if (!summary) {
      snapshot.warnings.push(`${PROVIDERS[p].name} had no data for this week.`);
      return;
    }
    for (const d of days) Object.assign(d, patches[d.date]);
    snapshot.sources.push(source);
    if (source === "calendar") snapshot.calendar = summary as WeekSnapshot["calendar"];
    if (source === "spotify") snapshot.spotify = summary as WeekSnapshot["spotify"];
    if (source === "github") snapshot.github = summary as WeekSnapshot["github"];
    if (source === "health") snapshot.health = summary as WeekSnapshot["health"];
  });

  return snapshot;
}

// ---------- narrate ----------

async function narrate(snapshot: WeekSnapshot): Promise<WeekPayload> {
  const angles = findAngles(snapshot);
  const fallback = templateStory(snapshot, angles);
  let story = fallback;
  let writer: WeekPayload["writer"] = "template";

  if (llmConfigured() && snapshot.sources.length > 0) {
    try {
      const raw = await llmStory(snapshot, angles);
      const grounded = groundStory(raw, templateCards(snapshot, angles), snapshot, angles);
      if (grounded.story.cards.length >= 6) {
        story = grounded.story;
        writer = "llm";
      }
    } catch (err) {
      console.error("[weft] LLM writer failed, using template:", err);
    }
  }

  return { snapshot, angles, story, writer, generatedAt: new Date().toISOString() };
}

// ---------- public ----------

export async function buildWeek(opts: { demo: boolean; tz: string; force?: boolean }): Promise<WeekPayload> {
  let tokens: Partial<Record<ProviderId, TokenSet>> = {};
  if (!opts.demo) {
    const pairs = await Promise.all(
      (Object.keys(PROVIDERS) as ProviderId[]).map(async (p) => [p, await getToken(p)] as const),
    );
    tokens = Object.fromEntries(pairs.filter(([, t]) => t)) as typeof tokens;
  }
  const demo = opts.demo || Object.keys(tokens).length === 0;
  const { weekStart } = lastCompletedWeek(opts.tz);
  const identity = demo
    ? "demo"
    : Object.entries(tokens)
        .map(([p, t]) => `${p}:${t!.access_token}`)
        .sort()
        .join("|");
  const key = createHash("sha256").update(`${VERSION}|${identity}|${weekStart}|${opts.tz}`).digest("hex");

  if (!opts.force && cache.has(key)) return cache.get(key)!;
  const snapshot = demo ? demoSnapshot(opts.tz) : await collect(tokens, opts.tz);
  const payload = await narrate(snapshot);
  remember(key, payload);
  return payload;
}
