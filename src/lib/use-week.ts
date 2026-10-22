"use client";

import { useCallback, useEffect, useState } from "react";
import { track } from "./analytics";
import type { WeekPayload } from "./types";

const KEY = (demo: boolean) => `weft:week:${demo ? "demo" : "live"}`;

function tz() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
}

export function useWeek(demo: boolean) {
  const [data, setData] = useState<WeekPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reweaving, setReweaving] = useState(false);

  useEffect(() => {
    let alive = true;
    try {
      const cached = sessionStorage.getItem(KEY(demo));
      if (cached) queueMicrotask(() => alive && setData(JSON.parse(cached)));
    } catch {}
    document.cookie = `weft_tz=${encodeURIComponent(tz())}; path=/; max-age=31536000; samesite=lax`;
    const started = performance.now();
    fetch(`/api/week?${demo ? "demo=1&" : ""}tz=${encodeURIComponent(tz())}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((p: WeekPayload) => {
        if (!alive) return;
        setData(p);
        try {
          sessionStorage.setItem(KEY(demo), JSON.stringify(p));
        } catch {}
        track("week_built", {
          sources_count: p.snapshot.sources.length,
          writer: p.writer,
          duration_ms: Math.round(performance.now() - started),
          demo: p.snapshot.demo,
        });
      })
      .catch((e) => alive && setError(String(e.message ?? e)));
    return () => {
      alive = false;
    };
  }, [demo]);

  const reweave = useCallback(async () => {
    setReweaving(true);
    track("reweave_clicked");
    try {
      const r = await fetch(`/api/week/reweave?${demo ? "demo=1&" : ""}tz=${encodeURIComponent(tz())}`, { method: "POST" });
      const json = await r.json();
      if (!r.ok) throw new Error(json.error ?? `HTTP ${r.status}`);
      setData(json);
      try {
        sessionStorage.setItem(KEY(demo), JSON.stringify(json));
      } catch {}
      return null;
    } catch (e) {
      return String((e as Error).message);
    } finally {
      setReweaving(false);
    }
  }, [demo]);

  return { data, error, reweave, reweaving };
}
