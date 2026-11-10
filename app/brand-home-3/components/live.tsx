"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type RefObject } from "react";
import { formatDuration, formatPrice } from "@/lib/dasalon/locale";
import type { BookingBootstrap, PublicService } from "@/lib/dasalon/types";
import { fetchVenue, prefetchVenues, useVenueEntry } from "@/lib/dasalon/venue-cache";
import { factsLine, menuFacts, venueStatus } from "@/lib/dasalon/venue-status";
import { VENUE_FACTS } from "@/lib/dasalon/venues";
import { readSaveData, useClock } from "@/lib/page/use-clock";
import { DEFAULT_PLACE, type PlaceSlug } from "../data/places";
import { useSerein } from "./provider";
import ui from "./ui.module.css";

/*
 * Live helpers every section shares. They read the shared venue cache
 * (Serenity is warmed by the provider) and never fetch by themselves, except
 * useWarmPlaces (proximity) and retry(). Server render and hydration always
 * show skeletons: the catalogue, the menus and the clock exist only after.
 */

/* ---------- Entries ---------- */

export type EntryStatus = "loading" | "ready" | "error" | "empty" | "unbound";

export type PlaceEntry = {
  venueId: string | null;
  data: BookingBootstrap | null;
  status: EntryStatus;
  retry: () => void;
};

/** The place's live menu from the shared venue cache (Serenity is seeded/warmed by the provider). Never fetches by itself. */
export function usePlaceEntry(slug: PlaceSlug): PlaceEntry {
  const { placeBySlug, catalog } = useSerein();
  const venueId = placeBySlug(slug)?.venueId ?? null;
  const entry = useVenueEntry(venueId);
  // The catalogue already holds the API's default venue; use it until the cache is seeded.
  const data = entry.data ?? (venueId && catalog.data?.selectedVenueId === venueId ? catalog.data : null);

  let status: EntryStatus;
  if (!venueId) status = catalog.loading ? "loading" : "unbound";
  else if (data) status = data.services.length ? "ready" : "empty";
  else if (entry.error) status = "error";
  else status = "loading";

  const retry = useCallback(() => {
    if (venueId) void fetchVenue(venueId, true);
  }, [venueId]);

  return { venueId, data, status, retry };
}

/** A service by exact live name, then case-insensitive. */
export function findService(services: readonly PublicService[] | null | undefined, name: string): PublicService | null {
  if (!services?.length) return null;
  const lower = name.toLowerCase();
  return services.find((service) => service.name === name) ?? services.find((service) => service.name.toLowerCase() === lower) ?? null;
}

export type ServiceState = "loading" | "ready" | "missing" | "error";

/** A named service on that place's menu (exact name, then case-insensitive). */
export function useLiveService(slug: PlaceSlug, name: string): { state: ServiceState; service: PublicService | null } {
  const { data, status } = usePlaceEntry(slug);
  if (status === "loading") return { state: "loading", service: null };
  if (status === "error" || status === "unbound") return { state: "error", service: null };
  const service = findService(data?.services, name);
  return service ? { state: "ready", service } : { state: "missing", service: null };
}

/**
 * Fetch these places when `ref` comes within `rootMargin` of the viewport (IntersectionObserver, once),
 * through prefetchVenues (one at a time, 300 ms apart). Skipped under Save-Data, except Serenity Spa
 * House: the provider leaves Serein's home to the sections under Save-Data, so it is fetched here.
 */
export function useWarmPlaces(ref: RefObject<HTMLElement | null>, slugs: readonly PlaceSlug[], rootMargin = "800px"): void {
  const { places } = useSerein();
  const [near, setNear] = useState(false);
  const requested = useRef<Set<string>>(new Set());
  const key = slugs.join(",");

  useEffect(() => {
    const element = ref.current;
    if (near || !element) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();
        setNear(true);
      },
      { rootMargin },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [near, ref, rootMargin]);

  useEffect(() => {
    if (!near) return;
    const saveData = readSaveData();
    const ids: string[] = [];
    for (const slug of key.split(",") as PlaceSlug[]) {
      if (saveData && slug !== DEFAULT_PLACE) continue;
      const venueId = places.find((place) => place.slug === slug)?.venueId;
      if (!venueId || requested.current.has(venueId)) continue;
      requested.current.add(venueId);
      ids.push(venueId);
    }
    if (ids.length) void prefetchVenues(ids);
  }, [key, near, places]);
}

/* ---------- "Loading today's prices": said once per page, not per row ---------- */

let loadingAnnounced = false;
let announcement = "";
const announcementListeners = new Set<() => void>();

