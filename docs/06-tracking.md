# Weft — Tracking

Two kinds of tracking live here: **project tracking** (what's built) and **product analytics** (what users do).

## Part A — Project tracker

Legend: ✅ done · 🟡 in progress · ⬜ not started · ⏭ deferred to a later version

| Milestone | Task | Status |
|---|---|---|
| **M0 Foundation** | Next.js scaffold, deps | ✅ |
| | Brand tokens, fonts, logo assets | ✅ |
| | Zod schemas | ✅ |
| **M1 Pipeline** | Week helpers, demo week | ✅ |
| | Angles (peaks, streaks, correlations) | ✅ |
| | Pipeline orchestration + LRU cache | ✅ |
| **M2 Story writer** | Template writer | ✅ |
| | LLM writer (AI Gateway, structured output) | ✅ |
| | Number validation + fallback | ✅ |
| | `/api/week` | ✅ |
| **M3 Generative art** | PRNG + tapestry renderer + export | ✅ |
| **M4 Story player** | Player, cards, keyboard/pointer controls | ✅ |
| **M5 Dashboard** | Bento tiles, rhythm chart, sleep rings, heatmap | ✅ |
| **M6 Integrations** | Encrypted session + PKCE | ✅ |
| | Google Calendar, Spotify, GitHub, Oura connectors | ✅ |
| | `/connect` page | ✅ |
| **M7 Landing** | Landing page | ✅ |
| **M8 Ship** | Typecheck + build | ✅ |
| | Deploy to Vercel | ⬜ needs Vercel account + OAuth credentials |
| **v1.1** | Postgres history, week-over-week, Sunday email | ⏭ |
| **v1.2** | Share pages + OG images, Apple Health import | ⏭ |

## Part B — Product analytics plan

Tool: Vercel Web Analytics custom events (`track()` from `@vercel/analytics`), swappable for PostHog.
All events are anonymous; no personal data in properties.

### Events

| Event | When | Properties |
|---|---|---|
| `landing_cta_clicked` | Hero or footer CTA click | `cta: "demo" \| "connect"`, `position` |
| `connect_started` | User clicks Connect on a provider | `provider` |
| `connect_completed` | OAuth callback succeeds | `provider` |
| `connect_failed` | OAuth callback errors | `provider`, `reason` |
| `source_disconnected` | Disconnect | `provider` |
| `week_built` | `/api/week` returns | `sources_count`, `writer: "llm" \| "template"`, `duration_ms`, `cached` |
| `story_opened` | Story player mounts | `entry: "dashboard" \| "landing" \| "deeplink"` |
| `story_card_viewed` | Card becomes active | `index`, `kind`, `source` |
| `story_completed` | Last card reached | `duration_s`, `paused_count` |
| `story_exited` | Closed before the end | `at_index` |
| `tapestry_exported` | PNG saved | `from: "story" \| "dashboard"` |
| `reweave_clicked` | Regenerate story | — |
| `insight_feedback` | Thumbs on an insight | `type`, `value: "up" \| "down"` |

### Funnels
1. **Activation:** `landing_cta_clicked` → `story_opened` → `story_completed`
2. **Connection:** `connect_started` → `connect_completed` (per provider) → `week_built (sources_count ≥ 2)`
3. **Sharing:** `story_completed` → `tapestry_exported`

### Dashboards
- Weekly actives, story completion rate, median story time
- Writer mix (LLM vs template) and `week_built.duration_ms` p50/p95
- Connection success rate per provider (catches broken OAuth apps fast)
