"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { ATELIERS, atelierHref, type AtelierSlug } from "../data/ateliers";
import { fetchVenue, useVenueEntry } from "@/lib/dasalon/venue-cache";
import { formatPrice } from "@/lib/dasalon/locale";
import { categorySlug } from "@/lib/dasalon/slug";
import type { PublicService } from "@/lib/dasalon/types";
import { groupByCategory } from "@/lib/dasalon/venue-status";
import { AtelierLink } from "./ateliers-link";
import { useEnsureVenue } from "./ateliers-live";
import { BookButton } from "./book-button";
import { Alert, ArrowRight } from "./icons";
import { useAtelier } from "./provider";
import { ServiceTag } from "./service-tag";
import styles from "./collection.module.css";
import ui from "./ui.module.css";

/* ---------- Grouping: API category order ---------- */

type Line = {
  category: string;
  slug: string;
  count: string;
  services: { service: PublicService; number: number }[];
};

const NO_SERVICES: PublicService[] = [];

function linesOf(services: PublicService[]): Line[] {
  let number = 0;
  return groupByCategory(services, categorySlug).map((group) => {
    const prices = group.services.map((service) => service.price).filter((price) => price > 0);
    const size = group.services.length;
    const from = prices.length ? ` · from ${formatPrice(Math.min(...prices))}` : "";
    return {
      category: group.category,
      slug: group.slug,
      count: `${size} ${size === 1 ? "service" : "services"}${from}`,
      services: group.services.map((service) => ({ service, number: (number += 1) })),
    };
  });
}

/* ---------- Placeholders ---------- */

const SKELETON_TAGS = 7;

function Skeleton() {
  return (
    <div className={styles.group} aria-hidden="true">
      <div className={styles.lineCard}>
        <span className={`${styles.skeleton} ${styles.skeletonTitle}`} />
        <span className={`${styles.skeleton} ${styles.skeletonCount}`} />
      </div>
      {Array.from({ length: SKELETON_TAGS }, (_, index) => (
        <div key={index} className={styles.skeletonTag}>
          <span className={`${styles.skeleton} ${styles.skeletonNo}`} />
          <span className={`${styles.skeleton} ${styles.skeletonName}`} />
          <span className={`${styles.skeleton} ${styles.skeletonPrice}`} />
        </div>
      ))}
    </div>
  );
}

/* ---------- The collection ---------- */

type View = "pending" | "loading" | "ready" | "empty" | "error";

const HOLD_MS = 600;

/**
 * Every live service of one atelier as a menu: each category a heading and its
 * rows (name, a line of description, time and price), set in two columns on
 * wide screens. On the home page a sticky switcher (native radios) chooses the
 * atelier; on an atelier page the atelier is fixed.
 */
