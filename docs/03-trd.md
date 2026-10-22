# Weft — Technical Requirements Document

## 1. Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | **Next.js (App Router) + TypeScript** | Server components for data fetching, route handlers for OAuth, one deployable |
| Styling | **Tailwind CSS v4** + CSS variables for brand tokens | Tokens in one place, light/dark from the same file |
| Motion | **motion** (Framer Motion) | Story card transitions, layout animations |
| AI | **Vercel AI SDK** through **Vercel AI Gateway** | One API key, model fallback, structured output with Zod |
| Validation | **Zod** | Shared schemas for the snapshot, story and insights |
| Session / tokens | **jose** (JWE, A256GCM) in httpOnly cookies | No DB needed for v1; tokens encrypted at rest in the browser |
| Art | **Canvas 2D** with a seeded PRNG | Deterministic, fast, exportable to PNG |
| Hosting | Vercel (Fluid Compute, Node.js runtime) | Streaming, long timeouts for the pipeline |

## 2. Architecture

```
            ┌──────────────── Browser ─────────────────┐
            │ Landing  ·  /connect  ·  /week  ·  /story │
            └───────────────┬──────────────────────────┘
                            │ fetch /api/week?demo=1
┌───────────────────────────▼────────────────────────────────────────┐
│ Next.js server (Node.js runtime)                                     │
│                                                                      │
│  /api/auth/[provider]/start ──► provider consent screen              │
│  /api/auth/[provider]/callback ──► code → token ──► encrypted cookie │
│                                                                      │
│  /api/week ─► Pipeline                                               │
│     1. collect:   connectors/{calendar,spotify,github,oura}.ts       │
│                   (parallel, each with timeout + graceful failure)   │
│     2. normalize: → WeekSnapshot (zod-validated, per-day buckets)    │
│     3. analyze:   angles.ts → peaks, streaks, contrasts, correlations│
│     4. narrate:   story.ts → LLM (structured) or template fallback   │
│     5. seed:      art seed = hash(snapshot)                          │
│     cache: in-memory LRU keyed by sha256(sources + week + version)   │
└──────────────────────────────────────────────────────────────────────┘
```

## 3. Data model

```ts
type Source = "calendar" | "spotify" | "github" | "health";

interface DaySignals {
  date: string;              // YYYY-MM-DD, user's local week
  meetingsMinutes: number;
  focusMinutes: number;
  events: number;
  listeningMinutes: number;
  tracksPlayed: number;
  commits: number;
  prs: number;
  sleepHours: number | null;
  steps: number | null;
  readiness: number | null;  // 0–100
  lateNightListening: number; // plays between 00:00–04:00
}

interface WeekSnapshot {
  weekStart: string; weekEnd: string;
  sources: Source[];                  // which threads were available
  days: DaySignals[];                 // always 7
  calendar?: { totalEvents; meetingHours; focusHours; busiestDay; categories: Record<string, number> };
  spotify?:  { minutes; topTracks: {name; artist; plays}[]; topArtists: {name; plays}[]; topGenres: string[]; moodScore /*0–1 valence*/; energyScore };
  github?:   { commits; prs; reviews; repos: {name; commits}[]; languages: Record<string, number>; longestStreakDays; peakHour };
  health?:   { avgSleepHours; bestSleepDay; avgSteps; totalSteps; avgReadiness };
}

interface Story {
  title: string;              // "The week you found your rhythm"
  cards: StoryCard[];         // 8–10
  insights: Insight[];        // 3–5
}
interface StoryCard {
  kind: "intro" | "stat" | "list" | "contrast" | "insight" | "outro";
  source: Source | "mixed";
  eyebrow: string; headline: string; body: string;
  stat?: { value: string; label: string };
  items?: { label: string; value: string }[];
}
interface Insight { type: "pattern" | "streak" | "contrast" | "highlight"; title: string; body: string; sources: Source[] }
```

## 4. Integrations

