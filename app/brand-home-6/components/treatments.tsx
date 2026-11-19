"use client";

import { useEffect, useId, useMemo, useState, type CSSProperties } from "react";
import { formatDuration, formatPrice } from "@/lib/dasalon/locale";
import { categorySlug } from "@/lib/dasalon/slug";
import type { PublicService } from "@/lib/dasalon/types";
import { fetchVenue, useVenueEntry } from "@/lib/dasalon/venue-cache";
import { factsLine, groupByCategory, menuFacts, venueStatus, type StatusWords } from "@/lib/dasalon/venue-status";
import { useClock } from "@/lib/page/use-clock";
import type { HouseSlug } from "../data/houses";
import { ArrowRight, ChevronDown } from "./icons";
import { useNeroli } from "./provider";
import drop from "./drop.module.css";
import styles from "./treatments.module.css";
import ui from "./ui.module.css";

const NO_SERVICES: PublicService[] = [];

/** Dates are working days, never free slots. */
export const STATUS_WORDS: StatusWords = {
  today: "Bookable today",
  next: (day) => `Next bookable day: ${day}`,
};

/** A bubble's diameter grows with how many treatments it holds. */
function bubbleSize(count: number) {
  return Math.round(Math.min(150, Math.max(92, 78 + count * 11)));
}

/**
 * The menu. Choose a house; its live menu (da Salon Partner API) gathers into
 * bubbles, one per kind of treatment, sized by how many each holds. The drop
 * fills the bubble you choose, and the treatments in it appear as tiles that
 * book.
 */
export function Treatments() {
  const { houses, house, setHouse, catalog, openBooking, warmBooking } = useNeroli();
  const uid = useId();
  const current = houses.find((item) => item.slug === house) ?? houses[0];
  const venueId = current.venueId;
  const entry = useVenueEntry(venueId);
  const data = entry.data ?? (venueId && catalog.data?.selectedVenueId === venueId ? catalog.data : null);
  const now = useClock();

  useEffect(() => {
    if (venueId) void fetchVenue(venueId);
  }, [venueId]);

  const services = data?.services ?? NO_SERVICES;
  const groups = useMemo(() => groupByCategory(services, categorySlug), [services]);
  const [chosen, setChosen] = useState<string | null>(null);
  const group = groups.find((item) => item.slug === chosen) ?? groups[0] ?? null;

  const view = data
    ? services.length ? "ready" : "empty"
    : venueId
      ? entry.error ? "error" : "loading"
      : catalog.loading ? "loading" : "error";

  const status = now ? venueStatus(current.hours, data, now, STATUS_WORDS) : null;
  const facts = data ? factsLine(menuFacts(data)) : null;

  const retry = () => {
    if (venueId) void fetchVenue(venueId, true);
    else void catalog.refresh();
  };

  const chooseHouse = (slug: HouseSlug) => {
    setHouse(slug);
    setChosen(null);
  };

  return (
    <section
      id="treatments"
      data-tone="light"
      data-drop-zone="light"
      aria-labelledby="treatments-title"
      className={`${ui.section} ${ui.light} ${styles.treatments}`}
    >
      <div className={ui.container}>
        <div className={styles.head}>
          <h2 id="treatments-title" className={`${ui.h2} ${styles.title} ${ui.surface}`} tabIndex={-1} data-jump-focus="">
            Rituals shaped around how you arrive.
          </h2>
          <div className={styles.house}>
            <label className={styles.houseLabel} htmlFor={`${uid}-house`}>
              House
            </label>
            <span className={styles.select}>
              <select id={`${uid}-house`} value={current.slug} onChange={(event) => chooseHouse(event.target.value as HouseSlug)}>
                {houses.map((item) => (
                  <option key={item.slug} value={item.slug}>
                    {item.name}
                  </option>
                ))}
              </select>
              <ChevronDown size={20} />
            </span>
            <p className={styles.houseLine}>
              {current.area} · {current.trade}
            </p>
            <p className={styles.houseStatus} aria-live="polite">
              {status?.tone === "open" ? <span className={styles.dot} aria-hidden="true" /> : null}
              {status?.text ?? current.hoursLabel}
            </p>
            {facts ? <p className={styles.houseFacts}>{facts}</p> : null}
          </div>
        </div>

        {view === "ready" && group ? (
          <>
            <div className={styles.bubbles} role="radiogroup" aria-label="Kind of treatment">
              {groups.map((item) => {
                const on = item.slug === group.slug;
                return (
                  <label key={item.slug} className={styles.bubble} style={{ "--size": `${bubbleSize(item.services.length)}px` } as CSSProperties}>
                    <input
                      type="radio"
                      name={`${uid}-kind`}
                      className={ui.srOnly}
                      checked={on}
                      onChange={() => setChosen(item.slug)}
                    />
                    <span className={styles.circle} data-on={on ? "" : undefined} aria-hidden="true">
                      <span className={`${drop.slot} ${styles.slot}`} data-drop-slot={on ? "on" : "off"} />
                    </span>
                    <span className={styles.bubbleName}>{item.category}</span>
                    <span className={styles.bubbleCount}>
                      {item.services.length} {item.services.length === 1 ? "treatment" : "treatments"}
                    </span>
                  </label>
                );
              })}
            </div>

            <ul className={styles.tiles} key={`${current.slug}-${group.slug}`} aria-label={`${group.category} at ${current.name}`}>
              {group.services.map((service) => (
                <li key={service.id} className={styles.tileItem}>
                  <button
                    type="button"
                    className={styles.tile}
                    onClick={() => openBooking({ slug: current.slug, serviceId: service.id })}
                    onPointerEnter={warmBooking}
                    onFocus={warmBooking}
                  >
                    <span className={ui.srOnly}>
                      Book {service.name}, {formatDuration(service.duration)}, {formatPrice(service.price)}
                      {service.taxLabel ? ` ${service.taxLabel}` : ""}, at {current.name}
                    </span>
                    <span className={styles.tileName} aria-hidden="true">
                      {service.name}
                    </span>
                    {service.description ? (
                      <span className={styles.tileText} aria-hidden="true">
                        {service.description}
                      </span>
                    ) : null}
                    <span className={styles.tileFoot} aria-hidden="true">
                      <span className={styles.tileTime}>{formatDuration(service.duration)}</span>
                      <span className={styles.tilePrice}>{formatPrice(service.price)}</span>
                      <span className={styles.tileGo}>
                        <ArrowRight size={16} />
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <div className={styles.waiting}>
            <div className={styles.bubbles} aria-hidden="true">
              {[128, 104, 116].map((size, index) => (
                <span key={size} className={styles.bubble} style={{ "--size": `${size}px` } as CSSProperties}>
                  <span className={`${styles.circle} ${view === "loading" ? styles.pulse : ""}`}>
                    <span className={`${drop.slot} ${styles.slot}`} data-drop-slot={index === 0 ? "on" : "off"} />
                  </span>
                </span>
              ))}
            </div>
            {view === "loading" ? <p className={styles.stateText} role="status">Loading the menu at {current.name}…</p> : null}
            {view === "empty" ? (
              <p className={styles.stateText}>{current.name} has nothing open for online booking at the moment.</p>
            ) : null}
            {view === "error" ? (
              <div className={styles.state}>
                <p className={styles.stateText}>The menu at {current.name} isn&rsquo;t loading just now.</p>
                <button type="button" className={`${ui.btn} ${ui.outline} ${ui.sm}`} onClick={retry}>
                  Try again
                </button>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </section>
  );
}
