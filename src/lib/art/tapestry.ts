import { THREAD_HEX, hexAlpha } from "../colors";
import { weekIntensity } from "../pipeline/angles";
import { fnv1a, mulberry32 } from "../prng";
import type { DaySignals, Source } from "../types";

// A week rendered as woven cloth.
// Warp (vertical) = the 7 days. Weft (horizontal ribbons) = threads from each source.
// A ribbon swells, brightens and ripples where that source was intense that day.
// Everything is derived from a seeded PRNG, so the same week always weaves the same cloth.

interface Thread {
  source: Source;
  color: string;
  baseY: number;
  phase: number;
  freq: number;
  amp: number;
  width: number;
  speed: number;
}

export interface TapestryModel {
  threads: Thread[];
  intensity: Record<Source, number[]>; // 7 values, 0..1
  warps: number;
  seed: number;
}

const ORDER: Source[] = ["calendar", "spotify", "github", "health"];

export function buildTapestry(days: DaySignals[], sources: Source[], seedKey: string): TapestryModel {
  const seed = fnv1a(seedKey + JSON.stringify(days.map((d) => [d.meetingsMinutes, d.listeningMinutes, d.commits, d.sleepHours])));
  const rand = mulberry32(seed);
  const perDay = days.map(weekIntensity);
  const keyOf: Record<Source, keyof ReturnType<typeof weekIntensity>> = {
    calendar: "time",
    spotify: "sound",
    github: "craft",
    health: "body",
  };
  const intensity = Object.fromEntries(
    ORDER.map((s) => [s, sources.includes(s) ? perDay.map((d) => d[keyOf[s]]) : Array(7).fill(0)]),
  ) as Record<Source, number[]>;

  const threads: Thread[] = [];
  for (const s of ORDER) {
    if (!sources.includes(s)) continue;
    const avg = intensity[s].reduce((a, b) => a + b, 0) / 7;
    const n = 9 + Math.round(avg * 16);
    for (let i = 0; i < n; i++) {
      threads.push({
        source: s,
        color: THREAD_HEX[s],
        baseY: 0.06 + rand() * 0.88,
        phase: rand() * Math.PI * 2,
        freq: 1.2 + rand() * 2.6,
        amp: 0.5 + rand() * 0.9,
        width: 0.55 + rand() * 1.1,
        speed: (rand() > 0.5 ? 1 : -1) * (0.15 + rand() * 0.25),
      });
    }
  }
  // Shuffle so sources interleave in depth like real cloth.
  for (let i = threads.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [threads[i], threads[j]] = [threads[j], threads[i]];
  }
  return { threads, intensity, warps: 7 * 6, seed };
}

// Smooth (cosine) interpolation of the 7 day values at horizontal position u ∈ [0,1].
function sample(values: number[], u: number) {
  const x = u * 7 - 0.5;
  const i = Math.max(0, Math.min(6, Math.floor(x)));
  const j = Math.min(6, i + 1);
  const f = Math.max(0, Math.min(1, x - i));
  const k = (1 - Math.cos(f * Math.PI)) / 2;
  return values[i] * (1 - k) + values[j] * k;
}

const SEGMENTS = 72;

