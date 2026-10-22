"use client";

import { AnimatePresence, motion } from "motion/react";
import { AlertTriangle, Download, Play, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { track } from "@/lib/analytics";
import { THREAD_HEX } from "@/lib/colors";
import { useWeek } from "@/lib/use-week";
import { DAY_SHORT, formatRange } from "@/lib/week";
import { BodyTile, CraftTile, InsightCard, RhythmTile, SoundTile, TimeTile } from "./bento/tiles";
import { Tile, TileLabel } from "./bento/tile";
import { NavLink, SiteNav } from "./site-nav";
import { SourceDots } from "./story/story-card";
import { StoryPlayer } from "./story/story-player";
import { Tapestry, type TapestryHandle } from "./tapestry";
import { ThreadBackdrop } from "./thread-backdrop";
import { Purl } from "./purl";

export function Dashboard({ demo, autoplay }: { demo: boolean; autoplay: boolean }) {
  const { data, error, reweave, reweaving } = useWeek(demo);
  const [storyOpen, setStoryOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const tapRef = useRef<TapestryHandle>(null);
  const router = useRouter();
  const autoplayed = useRef(false);

  useEffect(() => {
    if (autoplay && data && !autoplayed.current) {
      autoplayed.current = true;
      setStoryOpen(true);
    }
  }, [autoplay, data]);

  const closeStory = () => {
    setStoryOpen(false);
    if (autoplay) router.replace(demo ? "/week?demo=1" : "/week", { scroll: false });
  };

  const save = async () => {
    if (!data) return;
    const blob = await tapRef.current?.exportPng({
      title: data.story.title,
      subtitle: formatRange(data.snapshot.weekStart, data.snapshot.weekEnd),
    });
    if (!blob) return;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `weft-${data.snapshot.weekStart}.png`;
    a.click();
    URL.revokeObjectURL(a.href);
    track("tapestry_exported", { from: "dashboard" });
  };

  const onReweave = async () => {
    const err = await reweave();
    setToast(err ?? "Rewoven. Fresh story ready.");
    setTimeout(() => setToast(null), 3200);
  };

  return (
    <div className="flex min-h-screen flex-col">
      <SiteNav>
        <NavLink href="/week" active>
          Week
        </NavLink>
        <NavLink href="/connect">Threads</NavLink>
      </SiteNav>

      {!data ? (
        <Weaving error={error} />
      ) : (
        <main className="mx-auto w-full max-w-[1320px] flex-1 px-4 pb-20 pt-8 sm:px-6">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative mb-5 flex flex-wrap items-center justify-between gap-6 overflow-hidden rounded-[28px] border border-loom-3 bg-loom-2 p-5 shadow-[var(--shadow-soft)] sm:p-7"
          >
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 opacity-60"
              style={{
                background:
                  "radial-gradient(60% 120% at 0% 0%, rgba(139,108,246,.10), transparent 60%), radial-gradient(50% 120% at 100% 100%, rgba(245,165,36,.12), transparent 60%)",
              }}
            />
            <div className="relative flex min-w-0 flex-1 items-center gap-4 sm:gap-6">
              <Purl mood="wave" size={92} className="shrink-0" />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-3 font-mono text-[11px] uppercase tracking-[0.22em] text-ash">
                  {data.snapshot.demo && <span className="rounded-full border border-time/50 bg-time/10 px-2 py-0.5 text-time-ink">Demo week</span>}
                  <span>{formatRange(data.snapshot.weekStart, data.snapshot.weekEnd)}</span>
                  <SourceDots sources={data.snapshot.sources} />
                </div>
                <h1 className="mt-1.5 font-display text-4xl sm:text-5xl">
                  {greeting()}, <span className="italic text-weave">your week is woven.</span>
                </h1>
                {data.story.insights[0] && (
                  <p className="mt-2 max-w-2xl text-[15px] text-ash">
                    <span className="font-medium text-bone">Purl noticed:</span> {data.story.insights[0].body}
                  </p>
                )}
              </div>
            </div>
            <div className="relative flex gap-2">
              <button
                onClick={onReweave}
                disabled={reweaving}
                className="focus-ring inline-flex h-11 items-center gap-2 rounded-full border border-bone/12 px-4 text-sm text-bone/85 hover:bg-bone/5 disabled:opacity-50"
              >
                <RefreshCw size={15} className={reweaving ? "animate-spin" : ""} /> Reweave
              </button>
              <button onClick={() => setStoryOpen(true)} className="focus-ring inline-flex h-11 items-center gap-2 rounded-full bg-bone px-5 text-sm font-medium text-loom hover:bg-bone/85">
                <Play size={15} fill="currentColor" /> Play story
              </button>
            </div>
          </motion.div>

          {data.snapshot.warnings.length > 0 && (
            <div className="mb-5 flex items-start gap-3 rounded-2xl border border-time/25 bg-time/5 p-4 text-sm text-bone/80">
              <AlertTriangle size={16} className="mt-0.5 shrink-0 text-time-ink" />
              <div>{data.snapshot.warnings.join(" ")}</div>
            </div>
          )}

          {/* Bento */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-6 lg:grid-cols-12">
            <Tile index={0} label="Tapestry" className="group min-h-[380px] md:col-span-6 lg:col-span-6 lg:row-span-2">
              <Tapestry ref={tapRef} days={data.snapshot.days} sources={data.snapshot.sources} seed={data.snapshot.weekStart} />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-around px-2 pb-3">
                {DAY_SHORT.map((d) => (
                  <span key={d} className="font-mono text-[10px] uppercase tracking-[0.18em] text-bone/40">
                    {d}
                  </span>
                ))}
              </div>
              <div className="absolute left-4 top-4 rounded-full border border-loom-3 bg-loom-2/85 px-3 py-1.5 backdrop-blur">
                <TileLabel>Tapestry · {data.snapshot.weekStart}</TileLabel>
              </div>
              <button
                onClick={save}
                aria-label="Save tapestry as image"
                className="focus-ring absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-loom/60 text-bone/80 opacity-0 backdrop-blur transition group-hover:opacity-100 focus-visible:opacity-100"
              >
                <Download size={16} />
              </button>
            </Tile>

            <Tile index={1} label="This week's story" className="flex min-h-[240px] flex-col p-6 md:col-span-3 lg:col-span-3">
              <TileLabel>The story</TileLabel>
              <h2 className="mt-4 font-display text-[2.1rem] italic leading-[1]">{data.story.title}</h2>
              <p className="mt-3 text-sm text-ash">
                {data.story.cards.length} cards · {data.writer === "llm" ? "written by AI" : "template writer"}
              </p>
              <button
                onClick={() => setStoryOpen(true)}
                className="focus-ring group/play mt-auto inline-flex items-center gap-3 self-start rounded-full pr-4 text-sm"
              >
                <span className="grid h-12 w-12 place-items-center rounded-full bg-weave text-loom shadow-[0_0_40px_-6px_rgba(167,139,255,.6)] transition group-hover/play:scale-105">
                  <Play size={18} fill="currentColor" />
                </span>
                Play your week
              </button>
            </Tile>

            <div className="md:col-span-3 lg:col-span-3">
              <TimeTile s={data.snapshot} index={2} />
            </div>
            <div className="md:col-span-3 lg:col-span-3">
              <SoundTile s={data.snapshot} index={3} />
            </div>
            <div className="md:col-span-3 lg:col-span-3">
              <CraftTile s={data.snapshot} index={4} />
            </div>

            <div className="md:col-span-6 lg:col-span-8">
              <RhythmTile s={data.snapshot} index={5} />
            </div>
            <div className="md:col-span-6 lg:col-span-4">
              <BodyTile s={data.snapshot} index={6} />
            </div>
          </div>

          {/* Insights */}
          <div className="mb-4 mt-12 flex items-end justify-between">
            <h2 className="font-display text-3xl">
              What the threads <span className="italic">say</span>
            </h2>
            <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-dust">{data.story.insights.length} insights</span>
          </div>
          <div className="scrollbar-none -mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2 lg:mx-0 lg:grid lg:grid-cols-4 lg:overflow-visible lg:px-0">
            {data.story.insights.map((ins, i) => (
              <InsightCard key={ins.title} insight={ins} index={7 + i} />
            ))}
          </div>

          {data.snapshot.demo && (
            <div className="relative mt-12 overflow-hidden rounded-[28px] border border-loom-3 bg-loom-2 p-8 shadow-[var(--shadow-soft)] sm:p-10">
              <ThreadBackdrop colors={Object.values(THREAD_HEX)} seed="cta" density={8} />
              <div className="relative flex flex-wrap items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                  <Purl mood="excited" size={88} className="shrink-0" />
                  <div>
                  <h3 className="font-display text-3xl sm:text-4xl">
                    This was Maya&apos;s week. <span className="italic">Want yours?</span>
                  </h3>
                  <p className="mt-2 text-ash">Connect a thread or two and Purl will weave your real week.</p>
                  </div>
                </div>
                <Link href="/connect" className="focus-ring inline-flex h-12 items-center rounded-full bg-bone px-6 text-sm font-medium text-loom hover:bg-bone/85">
                  Connect your threads
                </Link>
              </div>
            </div>
          )}
        </main>
      )}

      <AnimatePresence>{storyOpen && data && <StoryPlayer payload={data} onClose={closeStory} entry={autoplay ? "deeplink" : "dashboard"} />}</AnimatePresence>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            role="status"
            className="fixed bottom-6 left-1/2 z-40 -translate-x-1/2 rounded-full border border-bone/10 bg-loom-2 px-5 py-3 text-sm shadow-2xl"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function greeting() {
  const h = new Date().getHours();
  return h < 5 ? "Up late" : h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

function Weaving({ error }: { error: string | null }) {
  return (
    <div className="relative flex flex-1 items-center justify-center overflow-hidden">
      <ThreadBackdrop colors={Object.values(THREAD_HEX)} seed="loading" density={16} />
      <div className="relative flex flex-col items-center text-center" role="status">
        <Purl mood={error ? "sleepy" : "thinking"} size={120} className="mb-4" />
        {error ? (
          <>
            <p className="font-display text-4xl italic">The loom jammed.</p>
            <p className="mt-3 text-ash">{error}</p>
            <Link href="/week?demo=1" className="mt-6 inline-block text-sm text-bone underline underline-offset-4">
              Try the demo week instead
            </Link>
          </>
        ) : (
          <>
            <p className="font-display text-5xl italic">Purl is weaving your week…</p>
            <p className="mt-3 font-mono text-xs uppercase tracking-[0.2em] text-ash">gathering threads · finding patterns · writing your story</p>
          </>
        )}
      </div>
    </div>
  );
}
