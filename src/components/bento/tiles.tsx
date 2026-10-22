"use client";

import { Disc3, GitCommitHorizontal, Moon, Footprints, Sparkles, Shuffle, Repeat2, Flame } from "lucide-react";
import { useState } from "react";
import { THREAD_HEX, THREAD_VAR } from "@/lib/colors";
import type { Insight, WeekSnapshot } from "@/lib/types";
import { DAY_SHORT, dayName } from "@/lib/week";
import { SourceDots } from "../story/story-card";
import { EmptyThread, Tile, TileLabel } from "./tile";

const fmt = (n: number) => n.toLocaleString("en-US");

// ---------------- Time ----------------
export function TimeTile({ s, index }: { s: WeekSnapshot; index: number }) {
  if (!s.calendar) return <EmptyThread name="Time" color={THREAD_VAR.calendar} provider="Google Calendar" />;
  const max = Math.max(...s.days.map((d) => d.meetingsMinutes + d.focusMinutes), 60);
  return (
    <Tile index={index} accent={THREAD_HEX.calendar} label="Time" className="flex h-full flex-col p-6">
      <TileLabel color={THREAD_VAR.calendar}>Time</TileLabel>
      <div className="mt-4 flex items-end gap-5">
        <div>
          <div className="font-display text-5xl tabular leading-none">{s.calendar.meetingHours}h</div>
          <div className="mt-1 text-xs text-ash">meetings</div>
        </div>
        <div>
          <div className="font-display text-5xl tabular leading-none text-time-ink">{s.calendar.focusHours}h</div>
          <div className="mt-1 text-xs text-ash">focus</div>
        </div>
      </div>
      <div className="mt-auto flex h-28 gap-1.5 pt-5">
        {s.days.map((d, i) => (
          <div key={d.date} className="flex h-full flex-1 flex-col items-center gap-1.5" title={`${dayName(d.date)}: ${d.meetingsMinutes} min meetings, ${d.focusMinutes} min focus`}>
            <div className="flex min-h-0 w-full flex-1 flex-col justify-end gap-[3px]">
              <div className="w-full rounded-[4px] border border-time/70" style={{ height: `${(d.focusMinutes / max) * 100}%` }} />
              <div className="w-full rounded-[4px] bg-time" style={{ height: `${(d.meetingsMinutes / max) * 100}%`, opacity: 0.35 + (d.meetingsMinutes / max) * 0.65 }} />
            </div>
            <span className="font-mono text-[10px] text-dust">{DAY_SHORT[i][0]}</span>
          </div>
        ))}
      </div>
    </Tile>
  );
}

// ---------------- Sound ----------------
export function SoundTile({ s, index }: { s: WeekSnapshot; index: number }) {
  if (!s.spotify) return <EmptyThread name="Sound" color={THREAD_VAR.spotify} provider="Spotify" />;
  const top = s.spotify.topTracks[0];
  return (
    <Tile index={index} accent={THREAD_HEX.spotify} label="Sound" className="flex h-full flex-col p-6">
      <TileLabel color={THREAD_VAR.spotify} right={<span className="font-mono text-xs text-ash tabular">{fmt(s.spotify.minutes)} min</span>}>
        Sound
      </TileLabel>
      {top && (
        <div className="mt-5 flex items-center gap-4">
          <div className="relative grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-full bg-sound/15">
            {top.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={top.image} alt="" className="h-full w-full animate-[spin_9s_linear_infinite] object-cover" />
            ) : (
              <Disc3 className="animate-[spin_6s_linear_infinite] text-sound-ink" size={34} strokeWidth={1.25} />
            )}
            <span className="absolute h-2.5 w-2.5 rounded-full bg-loom ring-2 ring-sound/40" />
          </div>
          <div className="min-w-0">
            <div className="truncate font-display text-2xl italic leading-tight">{top.name}</div>
            <div className="truncate text-sm text-ash">
              {top.artist} · <span className="text-sound-ink">{top.plays} plays</span>
            </div>
          </div>
        </div>
      )}
      <ul className="mt-auto space-y-1.5 pt-5">
        {s.spotify.topArtists.slice(0, 3).map((a, i) => (
          <li key={a.name} className="flex items-center gap-3 text-sm">
            <span className="w-3 font-mono text-[11px] text-dust">{i + 1}</span>
            <span className="flex-1 truncate text-bone/85">{a.name}</span>
            <span className="h-1 rounded-full bg-sound/70" style={{ width: `${(a.plays / s.spotify!.topArtists[0].plays) * 64}px` }} />
          </li>
        ))}
      </ul>
    </Tile>
  );
}

