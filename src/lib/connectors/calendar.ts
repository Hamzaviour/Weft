import type { CalendarSummary } from "../types";
import { localDate } from "../week";
import { emptyPatches, getJson, round1, type DayPatch, type WeekRange } from "./shared";

interface GEvent {
  status?: string;
  summary?: string;
  eventType?: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
  attendees?: { self?: boolean; responseStatus?: string }[];
  hangoutLink?: string;
  conferenceData?: unknown;
  transparency?: string;
}

const FOCUS = /\b(focus|deep work|heads ?down|no meetings|maker time|study)\b/i;
const SOCIAL = /\b(lunch|dinner|drinks|coffee|party|birthday|date|brunch|hangout)\b/i;

// Titles are only used here, to pick a category. They never leave this function.
function categorize(e: GEvent): "meeting" | "focus" | "social" | "personal" {
  if (e.eventType === "focusTime" || FOCUS.test(e.summary ?? "")) return "focus";
  if (SOCIAL.test(e.summary ?? "")) return "social";
  if ((e.attendees?.length ?? 0) > 1 || e.hangoutLink || e.conferenceData) return "meeting";
  return "personal";
}

export async function fetchCalendar(token: string, r: WeekRange) {
  const events: GEvent[] = [];
  let pageToken: string | undefined;
  for (let page = 0; page < 5; page++) {
    const q = new URLSearchParams({
      timeMin: r.fetchFrom.toISOString(),
      timeMax: r.fetchTo.toISOString(),
      singleEvents: "true",
      orderBy: "startTime",
      maxResults: "250",
      ...(pageToken && { pageToken }),
    });
    const json = await getJson<{ items: GEvent[]; nextPageToken?: string }>(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?${q}`,
      token,
      "calendar",
    );
    events.push(...json.items);
    pageToken = json.nextPageToken;
    if (!pageToken) break;
  }

  const patches = emptyPatches(r.days) as Record<string, Required<Pick<DayPatch, "meetingsMinutes" | "focusMinutes" | "events">>>;
  for (const d of r.days) patches[d] = { meetingsMinutes: 0, focusMinutes: 0, events: 0 };
  const categories: Record<string, number> = { meeting: 0, focus: 0, social: 0, personal: 0 };
  let longest = 0;

  for (const e of events) {
    if (e.status === "cancelled" || !e.start.dateTime || !e.end.dateTime) continue; // skip all-day
    if (e.attendees?.some((a) => a.self && a.responseStatus === "declined")) continue;
    const day = localDate(e.start.dateTime, r.tz);
    if (!patches[day]) continue;
    const minutes = Math.max(0, (Date.parse(e.end.dateTime) - Date.parse(e.start.dateTime)) / 60_000);
    if (minutes > 12 * 60) continue;
    const cat = categorize(e);
    categories[cat]++;
    patches[day].events++;
    if (cat === "meeting") {
      patches[day].meetingsMinutes += minutes;
      longest = Math.max(longest, minutes);
    } else if (cat === "focus") {
      patches[day].focusMinutes += minutes;
    }
  }

  const totals = Object.values(patches);
  const busiestDay = r.days.reduce((a, b) => (patches[b].meetingsMinutes > patches[a].meetingsMinutes ? b : a));
  const summary: CalendarSummary = {
    totalEvents: totals.reduce((a, d) => a + d.events, 0),
    meetingHours: round1(totals.reduce((a, d) => a + d.meetingsMinutes, 0) / 60),
    focusHours: round1(totals.reduce((a, d) => a + d.focusMinutes, 0) / 60),
    busiestDay,
    longestMeetingMinutes: Math.round(longest),
    categories,
  };
  return { patches: patches as Record<string, DayPatch>, summary };
}
