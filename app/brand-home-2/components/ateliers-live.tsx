"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode, type SyntheticEvent } from "react";
import { ATELIERS, atelierBySlug as staticAtelier, type AtelierSlug } from "../data/ateliers";
import { unknownVenues, venueIdsBySlug } from "../lib/match";
import { fetchVenue, prefetchVenues, seedVenue, useVenueEntry } from "@/lib/dasalon/venue-cache";
import { factsLine, menuFacts, venueStatus, type StatusWords } from "@/lib/dasalon/venue-status";
import { useClock, useSaveData } from "@/lib/page/use-clock";
import { useAtelier, type LiveAtelier } from "./provider";
import styles from "./ateliers.module.css";
import ui from "./ui.module.css";

/* ---------- Live venue reads, shared with the atelier pages ---------- */

/** Template 2 status wording: dates are working days, never free slots. */
export const STATUS_WORDS: StatusWords = {
  today: "Bookable today",
  next: (day) => `Next bookable day: ${day}`,
};

/**
 * One atelier's live menu and dates. The default venue reads straight from the
 * shared catalog (so it never waits for the cache seed); the others from the
 * venue cache. `unmatched` means the catalog answered and no venue bears this
 * atelier's name, so the page falls back to its static facts.
 */
export function useLiveVenue(slug: AtelierSlug) {
  const { atelierBySlug, catalog } = useAtelier();
  const atelier: LiveAtelier = atelierBySlug(slug) ?? { ...staticAtelier(slug)!, venueId: null };
  const venueId = atelier.venueId;
  const entry = useVenueEntry(venueId);
  const seeded = venueId && catalog.data?.selectedVenueId === venueId ? catalog.data : null;
  const data = entry.data ?? seeded;
  const unmatched = !venueId && !catalog.loading;
  const loading = !data && !unmatched && (catalog.loading || entry.loading);
  return { atelier, venueId, data, error: entry.error, loading, unmatched };
}

/**
 * Loads a venue once it is known. The provider seeds the cache from the
 * catalog in its own effect, which runs after this one, so seed here first
 * rather than fetch the default venue twice.
 */
export function useEnsureVenue(venueId: string | null) {
  const { catalog } = useAtelier();
  const catalogData = catalog.data;
  useEffect(() => {
    if (!venueId) return;
    if (catalogData) seedVenue(catalogData);
    void fetchVenue(venueId);
  }, [venueId, catalogData]);
}

/* ---------- Row facts ---------- */

type LineProps = { slug: AtelierSlug; className?: string };

/** The static hours label on the server; the live SGT status once hydrated. */
export function AtelierStatus({ slug, className }: LineProps) {
  const { atelier, data } = useLiveVenue(slug);
  const now = useClock();
  const status = now ? venueStatus(atelier.hours, data, now, STATUS_WORDS) : null;
  return (
    <p className={className}>
      {status?.tone === "open" ? <span className={`${ui.dot} ${styles.statusDot}`} aria-hidden="true" /> : null}
      <span>{status?.text ?? atelier.hoursLabel}</span>
    </p>
  );
}

/** "8 services · from S$10", a quiet placeholder while it loads. */
export function AtelierMeta({ slug, className, placeholderClassName }: LineProps & { placeholderClassName?: string }) {
  const { data, loading } = useLiveVenue(slug);
  const line = data ? factsLine(menuFacts(data)) : null;
  return (
    <p className={className}>
      {line ?? (loading ? <span className={placeholderClassName ?? styles.metaPlaceholder} aria-hidden="true" /> : null)}
    </p>
  );
}

/* ---------- The list body: venue prefetch and intent ---------- */

/**
 * Wraps the server-rendered list. The other venues load (one at a time) once
 * the section is within 800px, or on interaction when the visitor has asked
 * to save data; hovering or focusing a card warms that venue first.
 */
export function AteliersLive({ children }: { children: ReactNode }) {
  const { ateliers, catalog } = useAtelier();
  const saveData = useSaveData();
  const ref = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);
  const warmed = useRef<AtelierSlug | null>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node || near) return;
    const target = node.closest("section") ?? node;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setNear(true);
          observer.disconnect();
        }
      },
      { rootMargin: "800px 0px" },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [near]);

  const defaultVenue = catalog.data?.selectedVenueId ?? null;
  const othersKey = useMemo(
    () => ateliers
      .map((atelier) => atelier.venueId)
      .filter((id): id is string => Boolean(id) && id !== defaultVenue)
      .join(","),
    [ateliers, defaultVenue],
  );

  useEffect(() => {
    if (!near || saveData || !othersKey) return;
    void prefetchVenues(othersKey.split(","));
  }, [near, saveData, othersKey]);

  const onIntent = (event: SyntheticEvent) => {
    const card = event.target instanceof Element ? event.target.closest<HTMLElement>("[data-atelier]") : null;
    const atelier = staticAtelier(card?.dataset.atelier);
    if (!atelier || atelier.slug === warmed.current) return;
    warmed.current = atelier.slug;
    const venueId = ateliers.find((item) => item.slug === atelier.slug)?.venueId;
    if (venueId) void fetchVenue(venueId);
  };

  return (
    <div ref={ref} className={styles.live} onPointerOver={onIntent} onFocus={onIntent}>
      {children}
    </div>
  );
}

/* ---------- Venues the API lists that match no atelier ---------- */

const NUMERALS: ReadonlyArray<[number, string]> = [[10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"]];

function roman(value: number) {
  let rest = value;
  let out = "";
  for (const [size, glyph] of NUMERALS) {
    while (rest >= size) {
      out += glyph;
      rest -= size;
    }
  }
  return out;
}

/** Plain cards "V", "VI"… with the API name and Book; no photograph, address or status. */
export function ExtraAtelierRows() {
  const { catalog, openBooking, prefetchBooking } = useAtelier();
  const venues = catalog.data?.venues;
  const extras = useMemo(() => unknownVenues(venues, venueIdsBySlug(venues)), [venues]);
  if (!extras.length) return null;

  return extras.map((venue, index) => {
    const book = (block: boolean) => (
      <button
        type="button"
        className={`${ui.btn} ${ui.secondary} ${ui.sm} ${block ? ui.block : ""}`}
        data-book=""
        aria-label={`Book at ${venue.name}`}
        onClick={() => openBooking({ venueId: venue.id })}
        onPointerEnter={prefetchBooking}
        onFocus={prefetchBooking}
        onTouchStart={prefetchBooking}
      >
        Book
      </button>
    );
    return (
      <li key={venue.id} className={`${styles.card} ${styles.extra}`}>
        <div className={styles.media} aria-hidden="true">
          <span className={styles.no}>{roman(ATELIERS.length + index + 1)}</span>
        </div>
        <div className={styles.body}>
          <p className={styles.trade}>Singapore</p>
          <h3 className={styles.name}>{venue.name}</h3>
          <div className={styles.actions}>{book(false)}</div>
        </div>
      </li>
    );
  });
}
