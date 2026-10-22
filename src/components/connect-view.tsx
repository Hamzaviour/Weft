"use client";

import { AnimatePresence, motion } from "motion/react";
import { CalendarDays, Check, GitBranch, HeartPulse, Loader2, Music2, Sparkles } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { track } from "@/lib/analytics";
import { THREAD_HEX, THREAD_INK } from "@/lib/colors";
import type { Source } from "@/lib/types";
import { PurlSays } from "./purl";
import { NavLink, SiteNav } from "./site-nav";

interface ProviderState {
  id: string;
  source: Source;
  name: string;
  reads: string;
  scopes: string[];
  configured: boolean;
  connected: boolean;
}

const ICONS: Record<Source, typeof Music2> = { calendar: CalendarDays, spotify: Music2, github: GitBranch, health: HeartPulse };
const THREAD_LABEL: Record<Source, string> = { calendar: "Time", spotify: "Sound", github: "Craft", health: "Body" };

const ERRORS: Record<string, string> = {
  not_configured: "isn't configured on this server yet. Add its client ID and secret to the environment.",
  denied: "access was declined.",
  state_mismatch: "sign-in expired. Please try again.",
  exchange_failed: "couldn't complete sign-in. Please try again.",
  no_code: "didn't return an authorization code.",
};

function describeError(error: string) {
  const [provider, ...rest] = error.split("_");
  const reason = rest.join("_");
  return `${provider[0].toUpperCase()}${provider.slice(1)} ${ERRORS[reason] ?? "couldn't connect."}`;
}