// ---------------- Craft ----------------
export function CraftTile({ s, index }: { s: WeekSnapshot; index: number }) {
  if (!s.github) return <EmptyThread name="Craft" color={THREAD_VAR.github} provider="GitHub" />;
  // 7 days × 8 three-hour buckets.
  const grid = s.days.map((d) => Array.from({ length: 8 }, (_, b) => d.commitHours.slice(b * 3, b * 3 + 3).reduce((a, x) => a + x, 0)));
  const max = Math.max(1, ...grid.flat());
  const langs = Object.entries(s.github.languages).sort((a, b) => b[1] - a[1]);
  const langTotal = langs.reduce((a, [, n]) => a + n, 0) || 1;
  return (
    <Tile index={index} accent={THREAD_HEX.github} label="Craft" className="flex h-full flex-col p-6">
      <TileLabel color={THREAD_VAR.github} right={<GitCommitHorizontal size={16} className="text-craft-ink" />}>
        Craft
      </TileLabel>
      <div className="mt-4 flex items-baseline gap-3">
        <span className="font-display text-5xl tabular leading-none">{s.github.commits}</span>
        <span className="text-sm text-ash">
          commits · {s.github.prs} PRs · {s.github.reviews} reviews
        </span>
      </div>
      <div className="mt-5 grid grid-cols-7 gap-1" role="img" aria-label="Commits by day and time of day">
        {grid.map((col, i) => (
          <div key={i} className="grid grid-rows-8 gap-1">
            {col.map((v, j) => (
              <div
                key={j}
                className="h-3.5 rounded-[3px]"
                style={{ background: v ? THREAD_HEX.github : "rgba(31,26,36,0.07)", opacity: v ? 0.25 + (v / max) * 0.75 : 1 }}
              />
            ))}
          </div>
        ))}
      </div>
      {langs.length > 0 && (
        <div className="mt-auto pt-5">
          <div className="flex h-1.5 overflow-hidden rounded-full">
            {langs.map(([l, n], i) => (
              <span key={l} style={{ width: `${(n / langTotal) * 100}%`, background: THREAD_HEX.github, opacity: 1 - i * 0.22 }} />
            ))}
          </div>
          <div className="mt-2 flex flex-wrap gap-x-3 font-mono text-[11px] text-ash">
            {langs.slice(0, 3).map(([l, n]) => (
              <span key={l}>
                {l} {Math.round((n / langTotal) * 100)}%
              </span>
            ))}
          </div>
        </div>
      )}
    </Tile>
  );
}

// ---------------- Body ----------------
export function BodyTile({ s, index }: { s: WeekSnapshot; index: number }) {
  if (!s.health) return <EmptyThread name="Body" color={THREAD_VAR.health} provider="Oura" />;
  const C = 2 * Math.PI;
  return (
    <Tile index={index} accent={THREAD_HEX.health} label="Body" className="flex h-full flex-col p-6">
      <TileLabel color={THREAD_VAR.health} right={<Moon size={15} className="text-body-ink" />}>
        Body
      </TileLabel>
      <div className="mt-3 flex flex-1 items-center gap-5">
        <svg viewBox="0 0 120 120" className="h-36 w-36 shrink-0 -rotate-90" role="img" aria-label="Sleep per night, one ring per day">
          {s.days.map((d, i) => {
            const r = 54 - i * 6.5;
            const frac = Math.min(1, (d.sleepHours ?? 0) / 9);
            return (
              <g key={d.date}>
                <circle cx="60" cy="60" r={r} fill="none" stroke="rgba(31,26,36,0.07)" strokeWidth="4" />
                <circle
                  cx="60"
                  cy="60"
                  r={r}
                  fill="none"
                  stroke={THREAD_HEX.health}
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray={`${frac * C * r} ${C * r}`}
                  opacity={0.35 + frac * 0.65}
                >
                  <title>{`${dayName(d.date)}: ${d.sleepHours ?? "–"}h`}</title>
                </circle>
              </g>
            );
          })}
        </svg>
        <div className="space-y-4">
          <div>
            <div className="font-display text-4xl tabular leading-none">{s.health.avgSleepHours}h</div>
            <div className="mt-1 text-xs text-ash">avg sleep</div>
          </div>
          <div>
            <div className="flex items-center gap-1.5 font-display text-3xl tabular leading-none">
              {fmt(s.health.totalSteps)}
            </div>
            <div className="mt-1 inline-flex items-center gap-1 text-xs text-ash">
              <Footprints size={12} /> steps
            </div>
          </div>
        </div>
      </div>
    </Tile>
  );
}

// ---------------- Rhythm ----------------
const SERIES = [
  { key: "time", source: "calendar", get: (d: WeekSnapshot["days"][number]) => d.meetingsMinutes + d.focusMinutes, unit: "min booked" },
  { key: "sound", source: "spotify", get: (d: WeekSnapshot["days"][number]) => d.listeningMinutes, unit: "min music" },
  { key: "craft", source: "github", get: (d: WeekSnapshot["days"][number]) => d.commits, unit: "commits" },
  { key: "body", source: "health", get: (d: WeekSnapshot["days"][number]) => d.sleepHours ?? 0, unit: "h sleep" },
] as const;

