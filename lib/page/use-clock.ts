"use client";

import { useSyncExternalStore } from "react";

/* ---------- Clock: one shared ticker, read after hydration only ---------- */

const MINUTE = 60_000;
const clockListeners = new Set<() => void>();
let clockTimer = 0;
let clockMinute = -1;
let clockDate: Date | null = null;

function subscribeClock(listener: () => void) {
  clockListeners.add(listener);
  if (!clockTimer) {
    clockTimer = window.setInterval(() => clockListeners.forEach((notify) => notify()), 15_000);
  }
  return () => {
    clockListeners.delete(listener);
    if (!clockListeners.size) {
      window.clearInterval(clockTimer);
      clockTimer = 0;
    }
  };
}

function readClock() {
  const minute = Math.floor(Date.now() / MINUTE);
  if (minute !== clockMinute || !clockDate) {
    clockMinute = minute;
    clockDate = new Date(minute * MINUTE);
  }
  return clockDate;
}

/** The current minute, or null during server render and hydration (so SGT status never mismatches). */
export function useClock(): Date | null {
  return useSyncExternalStore(subscribeClock, readClock, () => null);
}

/* ---------- Save-Data ---------- */

function noopSubscribe() {
  return () => undefined;
}

export function readSaveData() {
  return Boolean((navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData);
}

/** True when the visitor asked to save data; false during server render. */
export function useSaveData() {
  return useSyncExternalStore(noopSubscribe, readSaveData, () => false);
}
