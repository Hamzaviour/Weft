// Week math in the user's time zone without a date library.
// A "week" is Monday..Sunday. We always describe the last *completed* week.

const DAY_MS = 86_400_000;

export function localDate(input: Date | string | number, tz: string): string {
  const d = new Date(input);
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

export function localHour(input: Date | string | number, tz: string): number {
  const h = new Intl.DateTimeFormat("en-US", { timeZone: tz, hour: "numeric", hourCycle: "h23" }).format(
    new Date(input),
  );
  return Number(h) % 24;
}

function parseYmd(ymd: string): Date {
  return new Date(`${ymd}T00:00:00Z`);
}

export function addDays(ymd: string, n: number): string {
  return new Date(parseYmd(ymd).getTime() + n * DAY_MS).toISOString().slice(0, 10);
}

export function weekdayIndex(ymd: string): number {
  // 0 = Monday
  return (parseYmd(ymd).getUTCDay() + 6) % 7;
}

export function lastCompletedWeek(tz: string, now = new Date()) {
  const today = localDate(now, tz);
  const thisMonday = addDays(today, -weekdayIndex(today));
  const weekStart = addDays(thisMonday, -7);
  const weekEnd = addDays(weekStart, 6);
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  // Generous UTC window for API queries; results are re-bucketed by local date.
  const fetchFrom = new Date(parseYmd(weekStart).getTime() - DAY_MS);
  const fetchTo = new Date(parseYmd(weekEnd).getTime() + 2 * DAY_MS);
  return { weekStart, weekEnd, days, fetchFrom, fetchTo };
}

export const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
export const DAY_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function dayName(ymd: string) {
  return DAY_NAMES[weekdayIndex(ymd)];
}

export function formatRange(start: string, end: string) {
  const f = (s: string) =>
    parseYmd(s).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
  return `${f(start)} – ${f(end)}`;
}

export function safeTimeZone(tz: string | null | undefined) {
  if (!tz) return "UTC";
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return tz;
  } catch {
    return "UTC";
  }
}