function smoothPath(pts: [number, number][]) {
  let d = `M ${pts[0][0]} ${pts[0][1]}`;
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1];
    const [x1, y1] = pts[i];
    const cx = (x0 + x1) / 2;
    d += ` C ${cx} ${y0}, ${cx} ${y1}, ${x1} ${y1}`;
  }
  return d;
}

export function RhythmTile({ s, index }: { s: WeekSnapshot; index: number }) {
  const [hover, setHover] = useState<number | null>(null);
  const W = 700;
  const H = 200;
  const pad = 16;
  const series = SERIES.filter((x) => s.sources.includes(x.source));
  const xAt = (i: number) => pad + (i / 6) * (W - pad * 2);

  return (
    <Tile index={index} label="Rhythm of the week" className="flex h-full flex-col p-6">
      <TileLabel
        right={
          <span className="flex gap-3">
            {series.map((x) => (
              <span key={x.key} className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.15em] text-ash">
                <span className="h-[3px] w-3 rounded-full" style={{ background: THREAD_HEX[x.source] }} />
                <span className="hidden sm:inline">{x.key}</span>
              </span>
            ))}
          </span>
        }
      >
        Rhythm
      </TileLabel>
      <div className="relative mt-4 flex-1">
        <svg viewBox={`0 0 ${W} ${H + 24}`} className="h-full min-h-[190px] w-full overflow-visible" onMouseLeave={() => setHover(null)}>
          <defs>
            {series.map((x) => (
              <linearGradient key={x.key} id={`fill-${x.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor={THREAD_HEX[x.source]} stopOpacity="0.22" />
                <stop offset="1" stopColor={THREAD_HEX[x.source]} stopOpacity="0" />
              </linearGradient>
            ))}
          </defs>
          {s.days.map((d, i) => (
            <g key={d.date}>
              <line x1={xAt(i)} x2={xAt(i)} y1={0} y2={H} stroke="rgba(31,26,36,0.07)" strokeDasharray="2 4" />
              <text x={xAt(i)} y={H + 20} textAnchor="middle" className="fill-dust font-mono text-[11px]">
                {DAY_SHORT[i]}
              </text>
              <rect x={xAt(i) - (W - pad * 2) / 12} y={0} width={(W - pad * 2) / 6} height={H} fill="transparent" onMouseEnter={() => setHover(i)} />
            </g>
          ))}
          {series.map((x) => {
            const vals = s.days.map(x.get);
            const max = Math.max(...vals, 1e-6);
            const pts = vals.map((v, i) => [xAt(i), H - 8 - (v / max) * (H - 24)] as [number, number]);
            const line = smoothPath(pts);
            return (
              <g key={x.key}>
                <path d={`${line} L ${xAt(6)} ${H} L ${xAt(0)} ${H} Z`} fill={`url(#fill-${x.key})`} />
                <path d={line} fill="none" stroke={THREAD_HEX[x.source]} strokeWidth="2.25" strokeLinecap="round" style={{ filter: `drop-shadow(0 0 6px ${THREAD_HEX[x.source]}66)` }} />
                {hover != null && <circle cx={pts[hover][0]} cy={pts[hover][1]} r="4.5" fill="var(--loom-2)" stroke={THREAD_HEX[x.source]} strokeWidth="2" />}
              </g>
            );
          })}
        </svg>
        {hover != null && (
          <div
            className="pointer-events-none absolute top-0 z-10 w-44 -translate-x-1/2 rounded-xl border border-bone/10 bg-loom/90 p-3 text-xs shadow-2xl backdrop-blur"
            style={{ left: `${(xAt(hover) / W) * 100}%` }}
          >
            <div className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-ash">{dayName(s.days[hover].date)}</div>
            {series.map((x) => (
              <div key={x.key} className="flex justify-between gap-2 py-0.5">
                <span style={{ color: THREAD_HEX[x.source] }}>{x.unit}</span>
                <span className="tabular">{fmt(Math.round(x.get(s.days[hover]) * 10) / 10)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </Tile>
  );
}

// ---------------- Insights ----------------
const INSIGHT_ICON = { pattern: Shuffle, streak: Flame, contrast: Repeat2, highlight: Sparkles };

export function InsightCard({ insight, index }: { insight: Insight; index: number }) {
  const Icon = INSIGHT_ICON[insight.type];
  const color = THREAD_HEX[insight.sources[0]];
  return (
    <Tile index={index} accent={color} label={insight.title} className="flex min-w-[280px] snap-start flex-col p-6 lg:min-w-0">
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-2 rounded-full border border-bone/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-ash">
          <Icon size={12} style={{ color }} /> {insight.type}
        </span>
        <SourceDots sources={insight.sources} />
      </div>
      <h3 className="mt-5 font-display text-[1.7rem] leading-[1.05]">{insight.title}</h3>
      <p className="mt-3 text-sm leading-relaxed text-ash">{insight.body}</p>
    </Tile>
  );
}
