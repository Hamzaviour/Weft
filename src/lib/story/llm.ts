import { generateText, Output } from "ai";
import { StorySchema, type Angle, type Story, type WeekSnapshot } from "../types";
import { dayName } from "../week";

const SYSTEM = `You are Weft, an AI that writes a "Spotify Wrapped"-style story about one person's week.
Voice: a perceptive friend who read their week and is glad to see them. Warm, specific, a little poetic.
You may use weaving metaphors (threads, knots, loom) but at most once every few cards.
Never be judgmental, never give medical or productivity advice, never use emoji or exclamation marks.

Hard rules:
- Use ONLY numbers that appear in the data or the angles. Never estimate or invent a number.
- 8 to 10 cards. Card 1 is kind "intro", the last card is kind "outro".
- At least two cards must connect two different sources (source "mixed").
- Only write about sources listed in "sources". Never mention a source that is missing.
- Headlines are short and editorial (max 9 words). Bodies are 1-2 sentences.
- "eyebrow" is an uppercase label like "TIME · MEETINGS" or "SOUND × BODY".
- Use stat for a single big number, items for top-5 lists; set the other to null.
- Insights (3-5) should prefer cross-source patterns from the angles.`;

function compactSnapshot(s: WeekSnapshot) {
  return {
    week: `${s.weekStart} to ${s.weekEnd}`,
    sources: s.sources,
    days: s.days.map((d) => ({
      day: dayName(d.date),
      ...(s.calendar && { meetingsMin: d.meetingsMinutes, focusMin: d.focusMinutes, events: d.events }),
      ...(s.spotify && { listeningMin: d.listeningMinutes, plays: d.tracksPlayed, lateNightPlays: d.lateNightPlays }),
      ...(s.github && { commits: d.commits, prs: d.prs }),
      ...(s.health && { sleepH: d.sleepHours, steps: d.steps, readiness: d.readiness }),
    })),
    calendar: s.calendar,
    spotify: s.spotify && {
      ...s.spotify,
      topTracks: s.spotify.topTracks.map(({ name, artist, plays }) => ({ name, artist, plays })),
      topArtists: s.spotify.topArtists.map(({ name, plays }) => ({ name, plays })),
    },
    github: s.github && { ...s.github, login: undefined },
    health: s.health && {
      ...s.health,
      bestSleepDay: dayName(s.health.bestSleepDay),
      worstSleepDay: dayName(s.health.worstSleepDay),
    },
  };
}

export function llmConfigured() {
  return Boolean(process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN);
}

export async function llmStory(s: WeekSnapshot, angles: Angle[]): Promise<Story> {
  const { output } = await generateText({
    model: process.env.WEFT_MODEL || "anthropic/claude-sonnet-5-5",
    system: SYSTEM,
    output: Output.object({ schema: StorySchema }),
    prompt: `DATA:\n${JSON.stringify(compactSnapshot(s))}\n\nANGLES (strongest first):\n${angles
      .map((a) => `- [${a.sources.join("+")}] ${a.fact}`)
      .join("\n")}\n\nWrite the story.`,
    abortSignal: AbortSignal.timeout(25_000),
    maxRetries: 1,
  });
  return output;
}
