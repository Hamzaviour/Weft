import type { DaySignals, WeekSnapshot } from "./types";
import { lastCompletedWeek } from "./week";

// A hand-tuned week with a real arc: a heavy, meeting-packed Tuesday, a late-night
// listening spiral midweek, a breakthrough coding Thursday after the best sleep,
// and a quiet, outdoorsy weekend.
const DAYS: Omit<DaySignals, "date" | "commitHours">[] = [
  { meetingsMinutes: 210, focusMinutes: 150, events: 6, listeningMinutes: 96, tracksPlayed: 31, lateNightPlays: 0, commits: 7, prs: 1, sleepHours: 7.1, steps: 8420, readiness: 78 },
  { meetingsMinutes: 375, focusMinutes: 30, events: 9, listeningMinutes: 41, tracksPlayed: 14, lateNightPlays: 3, commits: 0, prs: 0, sleepHours: 6.2, steps: 5210, readiness: 64 },
  { meetingsMinutes: 120, focusMinutes: 180, events: 4, listeningMinutes: 188, tracksPlayed: 62, lateNightPlays: 11, commits: 9, prs: 1, sleepHours: 5.4, steps: 6130, readiness: 58 },
  { meetingsMinutes: 60, focusMinutes: 300, events: 3, listeningMinutes: 214, tracksPlayed: 70, lateNightPlays: 2, commits: 23, prs: 3, sleepHours: 8.3, steps: 7950, readiness: 88 },
  { meetingsMinutes: 150, focusMinutes: 120, events: 5, listeningMinutes: 132, tracksPlayed: 44, lateNightPlays: 6, commits: 12, prs: 2, sleepHours: 7.4, steps: 9310, readiness: 81 },
  { meetingsMinutes: 0, focusMinutes: 0, events: 2, listeningMinutes: 71, tracksPlayed: 23, lateNightPlays: 0, commits: 4, prs: 0, sleepHours: 8.9, steps: 15680, readiness: 90 },
  { meetingsMinutes: 0, focusMinutes: 60, events: 1, listeningMinutes: 118, tracksPlayed: 38, lateNightPlays: 0, commits: 2, prs: 0, sleepHours: 8.1, steps: 11240, readiness: 86 },
];

// Hour each day's commits cluster around.
const COMMIT_PEAKS = [11, 14, 23, 15, 16, 12, 20];

export function demoSnapshot(tz = "UTC", now = new Date()): WeekSnapshot {
  const { weekStart, weekEnd, days } = lastCompletedWeek(tz, now);

  const signals: DaySignals[] = DAYS.map((d, i) => {
    const commitHours = Array<number>(24).fill(0);
    let left = d.commits;
    let offset = 0;
    while (left > 0) {
      const h = (COMMIT_PEAKS[i] + [0, 1, -1, 2, -2, 3][offset % 6] + 24) % 24;
      const n = Math.min(left, Math.max(1, Math.round(d.commits / 3)));
      commitHours[h] += n;
      left -= n;
      offset++;
    }
    return { ...d, date: days[i], commitHours };
  });

  const totalMeet = signals.reduce((a, d) => a + d.meetingsMinutes, 0);
  const totalFocus = signals.reduce((a, d) => a + d.focusMinutes, 0);
  const sleep = signals.map((d) => d.sleepHours ?? 0);
  const steps = signals.map((d) => d.steps ?? 0);

  return {
    weekStart,
    weekEnd,
    timezone: tz,
    demo: true,
    sources: ["calendar", "spotify", "github", "health"],
    days: signals,
    calendar: {
      totalEvents: signals.reduce((a, d) => a + d.events, 0),
      meetingHours: Math.round((totalMeet / 60) * 10) / 10,
      focusHours: Math.round((totalFocus / 60) * 10) / 10,
      busiestDay: days[1],
      longestMeetingMinutes: 120,
      categories: { meeting: 18, focus: 7, social: 3, personal: 2 },
    },
    spotify: {
      minutes: signals.reduce((a, d) => a + d.listeningMinutes, 0),
      plays: signals.reduce((a, d) => a + d.tracksPlayed, 0),
      topTracks: [
        { name: "Pink + White", artist: "Frank Ocean", plays: 11 },
        { name: "Gooey", artist: "Glass Animals", plays: 9 },
        { name: "Midnight City", artist: "M83", plays: 8 },
        { name: "Nights", artist: "Frank Ocean", plays: 7 },
        { name: "Sunset Lover", artist: "Petit Biscuit", plays: 6 },
      ],
      topArtists: [
        { name: "Frank Ocean", plays: 26 },
        { name: "Glass Animals", plays: 17 },
        { name: "Tame Impala", plays: 15 },
        { name: "M83", plays: 12 },
        { name: "Khruangbin", plays: 10 },
      ],
      topGenres: ["alt r&b", "neo-psychedelia", "indietronica"],
      lateNightPlays: signals.reduce((a, d) => a + d.lateNightPlays, 0),
    },
    github: {
      login: "maya-builds",
      commits: signals.reduce((a, d) => a + d.commits, 0),
      prs: signals.reduce((a, d) => a + d.prs, 0),
      reviews: 6,
      repos: [
        { name: "loom-ui", commits: 29 },
        { name: "dotfiles", commits: 14 },
        { name: "weekend-synth", commits: 8 },
        { name: "api-gateway", commits: 6 },
      ],
      languages: { TypeScript: 34, Rust: 12, Lua: 6, CSS: 5 },
      longestStreakDays: 5,
      peakHour: 15,
    },
    health: {
      avgSleepHours: Math.round((sleep.reduce((a, b) => a + b, 0) / 7) * 10) / 10,
      bestSleepDay: days[5],
      worstSleepDay: days[2],
      avgSteps: Math.round(steps.reduce((a, b) => a + b, 0) / 7),
      totalSteps: steps.reduce((a, b) => a + b, 0),
      avgReadiness: 78,
    },
    warnings: [],
  };
}
