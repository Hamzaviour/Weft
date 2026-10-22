# Weft — Implementation Plan

Each milestone ends in a working, demoable state. Status is tracked in [`06-tracking.md`](./06-tracking.md).

## M0 — Foundation
1. Scaffold Next.js (App Router, TS, Tailwind v4, `src/`).
2. Install `motion`, `ai`, `zod`, `jose`, `lucide-react`.
3. Brand tokens in `globals.css` (`--loom`, `--bone`, thread colors, gradient, easing); fonts via `next/font` (Instrument Serif, Geist, Geist Mono).
4. Brand assets: `public/brand/weft-mark.svg`, `weft-logo.svg`, favicon.
5. `src/lib/types.ts`: Zod schemas for `DaySignals`, `WeekSnapshot`, `Story`, `Insight`.

## M1 — Data pipeline (demo first)
1. `lib/week.ts`: week range helpers (Monday-start, local time zone).
2. `lib/demo.ts`: realistic, seeded demo week covering all four sources.
3. `lib/pipeline/angles.ts`: peaks, quiet days, streaks, correlations (sleep ↔ commits, meetings ↔ listening, late-night plays).
4. `lib/pipeline/index.ts`: `buildWeek({ demo | tokens })` → collect → normalize → analyze → narrate, with LRU cache.

## M2 — Story writer
1. `lib/story/template.ts`: deterministic writer that turns angles into 8–10 cards + insights.
2. `lib/story/llm.ts`: AI SDK structured generation through AI Gateway; prompt with voice rules.
3. `lib/story/validate.ts`: number whitelist check; swap invalid cards with template cards.
4. `/api/week` route returning `{ snapshot, angles, story, writer }`.

## M3 — Generative art
1. `lib/art/prng.ts` (fnv1a + mulberry32).
2. `components/tapestry.tsx`: warp bands, woven threads, drift animation, reduced-motion, PNG export.

## M4 — Story player
1. `components/story/story-player.tsx`: state machine, 6s timers, pause on hold, keyboard.
2. `components/story/story-card.tsx`: card kinds + per-source thread backgrounds.
3. `/story` route (full screen, Esc → `/week`).

## M5 — Bento dashboard
1. `components/bento/*`: Headline, Time, Sound, Craft (heatmap), Body (sleep rings), Rhythm chart, Insights.
2. `/week` route with staggered entrance and disconnected-tile states.

## M6 — Real integrations
1. `lib/session.ts`: JWE cookie per provider (jose), OAuth `state` + PKCE helpers.
2. `lib/providers.ts`: config for Google, Spotify, GitHub, Oura (auth URL, token URL, scopes, refresh).
3. `/api/auth/[provider]/{start,callback,disconnect}` routes.
4. `lib/connectors/{calendar,spotify,github,oura}.ts`: fetch the week, map to `DaySignals` + source summary.
5. `/connect` page with live connection state.

## M7 — Landing page
1. `/` hero with live tapestry, the four threads, how-it-works, story preview, bento preview, privacy, CTA.
2. SEO metadata + OG image.

## M8 — Polish and ship
1. Lint + typecheck + production build.
2. Accessibility pass (keyboard, contrast, reduced motion).
3. README with setup for each OAuth app.
4. Deploy to Vercel (`vercel deploy`), add env vars.

## Testing strategy
- Unit: `angles.ts` and `validate.ts` (pure functions) with Node test runner.
- Integration: `/api/week?demo=1` returns a schema-valid payload.
- Manual: story player on mobile Safari + Chrome; connectors with real accounts.
