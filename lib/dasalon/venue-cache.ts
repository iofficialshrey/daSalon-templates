"use client";

import { useSyncExternalStore } from "react";
import type { BookingBootstrap } from "@/lib/dasalon/types";

/*
 * Live menu and dates for each venue, fetched from /api/dasalon/bootstrap and
 * kept for five minutes. The default venue is seeded from the shared catalog
 * hook; the others are fetched one at a time when the visitor nears them.
 */

export type VenueEntry = {
  data: BookingBootstrap | null;
  error: string;
  loading: boolean;
  at: number;
};

const TTL = 5 * 60_000;
const EMPTY: VenueEntry = { data: null, error: "", loading: false, at: 0 };
const entries = new Map<string, VenueEntry>();
const inflight = new Map<string, Promise<void>>();
const listeners = new Set<() => void>();
let queue: Promise<void> = Promise.resolve();

function set(venueId: string, entry: VenueEntry) {
  entries.set(venueId, entry);
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function fresh(entry: VenueEntry | undefined) {
  return Boolean(entry?.data && Date.now() - entry.at < TTL);
}

/** The shared catalog already holds the default venue; reuse it. */
export function seedVenue(data: BookingBootstrap) {
  const current = entries.get(data.selectedVenueId);
  if (current?.data === data) return;
  set(data.selectedVenueId, { data, error: "", loading: false, at: Date.now() });
}

export function fetchVenue(venueId: string, force = false): Promise<void> {
  if (!force && fresh(entries.get(venueId))) return Promise.resolve();
  const pending = inflight.get(venueId);
  if (pending) return pending;

  const previous = entries.get(venueId) ?? EMPTY;
  set(venueId, { ...previous, loading: !previous.data, error: "" });
  // A hung request fails after 15s, so a menu never shows a skeleton forever.
  const signal = typeof AbortSignal.timeout === "function" ? AbortSignal.timeout(15_000) : undefined;
  const request = fetch(`/api/dasalon/bootstrap?venueId=${encodeURIComponent(venueId)}`, { cache: "no-store", signal })
    .then(async (response) => {
      const payload = await response.json().catch(() => null) as { success?: boolean; data?: BookingBootstrap; message?: string } | null;
      if (!response.ok || !payload?.success || !payload.data) {
        // Credential and server faults keep their wording off the page.
        const internal = response.status === 401 || response.status === 403 || response.status >= 500;
        throw new Error((!internal && payload?.message) || "This menu isn't loading just now.");
      }
      set(venueId, { data: payload.data, error: "", loading: false, at: Date.now() });
    })
    .catch((issue: unknown) => {
      const current = entries.get(venueId) ?? EMPTY;
      set(venueId, {
        ...current,
        loading: false,
        // Network failures and timeouts reject with the browser's own wording; show only messages written here.
        error: issue instanceof Error && !(issue instanceof TypeError) && !(issue instanceof DOMException)
          ? issue.message
          : "This menu isn't loading just now.",
      });
    })
    .finally(() => inflight.delete(venueId));
  inflight.set(venueId, request);
  return request;
}

/** The request already on its way for this venue, if any. */
export function pendingVenue(venueId: string): Promise<void> | undefined {
  return inflight.get(venueId);
}

/** Fetch several venues one after another, 300 ms apart, so the partner API is never hit in a burst. */
export function prefetchVenues(venueIds: string[]) {
  venueIds.forEach((venueId) => {
    queue = queue
      .then(() => fetchVenue(venueId))
      .then(() => new Promise<void>((resolve) => window.setTimeout(resolve, 300)));
  });
  return queue;
}

/** A booking snapshot is only handed to the modal when it matches the venue and is fresh. */
export function snapshotFor(venueId: string | null | undefined): BookingBootstrap | null {
  if (!venueId) return null;
  const entry = entries.get(venueId);
  if (!entry?.data || entry.data.selectedVenueId !== venueId || Date.now() - entry.at > TTL) return null;
  return entry.data;
}

export function useVenueEntry(venueId: string | null | undefined): VenueEntry {
  return useSyncExternalStore(
    subscribe,
    () => (venueId ? entries.get(venueId) ?? EMPTY : EMPTY),
    () => EMPTY,
  );
}
