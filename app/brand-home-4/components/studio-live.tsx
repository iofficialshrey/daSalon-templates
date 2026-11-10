"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, type MouseEvent as ReactMouseEvent, type ReactNode } from "react";
import { formatDuration } from "@/lib/dasalon/locale";
import { fetchVenue, prefetchVenues, useVenueEntry } from "@/lib/dasalon/venue-cache";
import { venueStatus } from "@/lib/dasalon/venue-status";
import { isVenueSlug } from "@/lib/dasalon/venues";
import { jumpTo } from "@/lib/page/jump";
import { useLite } from "@/lib/page/lite";
import { useClock } from "@/lib/page/use-clock";
import type { StudioSlug } from "../data/studios";
import { focusCheckedStudio } from "./edit-focus";
import { ArrowRight, Plus } from "./icons";
import { usePaloma } from "./provider";
import { openStudioFile, toggleStudioFile, useStudioFiles } from "./studio-file-store";
import { CONSULT, factsText, menuVenues, priceText, quickPicks, serviceTax, spokenTax, statusClass } from "./studio-format";
import s from "./studios.module.css";
import ui from "./ui.module.css";

/*
 * Client islands for 07 — Studios. The server renders every row (names,
 * addresses and hours are in the HTML); these add the live status and facts,
 * the gatefold file toggle, the three quick-book rows, any live venue outside
 * the four, the proximity prefetch and #studio-{slug} deep links.
 */

const QUICK_SKELETON = ["a", "b", "c"] as const;

function plainClick(event: ReactMouseEvent) {
  return event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;
}

/** One studio's live menu: its own cache entry, or the shared catalog when it is the API's default venue. */
function useStudioLive(slug: StudioSlug) {
  const { studioBySlug, catalog } = usePaloma();
  const studio = studioBySlug(slug);
  const venueId = studio?.venueId ?? null;
  const entry = useVenueEntry(venueId);
  const isDefault = venueId !== null && venueId === catalog.data?.selectedVenueId;
  const data = entry.data ?? (isDefault ? catalog.data : null);
  // No menu is on its way: the catalog failed, the studio is not online, or its own request failed.
  const failed = !data && (venueId ? Boolean(entry.error) && !entry.loading : !catalog.loading);
  return { studio, venueId, entry, data, failed, catalog };
}

/* ---------- Status and facts ---------- */

type LineProps = { slug: StudioSlug; className?: string };

/**
 * "Open now · until 6:00 pm", after hydration only. Until then a skeleton holds
 * its line; without live dates it reads `fallback` (the published hours).
 */
export function StudioStatus({ slug, className, fallback }: LineProps & { fallback?: string }) {
  const { studio, venueId, entry, data, failed } = useStudioLive(slug);
  const lite = useLite();
  const now = useClock();
  const status = now && studio ? venueStatus(studio.hours, data, now) : null;
  if (status) return <p className={`${statusClass(status)} ${className ?? ""}`}>{status.text}</p>;
  // Lite visitors fetch a studio only when they reach for it, so nothing is "on its way" for them.
  const waiting = !now || (!failed && (entry.loading || !lite || !venueId));
  if (waiting) {
    return (
      <p className={`${s.hold} ${className ?? ""}`} aria-hidden="true">
        <span className={`${ui.skeleton} ${s.statusSkel}`} />
      </p>
    );
  }
  return <p className={`${ui.small} ${className ?? ""}`}>{fallback ?? studio?.hoursLabel}</p>;
}

/** "14 services · from S$45", with a skeleton while the menu is on its way. */
export function StudioFacts({ slug, className }: LineProps) {
  const { venueId, entry, data, failed } = useStudioLive(slug);
  const lite = useLite();
  const facts = factsText(data);
  if (facts) return <p className={className}>{facts}</p>;
  if (failed || (lite && venueId && !entry.loading)) return null;
  return (
    <p className={`${s.hold} ${className ?? ""}`} aria-hidden="true">
      <span className={`${ui.skeleton} ${s.factsSkel}`} />
    </p>
  );
}

/* ---------- The gatefold ---------- */

