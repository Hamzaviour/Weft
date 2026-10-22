import type { Angle, Story, StoryCard, WeekSnapshot } from "../types";

// Guards against the LLM inventing numbers: every number shown on a card must
// exist somewhere in the snapshot or the angles (allowing for rounding).

function collectNumbers(value: unknown, out: Set<string>) {
  if (typeof value === "number" && Number.isFinite(value)) {
    addNumber(value, out);
  } else if (typeof value === "string") {
    for (const m of value.matchAll(/-?\d[\d,]*(?:\.\d+)?/g)) addNumber(Number(m[0].replace(/,/g, "")), out);
  } else if (Array.isArray(value)) {
    for (const v of value) collectNumbers(v, out);
  } else if (value && typeof value === "object") {
    for (const v of Object.values(value)) collectNumbers(v, out);
  }
}

function addNumber(n: number, out: Set<string>) {
  out.add(String(n));
  out.add(String(Math.round(n)));
  out.add((Math.round(n * 10) / 10).toString());
  // Minutes ↔ hours conversions the writer may reasonably make.
  out.add((Math.round((n / 60) * 10) / 10).toString());
  out.add(String(Math.round(n / 60)));
  if (n >= 1000) out.add((Math.round(n / 100) / 10).toString()); // 15,680 → 15.7 (k)
}

export function numberWhitelist(s: WeekSnapshot, angles: Angle[]) {
  const set = new Set<string>();
  collectNumbers(s, set);
  collectNumbers(angles, set);
  for (let i = 0; i <= 10; i++) set.add(String(i)); // small counts ("two threads", "7 days")
  set.add("24");
  return set;
}

function numbersIn(text: string) {
  return [...text.matchAll(/-?\d[\d,]*(?:\.\d+)?/g)].map((m) => Number(m[0].replace(/,/g, "")));
}

export function cardIsGrounded(card: StoryCard, allowed: Set<string>) {
  const texts = [card.headline, card.body, card.stat?.value ?? "", ...(card.items ?? []).map((i) => i.value)];
  return texts.every((t) =>
    numbersIn(t).every((n) => allowed.has(String(n)) || allowed.has((Math.round(n * 10) / 10).toString())),
  );
}

export function groundStory(story: Story, fallbackCards: StoryCard[], s: WeekSnapshot, angles: Angle[]) {
  const allowed = numberWhitelist(s, angles);
  const used = new Set<number>();
  let replaced = 0;
  const cards = story.cards.flatMap((card) => {
    if (cardIsGrounded(card, allowed)) return [card];
    replaced++;
    const idx = fallbackCards.findIndex((f, i) => !used.has(i) && f.source === card.source && f.kind !== "intro" && f.kind !== "outro");
    if (idx === -1) return [];
    used.add(idx);
    return [fallbackCards[idx]];
  });
  const insights = story.insights.filter((i) => numbersIn(i.body).every((n) => allowed.has(String(n)) || allowed.has((Math.round(n * 10) / 10).toString())));
  return { story: { ...story, cards, insights: insights.length >= 3 ? insights : story.insights }, replaced };
}
