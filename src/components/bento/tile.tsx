"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { Plus } from "lucide-react";
import type { ReactNode } from "react";
import { Purl } from "../purl";

export function Tile({
  children,
  className = "",
  accent,
  index = 0,
  label,
}: {
  children: ReactNode;
  className?: string;
  accent?: string;
  index?: number;
  label?: string;
}) {
  return (
    <motion.section
      aria-label={label}
      initial={{ opacity: 0, y: 24, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.7, delay: 0.08 + index * 0.05, ease: [0.2, 0.8, 0.2, 1] }}
      className={`tile relative overflow-hidden ${className}`}
      style={{ ["--tile-accent" as string]: accent }}
    >
      {children}
    </motion.section>
  );
}

export function TileLabel({ color, children, right }: { color?: string; children: ReactNode; right?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-ash">
        {color && <span className="h-1.5 w-1.5 rounded-full" style={{ background: color, boxShadow: `0 0 10px ${color}` }} />}
        {children}
      </span>
      {right}
    </div>
  );
}

export function EmptyThread({ name, color, provider }: { name: string; color: string; provider: string }) {
  return (
    <div className="relative flex h-full min-h-[180px] flex-col justify-between rounded-[23px] border border-dashed border-loom-4 bg-loom-2/50 p-6">
      <TileLabel color={color}>{name}</TileLabel>
      <Purl mood="sleepy" size={64} className="absolute right-5 top-5" />
      <div>
        <p className="font-display text-2xl italic text-bone/60">A loose thread.</p>
        <Link href="/connect" className="focus-ring mt-3 inline-flex items-center gap-1.5 rounded-full text-sm text-ash hover:text-bone">
          <Plus size={14} /> Connect {provider}
        </Link>
      </div>
    </div>
  );
}
