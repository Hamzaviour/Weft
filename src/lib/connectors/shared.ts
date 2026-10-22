import type { DaySignals } from "../types";

export interface WeekRange {
  tz: string;
  weekStart: string;
  weekEnd: string;
  days: string[];
  fetchFrom: Date;
  fetchTo: Date;
}

export type DayPatch = Partial<Omit<DaySignals, "date">>;

export class ConnectorError extends Error {
  constructor(public source: string, message: string, public status?: number) {
    super(`${source}: ${message}`);
  }
}

export async function getJson<T>(url: string, token: string, source: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json", ...init?.headers },
    signal: AbortSignal.timeout(8_000),
    cache: "no-store",
  });
  if (!res.ok) throw new ConnectorError(source, `${res.status} ${res.statusText}`, res.status);
  return res.json() as Promise<T>;
}

export function emptyPatches(days: string[]): Record<string, DayPatch> {
  return Object.fromEntries(days.map((d) => [d, {}]));
}

export const round1 = (n: number) => Math.round(n * 10) / 10;
