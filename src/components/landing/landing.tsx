"use client";

import { motion, useScroll, useTransform } from "motion/react";
import { ArrowRight, CalendarDays, EyeOff, GitBranch, HeartPulse, KeyRound, Music2, Play, ShieldCheck, Trash2 } from "lucide-react";
import Link from "next/link";
import { useMemo, useRef } from "react";
import { track } from "@/lib/analytics";
import { THREAD_HEX, THREAD_INK } from "@/lib/colors";
import { demoSnapshot } from "@/lib/demo";
import { findAngles } from "@/lib/pipeline/angles";
import { templateStory } from "@/lib/story/template";
import type { Source } from "@/lib/types";
import { BodyTile, CraftTile, InsightCard, RhythmTile, SoundTile, TimeTile } from "../bento/tiles";
import { Logo } from "../logo";
import { Purl, PurlSays, type PurlMood } from "../purl";
import { Tapestry } from "../tapestry";
import { ThreadBackdrop } from "../thread-backdrop";
import { StoryPhone } from "./story-phone";

const ease = [0.2, 0.8, 0.2, 1] as const;

const reveal = {
  initial: { opacity: 0, y: 32 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.8, ease },
};

const THREADS: { source: Source; name: string; provider: string; icon: typeof Music2; line: string; reads: string }[] = [
  { source: "calendar", name: "Time", provider: "Google Calendar", icon: CalendarDays, line: "Where the hours went.", reads: "Meetings, focus blocks, free days" },
  { source: "spotify", name: "Sound", provider: "Spotify", icon: Music2, line: "What the week sounded like.", reads: "Plays, repeats, 2am sessions" },
  { source: "github", name: "Craft", provider: "GitHub", icon: GitBranch, line: "What you made.", reads: "Commits, PRs, the hour you peak" },
  { source: "health", name: "Body", provider: "Oura", icon: HeartPulse, line: "How you carried it.", reads: "Sleep, steps, readiness" },
];

