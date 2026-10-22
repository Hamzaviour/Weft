"use client";

import { motion } from "motion/react";
import { THREAD_VAR, THREAD_HEX, THREAD_NAME } from "@/lib/colors";
import type { Source, StoryCard as Card } from "@/lib/types";

const ease = [0.2, 0.8, 0.2, 1] as const;

const rise = (delay: number) => ({
  initial: { opacity: 0, y: 28, filter: "blur(8px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)" },
  transition: { duration: 0.7, delay, ease },
});

export function cardColors(card: Card, sources: Source[]) {
  if (card.source !== "mixed") return [THREAD_HEX[card.source]];
  return sources.map((s) => THREAD_HEX[s]);
}

export function StoryCardView({ card, index, total }: { card: Card; index: number; total: number }) {
  const accent = THREAD_VAR[card.source];
  const isBig = card.kind === "intro" || card.kind === "outro";

  return (
    <div className="relative z-10 mx-auto flex h-full w-full max-w-[640px] flex-col justify-center px-7 pb-24 pt-20 sm:px-10">
      <motion.div {...rise(0.05)} className="mb-6 flex items-center gap-3">
        <span className="font-mono text-[11px] tracking-[0.22em]" style={{ color: accent }}>
          {card.eyebrow}
        </span>
        <span className="h-px flex-1 bg-gradient-to-r from-bone/15 to-transparent" />
        <span className="font-mono text-[11px] text-dust tabular">
          {String(index + 1).padStart(2, "0")}/{String(total).padStart(2, "0")}
        </span>
      </motion.div>

      <motion.h2
        {...rise(0.15)}
        className={`font-display text-balance leading-[0.95] ${
          isBig ? "text-[clamp(3rem,11vw,6rem)]" : "text-[clamp(2.4rem,8vw,4.25rem)]"
        }`}
      >
        {card.headline}
      </motion.h2>

      {card.stat && (
        <motion.div {...rise(0.35)} className="mt-8">
          <div
            className="font-display tabular leading-[0.85] text-[clamp(5.5rem,24vw,11rem)]"
            style={{ color: accent, textShadow: `0 0 60px color-mix(in oklab, ${accent} 35%, transparent)` }}
          >
            {card.stat.value}
          </div>
          <div className="mt-2 font-mono text-xs uppercase tracking-[0.2em] text-ash">{card.stat.label}</div>
        </motion.div>
      )}

      {card.items && card.items.length > 0 && (
        <ol className="mt-8 space-y-1">
          {card.items.map((item, i) => (
            <motion.li
              key={item.label}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 + i * 0.09, ease }}
              className="flex items-baseline gap-4 border-b border-bone/[0.06] py-3"
            >
              <span className="w-6 font-mono text-xs text-dust tabular">{i + 1}</span>
              <span className={`flex-1 truncate ${i === 0 ? "font-display text-3xl italic" : "text-lg text-bone/85"}`}>
                {item.label}
              </span>
              <span className="font-mono text-sm tabular" style={{ color: accent }}>
                {item.value}
              </span>
            </motion.li>
          ))}
        </ol>
      )}

      <motion.p {...rise(card.stat || card.items ? 0.55 : 0.3)} className="mt-8 max-w-[38ch] text-lg leading-relaxed text-bone/75 sm:text-xl">
        {card.body}
      </motion.p>
    </div>
  );
}

export function SourceDots({ sources }: { sources: Source[] }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      {sources.map((s) => (
        <span key={s} title={THREAD_NAME[s]} className="h-2 w-2 rounded-full" style={{ background: THREAD_VAR[s] }} />
      ))}
    </span>
  );
}