function subscribeAnnouncement(listener: () => void) {
  announcementListeners.add(listener);
  return () => announcementListeners.delete(listener);
}

function announceLoadingOnce() {
  if (loadingAnnounced) return;
  loadingAnnounced = true;
  announcement = "Loading today's prices";
  announcementListeners.forEach((listener) => listener());
  window.setTimeout(() => {
    announcement = "";
    announcementListeners.forEach((listener) => listener());
  }, 2400);
}

/** The one visually hidden polite region for live prices. Rendered once, by the layout. */
export function LiveAnnouncer() {
  const text = useSyncExternalStore(subscribeAnnouncement, () => announcement, () => "");
  return (
    <p className={ui.srOnly} role="status" aria-live="polite">
      {text}
    </p>
  );
}

function Skeleton({ width, height }: { width: number; height: number }) {
  return <span className={ui.skeleton} style={{ width, height }} aria-hidden="true" />;
}

/* ---------- Service meta ---------- */

/**
 * "1 hr 15 min · S$140" (+ " · {place}" with withPlace); a 96×14 skeleton while loading;
 * "See today's menu" when missing; "Price shown when you book" on error or unbound.
 */
export function ServiceMeta({ slug, name, withPlace = false, className }: { slug: PlaceSlug; name: string; withPlace?: boolean; className?: string }) {
  const { state, service } = useLiveService(slug, name);

  useEffect(() => {
    if (state === "loading") announceLoadingOnce();
  }, [state]);

  if (state === "loading") {
    return (
      <span className={`${ui.ui} ${ui.muted} ${className ?? ""}`}>
        <Skeleton width={96} height={14} />
      </span>
    );
  }
  if (state === "error") {
    return <span className={`${ui.small} ${ui.muted} ${className ?? ""}`}>Price shown when you book</span>;
  }
  if (!service) {
    return <span className={`${ui.small} ${ui.muted} ${className ?? ""}`}>See today&apos;s menu</span>;
  }
  return (
    <span className={`${ui.ui} ${ui.muted} ${className ?? ""}`}>
      {formatDuration(service.duration)} · {formatPrice(service.price)}
      {withPlace ? ` · ${VENUE_FACTS[slug].name}` : null}
    </span>
  );
}

/* ---------- Status ---------- */

const DOT = { open: ui.dotOpen, next: ui.dotNext, none: ui.dotNone } as const;

/**
 * 8px dot + "{place} · Open now · until 6:00 pm" (withName) via venueStatus(VENUE_FACTS[slug].hours, data, useClock()).
 * A 160×13 skeleton until the clock and data exist; the static hoursLabel on error or unbound.
 * onDark switches the dot colours (text follows the tone).
 */
export function StatusLine({ slug, withName = false, onDark = false, className }: { slug: PlaceSlug; withName?: boolean; onDark?: boolean; className?: string }) {
  const { data, status } = usePlaceEntry(slug);
  const clock = useClock();
  const facts = VENUE_FACTS[slug];
  const classes = `${ui.status} ${onDark ? ui.statusDark : ""} ${className ?? ""}`;
  const prefix = withName ? `${facts.name} · ` : "";

  if (status === "error" || status === "unbound") {
    return (
      <span className={classes}>
        <span className={ui.dotNone} aria-hidden="true" />
        <span>{prefix}{facts.hoursLabel}</span>
      </span>
    );
  }

  const live = data && clock ? venueStatus(facts.hours, data, clock) : null;
  if (!live) {
    return (
      <span className={classes}>
        <Skeleton width={160} height={13} />
      </span>
    );
  }

  return (
    <span className={classes}>
      <span className={DOT[live.tone]} aria-hidden="true" />
      <span>{prefix}{live.text}</span>
    </span>
  );
}

/* ---------- Facts ---------- */

/**
 * factsLine(menuFacts(data, now)) → "14 services · from S$45"; renders nothing until ready
 * (or a 120×13 skeleton while loading, with `skeleton`), and nothing on error or unbound.
 */
export function FactsLine({ slug, className, skeleton = false }: { slug: PlaceSlug; className?: string; skeleton?: boolean }) {
  const { data, status } = usePlaceEntry(slug);
  const clock = useClock();
  const ready = (status === "ready" || status === "empty") && data && clock;

  if (ready) return <span className={`${ui.small} ${ui.num} ${className ?? ""}`}>{factsLine(menuFacts(data, clock))}</span>;
  // Loading, or data in hand while the clock starts after hydration.
  if (skeleton && status !== "error" && status !== "unbound") {
    return (
      <span className={className}>
        <Skeleton width={120} height={13} />
      </span>
    );
  }
  return null;
}
