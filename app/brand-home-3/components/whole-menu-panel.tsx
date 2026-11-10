"use client";

import { useEffect, useRef } from "react";
import { formatDuration, formatPrice } from "@/lib/dasalon/locale";
import { categorySlug } from "@/lib/dasalon/slug";
import { fetchVenue, prefetchVenues } from "@/lib/dasalon/venue-cache";
import { groupByCategory } from "@/lib/dasalon/venue-status";
import { readSaveData } from "@/lib/page/use-clock";
import { PLACES, placeBySlug, subLine, type PlaceSlug } from "../data/places";
import { BookButton } from "./book-button";
import { ArrowUpRight } from "./icons";
import { FactsLine, StatusLine, usePlaceEntry } from "./live";
import { setMenuPlace } from "./menu-store";
import { useSerein } from "./provider";
import { MenuSkeleton } from "./whole-menu";
import ui from "./ui.module.css";
import styles from "./rituals.module.css";

/*
 * The body of "05 · The whole menu", loaded by whole-menu.tsx (next/dynamic) on
 * the first open and kept mounted after. The chosen place is fetched on open and
 * on tab change, and refreshed every 60 s while open (fetchVenue is a no-op while
 * fresh). The first open warms the other three places one at a time, except
 * under Save-Data. The status line lives in whole-menu.tsx, so it exists before
 * this code arrives.
 */

const REFRESH_MS = 60_000;

/** offline: the catalogue itself failed, so no place could be bound. */
type View = "loading" | "ready" | "error" | "empty" | "unmatched" | "offline";

export default function WholeMenuPanel({ open, slug }: { open: boolean; slug: PlaceSlug }) {
  const { places, catalog, setCurrentPlace } = useSerein();
  const place = placeBySlug(slug);
  const { venueId, data, status, retry } = usePlaceEntry(slug);
  const warmed = useRef(false);

  useEffect(() => {
    if (!open || !venueId) return;
    void fetchVenue(venueId);
    const timer = window.setInterval(() => void fetchVenue(venueId), REFRESH_MS);
    return () => window.clearInterval(timer);
  }, [open, venueId]);

  // The chosen place goes first in the queue (its request is already in flight), then the others, 300 ms apart.
  useEffect(() => {
    if (!open || warmed.current) return;
    const others = places
      .filter((item) => item.slug !== slug)
      .map((item) => item.venueId)
      .filter((id): id is string => Boolean(id));
    if (!others.length) return;
    warmed.current = true;
    if (readSaveData()) return;
    void prefetchVenues(venueId ? [venueId, ...others] : others);
  }, [open, places, slug, venueId]);

  let view: View;
  if (status === "unbound") view = catalog.data ? "unmatched" : "offline";
  else view = status;

  const groups = view === "ready" && data ? groupByCategory(data.services, categorySlug) : [];

  const choose = (next: PlaceSlug) => {
    setCurrentPlace(next);
    setMenuPlace(next);
  };

  const bookHere = (
    <BookButton slug={slug} className={`${ui.btn} ${ui.sm} ${ui.secondary}`}>
      {`Book at ${place.name}`}
    </BookButton>
  );

  return (
    <>
      <fieldset className={styles.tabs}>
        <legend className={ui.label}>Choose a place</legend>
        <div className={styles.tabRow}>
          {PLACES.map((item) => (
            <label key={item.slug} className={styles.tab}>
              <input
                type="radio"
                name="sr-menu-place"
                value={item.slug}
                checked={item.slug === slug}
                onChange={() => choose(item.slug)}
                className={ui.srOnly}
              />
              <span className={styles.tabName}>{item.name}</span>
              <span className={`${ui.small} ${styles.tabSub}`}>{subLine(item)}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className={styles.placeLine}>
        <p className={ui.small}>{`${place.address} · ${place.hoursLabel}`}</p>
        <StatusLine slug={slug} />
        {/* The empty state says it in full below. */}
        {view !== "empty" ? <FactsLine slug={slug} className={ui.muted} /> : null}
      </div>

      {view === "loading" ? <MenuSkeleton /> : null}

      {view === "ready" ? (
        <div className={styles.groups}>
          {groups.map((group) => (
            <div key={group.slug} className={styles.menuGroup}>
              <h4 className={`${ui.label} ${styles.menuGroupTitle}`}>{group.category}</h4>
              <ul>
                {group.services.map((service) => (
                  <li key={service.id} className={styles.item}>
                    <span className={`${ui.serif} ${styles.serviceName}`}>{service.name}</span>
                    <span className={`${ui.ui} ${ui.muted} ${styles.itemMeta}`}>
                      {`${formatDuration(service.duration)} · ${formatPrice(service.price)}`}
                    </span>
                    <BookButton
                      slug={slug}
                      serviceId={service.id}
                      srSuffix={` ${service.name} at ${place.name}`}
                      className={`${ui.text} ${styles.itemBook}`}
                    >
                      Book
                    </BookButton>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ) : null}

      {view === "error" || view === "offline" ? (
        <div className={styles.state}>
          <p className={ui.body}>{`We couldn't load the menu at ${place.name} just now.`}</p>
          <div className={styles.stateActions}>
            <button type="button" className={ui.text} onClick={view === "error" ? retry : () => void catalog.refresh()}>
              Try again
            </button>
            {bookHere}
          </div>
        </div>
      ) : null}

      {view === "empty" ? (
        <div className={styles.state}>
          <p className={ui.body}>{`${place.name} has no online services at the moment. You can still book and choose at the place.`}</p>
          <div className={styles.stateActions}>{bookHere}</div>
        </div>
      ) : null}

      {view === "unmatched" ? (
        <div className={styles.state}>
          <p className={ui.body}>{`${place.name} isn't taking online bookings at the moment.`}</p>
          <div className={styles.stateActions}>
            <a className={ui.text} href={place.directionsUrl} target="_blank" rel="noopener noreferrer">
              <span>
                Directions
                <span className={ui.srOnly}>{` to ${place.name} (opens Google Maps in a new tab)`}</span>
              </span>
              <ArrowUpRight />
            </a>
          </div>
        </div>
      ) : null}

      {view === "ready" || view === "loading" ? (
        <div className={styles.menuFoot}>
          {bookHere}
          <p className={`${ui.small} ${ui.muted}`}>
            Prices in Singapore dollars, from the live menu. You pay on the day, after your visit.
          </p>
        </div>
      ) : null}
    </>
  );
}
