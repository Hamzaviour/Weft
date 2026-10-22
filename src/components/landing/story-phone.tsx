"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { THREAD_VAR } from "@/lib/colors";
import type { Story } from "@/lib/types";

// A miniature, self-playing story inside a phone frame.
export function StoryPhone({ story }: { story: Story }) {
  const cards = story.cards.filter((c) => c.kind !== "outro");
  const [i, setI] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setI((x) => (x + 1) % cards.length), 3200);
    return () => clearInterval(id);
  }, [cards.length]);

  const card = cards[i];
  const color = THREAD_VAR[card.source];

  return (
    <div className="relative mx-auto aspect-[9/19] w-[min(320px,80vw)] rounded-[46px] border border-bone/15 bg-bone p-2.5 shadow-[0_40px_120px_-30px_rgba(167,139,255,.45)]">
      <div className="relative h-full w-full overflow-hidden rounded-[38px] bg-loom">
        <div
          className="absolute inset-0 transition-[background] duration-700"
          style={{ background: `radial-gradient(120% 60% at 90% 0%, color-mix(in oklab, ${color} 28%, transparent), transparent 65%)` }}
        />
        <div className="absolute inset-x-0 top-0 z-10 flex gap-1 px-4 pt-5">
          {cards.map((_, k) => (
            <div key={k} className="h-[2.5px] flex-1 overflow-hidden rounded-full bg-bone/15">
              {k <= i && (
                <motion.div
                  key={`${k}-${i}`}
                  className="h-full bg-weave"
                  initial={{ width: k < i ? "100%" : "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: k < i ? 0 : 3.2, ease: "linear" }}
                />
              )}
            </div>
          ))}
        </div>
        <div className="absolute left-1/2 top-2 z-20 h-5 w-20 -translate-x-1/2 rounded-full bg-bone" />
        <AnimatePresence mode="wait">
          <motion.div
            key={i}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24, filter: "blur(4px)" }}
            transition={{ duration: 0.45, ease: [0.2, 0.8, 0.2, 1] }}
            className="relative flex h-full flex-col justify-center px-6 pb-10"
          >
            <span className="font-mono text-[9px] tracking-[0.2em]" style={{ color }}>
              {card.eyebrow}
            </span>
            <h3 className="mt-3 font-display text-[2.1rem] leading-[0.95]">{card.headline}</h3>
            {card.stat && (
              <div className="mt-5 font-display text-7xl tabular leading-none" style={{ color }}>
                {card.stat.value}
              </div>
            )}
            {card.items && (
              <ol className="mt-4 space-y-1.5">
                {card.items.slice(0, 4).map((it, k) => (
                  <li key={it.label} className="flex justify-between gap-2 border-b border-bone/5 pb-1.5 text-[12px]">
                    <span className={`truncate ${k === 0 ? "font-display text-base italic" : "text-bone/80"}`}>{it.label}</span>
                    <span className="font-mono" style={{ color }}>
                      {it.value}
                    </span>
                  </li>
                ))}
              </ol>
            )}
            <p className="mt-5 text-[13px] leading-relaxed text-bone/70">{card.body}</p>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
