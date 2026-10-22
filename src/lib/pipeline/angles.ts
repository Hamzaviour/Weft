import type { Angle, DaySignals, Source, WeekSnapshot } from "../types";
import { dayName } from "../week";

// Angles are the "interesting things" about a week, computed deterministically.
// Both story writers build on them, so the LLM never has to find patterns on its own.

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
const round1 = (n: number) => Math.round(n * 10) / 10;

function maxBy<T>(xs: T[], f: (x: T) => number): T {
  return xs.reduce((best, x) => (f(x) > f(best) ? x : best), xs[0]);
}
function minBy<T>(xs: T[], f: (x: T) => number): T {
  return xs.reduce((best, x) => (f(x) < f(best) ? x : best), xs[0]);
}

function pearson(a: number[], b: number[]) {
  const n = a.length;
  const ma = sum(a) / n;
  const mb = sum(b) / n;
  let num = 0, da = 0, db = 0;
  for (let i = 0; i < n; i++) {
    num += (a[i] - ma) * (b[i] - mb);
    da += (a[i] - ma) ** 2;
    db += (b[i] - mb) ** 2;
  }
  return da && db ? num / Math.sqrt(da * db) : 0;
}

export function findAngles(s: WeekSnapshot): Angle[] {
  const angles: Angle[] = [];
  const days = s.days;
  const has = (src: Source) => s.sources.includes(src);

  if (has("calendar") && s.calendar) {
    const busiest = maxBy(days, (d) => d.meetingsMinutes);
    angles.push({
      id: "busiest-day",
      sources: ["calendar"],
      weight: 0.8,
      fact: `${dayName(busiest.date)} was the busiest day: ${busiest.events} events and ${round1(busiest.meetingsMinutes / 60)} hours of meetings.`,
      numbers: { day: dayName(busiest.date), events: busiest.events, meetingHours: round1(busiest.meetingsMinutes / 60) },
    });
    const ratio = s.calendar.meetingHours / Math.max(0.1, s.calendar.meetingHours + s.calendar.focusHours);
    angles.push({
      id: "meeting-vs-focus",
      sources: ["calendar"],
      weight: 0.6,
      fact: `${s.calendar.meetingHours}h in meetings vs ${s.calendar.focusHours}h of focus time (${Math.round(ratio * 100)}% meetings).`,
      numbers: { meetingHours: s.calendar.meetingHours, focusHours: s.calendar.focusHours, meetingPct: Math.round(ratio * 100) },
    });
  }

  if (has("spotify") && s.spotify) {
    const top = s.spotify.topTracks[0];
    if (top) {
      angles.push({
        id: "top-track",
        sources: ["spotify"],
        weight: 0.9,
        fact: `Most played track: "${top.name}" by ${top.artist}, ${top.plays} plays.`,
        numbers: { track: top.name, artist: top.artist, plays: top.plays },
      });
    }
    const loudest = maxBy(days, (d) => d.listeningMinutes);
    angles.push({
      id: "soundtrack-day",
      sources: ["spotify"],
      weight: 0.5,
      fact: `${s.spotify.minutes} minutes of music in total; most on ${dayName(loudest.date)} (${loudest.listeningMinutes} min).`,
      numbers: { minutes: s.spotify.minutes, hours: round1(s.spotify.minutes / 60), day: dayName(loudest.date), dayMinutes: loudest.listeningMinutes },
    });
    if (s.spotify.lateNightPlays >= 5) {
      const lateDay = maxBy(days, (d) => d.lateNightPlays);
      angles.push({
        id: "late-night",
        sources: has("health") ? ["spotify", "health"] : ["spotify"],
        weight: 0.75,
        fact: `${s.spotify.lateNightPlays} songs played between midnight and 4am, most on ${dayName(lateDay.date)}${
          lateDay.sleepHours != null ? `, which got only ${lateDay.sleepHours}h of sleep` : ""
        }.`,
        numbers: { plays: s.spotify.lateNightPlays, day: dayName(lateDay.date), sleep: lateDay.sleepHours ?? "" },
      });
    }
  }

  if (has("github") && s.github) {
    const peak = maxBy(days, (d) => d.commits);
    angles.push({
      id: "peak-commit-day",
      sources: ["github"],
      weight: 0.85,
      fact: `${s.github.commits} commits this week; ${peak.commits} of them on ${dayName(peak.date)}.`,
      numbers: { commits: s.github.commits, peak: peak.commits, day: dayName(peak.date), prs: s.github.prs },
    });
    if (s.github.longestStreakDays >= 3) {
      angles.push({
        id: "streak",
        sources: ["github"],
        weight: 0.55,
        fact: `A ${s.github.longestStreakDays}-day commit streak.`,
        numbers: { days: s.github.longestStreakDays },
      });
    }
    const repo = s.github.repos[0];
    if (repo) {
      angles.push({
        id: "top-repo",
        sources: ["github"],
        weight: 0.5,
        fact: `Most work went into ${repo.name} (${repo.commits} commits). Peak coding hour: ${s.github.peakHour}:00.`,
        numbers: { repo: repo.name, commits: repo.commits, peakHour: s.github.peakHour },
      });
    }
  }

  if (has("health") && s.health) {
    angles.push({
      id: "sleep",
      sources: ["health"],
      weight: 0.6,
      fact: `Average sleep ${s.health.avgSleepHours}h. Longest sleep logged ${dayName(s.health.bestSleepDay)}, shortest ${dayName(s.health.worstSleepDay)}.`,
      numbers: { avg: s.health.avgSleepHours, best: dayName(s.health.bestSleepDay), worst: dayName(s.health.worstSleepDay) },
    });
    const walk = maxBy(days, (d) => d.steps ?? 0);
    angles.push({
      id: "steps",
      sources: ["health"],
      weight: 0.5,
      fact: `${s.health.totalSteps.toLocaleString("en-US")} steps; ${(walk.steps ?? 0).toLocaleString("en-US")} on ${dayName(walk.date)} alone.`,
      numbers: { total: s.health.totalSteps, day: dayName(walk.date), dayMax: walk.steps ?? 0 },
    });
  }

  // Cross-source angles: the reason Weft exists.
  const sleepDays = days.filter((d) => d.sleepHours != null);
  if (has("health") && has("github") && sleepDays.length >= 5) {
    const r = pearson(sleepDays.map((d) => d.sleepHours!), sleepDays.map((d) => d.commits));
    const peak = maxBy(days, (d) => d.commits);
    angles.push({
      id: "sleep-x-code",
      sources: ["health", "github"],
      weight: 0.95 * Math.max(0.4, Math.abs(r)),
      fact: `Sleep and commits ${r > 0.3 ? "moved together" : r < -0.3 ? "moved in opposite directions" : "weren't strongly linked"} (r=${round1(r)}). The ${peak.commits}-commit ${dayName(peak.date)} followed ${peak.sleepHours ?? "?"}h of sleep.`,
      numbers: { r: round1(r), commits: peak.commits, day: dayName(peak.date), sleep: peak.sleepHours ?? "" },
    });
  }
  if (has("calendar") && has("github")) {
    const heavy = days.filter((d) => d.meetingsMinutes >= 240);
    const light = days.filter((d) => d.meetingsMinutes <= 90 && d.focusMinutes + d.meetingsMinutes > 0);
    if (heavy.length && light.length) {
      const avgHeavy = round1(sum(heavy.map((d) => d.commits)) / heavy.length);
      const avgLight = round1(sum(light.map((d) => d.commits)) / light.length);
      angles.push({
        id: "meetings-x-code",
        sources: ["calendar", "github"],
        weight: 0.9,
        fact: `On days with 4h+ of meetings you averaged ${avgHeavy} commits; on light-meeting days, ${avgLight}.`,
        numbers: { heavy: avgHeavy, light: avgLight },
      });
    }
  }
  if (has("spotify") && has("github")) {
    const r = pearson(days.map((d) => d.listeningMinutes), days.map((d) => d.commits));
    if (r > 0.4) {
      const peak = maxBy(days, (d) => d.commits);
      angles.push({
        id: "music-x-code",
        sources: ["spotify", "github"],
        weight: 0.8,
        fact: `Music and code rose together (r=${round1(r)}). On ${dayName(peak.date)} you played ${peak.listeningMinutes} minutes and shipped ${peak.commits} commits.`,
        numbers: { r: round1(r), minutes: peak.listeningMinutes, commits: peak.commits, day: dayName(peak.date) },
      });
    }
  }
  if (has("calendar") && has("health")) {
    const quiet = minBy(days, (d) => d.meetingsMinutes + d.focusMinutes);
    if (quiet.steps != null) {
      angles.push({
        id: "free-day-x-body",
        sources: ["calendar", "health"],
        weight: 0.6,
        fact: `Your emptiest calendar day, ${dayName(quiet.date)}, was also when you moved most: ${quiet.steps.toLocaleString("en-US")} steps.`,
        numbers: { day: dayName(quiet.date), steps: quiet.steps },
      });
    }
  }

  return angles.sort((a, b) => b.weight - a.weight);
}

export function weekIntensity(d: DaySignals) {
  return {
    time: Math.min(1, (d.meetingsMinutes + d.focusMinutes * 0.5) / 420),
    sound: Math.min(1, d.listeningMinutes / 240),
    craft: Math.min(1, d.commits / 25),
    body: d.sleepHours == null ? 0 : Math.min(1, ((d.steps ?? 0) / 16000) * 0.5 + (d.sleepHours / 9) * 0.5),
  };
}
