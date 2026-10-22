import type { Source } from "./types";

export const THREAD_HEX: Record<Source, string> = {
  calendar: "#F5A524",
  spotify: "#8B6CF6",
  github: "#1FB98A",
  health: "#F2546A",
};

// Darker versions for text on light surfaces.
export const THREAD_INK: Record<Source, string> = {
  calendar: "#A35F00",
  spotify: "#6847D6",
  github: "#0B7F5C",
  health: "#C22E4A",
};

export const THREAD_VAR: Record<Source | "mixed", string> = {
  calendar: "var(--ink-time)",
  spotify: "var(--ink-sound)",
  github: "var(--ink-craft)",
  health: "var(--ink-body)",
  mixed: "var(--bone)",
};

export const THREAD_NAME: Record<Source, string> = {
  calendar: "Time",
  spotify: "Sound",
  github: "Craft",
  health: "Body",
};

export function hexAlpha(hex: string, alpha: number) {
  const a = Math.round(Math.max(0, Math.min(1, alpha)) * 255)
    .toString(16)
    .padStart(2, "0");
  return `${hex}${a}`;
}