/** "Studio file": unfolds the file under its row. The clicked row stays where it is when another file shuts. */
export function StudioFileToggle({ slug, name, className }: { slug: StudioSlug; name: string; className?: string }) {
  const files = useStudioFiles();
  const open = files.open === slug;
  const anchor = useRef<number | null>(null);

  useLayoutEffect(() => {
    const before = anchor.current;
    anchor.current = null;
    if (before === null) return;
    const row = document.getElementById(`studio-${slug}`);
    if (!row) return;
    const delta = row.getBoundingClientRect().top - before;
    if (Math.abs(delta) >= 1) window.scrollBy({ top: delta, behavior: "instant" });
  }, [open, slug]);

  return (
    <button
      type="button"
      className={className}
      aria-expanded={open}
      aria-controls={`studio-${slug}-file`}
      onClick={() => {
        if (!open) anchor.current = document.getElementById(`studio-${slug}`)?.getBoundingClientRect().top ?? null;
        toggleStudioFile(slug);
      }}
    >
      <span>
        Studio file<span className={ui.srOnly}>{`, ${name}`}</span>
      </span>
      <Plus className={s.toggleIcon} />
    </button>
  );
}

/**
 * The file region. It unfolds (grid rows 0fr → 1fr), folds back, then takes
 * the hidden attribute so nothing inside it can be focused while shut.
 */
export function StudioFile({ slug, labelledBy, children }: { slug: StudioSlug; labelledBy: string; children: ReactNode }) {
  const files = useStudioFiles();
  const { studioBySlug, catalog } = usePaloma();
  const venueId = studioBySlug(slug)?.venueId ?? null;
  const defaultVenueId = catalog.data?.selectedVenueId;
  const open = files.open === slug;
  const folding = files.closing === slug;
  const jumped = useRef(0);

  // Opening asks for the menu; the cache makes it a no-op while fresh. The default venue comes
  // with the catalog (seeded by the provider, whose effect runs after this one), so skip it.
  useEffect(() => {
    if (open && venueId && venueId !== defaultVenueId) void fetchVenue(venueId);
  }, [open, venueId, defaultVenueId]);

  // "About this studio" and #studio-{slug}: the row comes under the header and its name takes focus.
  useEffect(() => {
    const jump = files.jump;
    if (!open || !jump || jump.slug !== slug || jump.seq === jumped.current) return;
    jumped.current = jump.seq;
    jumpTo(`studio-${slug}`);
  }, [open, files.jump, slug]);

  return (
    <div
      id={`studio-${slug}-file`}
      role="region"
      aria-labelledby={labelledBy}
      className={s.file}
      data-open={open ? "true" : "false"}
      hidden={!open && !folding}
    >
      <div className={s.fileClip}>{children}</div>
    </div>
  );
}

