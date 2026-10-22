import type { Angle, Insight, Story, StoryCard, WeekSnapshot } from "../types";
import { dayName, formatRange } from "../week";

// Deterministic writer. Used when no LLM is configured, when the LLM fails,
// and as the source of replacement cards when an LLM card fails validation.

const fmt = (n: number) => n.toLocaleString("en-US");

function pick(angles: Angle[], id: string) {
  return angles.find((a) => a.id === id);
}

export function templateCards(s: WeekSnapshot, angles: Angle[]): StoryCard[] {
  const cards: StoryCard[] = [];
  const threads = s.sources.length;

  cards.push({
    kind: "intro",
    source: "mixed",
    eyebrow: `WEEK OF ${formatRange(s.weekStart, s.weekEnd).toUpperCase()}`,
    headline: "Let's unravel your week.",
    body: `${threads} thread${threads === 1 ? "" : "s"}, seven days. Here's what they wove together.`,
    stat: null,
    items: null,
  });

  if (s.calendar) {
    const busy = pick(angles, "busiest-day");
    cards.push({
      kind: "stat",
      source: "calendar",
      eyebrow: "TIME · MEETINGS",
      headline: `${busy?.numbers.day ?? dayName(s.calendar.busiestDay)} was a knot.`,
      body: busy
        ? `${busy.numbers.events} events and ${busy.numbers.meetingHours} hours of meetings, back to back.`
        : `Your busiest day of the week.`,
      stat: { value: `${s.calendar.meetingHours}h`, label: "in meetings this week" },
      items: null,
    });
  }

  if (s.spotify) {
    cards.push({
      kind: "list",
      source: "spotify",
      eyebrow: "SOUND · ON REPEAT",
      headline: s.spotify.topTracks[0] ? `"${s.spotify.topTracks[0].name}" had you.` : "Your soundtrack.",
      body: `${fmt(s.spotify.minutes)} minutes of music across ${fmt(s.spotify.plays)} plays.`,
      stat: null,
      items: s.spotify.topTracks.slice(0, 5).map((t) => ({ label: `${t.name} · ${t.artist}`, value: `${t.plays}×` })),
    });
  }

  const late = pick(angles, "late-night");
  if (late) {
    cards.push({
      kind: "contrast",
      source: late.sources.length > 1 ? "mixed" : "spotify",
      eyebrow: "SOUND × BODY · AFTER MIDNIGHT",
      headline: "The 2am listening sessions.",
      body: late.fact,
      stat: { value: String(late.numbers.plays), label: "songs after midnight" },
      items: null,
    });
  }

  if (s.github) {
    const peak = pick(angles, "peak-commit-day");
    cards.push({
      kind: "stat",
      source: "github",
      eyebrow: "CRAFT · COMMITS",
      headline: peak ? `${peak.numbers.day} was your build day.` : "You shipped.",
      body: `${s.github.commits} commits and ${s.github.prs} pull requests${
        s.github.repos[0] ? `, mostly in ${s.github.repos[0].name}` : ""
      }.`,
      stat: { value: String(peak?.numbers.peak ?? s.github.commits), label: peak ? `commits on ${peak.numbers.day}` : "commits" },
      items: null,
    });
  }

  if (s.health) {
    cards.push({
      kind: "stat",
      source: "health",
      eyebrow: "BODY · SLEEP",
      headline: `You slept best on ${dayName(s.health.bestSleepDay)}.`,
      body: `You averaged ${s.health.avgSleepHours} hours a night and walked ${fmt(s.health.totalSteps)} steps.`,
      stat: { value: `${s.health.avgSleepHours}h`, label: "average sleep" },
      items: null,
    });
  }

  const cross = angles.filter((a) => a.sources.length > 1 && a.id !== "late-night").slice(0, 2);
  for (const a of cross) {
    cards.push({
      kind: "insight",
      source: "mixed",
      eyebrow: a.sources.map((x) => x.toUpperCase()).join(" × "),
      headline: crossHeadline(a),
      body: a.fact,
      stat: null,
      items: null,
    });
  }

  cards.push({
    kind: "outro",
    source: "mixed",
    eyebrow: "WOVEN BY WEFT",
    headline: titleFor(s, angles),
    body: "This is your week as cloth. Every thread is a real moment. No two weeks weave the same.",
    stat: null,
    items: null,
  });

  return cards;
}

function crossHeadline(a: Angle) {
  switch (a.id) {
    case "sleep-x-code":
      return "Rested you writes better code.";
    case "meetings-x-code":
      return "Meetings ate your momentum.";
    case "music-x-code":
      return "The louder the music, the more you shipped.";
    case "late-night":
      return "The 2am listening sessions.";
    case "free-day-x-body":
      return "An empty calendar got you moving.";
    default:
      return "Two threads, one pattern.";
  }
}

export function titleFor(s: WeekSnapshot, angles: Angle[]) {
  if (pick(angles, "sleep-x-code") && pick(angles, "late-night")) return "The week you found your rhythm";
  if (pick(angles, "meetings-x-code")) return "The week of knots and breakthroughs";
  if (s.github && s.github.commits > 30) return "The week you built things";
  if (s.spotify && s.spotify.minutes > 600) return "The week with a soundtrack";
  return "A week, woven";
}

export function templateInsights(angles: Angle[]): Insight[] {
  const typeFor = (a: Angle): Insight["type"] =>
    a.id === "streak" ? "streak" : a.id.includes("-x-") ? (a.id === "meetings-x-code" ? "contrast" : "pattern") : "highlight";
  const chosen = [
    ...angles.filter((a) => a.sources.length > 1),
    ...angles.filter((a) => a.sources.length === 1),
  ].slice(0, 4);
  while (chosen.length < 3 && angles[chosen.length]) chosen.push(angles[chosen.length]);
  return chosen.map((a) => ({
    type: typeFor(a),
    title: a.sources.length > 1 ? crossHeadline(a) : a.fact.split(/[:.;]/)[0],
    body: a.fact,
    sources: a.sources,
  }));
}

export function templateStory(s: WeekSnapshot, angles: Angle[]): Story {
  const insights = templateInsights(angles);
  if (insights.length === 0) {
    insights.push({ type: "highlight", title: "Your first thread", body: "Connect more sources and Weft will start finding patterns between them.", sources: s.sources.length ? [s.sources[0]] : ["calendar"] });
  }
  return { title: titleFor(s, angles), cards: templateCards(s, angles), insights };
}
