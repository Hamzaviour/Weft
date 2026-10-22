import type { GithubSummary } from "../types";
import { localDate, localHour } from "../week";
import { ConnectorError, getJson, type DayPatch, type WeekRange } from "./shared";

interface ContributionsResponse {
  data?: {
    viewer: {
      login: string;
      contributionsCollection: {
        totalCommitContributions: number;
        totalPullRequestContributions: number;
        totalPullRequestReviewContributions: number;
        contributionCalendar: { weeks: { contributionDays: { date: string; contributionCount: number }[] }[] };
        commitContributionsByRepository: {
          repository: { name: string; primaryLanguage: { name: string } | null };
          contributions: { totalCount: number };
        }[];
        pullRequestContributions: { nodes: { occurredAt: string }[] };
      };
    };
  };
  errors?: { message: string }[];
}

interface GhEvent { type: string; created_at: string; payload: { size?: number; commits?: unknown[] } }

const QUERY = `query($from: DateTime!, $to: DateTime!) {
  viewer {
    login
    contributionsCollection(from: $from, to: $to) {
      totalCommitContributions
      totalPullRequestContributions
      totalPullRequestReviewContributions
      contributionCalendar { weeks { contributionDays { date contributionCount } } }
      commitContributionsByRepository(maxRepositories: 10) {
        repository { name primaryLanguage { name } }
        contributions { totalCount }
      }
      pullRequestContributions(first: 50) { nodes { occurredAt } }
    }
  }
}`;

export async function fetchGithub(token: string, r: WeekRange) {
  const res = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      query: QUERY,
      variables: { from: `${r.weekStart}T00:00:00Z`, to: `${r.weekEnd}T23:59:59Z` },
    }),
    signal: AbortSignal.timeout(8_000),
    cache: "no-store",
  });
  if (!res.ok) throw new ConnectorError("github", `${res.status} ${res.statusText}`, res.status);
  const json = (await res.json()) as ContributionsResponse;
  if (!json.data) throw new ConnectorError("github", json.errors?.[0]?.message ?? "GraphQL error");
  const { login, contributionsCollection: c } = json.data.viewer;

  const patches: Record<string, DayPatch> = {};
  for (const d of r.days) patches[d] = { commits: 0, prs: 0, commitHours: Array(24).fill(0) };
  for (const w of c.contributionCalendar.weeks) {
    for (const d of w.contributionDays) if (patches[d.date]) patches[d.date].commits = d.contributionCount;
  }
  for (const pr of c.pullRequestContributions.nodes) {
    const day = localDate(pr.occurredAt, r.tz);
    if (patches[day]) patches[day].prs!++;
  }

  // Hour-of-day comes from push events (the contribution calendar has no times).
  const events = await getJson<GhEvent[]>(
    `https://api.github.com/users/${login}/events?per_page=100`,
    token,
    "github",
  ).catch(() => []);
  const hours = Array<number>(24).fill(0);
  for (const e of events) {
    if (e.type !== "PushEvent") continue;
    const day = localDate(e.created_at, r.tz);
    if (!patches[day]) continue;
    const h = localHour(e.created_at, r.tz);
    const n = e.payload.size ?? e.payload.commits?.length ?? 1;
    patches[day].commitHours![h] += n;
    hours[h] += n;
  }

  let streak = 0;
  let best = 0;
  for (const d of r.days) {
    streak = (patches[d].commits ?? 0) > 0 ? streak + 1 : 0;
    best = Math.max(best, streak);
  }

  const languages: Record<string, number> = {};
  for (const repo of c.commitContributionsByRepository) {
    const lang = repo.repository.primaryLanguage?.name;
    if (lang) languages[lang] = (languages[lang] ?? 0) + repo.contributions.totalCount;
  }

  const summary: GithubSummary = {
    login,
    commits: c.totalCommitContributions,
    prs: c.totalPullRequestContributions,
    reviews: c.totalPullRequestReviewContributions,
    repos: c.commitContributionsByRepository
      .map((x) => ({ name: x.repository.name, commits: x.contributions.totalCount }))
      .slice(0, 5),
    languages,
    longestStreakDays: best,
    peakHour: hours.some((h) => h > 0) ? hours.indexOf(Math.max(...hours)) : 14,
  };
  return { patches, summary };
}