export function Collection({ slug }: { slug?: AtelierSlug }) {
  const { ateliers, atelierBySlug, catalog, currentAtelier, setCurrentAtelier, openBooking, prefetchBooking } = useAtelier();
  const home = !slug;
  const uid = useId();
  const sectionId = home ? "services" : "collection";
  const titleId = `${sectionId}-title`;

  // Home: the guest's current atelier, else the catalog's default venue, else the first atelier.
  const defaultVenue = catalog.data?.selectedVenueId ?? null;
  const defaultSlug = useMemo(
    () => (defaultVenue ? ateliers.find((atelier) => atelier.venueId === defaultVenue)?.slug ?? null : null),
    [ateliers, defaultVenue],
  );
  const selectedSlug: AtelierSlug | null = slug
    ?? currentAtelier
    ?? defaultSlug
    ?? (catalog.loading ? null : ATELIERS[0].slug);
  const atelier = atelierBySlug(selectedSlug) ?? null;
  const venueId = atelier?.venueId ?? null;
  const entry = useVenueEntry(venueId);
  const data = entry.data ?? (venueId && catalog.data?.selectedVenueId === venueId ? catalog.data : null);
  useEnsureVenue(venueId);
  // Keep the menu on screen fresh, so its tags keep opening at the Time step after the 5-minute
  // TTL; fetchVenue is a no-op while the entry is still fresh.
  useEffect(() => {
    if (!venueId) return;
    const timer = window.setInterval(() => void fetchVenue(venueId), 60_000);
    return () => window.clearInterval(timer);
  }, [venueId]);

  const view: View = !atelier
    ? "pending"
    : data
      ? data.services.length ? "ready" : "empty"
      : venueId
        ? entry.error ? "error" : "loading"
        : catalog.loading ? "loading" : "error";

  const services = data?.services ?? NO_SERVICES;
  const lines = useMemo(() => linesOf(services), [services]);
  const total = services.length;
  const name = atelier?.name ?? null;

  // Stable callbacks keep every unchanged tag out of re-renders.
  const book = useRef<(serviceId: string) => void>(() => undefined);
  useEffect(() => {
    book.current = (serviceId) => openBooking({ slug: selectedSlug, serviceId });
  });
  const onBook = useCallback((serviceId: string) => book.current(serviceId), []);

  /* ---------- Switching ateliers (home) ---------- */

  const gridRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const holdTimer = useRef(0);
  const [hold, setHold] = useState<number | null>(null);
  const [announce, setAnnounce] = useState(false);
  const [stuck, setStuck] = useState(false);

  useEffect(() => () => window.clearTimeout(holdTimer.current), []);

  const choose = (next: AtelierSlug) => {
    const grid = gridRef.current;
    if (grid) {
      // Hold the old height while the new menu arrives, so the page below never jumps.
      setHold(grid.offsetHeight);
      window.clearTimeout(holdTimer.current);
      holdTimer.current = window.setTimeout(() => setHold(null), HOLD_MS);
      // Scrolled into the grid? Land its top under the sticky switcher, instantly.
      const header = parseFloat(getComputedStyle(grid).getPropertyValue("--at-header")) || 0;
      const under = Math.max(barRef.current?.getBoundingClientRect().bottom ?? 0, header);
      const top = grid.getBoundingClientRect().top;
      if (top < under) window.scrollTo({ top: Math.max(0, window.scrollY + top - under - 16), behavior: "instant" });
    }
    setAnnounce(true);
    setCurrentAtelier(next);
    const id = atelierBySlug(next)?.venueId;
    if (id) void fetchVenue(id);
  };

  // A hairline under the switcher once it sticks.
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const header = parseFloat(getComputedStyle(sentinel).getPropertyValue("--at-header")) || 0;
    const observer = new IntersectionObserver(
      ([item]) => setStuck(!item.isIntersecting && item.boundingClientRect.top < header + 1),
      { rootMargin: `${-(header + 1)}px 0px 0px 0px` },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  const chooseAnother = () => {
    const bar = barRef.current;
    const radio = bar?.querySelector<HTMLInputElement>("input:checked") ?? bar?.querySelector<HTMLInputElement>("input");
    radio?.focus();
  };

  const retry = () => {
    if (venueId) void fetchVenue(venueId, true);
    else void catalog.refresh();
  };

  const message = !name
    ? ""
    : view === "ready"
      ? `Showing ${total} ${total === 1 ? "service" : "services"} at ${name}`
      : view === "empty"
        ? `${name} has nothing open for online booking at the moment.`
        : view === "error"
          ? `The menu at ${name} isn't loading just now.`
          : `Loading the menu at ${name}…`;

  const viewLink = atelier ? (
    <AtelierLink href={atelierHref(atelier.slug)} className={`${ui.btn} ${ui.textBtn} ${styles.viewLink}`}>
      <span className={ui.underline}>View the atelier<span className={ui.srOnly}>: {atelier.name}</span></span>
      <ArrowRight />
    </AtelierLink>
  ) : null;

  return (
    <section
      id={sectionId}
      data-tone="nude"
      aria-labelledby={titleId}
      className={`${ui.section} ${ui.nude} ${styles.section} ${home ? styles.withSwitcher : ""}`}
    >
      <div className={ui.container}>
        {home ? (
          <div className={`${ui.head} ${styles.head}`}>
            <h2 id={titleId} className={`${ui.h2} ${ui.rise}`} tabIndex={-1} data-jump-focus="">
              Designed <em className={ui.italic}>around you.</em>
            </h2>
            <p className={`${ui.headLead} ${ui.lead} ${ui.rise} ${ui.rise2}`}>
              A concise menu at each atelier, live from its own diary. Every visit begins with a consultation; choose
              a service to see its times.
            </p>
          </div>
        ) : (
          <div className={styles.smallHead}>
            <h2 id={titleId} className={ui.h2s}>The menu at {atelier?.name}</h2>
          </div>
        )}
      </div>

      {home ? (
        <>
          <div ref={sentinelRef} className={styles.sentinel} aria-hidden="true" />
          <div ref={barRef} className={styles.bar} data-stuck={stuck ? "" : undefined}>
            <div className={ui.container}>
              <fieldset className={styles.switcher}>
                <legend className={styles.legend}>Showing the menu at</legend>
                <div className={styles.cells}>
                  {ATELIERS.map((item) => {
                    const checked = selectedSlug === item.slug;
                    return (
                      <label key={item.slug} className={`${styles.cell} ${checked ? styles.cellOn : ""}`}>
                        <input
                          type="radio"
                          name={`${uid}-atelier`}
                          value={item.slug}
                          checked={checked}
                          onChange={() => choose(item.slug)}
                          className={styles.radio}
                        />
                        <span className={styles.cellLabel}>{item.trade}</span>
                        <span className={ui.srOnly}> — </span>
                        <span className={styles.cellName}>{item.name}</span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>
            </div>
          </div>
        </>
      ) : null}

      <div className={ui.container}>
        {home ? (
          <div className={styles.atelierLine}>
            {atelier ? (
              <>
                <p className={styles.atelierName}>{atelier.name}</p>
                <span className={styles.atelierDot} aria-hidden="true">·</span>
                <p className={styles.atelierAddress}>{atelier.address}</p>
                <span className={styles.lineLink}>{viewLink}</span>
              </>
            ) : (
              <span className={`${styles.skeleton} ${styles.skeletonAtelier}`} aria-hidden="true" />
            )}
          </div>
        ) : null}

        <div
          ref={gridRef}
          className={styles.grid}
          style={hold != null && view !== "ready" ? { minHeight: hold } : undefined}
        >
          {view === "ready"
            ? lines.map((line) => {
              const headingId = `${uid}-${line.slug}`;
              return (
                <section key={line.category} aria-labelledby={headingId} className={styles.group}>
                  <div className={styles.lineCard}>
                    <h3 id={headingId} className={styles.lineTitle}>{line.category}</h3>
                    <p className={`${ui.label} ${ui.num}`}>{line.count}</p>
                  </div>
                  {/* Explicit roles: display: contents drops a bare list's semantics in some browsers. */}
                  <div role="list" className={styles.rows}>
                    {line.services.map(({ service, number }) => (
                      <ServiceTag
                        key={service.id}
                        service={service}
                        number={number}
                        atelierName={name ?? ""}
                        onBook={onBook}
                        onIntent={prefetchBooking}
                      />
                    ))}
                  </div>
                </section>
              );
            })
            : null}

          {view === "loading" || view === "pending" ? (
            <>
              <p className={ui.srOnly}>{name ? `Loading the menu at ${name}…` : "Loading the collection…"}</p>
              <Skeleton />
            </>
          ) : null}

          {view === "error" && atelier ? (
            <div className={styles.state}>
              <p className={styles.stateText}>
                <Alert size={16} className={styles.stateIcon} />
                <span>The menu at {atelier.name} isn&apos;t loading just now.</span>
              </p>
              <div className={styles.stateActions}>
                <button type="button" className={`${ui.btn} ${ui.secondary} ${ui.md}`} onClick={retry}>
                  Try again
                </button>
                <BookButton slug={atelier.slug} className={`${ui.btn} ${ui.primary} ${ui.md}`}>
                  Book anyway
                </BookButton>
              </div>
            </div>
          ) : null}

          {view === "empty" && atelier ? (
            <div className={styles.state}>
              <p className={styles.stateText}>
                <span>{atelier.name} has nothing open for online booking at the moment.</span>
              </p>
              <div className={styles.stateActions}>
                {home ? (
                  <button type="button" className={`${ui.btn} ${ui.textBtn}`} onClick={chooseAnother}>
                    <span className={ui.underline}>Choose another atelier</span>
                  </button>
                ) : (
                  <AtelierLink href="/brand-home-2#ateliers" className={`${ui.btn} ${ui.textBtn}`}>
                    <span className={ui.underline}>Choose another atelier</span>
                    <ArrowRight />
                  </AtelierLink>
                )}
              </div>
            </div>
          ) : null}
        </div>

        <div className={styles.foot}>
          <p className={styles.footNote}>
            {name ? `Prices and times are live from ${name}. ` : "Prices and times are live from each atelier. "}
            You pay at the atelier, after your visit. All times are Singapore time (SGT).
          </p>
          <BookButton
            slug={atelier?.slug}
            className={`${ui.btn} ${ui.secondary} ${ui.md} ${styles.footBook}`}
          >
            {name ? `Book at ${name}` : "Book an appointment"}
          </BookButton>
          {home ? <span className={styles.footLink}>{viewLink}</span> : null}
        </div>

        {home ? (
          <p className={ui.srOnly} role="status" aria-live="polite">
            {announce ? message : ""}
          </p>
        ) : null}
      </div>
    </section>
  );
}