| Source | Auth | Endpoints | Scopes |
|---|---|---|---|
| Google Calendar | OAuth 2.0 + PKCE, offline access | `GET /calendar/v3/calendars/primary/events?timeMin&timeMax&singleEvents=true` | `calendar.readonly` |
| Spotify | OAuth 2.0 + PKCE | `/v1/me/player/recently-played?limit=50` (paged by `before`), `/v1/me/top/tracks?time_range=short_term`, `/v1/me/top/artists` | `user-read-recently-played user-top-read` |
| GitHub | OAuth app (web flow) | `GET /users/{login}/events?per_page=100` (paged), GraphQL `contributionsCollection(from,to)` | `read:user` |
| Oura | OAuth 2.0 | `/v2/usercollection/daily_sleep`, `daily_activity`, `daily_readiness`, `sleep` | `daily personal` |

**Rules**
- Every OAuth flow uses a random `state` (and PKCE verifier where supported) stored in a short-lived httpOnly cookie, checked on callback.
- Tokens are stored per provider in cookie `weft_<provider>` as JWE encrypted with `WEFT_SECRET` (32+ bytes).
- Refresh tokens are used transparently when the access token expires (Google, Spotify, Oura).
- Each connector has a 8s timeout; a failure drops that source from the snapshot and is reported in `snapshot.warnings`, not as a 500.
- Spotify recently-played caps at the last 50 plays per page; we page backwards with `before` until we pass `weekStart` or hit 10 pages.

## 5. LLM

- Model: `anthropic/claude-sonnet-5-5` through AI Gateway (`AI_GATEWAY_API_KEY`), overridable via `WEFT_MODEL`.
- Structured output with the Zod `StorySchema`.
- Prompt contents: the snapshot (aggregates only) + pipeline `angles` + brand voice rules + hard rules
  ("use only numbers that appear in the data", "8–10 cards", "at least two cards mixing sources").
- Post-validation: every number in `stat.value` must appear in a whitelist derived from the snapshot (±rounding); failing cards are replaced with template cards.
- Fallback: if no key, timeout (25s), or schema failure, `templateStory(snapshot, angles)` produces a deterministic story. The UI shows which writer was used.

## 6. Generative art

- `seed = fnv1a(JSON.stringify(snapshot.days) + weekStart)` feeds a `mulberry32` PRNG.
- Canvas layout: 7 vertical warp bands (days). For each day, weft threads are drawn per source:
  thread count ∝ activity, amplitude ∝ intensity (meeting load, energy, commits, readiness), color = source thread color.
- Over/under weaving: threads alternate layering at warp crossings using clip masks.
- Animation: phase drift at 0.02 rad/s, disabled under reduced motion.
- Export: `canvas.toBlob()` at 2× for share cards.

## 7. API surface

| Route | Method | Purpose |
|---|---|---|
| `/api/auth/[provider]/start` | GET | Redirect to provider consent |
| `/api/auth/[provider]/callback` | GET | Exchange code, set encrypted cookie, redirect `/connect` |
| `/api/auth/[provider]/disconnect` | POST | Clear cookie |
| `/api/connections` | GET | Which providers are connected + configured |
| `/api/week` | GET | `?demo=1` or real; returns `{ snapshot, angles, story, writer, warnings }` |
| `/api/week/reweave` | POST | Bust cache, regenerate story (rate-limited 5/hour/session) |

## 8. Non-functional requirements

| Area | Requirement |
|---|---|
| Performance | Dashboard LCP < 2.0s on demo; pipeline p95 < 12s with LLM, < 2s cached |
| Accessibility | WCAG 2.2 AA; story cards keyboard-operable; reduced motion respected; art has a text alt describing the week |
| Security | httpOnly, `Secure`, `SameSite=Lax` cookies; CSRF via `state`; no tokens in client JS; read-only scopes |
| Privacy | No raw events persisted; calendar titles categorised server-side before LLM |
| Reliability | Any single connector failure degrades the story, never breaks it |

## 9. Environment variables

```
WEFT_SECRET=                 # 32+ random bytes, base64
APP_URL=http://localhost:3000
AI_GATEWAY_API_KEY=          # optional: enables the LLM writer
WEFT_MODEL=anthropic/claude-sonnet-5-5
GOOGLE_CLIENT_ID= / GOOGLE_CLIENT_SECRET=
SPOTIFY_CLIENT_ID= / SPOTIFY_CLIENT_SECRET=
GITHUB_CLIENT_ID= / GITHUB_CLIENT_SECRET=
OURA_CLIENT_ID= / OURA_CLIENT_SECRET=
```

Providers without credentials show as "not configured" on `/connect`; demo mode needs none of these.
