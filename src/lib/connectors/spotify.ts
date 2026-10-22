import type { SpotifySummary } from "../types";
import { localDate, localHour } from "../week";
import { getJson, type DayPatch, type WeekRange } from "./shared";

interface Artist { id: string; name: string; genres?: string[]; images?: { url: string }[] }
interface Track { id: string; name: string; duration_ms: number; artists: Artist[]; album: { images: { url: string }[] } }
interface PlayHistory { played_at: string; track: Track }

const API = "https://api.spotify.com/v1";

export async function fetchSpotify(token: string, r: WeekRange) {
  // recently-played pages backwards through time with the `before` cursor (ms).
  const plays: PlayHistory[] = [];
  let before = Math.min(Date.now(), r.fetchTo.getTime());
  for (let page = 0; page < 10; page++) {
    const json = await getJson<{ items: PlayHistory[]; cursors?: { before?: string } }>(
      `${API}/me/player/recently-played?limit=50&before=${before}`,
      token,
      "spotify",
    );
    plays.push(...json.items);
    const next = Number(json.cursors?.before);
    if (!json.items.length || !next || next < r.fetchFrom.getTime()) break;
    before = next;
  }

  const [topTracks, topArtists] = await Promise.all([
    getJson<{ items: Track[] }>(`${API}/me/top/tracks?time_range=short_term&limit=10`, token, "spotify").catch(() => ({ items: [] })),
    getJson<{ items: Artist[] }>(`${API}/me/top/artists?time_range=short_term&limit=10`, token, "spotify").catch(() => ({ items: [] })),
  ]);

  const patches: Record<string, DayPatch> = {};
  for (const d of r.days) patches[d] = { listeningMinutes: 0, tracksPlayed: 0, lateNightPlays: 0 };
  const trackCounts = new Map<string, { name: string; artist: string; plays: number; image?: string }>();
  const artistCounts = new Map<string, { name: string; plays: number; image?: string }>();
  let minutes = 0;
  let count = 0;
  let late = 0;

  for (const p of plays) {
    const day = localDate(p.played_at, r.tz);
    const patch = patches[day];
    if (!patch) continue;
    const m = p.track.duration_ms / 60_000;
    patch.listeningMinutes! += m;
    patch.tracksPlayed!++;
    if (localHour(p.played_at, r.tz) < 4) {
      patch.lateNightPlays!++;
      late++;
    }
    minutes += m;
    count++;
    const artist = p.track.artists[0];
    const t = trackCounts.get(p.track.id) ?? { name: p.track.name, artist: artist?.name ?? "", plays: 0, image: p.track.album.images[0]?.url };
    t.plays++;
    trackCounts.set(p.track.id, t);
    if (artist) {
      const a = artistCounts.get(artist.id) ?? { name: artist.name, plays: 0 };
      a.plays++;
      artistCounts.set(artist.id, a);
    }
  }
  for (const d of r.days) patches[d].listeningMinutes = Math.round(patches[d].listeningMinutes!);

  const byPlays = <T extends { plays: number }>(xs: Iterable<T>) => [...xs].sort((a, b) => b.plays - a.plays);
  let tracks = byPlays(trackCounts.values()).slice(0, 5);
  // Spotify only exposes ~50 recent plays per account; fall back to short-term top tracks.
  if (tracks.length < 3) {
    tracks = topTracks.items.slice(0, 5).map((t, i) => ({
      name: t.name,
      artist: t.artists[0]?.name ?? "",
      plays: trackCounts.get(t.id)?.plays ?? Math.max(1, 5 - i),
      image: t.album.images[0]?.url,
    }));
  }
  const artistImages = new Map(topArtists.items.map((a) => [a.name, a.images?.[0]?.url]));
  const artists = byPlays(artistCounts.values()).slice(0, 5).map((a) => ({ ...a, image: artistImages.get(a.name) }));
  const genres = [...new Set(topArtists.items.flatMap((a) => a.genres ?? []))].slice(0, 3);

  const summary: SpotifySummary = {
    minutes: Math.round(minutes),
    plays: count,
    topTracks: tracks,
    topArtists: artists.length ? artists : topArtists.items.slice(0, 5).map((a, i) => ({ name: a.name, plays: 5 - i, image: a.images?.[0]?.url })),
    topGenres: genres,
    lateNightPlays: late,
  };
  return { patches, summary };
}