/** Three live services, each one tap from the Day & time step at this studio. */
export function StudioQuickRows({ slug, labelledBy }: { slug: StudioSlug; labelledBy: string }) {
  const { studio, venueId, data, failed, catalog } = useStudioLive(slug);
  const { openBooking, prefetchBooking } = usePaloma();
  const picks = useMemo(() => (data ? quickPicks(data.services) : []), [data]);
  if (!studio) return null;

  if (!data && !failed) {
    return (
      <div>
        <p className={ui.srOnly}>{`Loading the menu at ${studio.name}…`}</p>
        <ul className={s.quickList} aria-hidden="true">
          {QUICK_SKELETON.map((key) => (
            <li key={key} className={s.quickSkel}>
              <span className={`${ui.skeleton} ${s.quickSkelBar}`} />
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (!data) {
    return (
      <div className={s.quickState}>
        <p className={ui.bodyS}>This menu isn’t loading just now.</p>
        <button
          type="button"
          className={`${ui.btn} ${ui.btnLine}`}
          onClick={() => {
            if (venueId) void fetchVenue(venueId, true);
            else void catalog.refresh();
          }}
        >
          Try again
        </button>
      </div>
    );
  }

  if (!picks.length) {
    return <p className={`${ui.bodyS} ${s.quickState}`}>{`${studio.name} has no services open for online booking at the moment.`}</p>;
  }

  return (
    <ul className={s.quickList} aria-labelledby={labelledBy}>
      {picks.map((service) => {
        const duration = formatDuration(service.duration);
        const price = priceText(service.price) ?? CONSULT;
        const tax = serviceTax(service);
        return (
          <li key={service.id}>
            <button
              type="button"
              className={s.quick}
              data-book=""
              aria-label={`Book ${service.name} at ${studio.name}, ${duration}, ${price}${spokenTax(tax)}`}
              onClick={(event) => openBooking({ slug, serviceId: service.id }, { returnTo: event.currentTarget })}
              onPointerEnter={prefetchBooking}
              onFocus={prefetchBooking}
            >
              <span className={s.quickName}>{service.name}</span>
              <span className={s.quickMeta}>
                {`${duration} · ${price}`}
                {tax ? <span className={s.quickTax}>{tax}</span> : null}
              </span>
              <span className={s.quickBook} aria-hidden="true">
                Book
                <ArrowRight />
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

/** "See the full menu": this studio becomes the page's studio, then the edit opens on it. */
export function SeeFullMenu({ slug, name, className }: { slug: StudioSlug; name: string; className?: string }) {
  const { setCurrentStudio } = usePaloma();
  return (
    <a
      href="#edit"
      className={className}
      onClick={(event) => {
        if (!plainClick(event)) return;
        event.preventDefault();
        setCurrentStudio(slug);
        window.requestAnimationFrame(() => {
          jumpTo("edit", { focus: false });
          focusCheckedStudio();
        });
      }}
    >
      <span>
        See the full menu<span className={ui.srOnly}>{` at ${name}`}</span>
      </span>
      <ArrowRight />
    </a>
  );
}

/* ---------- A live venue outside the four ---------- */

/** Plain "05 · {City}" rows: the name, "Address shown when you book" and Book. No file. */
export function StudioExtraRows() {
  const { studios, catalog, openBooking, prefetchBooking } = usePaloma();
  const liveVenues = catalog.data?.venues;
  const extras = useMemo(() => menuVenues(studios, liveVenues).filter((venue) => !venue.slug), [studios, liveVenues]);
  return (
    <>
      {extras.map((venue) => (
        <li key={venue.key} id={`studio-${venue.key}`} className={s.row}>
          <div className={s.rowGrid}>
            <p className={`${ui.label} ${s.rowMeta}`}>
              <span className={`${ui.num} ${s.rowNo}`}>{venue.no}</span>
              <span className={s.rowSep}> · </span>
              <span>{venue.area}</span>
            </p>
            <div className={s.rowName}>
              <h3 className={`${ui.displayM} ${s.name}`}>{venue.name}</h3>
            </div>
            <div className={s.rowWhere}>
              <p className={s.address}>Address shown when you book</p>
            </div>
            <div className={s.rowActions}>
              <button
                type="button"
                className={`${ui.btn} ${ui.btnPrimary} ${s.rowBook}`}
                data-book=""
                aria-label={`Book at ${venue.name}`}
                onClick={(event) => openBooking({ venueId: venue.venueId }, { returnTo: event.currentTarget })}
                onPointerEnter={prefetchBooking}
                onFocus={prefetchBooking}
              >
                Book
                <ArrowRight />
              </button>
            </div>
          </div>
        </li>
      ))}
    </>
  );
}

/* ---------- Prefetch and deep links ---------- */

/**
 * When #studios comes within a viewport, any studio menu not yet cached loads
 * (one at a time; never for lite visitors). After hydration #studio-{slug}
 * opens that file under its row; it is put back once if the menu above grows.
 */
export function StudiosWatch() {
  const { studios, catalog } = usePaloma();
  const lite = useLite();
  const defaultId = catalog.data?.selectedVenueId ?? null;
  const ids = useMemo(
    () => studios.map((studio) => studio.venueId).filter((id): id is string => Boolean(id) && id !== defaultId),
    [studios, defaultId],
  );

  const prefetched = useRef(false);
  useEffect(() => {
    if (lite || prefetched.current || !defaultId || !ids.length) return;
    const section = document.getElementById("studios");
    if (!section) return;
    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      observer.disconnect();
      prefetched.current = true;
      void prefetchVenues(ids);
    }, { rootMargin: "0px 0px 100% 0px" });
    observer.observe(section);
    return () => observer.disconnect();
  }, [lite, ids, defaultId]);

  const settle = useRef<StudioSlug | null>(null);
  useEffect(() => {
    const follow = () => {
      const id = decodeURIComponent(window.location.hash.slice(1));
      const slug = id.startsWith("studio-") ? id.slice(7) : "";
      if (!isVenueSlug(slug)) return;
      settle.current = slug;
      openStudioFile(slug, { jump: true });
    };
    // Once the guest scrolls or types, the page is theirs: no corrective jump.
    const release = () => {
      settle.current = null;
    };
    const frame = window.requestAnimationFrame(follow);
    window.addEventListener("hashchange", follow);
    window.addEventListener("wheel", release, { passive: true });
    window.addEventListener("touchstart", release, { passive: true });
    window.addEventListener("keydown", release);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("hashchange", follow);
      window.removeEventListener("wheel", release);
      window.removeEventListener("touchstart", release);
      window.removeEventListener("keydown", release);
    };
  }, []);

  // The live menu above arrives after the jump and adds rows: put the deep-linked row back once.
  useEffect(() => {
    const slug = settle.current;
    if (catalog.loading || !slug) return;
    settle.current = null;
    const frame = window.requestAnimationFrame(() => jumpTo(`studio-${slug}`, { focus: false }));
    return () => window.cancelAnimationFrame(frame);
  }, [catalog.loading]);

  return null;
}
