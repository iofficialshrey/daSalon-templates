"use client";

import Image from "next/image";
import { useEffect, useMemo, type ReactNode } from "react";
import { HOUSE_BY_SLUG, isHouseSlug, type HouseSlug } from "../data/houses";
import { fetchVenue, prefetchVenues, useVenueEntry } from "@/lib/dasalon/venue-cache";
import { factsLine, menuFacts, venueStatus, type VenueStatus } from "@/lib/dasalon/venue-status";
import { venueSlug, titleCase } from "@/lib/dasalon/slug";
import { readSaveData, useClock, useSaveData } from "@/lib/page/use-clock";
import { useMaison } from "./provider";
import s from "./houses.module.css";
import ui from "./ui.module.css";

/*
 * Client islands for the houses section: the live status and meta lines, the
 * card triggers, the proximity prefetch and any extra venue the API adds.
 * The server renders the static card around them, so nothing shifts on load.
 */

/** Under Save-Data nothing is prefetched; a venue is fetched when the visitor reaches for it instead. */
function warmVenue(venueId: string | null | undefined) {
  if (venueId && readSaveData()) void fetchVenue(venueId);
}

/* ---------- Status and meta lines ---------- */

/** Status dot tone: olive when open, bronze for a next opening, quiet when nothing is bookable. */
export function statusToneClass(tone: VenueStatus["tone"] | null | undefined) {
  if (tone === "open") return ui.statusOpen;
  if (tone === "none") return ui.statusQuiet;
  return "";
}

/** "Open now · until 6:00 pm", or the published hours line until live dates arrive. */
export function HouseStatusLine({ slug, className }: { slug: HouseSlug; className?: string }) {
  const { houseBySlug } = useMaison();
  const house = houseBySlug(slug);
  const entry = useVenueEntry(house?.venueId);
  const now = useClock();
  const status = now && house ? venueStatus(house.hours, entry.data, now) : null;
  const fallback = house?.hoursLabel ?? HOUSE_BY_SLUG.get(slug)?.hoursLabel ?? "";
  return (
    <p className={`${ui.status} ${statusToneClass(status?.tone)} ${className ?? ""}`}>
      {status?.text ?? fallback}
    </p>
  );
}

/** "8 services · from S$45", with a 120×14 skeleton while the venue loads. */
export function HouseMetaLine({ slug, className }: { slug: HouseSlug; className?: string }) {
  const { houseBySlug, catalog } = useMaison();
  const house = houseBySlug(slug);
  const venueId = house?.venueId ?? null;
  const entry = useVenueEntry(venueId);
  const saveData = useSaveData();
  const now = useClock();
  const line = now && entry.data ? factsLine(menuFacts(entry.data, now)) : null;

  const pending = venueId
    ? entry.loading || (!entry.data && !entry.error && !saveData)
    : catalog.loading && !catalog.data;

  if (!line && !pending) return null;
  return (
    <p className={`${ui.meta} ${ui.num} ${s.meta} ${className ?? ""}`}>
      {line ?? <span className={`${ui.skeleton} ${s.metaSkeleton}`} aria-hidden="true" />}
    </p>
  );
}

/* ---------- Triggers ---------- */

type TriggerProps = { slug: HouseSlug; className?: string; children: ReactNode };

/** Opens the booking window at this house. */
export function HouseBook({ slug, className, children }: TriggerProps) {
  const { openBooking, prefetchBooking, houseBySlug } = useMaison();
  const venueId = houseBySlug(slug)?.venueId;
  const warm = () => {
    prefetchBooking();
    warmVenue(venueId);
  };
  return (
    <button
      type="button"
      className={className}
      data-book=""
      onClick={() => openBooking({ house: slug })}
      onPointerEnter={warm}
      onFocus={warm}
      onTouchStart={warm}
    >
      {children}
    </button>
  );
}

/** Opens the house sheet (and pushes ?house=slug). */
export function HouseOpen({ slug, className, children }: TriggerProps) {
  const { openHouse, prefetchHouseSheet, houseBySlug } = useMaison();
  const venueId = houseBySlug(slug)?.venueId;
  const warm = () => {
    prefetchHouseSheet();
    warmVenue(venueId);
  };
  return (
    <button
      type="button"
      className={className}
      onClick={() => openHouse(slug)}
      onPointerEnter={warm}
      onFocus={warm}
      onTouchStart={warm}
    >
      {children}
    </button>
  );
}

/* ---------- Proximity prefetch ---------- */

/**
 * When #houses comes within 600px of the viewport, fetch the other houses'
 * live menus one at a time, 300ms apart. The default venue is already in the
 * cache from the shared catalog. Skipped entirely under Save-Data.
 */
