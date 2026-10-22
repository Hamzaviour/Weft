# Weft — Product Requirements Document

| | |
|---|---|
| **Product** | Weft: an AI personal life dashboard |
| **Status** | v1.0 (MVP), built |
| **Last updated** | 2026-10-22 |

## 1. Problem

People's weeks are scattered across apps. The calendar knows where time went, Spotify knows the
mood, GitHub knows what got built, the watch knows how they slept. None of these apps talk to each
other, and none of them tell a story. Spotify Wrapped proved people love a narrative recap of
their own data, but it arrives once a year and covers one source.

## 2. Vision

Every Sunday, Weft turns your week into something worth looking at: a full-screen story, a set of
cross-source insights and a generative tapestry that is unique to that week.

## 3. Goals and non-goals

**Goals (v1)**

1. Connect four sources: Google Calendar, Spotify, GitHub, health data (Oura, or a manual/CSV import).
2. Build a normalized weekly snapshot through one data pipeline.
3. Generate a Wrapped-style story (8–10 cards) and 3–5 cross-source insights with an LLM.
4. Render a deterministic generative tapestry from the snapshot.
5. Show a bento-grid dashboard of the week.
6. Work fully in a demo mode with realistic sample data, so anyone can try it without connecting accounts.

**Non-goals (v1)**

- Native mobile apps
- Social feed or friends
- Goal setting, habit coaching or medical advice
- Real-time streaming of data (weekly batch is the product)

## 4. Users

| Persona | Description | Job to be done |
|---|---|---|
| **Maya, the builder** | Software engineer, codes on side projects, music on all day | "Show me when I actually do my best work." |
| **Theo, the student** | Juggles classes, gym and a part-time job | "Help me see if my week was balanced." |
| **Ana, the recruiter-facing dev** | Wants a portfolio piece that's *her* | "Give me something beautiful to share." |

## 5. User stories and requirements

### 5.1 Onboarding and connections

| ID | Story | Priority | Acceptance criteria |
|---|---|---|---|
| C-1 | As a user I can connect Google Calendar via OAuth | P0 | Read-only scope; token stored encrypted; chip shows "connected" |
| C-2 | As a user I can connect Spotify via OAuth | P0 | `user-read-recently-played`, `user-top-read` scopes |
| C-3 | As a user I can connect GitHub via OAuth | P0 | `read:user` scope; public events + contributions |
| C-4 | As a user I can connect Oura for health data | P1 | Sleep, activity, readiness for the week |
| C-5 | As a user I can try Weft with demo data | P0 | One click; no account needed; clearly labelled "Demo week" |
| C-6 | As a user I can disconnect any source | P0 | Token deleted immediately |

### 5.2 The weekly story

| ID | Story | Priority | Acceptance criteria |
|---|---|---|---|
| S-1 | I see my week as full-screen animated story cards | P0 | 8–10 cards; tap/arrow/space to advance; hold to pause; progress bars |
| S-2 | Each card is written about *my* data | P0 | Every card cites at least one real number from the snapshot |
| S-3 | The story connects sources | P0 | At least 2 cards reference two sources at once |
| S-4 | The story degrades gracefully | P0 | With 1 source connected the story still has ≥ 5 cards; with no LLM key a template writer is used |
| S-5 | I can share the closing card as an image | P1 | Download PNG of the tapestry + headline |

### 5.3 Dashboard

| ID | Story | Priority | Acceptance criteria |
|---|---|---|---|
| D-1 | I see a bento grid of the week | P0 | Tiles: tapestry, headline, time, sound, craft, body, insights, day-by-day |
| D-2 | I can see each day's rhythm | P0 | 7-day chart combining meetings, commits, sleep, listening |
| D-3 | I can read AI insights | P0 | 3–5 insights, each with a type (pattern, streak, contrast, highlight) |
| D-4 | I can regenerate the story | P1 | "Reweave" button, rate-limited |

### 5.4 Generative art

| ID | Story | Priority | Acceptance criteria |
|---|---|---|---|
| A-1 | My week becomes a tapestry | P0 | Deterministic for the same snapshot; thread density = activity; colors = sources |
| A-2 | The art animates subtly | P1 | Threads drift; stops under `prefers-reduced-motion` |

## 6. Success metrics

| Metric | Target (first 90 days) |
|---|---|
| Activation: user finishes the story on first visit | ≥ 60% |
| Connection rate: users with ≥ 2 real sources | ≥ 35% |
| Weekly return: users who open the Sunday story 3 weeks in a row | ≥ 25% |
| Share rate: stories exported as an image | ≥ 10% |
| Story quality: thumbs-up on insights | ≥ 70% |

See [`06-tracking.md`](./06-tracking.md) for event definitions.

## 7. Privacy principles

1. Read-only scopes only. Weft never writes to your accounts.
2. Raw data is processed in memory and not stored; only the weekly snapshot (aggregates) is cached.
3. Only aggregates are sent to the LLM: no event titles from private calendars, no email addresses.
   Calendar event titles are reduced to categories (meeting, focus, social, personal) before the prompt.
4. Disconnect deletes the token; "Delete my data" deletes everything.

## 8. Release plan

| Phase | Scope |
|---|---|
| **v1.0 MVP** (this build) | Demo mode, 4 connectors, pipeline, AI story + insights, tapestry, bento dashboard, landing page |
| **v1.1** | Persistent history (Postgres), week-over-week comparisons, Sunday email |
| **v1.2** | Share pages with OG images, Apple Health import, more sources (Strava, Letterboxd) |

## 9. Risks

| Risk | Mitigation |
|---|---|
| OAuth app review (Spotify extended quota, Google verification) | Demo mode; dev-mode allowlists for early users |
| LLM invents numbers | Structured output + only snapshot numbers in the prompt + post-validation |
| Sensitive health data | Aggregate only; never sent raw; clear disconnect |
| Generic, boring stories | Prompt gives the model "angles" computed by the pipeline (peaks, contrasts, correlations) |