export function drawTapestry(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  model: TapestryModel,
  t: number,
  opts: { background?: boolean; dayLines?: boolean } = {},
) {
  const { background = true, dayLines = true } = opts;
  ctx.save();
  ctx.clearRect(0, 0, w, h);
  if (background) {
    ctx.fillStyle = "#FBF7F0";
    ctx.fillRect(0, 0, w, h);
  }

  // Warp threads.
  const scale = Math.max(0.6, Math.min(w, h) / 600);
  for (let i = 0; i < model.warps; i++) {
    const x = ((i + 0.5) / model.warps) * w;
    const dayEdge = dayLines && i % 6 === 0 && i > 0;
    ctx.fillStyle = dayEdge ? "rgba(34,28,41,0.10)" : "rgba(34,28,41,0.045)";
    ctx.fillRect(x - 0.5 * scale, 0, (dayEdge ? 1.2 : 0.8) * scale, h);
  }

  // Weft ribbons, multiplied like dye so overlaps deepen.
  ctx.globalCompositeOperation = "multiply";
  const tops = new Float32Array(SEGMENTS + 1);
  const bottoms = new Float32Array(SEGMENTS + 1);
  const centers: { y: Float32Array; half: Float32Array }[] = [];

  for (const th of model.threads) {
    const vals = model.intensity[th.source];
    const ys = new Float32Array(SEGMENTS + 1);
    const half = new Float32Array(SEGMENTS + 1);
    for (let s = 0; s <= SEGMENTS; s++) {
      const u = s / SEGMENTS;
      const I = sample(vals, u);
      const wave =
        Math.sin(u * th.freq * Math.PI * 2 + th.phase + t * th.speed) * (0.012 + 0.07 * I) * th.amp +
        Math.sin(u * th.freq * 5.1 + th.phase * 1.7 - t * th.speed * 0.6) * 0.006 * th.amp;
      const y = (th.baseY + wave) * h;
      const hw = (0.35 + 3.6 * I * I) * th.width * scale;
      ys[s] = y;
      half[s] = hw;
      tops[s] = y - hw;
      bottoms[s] = y + hw;
    }
    centers.push({ y: ys, half });

    const grad = ctx.createLinearGradient(0, 0, w, 0);
    for (let d = 0; d < 7; d++) {
      grad.addColorStop((d + 0.5) / 7, hexAlpha(th.color, 0.12 + 0.7 * vals[d]));
    }
    grad.addColorStop(0, hexAlpha(th.color, 0.12 + 0.55 * vals[0]));
    grad.addColorStop(1, hexAlpha(th.color, 0.12 + 0.55 * vals[6]));
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(0, tops[0]);
    for (let s = 1; s <= SEGMENTS; s++) ctx.lineTo((s / SEGMENTS) * w, tops[s]);
    for (let s = SEGMENTS; s >= 0; s--) ctx.lineTo((s / SEGMENTS) * w, bottoms[s]);
    ctx.closePath();
    ctx.fill();
  }

  // Over/under: at alternating crossings the warp passes over the weft.
  ctx.globalCompositeOperation = "source-over";
  model.threads.forEach((th, ti) => {
    const { y, half } = centers[ti];
    for (let i = 0; i < model.warps; i++) {
      if ((i + ti) % 2) continue;
      const u = (i + 0.5) / model.warps;
      const s = Math.round(u * SEGMENTS);
      if (half[s] < 1.2 * scale) continue;
      const x = u * w;
      ctx.fillStyle = "rgba(251,247,240,0.92)";
      ctx.fillRect(x - 1.6 * scale, y[s] - half[s] - 1, 3.2 * scale, half[s] * 2 + 2);
      ctx.fillStyle = "rgba(34,28,41,0.18)";
      ctx.fillRect(x - 0.6 * scale, y[s] - half[s] - 1, 1.2 * scale, half[s] * 2 + 2);
    }
  });

  // Knots: soft halos where a source peaked.
  ctx.globalCompositeOperation = "source-over";
  for (const s of ORDER) {
    model.intensity[s].forEach((v, d) => {
      if (v < 0.82) return;
      const th = model.threads.find((x) => x.source === s);
      if (!th) return;
      const ti = model.threads.indexOf(th);
      const seg = Math.round(((d + 0.5) / 7) * SEGMENTS);
      const cx = ((d + 0.5) / 7) * w;
      const cy = centers[ti].y[seg];
      const r = (18 + 22 * v) * scale * (1 + 0.08 * Math.sin(t * 1.4 + d));
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      g.addColorStop(0, hexAlpha(THREAD_HEX[s], 0.38));
      g.addColorStop(1, hexAlpha(THREAD_HEX[s], 0));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  // Vignette.
  ctx.globalCompositeOperation = "source-over";
  if (background) {
    const v = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.25, w / 2, h / 2, Math.max(w, h) * 0.75);
    v.addColorStop(0, "rgba(247,242,234,0)");
    v.addColorStop(1, "rgba(247,242,234,0.7)");
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, w, h);
  }
  ctx.restore();
}

export function describeTapestry(model: TapestryModel) {
  const names: Record<Source, string> = { calendar: "saffron", spotify: "violet", github: "mint", health: "coral" };
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const parts = ORDER.filter((s) => model.intensity[s].some((v) => v > 0)).map((s) => {
    const vals = model.intensity[s];
    const peak = vals.indexOf(Math.max(...vals));
    return `${names[s]} threads swelling on ${days[peak]}`;
  });
  return `A generative tapestry of seven days: ${parts.join(", ") || "a quiet, undyed cloth"}.`;
}