export function HousesPrefetch() {
  const { houses, catalog } = useMaison();
  const defaultId = catalog.data?.selectedVenueId ?? null;
  const ids = useMemo(
    () => houses
      .map((house) => house.venueId)
      .filter((id): id is string => Boolean(id) && id !== defaultId),
    [houses, defaultId],
  );

  useEffect(() => {
    if (!defaultId || !ids.length || readSaveData()) return;
    const target = document.getElementById("houses");
    if (!target || typeof IntersectionObserver === "undefined") {
      void prefetchVenues(ids);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();
        void prefetchVenues(ids);
      },
      { rootMargin: "600px 0px" },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [defaultId, ids]);

  return null;
}

/* ---------- Desktop arch ---------- */

const ARCH_EASE = "cubic-bezier(.16, 1, .3, 1)";

/**
 * Desktop: keeps the arch on the house nearest the middle of the screen. Each newly current
 * room wipes up into the arch (down when scrolling back) and settles from a slight zoom;
 * with reduced motion it simply swaps. Renders nothing.
 */
export function HouseStageSync() {
  useEffect(() => {
    const stage = document.querySelector<HTMLElement>("[data-house-stage]");
    if (!stage || typeof IntersectionObserver === "undefined") return;
    const frames = Array.from(stage.querySelectorAll<HTMLElement>("[data-house-frame]"));
    const captions = Array.from(stage.querySelectorAll<HTMLElement>("[data-house-caption]"));
    const count = stage.querySelector<HTMLElement>("[data-house-count]");
    const entries = Array.from(stage.querySelectorAll<HTMLElement>("[data-house-entry]"));
    const desktop = window.matchMedia("(min-width: 1100px)");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    let current = 0;

    const show = (index: number) => {
      const next = frames[index];
      const previous = frames[current];
      if (index === current || !next || !previous) return;
      const direction = index > current ? 1 : -1;
      for (const frame of frames) {
        if (frame !== next && frame !== previous) {
          frame.removeAttribute("data-current");
          frame.removeAttribute("data-previous");
        }
      }
      previous.removeAttribute("data-current");
      previous.setAttribute("data-previous", "");
      next.removeAttribute("data-previous");
      next.setAttribute("data-current", "");
      if (desktop.matches && !reduce.matches && typeof next.animate === "function") {
        next.getAnimations().forEach((animation) => animation.cancel());
        next.animate(
          [{ clipPath: direction > 0 ? "inset(100% 0 0 0)" : "inset(0 0 100% 0)" }, { clipPath: "inset(0 0 0 0)" }],
          { duration: 1100, easing: ARCH_EASE },
        );
        next.querySelector("img")?.animate(
          [{ transform: "scale(1.12)" }, { transform: "scale(1)" }],
          { duration: 1600, easing: ARCH_EASE },
        );
      }
      captions.forEach((caption, position) => caption.toggleAttribute("data-current", position === index));
      if (count) count.textContent = String(index + 1).padStart(2, "0");
      current = index;
    };

    // A thin band across the middle of the screen decides which house is current.
    const observer = new IntersectionObserver(
      (records) => {
        for (const record of records) {
          if (!record.isIntersecting) continue;
          const index = Number((record.target as HTMLElement).dataset.houseEntry);
          if (Number.isInteger(index)) show(index);
        }
      },
      { rootMargin: "-46% 0px -46% 0px" },
    );
    entries.forEach((entry) => observer.observe(entry));
    return () => observer.disconnect();
  }, []);

  return null;
}

/* ---------- Extra venues the static data does not know ---------- */

const FILM_STILL = "/brand-home-1/scroll-film/maison-film-576x768-last.v3.jpg";

/**
 * Any live venue without a static house (for example a renamed one) is appended
 * with its API name, its city as the label and the film's last frame. It has no
 * address or status, because nothing is published for it here.
 */
export function ExtraHouses() {
  const { catalog, openBooking, prefetchBooking } = useMaison();
  const venues = catalog.data?.venues;
  const extras = useMemo(
    () => (venues ?? []).filter((venue) => !isHouseSlug(venueSlug(venue.name))),
    [venues],
  );

  if (!extras.length) return null;
  return (
    <>
      {extras.map((venue) => (
        <li key={venue.id} className={s.entry}>
          <div className={s.media}>
            <Image
              src={FILM_STILL}
              alt=""
              width={576}
              height={768}
              quality={60}
              sizes="(max-width: 759px) 82vw, (max-width: 1099px) 45vw, 1px"
              className={s.mediaImg}
            />
          </div>
          <div className={s.body}>
            <p className={s.kind}>{titleCase(venue.city?.trim() || "Singapore")}</p>
            <h3 className={s.name}>{venue.name}</h3>
            <div className={s.actions}>
              <button
                type="button"
                className={`${ui.btn} ${ui.primary} ${s.book}`}
                data-book=""
                onClick={() => openBooking({ venueId: venue.id })}
                onPointerEnter={prefetchBooking}
                onFocus={prefetchBooking}
                onTouchStart={prefetchBooking}
              >
                Book here<span className={ui.srOnly}>, {venue.name}</span>
              </button>
            </div>
          </div>
        </li>
      ))}
    </>
  );
}