export function Landing() {
  const snapshot = useMemo(() => demoSnapshot("UTC", new Date("2026-10-19T12:00:00Z")), []);
  const story = useMemo(() => templateStory(snapshot, findAngles(snapshot)), [snapshot]);
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 1.15]);
  const heroFade = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const cta = (where: string, kind: "demo" | "connect") => () => track("landing_cta_clicked", { cta: kind, position: where });

  return (
    <div className="relative overflow-x-clip">
      {/* ---------------- Nav ---------------- */}
      <header className="fixed inset-x-0 top-0 z-40">
        <div className="mx-auto mt-3 flex h-14 max-w-[1200px] items-center justify-between rounded-full border border-bone/[0.08] bg-loom/55 px-3 pl-5 backdrop-blur-xl sm:mx-4 lg:mx-auto">
          <Logo size={24} />
          <nav className="hidden items-center gap-7 text-sm text-ash md:flex">
            <a href="#threads" className="hover:text-bone">Threads</a>
            <a href="#purl" className="hover:text-bone">Meet Purl</a>
            <a href="#story" className="hover:text-bone">The story</a>
            <a href="#dashboard" className="hover:text-bone">Dashboard</a>
            <a href="#privacy" className="hover:text-bone">Privacy</a>
          </nav>
          <Link href="/week?demo=1&story=1" onClick={cta("nav", "demo")} className="focus-ring inline-flex h-10 items-center gap-2 rounded-full bg-bone px-4 text-sm font-medium text-loom hover:bg-bone/85">
            Try a demo <ArrowRight size={14} />
          </Link>
        </div>
      </header>

      {/* ---------------- Hero ---------------- */}
      <section ref={heroRef} className="relative h-[100svh] min-h-[640px]">
        <motion.div style={{ scale: heroScale, opacity: heroFade }} className="absolute inset-0">
          <Tapestry days={snapshot.days} sources={snapshot.sources} seed={snapshot.weekStart} dayLines={false} />
        </motion.div>
        <div className="absolute inset-0 bg-[radial-gradient(70%_60%_at_50%_45%,rgba(250,246,239,.88),rgba(250,246,239,.45)_70%,transparent)]" />
        <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-loom to-transparent" />

        <div className="relative z-10 mx-auto flex h-full max-w-[1200px] flex-col items-center justify-center px-5 text-center">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease }} className="mb-6">
            <PurlSays mood="wave" size={84}>
              Hi, I&apos;m <span className="font-display text-lg italic">Purl</span>. I turn your week into a story.
            </PurlSays>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 40, filter: "blur(12px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 1.1, delay: 0.1, ease }}
            className="font-display text-[clamp(3.4rem,12vw,9rem)] leading-[0.85] tracking-[-0.03em]"
          >
            Your week,
            <br />
            <span className="italic text-weave">woven.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.35, ease }}
            className="mt-8 max-w-[34rem] text-lg leading-relaxed text-bone/75 sm:text-xl"
          >
            Weft reads your calendar, music, code and sleep, then every Sunday tells you the story of your week, with insights
            that connect them and a tapestry no other week could make.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.5, ease }}
            className="mt-10 flex flex-col gap-3 sm:flex-row"
          >
            <Link
              href="/week?demo=1&story=1"
              onClick={cta("hero", "demo")}
              className="focus-ring group inline-flex h-14 items-center justify-center gap-3 rounded-full bg-bone pl-2 pr-6 text-base font-medium text-loom shadow-[0_0_60px_-10px_rgba(255,181,71,.5)] hover:bg-bone/85"
            >
              <span className="grid h-10 w-10 place-items-center rounded-full bg-weave transition group-hover:scale-105">
                <Play size={16} fill="currentColor" />
              </span>
              Play a demo week
            </Link>
            <Link
              href="/connect"
              onClick={cta("hero", "connect")}
              className="focus-ring inline-flex h-14 items-center justify-center rounded-full border border-bone/15 bg-loom/40 px-6 text-base backdrop-blur hover:bg-bone/10"
            >
              Connect your threads
            </Link>
          </motion.div>
        </div>

        {/* Annotations pinned to real moments in the demo week */}
        <div className="pointer-events-none absolute inset-0 z-10 hidden lg:block" aria-hidden>
          {[
            { x: "18%", y: "24%", c: THREAD_HEX.calendar, t: "TUE · 6.3h of meetings" },
            { x: "68%", y: "20%", c: THREAD_HEX.github, t: "THU · 23 commits" },
            { x: "12%", y: "74%", c: THREAD_HEX.spotify, t: "WED · 11 songs after midnight" },
            { x: "74%", y: "76%", c: THREAD_HEX.health, t: "SAT · 15,680 steps" },
          ].map((a, i) => (
            <motion.div
              key={a.t}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1 + i * 0.15, duration: 0.6, ease }}
              className="absolute flex items-center gap-2 rounded-full border border-bone/10 bg-loom/70 px-3 py-1.5 font-mono text-[10px] tracking-[0.16em] text-bone/80 backdrop-blur"
              style={{ left: a.x, top: a.y }}
            >
              <span className="h-2 w-2 rounded-full" style={{ background: a.c, boxShadow: `0 0 12px ${a.c}` }} />
              {a.t}
            </motion.div>
          ))}
        </div>
      </section>

      {/* ---------------- Logos / sources strip ---------------- */}
      <section className="relative border-y border-bone/[0.06] py-6">
        <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-center gap-x-12 gap-y-3 px-5 text-sm text-ash">
          <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-dust">Reads from</span>
          {THREADS.map((t) => (
            <span key={t.provider} className="inline-flex items-center gap-2">
              <t.icon size={16} style={{ color: THREAD_INK[t.source] }} /> {t.provider}
            </span>
          ))}
        </div>
      </section>

      {/* ---------------- Threads ---------------- */}
      <section id="threads" className="mx-auto max-w-[1200px] scroll-mt-24 px-5 py-28 sm:py-36">
        <motion.div {...reveal} className="max-w-3xl">
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-ash">01 · Four threads</p>
          <h2 className="mt-4 font-display text-5xl leading-[0.95] sm:text-7xl">
            Your life lives in four apps. <span className="italic text-ash">None of them talk.</span>
          </h2>
          <p className="mt-6 max-w-xl text-lg text-ash">
            In weaving, the warp holds the shape and the weft carries the color. Your days are the warp. Weft gathers the threads
            running through them.
          </p>
        </motion.div>

        <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {THREADS.map((t, i) => (
            <motion.article
              key={t.source}
              {...reveal}
              transition={{ ...reveal.transition, delay: i * 0.08 }}
              className="tile group relative flex min-h-[320px] flex-col overflow-hidden p-6"
              style={{ ["--tile-accent" as string]: THREAD_HEX[t.source] }}
            >
              <svg viewBox="0 0 200 60" className="absolute inset-x-0 top-24 h-16 w-full opacity-60 transition-opacity duration-500 group-hover:opacity-100" preserveAspectRatio="none" aria-hidden>
                {[0, 1, 2].map((k) => (
                  <path
                    key={k}
                    d={`M0 ${30 + k * 6} C 50 ${5 + k * 12}, 120 ${58 - k * 10}, 200 ${26 + k * 5}`}
                    fill="none"
                    stroke={THREAD_HEX[t.source]}
                    strokeWidth={1.6 - k * 0.4}
                    opacity={1 - k * 0.3}
                  />
                ))}
              </svg>
              <div className="flex items-center justify-between">
                <span className="grid h-11 w-11 place-items-center rounded-2xl" style={{ background: `${THREAD_HEX[t.source]}22`, color: THREAD_INK[t.source] }}>
                  <t.icon size={20} strokeWidth={1.5} />
                </span>
                <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-dust">{t.provider}</span>
              </div>
              <div className="mt-auto">
                <h3 className="font-display text-5xl italic" style={{ color: THREAD_INK[t.source] }}>
                  {t.name}
                </h3>
                <p className="mt-2 text-lg">{t.line}</p>
                <p className="mt-1 text-sm text-ash">{t.reads}</p>
              </div>
            </motion.article>
          ))}
        </div>
      </section>

      {/* ---------------- How it works ---------------- */}
      <section className="relative border-y border-bone/[0.06] bg-loom-2/40 py-28 sm:py-36">
        <div className="mx-auto max-w-[1200px] px-5">
          <motion.div {...reveal} className="max-w-3xl">
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-ash">02 · On the loom</p>
            <h2 className="mt-4 font-display text-5xl leading-[0.95] sm:text-7xl">
              From raw data to a <span className="italic">story</span> in three passes.
            </h2>
          </motion.div>
          <div className="relative mt-20 grid gap-12 md:grid-cols-3 md:gap-8">
            <div className="absolute left-0 right-0 top-6 hidden h-px bg-weave opacity-40 md:block" />
            {[
              { n: "Gather", d: "Read-only OAuth pulls last week from each source. Raw events are bucketed into seven days and never stored." },
              { n: "Find the pattern", d: "A pipeline looks for peaks, streaks and correlations across sources: sleep against commits, meetings against momentum." },
              { n: "Weave", d: "An AI writes 8–10 story cards from those angles, using only your real numbers. Your week becomes a generative tapestry." },
            ].map((s, i) => (
              <motion.div key={s.n} {...reveal} transition={{ ...reveal.transition, delay: i * 0.12 }} className="relative">
                <span className="relative z-10 grid h-12 w-12 place-items-center rounded-full border border-bone/15 bg-loom font-mono text-sm">
                  0{i + 1}
                </span>
                <h3 className="mt-6 font-display text-4xl">{s.n}</h3>
                <p className="mt-3 max-w-sm text-ash">{s.d}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- Meet Purl ---------------- */}
      <section id="purl" className="mx-auto max-w-[1200px] scroll-mt-24 px-5 py-28 sm:py-36">
        <div className="grid items-center gap-14 lg:grid-cols-[1fr_1.1fr]">
          <motion.div {...reveal} className="relative mx-auto">
            <div className="absolute inset-0 -z-10 scale-125 rounded-full bg-[radial-gradient(circle,rgba(139,108,246,.18),rgba(245,165,36,.10)_45%,transparent_70%)] blur-2xl" />
            <Purl mood="happy" size={280} />
          </motion.div>
          <motion.div {...reveal} transition={{ ...reveal.transition, delay: 0.1 }}>
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-ash">03 · Meet Purl</p>
            <h2 className="mt-4 font-display text-5xl leading-[0.95] sm:text-7xl">
              A little ball of yarn <span className="italic text-weave">who reads your week.</span>
            </h2>
            <p className="mt-6 max-w-lg text-lg text-ash">
              Purl is wound from all four threads. It narrates your story, reacts to your week and nudges you toward the
              patterns worth noticing. Never judgy, always a little bit delighted.
            </p>
            <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {(
                [
                  { mood: "thinking", label: "Busy calendar", c: THREAD_INK.calendar },
                  { mood: "excited", label: "Song on repeat", c: THREAD_INK.spotify },
                  { mood: "proud", label: "Big build day", c: THREAD_INK.github },
                  { mood: "sleepy", label: "Short night", c: THREAD_INK.health },
                ] as { mood: PurlMood; label: string; c: string }[]
              ).map((m) => (
                <div key={m.mood} className="tile flex flex-col items-center px-3 pb-4 pt-5 text-center" style={{ ["--tile-accent" as string]: m.c }}>
                  <Purl mood={m.mood} size={76} />
                  <span className="mt-2 text-sm font-medium" style={{ color: m.c }}>
                    {m.label}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ---------------- Story ---------------- */}
      <section id="story" className="mx-auto grid max-w-[1200px] scroll-mt-24 items-center gap-16 px-5 py-28 sm:py-36 lg:grid-cols-2">
        <motion.div {...reveal}>
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-ash">04 · The story</p>
          <h2 className="mt-4 font-display text-5xl leading-[0.95] sm:text-7xl">
            Wrapped, <span className="italic text-weave">every week.</span>
          </h2>
          <p className="mt-6 max-w-lg text-lg text-ash">
            Full-screen cards you tap through like a story. Each one cites a real number. The best ones connect two threads you
            never thought to compare.
          </p>
          <ul className="mt-10 space-y-5">
            {story.insights.slice(0, 3).map((ins) => (
              <li key={ins.title} className="flex gap-4">
                <span className="mt-2 flex shrink-0 gap-1">
                  {ins.sources.map((s) => (
                    <span key={s} className="h-2 w-2 rounded-full" style={{ background: THREAD_HEX[s] }} />
                  ))}
                </span>
                <div>
                  <p className="font-display text-2xl italic">{ins.title}</p>
                  <p className="mt-1 text-sm text-ash">{ins.body}</p>
                </div>
              </li>
            ))}
          </ul>
        </motion.div>
        <motion.div {...reveal} transition={{ ...reveal.transition, delay: 0.15 }} className="relative">
          <div className="absolute inset-0 -z-10 blur-3xl">
            <ThreadBackdrop colors={Object.values(THREAD_HEX)} seed="phone" density={10} />
          </div>
          <StoryPhone story={story} />
        </motion.div>
      </section>

      {/* ---------------- Dashboard ---------------- */}
      <section id="dashboard" className="scroll-mt-24 border-t border-bone/[0.06] py-28 sm:py-36">
        <div className="mx-auto max-w-[1200px] px-5">
          <motion.div {...reveal} className="flex flex-wrap items-end justify-between gap-6">
            <div className="max-w-2xl">
              <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-ash">05 · The dashboard</p>
              <h2 className="mt-4 font-display text-5xl leading-[0.95] sm:text-7xl">
                The whole week, <span className="italic">at a glance.</span>
              </h2>
            </div>
            <Link href="/week?demo=1" onClick={cta("dashboard", "demo")} className="focus-ring inline-flex items-center gap-2 text-sm text-ash hover:text-bone">
              Open the live demo <ArrowRight size={14} />
            </Link>
          </motion.div>

          <motion.div {...reveal} className="relative mt-14">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-6 lg:grid-cols-12">
              <div className="tile relative min-h-[320px] overflow-hidden md:col-span-6 lg:col-span-6 lg:row-span-2">
                <Tapestry days={snapshot.days} sources={snapshot.sources} seed={`${snapshot.weekStart}-dash`} />
                <span className="absolute left-5 top-5 font-mono text-[11px] uppercase tracking-[0.2em] text-ash">Tapestry</span>
              </div>
              <div className="md:col-span-3 lg:col-span-3"><TimeTile s={snapshot} index={0} /></div>
              <div className="md:col-span-3 lg:col-span-3"><SoundTile s={snapshot} index={1} /></div>
              <div className="md:col-span-3 lg:col-span-3"><CraftTile s={snapshot} index={2} /></div>
              <div className="md:col-span-3 lg:col-span-3"><BodyTile s={snapshot} index={3} /></div>
              <div className="md:col-span-6 lg:col-span-8"><RhythmTile s={snapshot} index={4} /></div>
              <div className="md:col-span-6 lg:col-span-4">{story.insights[0] && <InsightCard insight={story.insights[0]} index={5} />}</div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ---------------- Privacy ---------------- */}
      <section id="privacy" className="scroll-mt-24 border-t border-bone/[0.06] bg-loom-2/40 py-28 sm:py-36">
        <div className="mx-auto max-w-[1200px] px-5">
          <motion.div {...reveal} className="max-w-3xl">
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-ash">06 · Privacy</p>
            <h2 className="mt-4 font-display text-5xl leading-[0.95] sm:text-7xl">
              Your threads. <span className="italic">Your cloth.</span>
            </h2>
          </motion.div>
          <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { i: KeyRound, t: "Read-only", d: "Every connection uses read-only scopes. Weft can't post, edit or delete anything." },
              { i: EyeOff, t: "Totals, not titles", d: "Calendar titles become categories on the server. The AI only ever sees weekly totals." },
              { i: ShieldCheck, t: "Encrypted tokens", d: "Access tokens live in encrypted, httpOnly cookies. No database of your accounts." },
              { i: Trash2, t: "One-click forget", d: "Disconnect a thread and its token is gone immediately." },
            ].map((p, k) => (
              <motion.div key={p.t} {...reveal} transition={{ ...reveal.transition, delay: k * 0.08 }} className="tile p-6">
                <p.i size={22} strokeWidth={1.5} className="text-bone/80" />
                <h3 className="mt-8 font-display text-3xl">{p.t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ash">{p.d}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- Final CTA ---------------- */}
      <section className="relative overflow-hidden border-t border-bone/[0.06]">
        <div className="absolute inset-0 opacity-70">
          <Tapestry days={[...snapshot.days].reverse()} sources={snapshot.sources} seed="finale" dayLines={false} />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-loom via-loom/60 to-loom" />
        <motion.div {...reveal} className="relative mx-auto flex max-w-[900px] flex-col items-center px-5 py-32 text-center sm:py-40">
          <Purl mood="excited" size={110} className="mb-6" />
          <h2 className="font-display text-[clamp(3rem,9vw,7.5rem)] leading-[0.9]">
            Four threads. One story.
            <br />
            <span className="italic text-weave">Every Sunday.</span>
          </h2>
          <div className="mt-12 flex flex-col gap-3 sm:flex-row">
            <Link href="/week?demo=1&story=1" onClick={cta("footer", "demo")} className="focus-ring inline-flex h-14 items-center justify-center gap-2 rounded-full bg-bone px-7 text-base font-medium text-loom hover:bg-bone/85">
              <Play size={16} fill="currentColor" /> Play a demo week
            </Link>
            <Link href="/connect" onClick={cta("footer", "connect")} className="focus-ring inline-flex h-14 items-center justify-center rounded-full border border-bone/15 bg-loom/50 px-7 text-base backdrop-blur hover:bg-bone/10">
              Weave my week
            </Link>
          </div>
        </motion.div>
      </section>

      <footer className="border-t border-bone/[0.06]">
        <div className="mx-auto flex max-w-[1200px] flex-col items-center justify-between gap-4 px-5 py-10 text-sm text-dust sm:flex-row">
          <Logo size={22} />
          <p>Your week, woven. · Built with Next.js, the AI SDK and a lot of thread.</p>
        </div>
      </footer>
    </div>
  );
}
