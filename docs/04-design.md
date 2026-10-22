# Weft — Design Spec

## 1. Principles

1. **The week is the hero.** Every screen is about one week. Navigation is minimal.
2. **One color per thread.** Users learn the four colors once and can read any chart afterwards.
3. **Editorial, not dashboard-y.** Big serif numbers, generous whitespace, sentences before charts.
4. **Motion has meaning.** Things move along the loom: horizontally for time, vertically for layers.

## 2. Information architecture

```
/            Landing page (marketing)
/connect     Connect threads (onboarding + settings)
/week        Bento dashboard for the current week
/story       Full-screen story (opens over /week, deep-linkable)
```

## 3. Screens

### 3.1 Connect (`/connect`)
- Header: "Gather your threads." with the four thread colors drawn as lines that "light up" when connected.
- 4 connection cards in a 2×2 grid: icon chip, name, what we read (one line), scopes as small mono text, button (Connect / Connected ✓ / Not configured).
- Primary CTA: "Weave my week" (enabled with ≥ 1 source). Secondary: "Try a demo week".

### 3.2 Story (`/story`)
- Full viewport, black loom background, one card at a time.
- Top: segmented progress bars (one per card), filling over 6s each, in the signature gradient.
- Tap right 2/3 = next, left 1/3 = back, hold = pause. Keys: ←/→, space, Esc closes.
- Card anatomy: eyebrow (mono, thread color) → headline (Instrument Serif, 3–6rem) → stat or list → body (Geist, 1.125rem, max 36ch).
- Each card has a background treatment tied to its source: drifting threads in that color, at 20% opacity.
- Final card: the full tapestry, title of the week, "Replay" and "Save image" buttons.

### 3.3 Dashboard (`/week`) — bento grid
Desktop: 12-column grid, 4 rows. Mobile: single column, same order.

```
┌──────────────────────────┬───────────┬───────────┐
│                          │ HEADLINE  │  TIME     │
│        TAPESTRY          │  (title,  │ (meeting  │
│     (6 cols × 2 rows)    │  play ▶)  │  vs focus)│
│                          ├───────────┼───────────┤
│                          │  SOUND    │  CRAFT    │
│                          │ (top trk) │ (heatmap) │
├──────────────────────────┴───────┬───┴───────────┤
│  RHYTHM: 7-day multi-thread chart│     BODY      │
│  (8 cols)                        │ (sleep rings) │
├──────────────────────────────────┴───────────────┤
│  INSIGHTS: 3–5 cards in a row (scroll on mobile) │
└──────────────────────────────────────────────────┘
```

- Tiles: `--loom-2` background, 1px `--loom-3` border, 24px radius, 20–28px padding.
- Hover: border picks up the tile's thread color at 40%, tile lifts 2px.
- Tiles animate in with a 40ms stagger on first load.
- A disconnected source's tile shows a dashed outline and a "Connect" link.

## 4. Components

| Component | Notes |
|---|---|
| `Tapestry` | Canvas, deterministic from snapshot, `animated` prop, `onExport` |
| `StoryPlayer` | Card state machine, timers, keyboard + pointer controls |
| `StoryCard` | Renders by `kind` |
| `BentoTile` | Title, thread color, slot |
| `RhythmChart` | SVG; 7 columns; per-source lines/bars normalized 0–1 |
| `SleepRings` | 7 concentric-arc mini rings |
| `CommitHeat` | 7 × 24 hour heatmap |
| `ThreadChip` | Source icon in tinted chip |
| `Logo` | Mark + wordmark |

## 5. Motion tokens

| Token | Value |
|---|---|
| `ease-loom` | `cubic-bezier(.2,.8,.2,1)` |
| `dur-fast` | 160ms |
| `dur-base` | 320ms |
| `dur-slow` | 640ms |
| Story card enter | x: 40px → 0, opacity 0 → 1, blur 8px → 0, `dur-slow` |
| Bento stagger | 40ms |

## 6. Accessibility

- Story: `role="region" aria-roledescription="story"`, each card `aria-live="polite"`; pause on focus inside; all controls reachable by keyboard.
- Tapestry: `role="img"` with an `aria-label` generated from the snapshot ("A tapestry of 7 days: heavy saffron midweek…").
- Contrast: all text ≥ 4.5:1; thread colors only decorative or paired with labels.
