import { z } from "zod";

export const SOURCES = ["calendar", "spotify", "github", "health"] as const;
export type Source = (typeof SOURCES)[number];

export const SOURCE_META: Record<
  Source,
  { label: string; thread: string; color: string; provider: string }
> = {
  calendar: { label: "Time", thread: "time", color: "var(--thread-time)", provider: "Google Calendar" },
  spotify: { label: "Sound", thread: "sound", color: "var(--thread-sound)", provider: "Spotify" },
  github: { label: "Craft", thread: "craft", color: "var(--thread-craft)", provider: "GitHub" },
  health: { label: "Body", thread: "body", color: "var(--thread-body)", provider: "Oura" },
};

export interface DaySignals {
  date: string;
  meetingsMinutes: number;
  focusMinutes: number;
  events: number;
  listeningMinutes: number;
  tracksPlayed: number;
  lateNightPlays: number;
  commits: number;
  prs: number;
  commitHours: number[]; // 24 buckets
  sleepHours: number | null;
  steps: number | null;
  readiness: number | null;
}

export interface CalendarSummary {
  totalEvents: number;
  meetingHours: number;
  focusHours: number;
  busiestDay: string;
  longestMeetingMinutes: number;
  categories: Record<string, number>;
}

export interface SpotifySummary {
  minutes: number;
  plays: number;
  topTracks: { name: string; artist: string; plays: number; image?: string }[];
  topArtists: { name: string; plays: number; image?: string }[];
  topGenres: string[];
  lateNightPlays: number;
}

export interface GithubSummary {
  login: string;
  commits: number;
  prs: number;
  reviews: number;
  repos: { name: string; commits: number }[];
  languages: Record<string, number>;
  longestStreakDays: number;
  peakHour: number;
}

export interface HealthSummary {
  avgSleepHours: number;
  bestSleepDay: string;
  worstSleepDay: string;
  avgSteps: number;
  totalSteps: number;
  avgReadiness: number | null;
}

export interface WeekSnapshot {
  weekStart: string;
  weekEnd: string;
  timezone: string;
  demo: boolean;
  sources: Source[];
  days: DaySignals[];
  calendar?: CalendarSummary;
  spotify?: SpotifySummary;
  github?: GithubSummary;
  health?: HealthSummary;
  warnings: string[];
}

export const InsightSchema = z.object({
  type: z.enum(["pattern", "streak", "contrast", "highlight"]),
  title: z.string().describe("Short, specific title, max 8 words"),
  body: z.string().describe("One or two sentences citing real numbers"),
  sources: z.array(z.enum(SOURCES)).min(1),
});
export type Insight = z.infer<typeof InsightSchema>;

export const StoryCardSchema = z.object({
  kind: z.enum(["intro", "stat", "list", "contrast", "insight", "outro"]),
  source: z.enum([...SOURCES, "mixed"]),
  eyebrow: z.string().describe("2-4 word mono label, e.g. 'TIME · MEETINGS'"),
  headline: z.string().describe("Editorial headline, max 9 words"),
  body: z.string().describe("1-2 sentences, warm and specific"),
  stat: z
    .object({ value: z.string(), label: z.string() })
    .nullable()
    .describe("Big number shown on the card; value must come from the data"),
  items: z
    .array(z.object({ label: z.string(), value: z.string() }))
    .nullable()
    .describe("For list cards: up to 5 rows"),
});
export type StoryCard = z.infer<typeof StoryCardSchema>;

export const StorySchema = z.object({
  title: z.string().describe("Title of the week, 3-7 words, e.g. 'The week you found your rhythm'"),
  cards: z.array(StoryCardSchema).min(6).max(10),
  insights: z.array(InsightSchema).min(3).max(5),
});
export type Story = z.infer<typeof StorySchema>;

export interface Angle {
  id: string;
  sources: Source[];
  weight: number;
  fact: string;
  numbers: Record<string, string | number>;
}

export interface WeekPayload {
  snapshot: WeekSnapshot;
  angles: Angle[];
  story: Story;
  writer: "llm" | "template";
  generatedAt: string;
}
