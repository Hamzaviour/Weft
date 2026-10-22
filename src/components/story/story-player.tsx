"use client";

import { AnimatePresence, motion } from "motion/react";
import { Download, Pause, Play, RotateCcw, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { track } from "@/lib/analytics";
import type { WeekPayload } from "@/lib/types";
import { formatRange } from "@/lib/week";
import { Tapestry, type TapestryHandle } from "../tapestry";
import { Purl, type PurlMood } from "../purl";
import { ThreadBackdrop } from "../thread-backdrop";
import { StoryCardView, cardColors } from "./story-card";

const CARD_MS = 6500;
const HOLD_MS = 220;

export function StoryPlayer({ payload, onClose, entry = "dashboard" }: { payload: WeekPayload; onClose: () => void; entry?: string }) {
  const { story, snapshot } = payload;
  const cards = story.cards;
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dir, setDir] = useState(1);
  const tapestryRef = useRef<TapestryHandle>(null);
  const pressStart = useRef(0);
  const progressRef = useRef(0);
  const indexRef = useRef(0);
  const pauses = useRef(0);
  const openedAt = useRef(0);
  const finished = useRef(false);
  const isLast = index === cards.length - 1;

  const go = useCallback(
    (delta: number) => {
      setDir(delta);
      progressRef.current = 0;
      setProgress(0);
      setIndex((i) => {
        const next = Math.max(0, Math.min(cards.length - 1, i + delta));
        return next;
      });
    },
    [cards.length],
  );

  useEffect(() => {
    openedAt.current = Date.now();
    track("story_opened", { entry, demo: snapshot.demo });
    return () => {
      if (!finished.current) track("story_exited", { at_index: indexRef.current });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    indexRef.current = index;
    const c = cards[index];
    track("story_card_viewed", { index, kind: c.kind, source: c.source });
    if (index === cards.length - 1 && !finished.current) {
      finished.current = true;
      track("story_completed", { duration_s: Math.round((Date.now() - openedAt.current) / 1000), paused_count: pauses.current });
    }
  }, [index, cards]);

  // Timer: advances unless paused, hidden, or on the last card.
  useEffect(() => {
    if (paused || isLast) return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = document.hidden ? 0 : now - last;
      last = now;
      progressRef.current += dt / CARD_MS;
      if (progressRef.current >= 1) {
        go(1);
        return;
      }
      setProgress(progressRef.current);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [paused, isLast, index, go]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
      else if (e.key === "Escape") onClose();
      else if (e.key === " ") {
        e.preventDefault();
        setPaused((p) => !p);
      } else return;
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [go, onClose]);

  const onPointerDown = () => {
    pressStart.current = performance.now();
    setPaused(true);
  };
  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const held = performance.now() - pressStart.current > HOLD_MS;
    setPaused(false);
    if (held) {
      pauses.current++;
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    go(e.clientX - rect.left < rect.width / 3 ? -1 : 1);
  };

  const replay = () => {
    setDir(-1);
    setIndex(0);
    progressRef.current = 0;
    setProgress(0);
    finished.current = false;
  };

  const save = async () => {
    const blob = await tapestryRef.current?.exportPng({
      title: story.title,
      subtitle: formatRange(snapshot.weekStart, snapshot.weekEnd),
    });
    if (!blob) return;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `weft-${snapshot.weekStart}.png`;
    a.click();
    URL.revokeObjectURL(a.href);
    track("tapestry_exported", { from: "story" });
  };

  const card = cards[index];
  const colors = cardColors(card, snapshot.sources);

  return (
    <motion.div
      role="region"
      aria-roledescription="story"
      aria-label={`${story.title}, a story about your week`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
      className="fixed inset-0 z-50 overflow-hidden bg-loom text-bone"
    >
      {/* Background: color wash + drifting threads for the card's source, full tapestry on the outro */}
      <AnimatePresence mode="sync">
        <motion.div
          key={`bg-${index}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.9 }}
          className="absolute inset-0"
        >
          <div
            className="absolute inset-0"
            style={{
              background: `radial-gradient(110% 75% at 88% 6%, ${colors[0]}55, transparent 62%), radial-gradient(90% 70% at 0% 100%, ${colors[colors.length - 1]}40, transparent 62%), color-mix(in oklab, ${colors[0]} 9%, var(--loom))`,
            }}
          />
          {card.kind !== "outro" && <ThreadBackdrop colors={colors} seed={`${snapshot.weekStart}-${index}`} density={card.kind === "intro" ? 14 : 9} />}
        </motion.div>
      </AnimatePresence>

      {isLast && (
        <motion.div initial={{ opacity: 0, scale: 1.08 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1.6, ease: [0.2, 0.8, 0.2, 1] }} className="absolute inset-0">
          <Tapestry ref={tapestryRef} days={snapshot.days} sources={snapshot.sources} seed={snapshot.weekStart} dayLines={false} />
          <div className="absolute inset-0 bg-gradient-to-t from-loom via-loom/60 to-loom/10" />
        </motion.div>
      )}

      {/* Progress */}
      <div className="absolute inset-x-0 top-0 z-30 flex gap-1.5 px-4 pt-4 sm:px-6">
        {cards.map((_, i) => (
          <div key={i} className="h-[3px] flex-1 overflow-hidden rounded-full bg-bone/12">
            <div
              className="h-full rounded-full bg-weave"
              style={{
                width: `${i < index ? 100 : i === index ? (isLast ? 100 : progress * 100) : 0}%`,
                backgroundSize: `${cards.length * 100}% 100%`,
                backgroundPosition: `${(i / Math.max(1, cards.length - 1)) * 100}% 0`,
              }}
            />
          </div>
        ))}
      </div>

      <div className="absolute inset-x-0 top-8 z-30 flex items-center justify-between px-4 sm:px-6">
        <span className="font-mono text-[11px] tracking-[0.2em] text-ash">
          {snapshot.demo ? "DEMO WEEK" : "YOUR WEEK"} · {formatRange(snapshot.weekStart, snapshot.weekEnd).toUpperCase()}
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setPaused((p) => !p)}
            className="focus-ring grid h-10 w-10 place-items-center rounded-full text-bone/80 hover:bg-bone/10"
            aria-label={paused ? "Play story" : "Pause story"}
          >
            {paused ? <Play size={18} /> : <Pause size={18} />}
          </button>
          <button onClick={onClose} className="focus-ring grid h-10 w-10 place-items-center rounded-full text-bone/80 hover:bg-bone/10" aria-label="Close story">
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Tap zones */}
      <div
        className="absolute inset-0 z-20 cursor-pointer select-none"
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={() => setPaused(false)}
        onPointerLeave={(e) => e.buttons && setPaused(false)}
      >
        <AnimatePresence mode="wait" custom={dir}>
          <motion.div
            key={index}
            custom={dir}
            initial={{ opacity: 0, x: dir * 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: dir * -40, filter: "blur(6px)" }}
            transition={{ duration: 0.45, ease: [0.2, 0.8, 0.2, 1] }}
            className="h-full"
            aria-live="polite"
          >
            {isLast ? (
              <OutroCard title={story.title} body={card.body} eyebrow={card.eyebrow} />
            ) : (
              <StoryCardView card={card} index={index} total={cards.length} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {isLast && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.6 }}
          className="absolute inset-x-0 bottom-8 z-30 flex justify-center gap-3 px-6"
        >
          <button onClick={replay} className="focus-ring inline-flex h-12 items-center gap-2 rounded-full border border-bone/15 bg-bone/5 px-5 text-sm backdrop-blur hover:bg-bone/10">
            <RotateCcw size={16} /> Replay
          </button>
          <button onClick={save} className="focus-ring inline-flex h-12 items-center gap-2 rounded-full bg-bone px-5 text-sm font-medium text-loom hover:bg-bone/85">
            <Download size={16} /> Save image
          </button>
          <button onClick={onClose} className="focus-ring inline-flex h-12 items-center rounded-full border border-bone/15 bg-bone/5 px-5 text-sm backdrop-blur hover:bg-bone/10">
            See dashboard
          </button>
        </motion.div>
      )}

      {/* Purl narrates from the corner */}
      {!isLast && (
        <AnimatePresence mode="wait">
          <motion.div
            key={`purl-${index}`}
            initial={{ opacity: 0, y: 16, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.5, delay: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
            className="pointer-events-none absolute bottom-8 right-4 z-30 flex items-end gap-2 sm:right-8"
          >
            <div className="relative mb-16 hidden max-w-[240px] rounded-2xl rounded-br-sm border border-loom-3 bg-loom-2/95 px-4 py-3 text-[15px] leading-snug text-bone shadow-[var(--shadow-lift)] backdrop-blur sm:block">
              {narration(card).line}
            </div>
            <Purl mood={narration(card).mood} size={116} />
          </motion.div>
        </AnimatePresence>
      )}

      {/* Writer attribution */}
      <div className="absolute bottom-3 left-4 z-30 font-mono text-[10px] tracking-[0.18em] text-dust sm:left-6">
        {payload.writer === "llm" ? "WRITTEN BY AI FROM YOUR DATA" : "WRITTEN FROM YOUR DATA"}
      </div>
    </motion.div>
  );
}

function narration(card: WeekPayload["story"]["cards"][number]): { mood: PurlMood; line: string } {
  if (card.kind === "intro") return { mood: "wave", line: "Hi, I'm Purl! Tap to follow the thread." };
  if (card.kind === "contrast") return { mood: "sleepy", line: "After midnight? Again? I need a nap." };
  if (card.kind === "insight" || card.source === "mixed") return { mood: "thinking", line: "Ooh. Two threads, one pattern." };
  switch (card.source) {
    case "calendar":
      return { mood: "thinking", line: "So many meetings, I got a little tangled." };
    case "spotify":
      return { mood: "excited", line: "This one was stuck in my yarn all week!" };
    case "github":
      return { mood: "proud", line: "Look what you made!" };
    case "health":
      return { mood: "sleepy", line: "Rest is a thread too." };
    default:
      return { mood: "happy", line: "Keep going!" };
  }
}

function OutroCard({ title, body, eyebrow }: { title: string; body: string; eyebrow: string }) {
  return (
    <div className="relative z-10 mx-auto flex h-full max-w-[720px] flex-col items-center justify-end px-7 pb-36 text-center">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.6 }} className="mb-4">
        <Purl mood="excited" size={104} />
      </motion.div>
      <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="font-mono text-[11px] tracking-[0.25em] text-ash">
        {eyebrow}
      </motion.span>
      <motion.h2
        initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ delay: 0.5, duration: 1, ease: [0.2, 0.8, 0.2, 1] }}
        className="mt-5 font-display text-balance text-[clamp(3rem,10vw,6.5rem)] italic leading-[0.92]"
      >
        {title}
      </motion.h2>
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }} className="mt-6 max-w-[42ch] text-lg text-bone/70">
        {body}
      </motion.p>
    </div>
  );
}