export function ConnectView({ connected, error }: { connected: string | null; error: string | null }) {
  const [providers, setProviders] = useState<ProviderState[] | null>(null);
  const [llm, setLlm] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  const load = () =>
    fetch("/api/connections")
      .then((r) => r.json())
      .then((j) => {
        setProviders(j.providers);
        setLlm(j.llm);
      });

  useEffect(() => {
    load();
    if (connected) {
      track("connect_completed", { provider: connected });
      try {
        sessionStorage.removeItem("weft:week:live");
      } catch {}
    }
    if (error) track("connect_failed", { provider: error.split("_")[0], reason: error.split("_").slice(1).join("_") });
  }, [connected, error]);

  const disconnect = async (id: string) => {
    setBusy(id);
    await fetch(`/api/auth/${id}/disconnect`, { method: "POST" });
    track("source_disconnected", { provider: id });
    try {
      sessionStorage.removeItem("weft:week:live");
    } catch {}
    await load();
    setBusy(null);
  };

  const count = providers?.filter((p) => p.connected).length ?? 0;

  return (
    <div className="flex min-h-screen flex-col">
      <SiteNav>
        <NavLink href="/week">Week</NavLink>
        <NavLink href="/connect" active>
          Threads
        </NavLink>
      </SiteNav>

      <main className="mx-auto w-full max-w-[1100px] flex-1 px-4 pb-24 pt-14 sm:px-6">
        {/* Header with four threads that light up as sources connect */}
        <div className="relative">
          <svg viewBox="0 0 1000 120" className="mb-8 h-20 w-full" preserveAspectRatio="none" aria-hidden>
            {(["calendar", "spotify", "github", "health"] as Source[]).map((s, i) => {
              const on = providers?.find((p) => p.source === s)?.connected;
              return (
                <motion.path
                  key={s}
                  d={`M 0 ${24 + i * 24} C 250 ${i * 30}, 500 ${110 - i * 22}, 1000 ${30 + i * 20}`}
                  fill="none"
                  stroke={THREAD_HEX[s]}
                  strokeWidth={on ? 3 : 1.5}
                  strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1, opacity: on ? 1 : 0.22 }}
                  transition={{ duration: 1.6, delay: i * 0.15, ease: [0.2, 0.8, 0.2, 1] }}
                  style={{ filter: on ? `drop-shadow(0 0 8px ${THREAD_HEX[s]})` : undefined }}
                />
              );
            })}
          </svg>
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-ash">Step 1 of 2 · {count}/4 threads</p>
          <h1 className="mt-3 font-display text-5xl leading-[0.95] sm:text-7xl">
            Gather your <span className="italic text-weave">threads.</span>
          </h1>
          <div className="mt-6 flex flex-wrap items-end justify-between gap-6">
            <p className="max-w-xl text-lg text-ash">
              Weft reads, never writes. Every connection is read-only, and only weekly totals ever reach the AI.
            </p>
            <PurlSays mood={count === 0 ? "thinking" : count === 4 ? "excited" : "happy"} size={84} side="left">
              {count === 0
                ? "No threads yet. Hand me one and I'll start weaving!"
                : count === 4
                  ? "All four threads! This is going to be beautiful."
                  : `${count} thread${count === 1 ? "" : "s"} on the loom. More threads, better stories.`}
            </PurlSays>
          </div>
        </div>

        <AnimatePresence>
          {(connected || error) && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              role="status"
              className={`mt-8 rounded-2xl border p-4 text-sm ${error ? "border-body/30 bg-body/5" : "border-craft/30 bg-craft/5"}`}
            >
              {error ? describeError(error) : `${connected![0].toUpperCase()}${connected!.slice(1)} connected. A new thread on the loom.`}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {(providers ?? Array.from({ length: 4 }, () => null)).map((p, i) =>
            p ? (
              <motion.article
                key={p.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06, duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
                className="tile flex flex-col p-6"
                style={{ ["--tile-accent" as string]: THREAD_HEX[p.source] }}
              >
                <div className="flex items-start justify-between">
                  <span className="grid h-12 w-12 place-items-center rounded-2xl" style={{ background: `${THREAD_HEX[p.source]}24`, color: THREAD_INK[p.source] }}>
                    {(() => {
                      const Icon = ICONS[p.source];
                      return <Icon size={22} strokeWidth={1.5} />;
                    })()}
                  </span>
                  <span className="font-mono text-[11px] uppercase tracking-[0.2em]" style={{ color: THREAD_INK[p.source] }}>
                    {THREAD_LABEL[p.source]}
                  </span>
                </div>
                <h2 className="mt-6 font-display text-3xl">{p.name}</h2>
                <p className="mt-2 text-sm leading-relaxed text-ash">{p.reads}</p>
                <p className="mt-3 font-mono text-[11px] text-dust">{p.scopes.join(" · ")}</p>
                <div className="mt-6 flex items-center gap-3 pt-2">
                  {p.connected ? (
                    <>
                      <span className="inline-flex h-11 items-center gap-2 rounded-full px-4 text-sm" style={{ background: `${THREAD_HEX[p.source]}1f`, color: THREAD_INK[p.source] }}>
                        <Check size={16} /> Connected
                      </span>
                      <button onClick={() => disconnect(p.id)} disabled={busy === p.id} className="focus-ring rounded-full px-3 py-2 text-sm text-ash hover:text-bone">
                        {busy === p.id ? <Loader2 size={14} className="animate-spin" /> : "Disconnect"}
                      </button>
                    </>
                  ) : p.configured ? (
                    <a
                      href={`/api/auth/${p.id}/start`}
                      onClick={() => track("connect_started", { provider: p.id })}
                      className="focus-ring inline-flex h-11 items-center rounded-full bg-bone px-5 text-sm font-medium text-loom hover:bg-bone/85"
                    >
                      Connect {p.name}
                    </a>
                  ) : (
                    <span className="inline-flex h-11 items-center rounded-full border border-dashed border-bone/15 px-4 text-sm text-dust" title={`Set ${p.id.toUpperCase()}_CLIENT_ID and ${p.id.toUpperCase()}_CLIENT_SECRET`}>
                      Not configured on this server
                    </span>
                  )}
                </div>
              </motion.article>
            ) : (
              <div key={i} className="tile h-[260px] animate-pulse" />
            ),
          )}
        </div>

        <div className="mt-12 flex flex-col items-start gap-6 rounded-[28px] border border-bone/10 bg-loom-2/50 p-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-ash">Step 2 of 2</p>
            <p className="mt-2 font-display text-3xl">Weave it.</p>
            <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-ash">
              <Sparkles size={13} className="text-sound-ink" /> {llm ? "AI writer is on." : "AI writer is off; the template writer will tell your story."}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/week?demo=1" className="focus-ring inline-flex h-12 items-center rounded-full border border-bone/15 px-5 text-sm hover:bg-bone/5">
              Try a demo week
            </Link>
            {count > 0 ? (
              <Link href="/week?story=1" className="focus-ring inline-flex h-12 items-center rounded-full bg-weave px-6 text-sm font-semibold text-loom">
                Weave my week
              </Link>
            ) : (
              <span aria-disabled className="inline-flex h-12 cursor-not-allowed items-center rounded-full bg-bone/5 px-6 text-sm text-dust">
                Weave my week
              </span>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
