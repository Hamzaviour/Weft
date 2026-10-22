"use client";

import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from "react";
import { buildTapestry, describeTapestry, drawTapestry } from "@/lib/art/tapestry";
import type { DaySignals, Source } from "@/lib/types";

export interface TapestryHandle {
  exportPng: (opts: { title: string; subtitle: string }) => Promise<Blob | null>;
}

interface Props {
  days: DaySignals[];
  sources: Source[];
  seed: string;
  animated?: boolean;
  dayLines?: boolean;
  className?: string;
}

export const Tapestry = forwardRef<TapestryHandle, Props>(function Tapestry(
  { days, sources, seed, animated = true, dayLines = true, className = "" },
  ref,
) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const model = useMemo(() => buildTapestry(days, sources, seed), [days, sources, seed]);
  const label = useMemo(() => describeTapestry(model), [model]);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let visible = true;
    let t = (model.seed % 1000) / 100;
    let last = performance.now();

    const resize = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const { width, height } = canvas.getBoundingClientRect();
      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.max(1, Math.round(height * dpr));
      drawTapestry(ctx, canvas.width, canvas.height, model, t, { dayLines });
    };

    const loop = (now: number) => {
      t += Math.min(0.05, (now - last) / 1000);
      last = now;
      if (visible) drawTapestry(ctx, canvas.width, canvas.height, model, t, { dayLines });
      raf = requestAnimationFrame(loop);
    };

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
    io.observe(canvas);
    resize();
    if (animated && !reduce) raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
    };
  }, [model, animated, dayLines]);

  useImperativeHandle(
    ref,
    () => ({
      async exportPng({ title, subtitle }) {
        const W = 1080;
        const H = 1350;
        const off = document.createElement("canvas");
        off.width = W;
        off.height = H;
        const ctx = off.getContext("2d")!;
        drawTapestry(ctx, W, H, model, 4, { dayLines: false });
        const shade = ctx.createLinearGradient(0, H * 0.45, 0, H);
        shade.addColorStop(0, "rgba(251,247,240,0)");
        shade.addColorStop(1, "rgba(251,247,240,0.96)");
        ctx.fillStyle = shade;
        ctx.fillRect(0, 0, W, H);
        const serif = getComputedStyle(document.documentElement).getPropertyValue("--font-instrument-serif") || "Georgia";
        const sans = getComputedStyle(document.documentElement).getPropertyValue("--font-geist-sans") || "system-ui";
        const mono = getComputedStyle(document.documentElement).getPropertyValue("--font-geist-mono") || "monospace";
        ctx.fillStyle = "#221C29";
        ctx.font = `italic 96px ${serif}`;
        wrapText(ctx, title, 80, H - 300, W - 160, 100);
        ctx.font = `400 30px ${sans}`;
        ctx.fillStyle = "#6B6273";
        ctx.fillText(subtitle, 80, H - 110);
        ctx.font = `500 22px ${mono}`;
        ctx.fillStyle = "#9D9389";
        ctx.fillText("WOVEN BY WEFT", 80, H - 64);
        return new Promise((res) => off.toBlob(res, "image/png"));
      },
    }),
    [model],
  );

  return <canvas ref={canvasRef} role="img" aria-label={label} className={`block h-full w-full ${className}`} />;
});

function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, max: number, lh: number) {
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > max && line) {
      lines.push(line);
      line = w;
    } else line = test;
  }
  lines.push(line);
  const startY = y - (lines.length - 1) * lh;
  lines.forEach((l, i) => ctx.fillText(l, x, startY + i * lh));
}
