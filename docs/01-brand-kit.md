# Weft — Brand Kit

> **Your week, woven.**

## 1. The name

In weaving, the **warp** is the set of threads held taut on the loom, and the **weft** is the thread
passed back and forth through them to make cloth. Your days are the warp. Everything you do inside
them (the meetings you sat through, the songs you played on repeat, the commits you shipped, the
hours you slept) is the weft.

Weft gathers those threads from your calendar, Spotify, GitHub and health data, and weaves them
into one piece of cloth each week: a story, a set of insights and a one-of-a-kind generative
tapestry that could only have come from that week.

- Short (4 letters), easy to say, unusual in software.
- A real word with a precise meaning that maps directly onto the product.
- Works as a verb in copy: "Weft your week", "woven on Sunday".

## 2. Positioning

| | |
|---|---|
| **Category** | Personal life dashboard / AI weekly recap |
| **For** | Curious, data-literate people (builders, designers, students) who already live inside Calendar, Spotify and GitHub |
| **Who want** | To see their week as a whole instead of as four separate apps |
| **Weft is** | An AI life dashboard that turns your week into a story and a piece of art |
| **Unlike** | Spotify Wrapped (once a year, one source) or quantified-self dashboards (charts with no narrative) |
| **We** | Write the story every Sunday, across every source, with insights that connect them |

**One-liner:** Weft connects your calendar, music, code and health, then tells you the story of your week.

**Elevator pitch:** Every Sunday, Weft reads the threads of your week: meetings, focus time, songs,
commits, sleep and steps. It writes a Wrapped-style story about them, points out the connections you
missed ("your best coding day came after your longest sleep") and weaves the whole week into a
generative tapestry you can keep or share.

## 3. Voice

Weft sounds like a perceptive friend who read your week's diary and is glad to see you.

| We are | We are not |
|---|---|
| Warm, specific, a little poetic | Saccharine or self-help |
| Observant: we point at real numbers | Vague ("you had a great week!") |
| Playful with craft metaphors (threads, loom, weave) | Twee: one metaphor per screen at most |
| Honest about bad weeks | Judgmental or prescriptive |

**Examples**

- Good: "Tuesday was a knot: six meetings back-to-back and zero commits. Thursday untangled it."
- Bad: "Great job this week! Keep crushing your goals! 🚀"
- Good: "You played *Pink + White* eleven times. Ten of those were after midnight."
- Bad: "Your top song was Pink + White."

## 4. Logo

The mark is a small loom: three vertical warp threads crossed by four horizontal weft threads, one
for each data source. The weft threads pass over and under the warp, so the mark reads as woven
rather than as a grid.

- `public/brand/weft-mark.svg`: the mark alone (app icon, favicon, avatar)
- `public/brand/weft-logo.svg`: mark plus wordmark (lowercase `weft`, set in Instrument Serif italic)

**Clear space:** the height of the mark's weft thread spacing (1/4 of the mark) on every side.
**Minimum size:** 16px for the mark, 72px wide for the full logo.
**Don't:** recolor the threads out of order, outline the mark, add shadows, or set the wordmark in caps.

## 5. Color

The base is a near-black "loom" with warm bone text. Each data source owns one thread color, used
consistently everywhere: charts, card accents, connection chips and the generative art.

### Neutrals

| Token | Hex | Use |
|---|---|---|
| `--loom` | `#0B0A10` | App background |
| `--loom-2` | `#14121C` | Raised surfaces, cards |
| `--loom-3` | `#1E1B29` | Borders, hover |
| `--bone` | `#F3EEE6` | Primary text |
| `--ash` | `#9A94A6` | Secondary text |
| `--dust` | `#5E5869` | Tertiary text, disabled |

### Threads (one per source)

| Token | Hex | Source | Meaning |
|---|---|---|---|
| `--thread-time` | `#FFB547` Saffron | Calendar | Time, structure |
| `--thread-sound` | `#A78BFF` Ultraviolet | Spotify | Mood, sound |
| `--thread-craft` | `#4BE3AC` Mint | GitHub | Making, building |
| `--thread-body` | `#FF6B7A` Coral | Health | Body, energy |

**Signature gradient** (used sparingly: hero, story progress bars, share card):
`linear-gradient(100deg, #FFB547 0%, #FF6B7A 35%, #A78BFF 70%, #4BE3AC 100%)`

Light mode inverts neutrals (`--loom #F7F3EC`, `--bone #15131B`) and darkens threads by ~12% for
contrast. All thread colors pass WCAG AA (≥ 4.5:1) as text on `--loom`.

## 6. Typography

| Role | Typeface | Notes |
|---|---|---|
| Display | **Instrument Serif** (italic for emphasis) | Story headlines, big numbers, the wordmark |
| UI / body | **Geist** | Everything else |
| Data | **Geist Mono** | Numbers in tables, timestamps, metric labels |

Scale (rem): 0.75 · 0.875 · 1 · 1.25 · 1.75 · 2.5 · 4 · 6.5. Story cards use the 4–6.5 range with
`letter-spacing: -0.03em`. Big numbers are always tabular (`font-variant-numeric: tabular-nums`).

## 7. Imagery and motion

- **Generative tapestries** are the brand's only illustration style. No stock photos, no 3D blobs.
  Each tapestry is seeded by a week's data, so the same week always renders the same cloth.
- **Motion** feels like thread: things slide in along one axis, ease out (`cubic-bezier(.2,.8,.2,1)`),
  and never bounce. Story cards advance like pages being turned through a loom.
- Respect `prefers-reduced-motion`: replace movement with fades and pause the art.

## 8. Iconography

Lucide icons at 1.5px stroke, sized 16/20/24. Source icons sit inside a 24px rounded chip tinted with
that source's thread color at 14% opacity.

## 9. Copy library

- Tagline: **Your week, woven.**
- Secondary: *Four threads. One story. Every Sunday.*
- CTA: "Weave my week" · "Connect a thread" · "Replay the story"
- Empty state: "No threads yet. Connect one and we'll start weaving."
- Share card footer: "woven by weft"
