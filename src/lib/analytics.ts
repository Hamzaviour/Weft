"use client";

import { track as vercelTrack } from "@vercel/analytics";

// Event names and properties are defined in docs/06-tracking.md.
type Props = Record<string, string | number | boolean | null>;

export function track(event: string, props?: Props) {
  try {
    vercelTrack(event, props);
  } catch {
    // Analytics must never break the product.
  }
}
