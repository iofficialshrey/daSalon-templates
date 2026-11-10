"use client";

import { useSyncExternalStore } from "react";

/*
 * "Lite" visitors get a still page with no film bytes and no speculative
 * prefetching: reduced motion, Save-Data, 2G, or a device with ≤ 2 GB memory.
 */

type NavigatorExtras = Navigator & {
  connection?: { saveData?: boolean; effectiveType?: string };
  deviceMemory?: number;
};

const REDUCED_QUERY = "(prefers-reduced-motion: reduce)";

export function liteSnapshot() {
  const nav = navigator as NavigatorExtras;
  return window.matchMedia(REDUCED_QUERY).matches
    || nav.connection?.saveData === true
    || nav.connection?.effectiveType === "2g"
    || nav.connection?.effectiveType === "slow-2g"
    || (typeof nav.deviceMemory === "number" && nav.deviceMemory <= 2);
}

export function subscribeLite(onChange: () => void) {
  const query = window.matchMedia(REDUCED_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

/** True for lite visitors; false during server render and hydration. */
export function useLite() {
  return useSyncExternalStore(subscribeLite, liteSnapshot, () => false);
}

function subscribeReduced(onChange: () => void) {
  const query = window.matchMedia(REDUCED_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

/** prefers-reduced-motion; false during server render. */
export function useReducedMotion() {
  return useSyncExternalStore(subscribeReduced, () => window.matchMedia(REDUCED_QUERY).matches, () => false);
}
