"use client";

import { useEffect, useId, useMemo } from "react";
import { formatDuration, formatPrice } from "@/lib/dasalon/locale";
import { categorySlug } from "@/lib/dasalon/slug";
import type { PublicService } from "@/lib/dasalon/types";
import { fetchVenue, useVenueEntry } from "@/lib/dasalon/venue-cache";
import { groupByCategory } from "@/lib/dasalon/venue-status";
import { ArrowRight } from "./icons";
import { useOru } from "./provider";
import styles from "./treatments.module.css";
import ui from "./ui.module.css";

const NO_SERVICES: PublicService[] = [];

/**
 * The treatment finder: choose a room and say how long you have, and the
 * room's live menu (da Salon Partner API) narrows to what fits. Every row
 * books that treatment in that room.
 */
export function Treatments() {
  const { rooms, room, setRoom, budget, setBudget, catalog, openBooking, warmBooking } = useOru();
  const uid = useId();
  const current = rooms.find((item) => item.slug === room) ?? rooms[0];
  const venueId = current.venueId;
  const entry = useVenueEntry(venueId);
  const data = entry.data ?? (venueId && catalog.data?.selectedVenueId === venueId ? catalog.data : null);

  useEffect(() => {
    if (venueId) void fetchVenue(venueId);
  }, [venueId]);

  const services = data?.services ?? NO_SERVICES;
  const longest = useMemo(() => services.reduce((max, service) => Math.max(max, service.duration), 0), [services]);
  // "Any length" covers the longest treatment, so the windows on offer are the shorter ones.
  const active = budget != null && budget < longest ? budget : null;
  const windows = useMemo(() => {
    const lengths = new Set(services.map((service) => service.duration).filter((minutes) => minutes < longest));
    if (active != null) lengths.add(active);
    return Array.from(lengths).sort((a, b) => a - b);
  }, [services, longest, active]);

  const fitting = useMemo(
    () => (active == null ? services : services.filter((service) => service.duration <= active)),
    [services, active],
  );
  const groups = useMemo(() => groupByCategory(fitting, categorySlug), [fitting]);

  const view = data
    ? !services.length ? "empty" : fitting.length ? "ready" : "none"
    : venueId
      ? entry.error ? "error" : "loading"
      : catalog.loading ? "loading" : "error";

  const retry = () => {
    if (venueId) void fetchVenue(venueId, true);
    else void catalog.refresh();
  };

  const summary = view === "ready"
    ? `${fitting.length} ${fitting.length === 1 ? "treatment" : "treatments"} at ${current.name}${active != null ? ` in ${formatDuration(active)} or less` : ""}`
    : view === "none"
      ? `Nothing at ${current.name} fits in ${formatDuration(active ?? 0)}`
      : view === "loading"
        ? `Loading the menu at ${current.name}`
        : "";

  return (
    <section id="treatments" data-tone="light" aria-labelledby="treatments-title" className={`${ui.section} ${ui.light}`}>
      <div className={`${ui.container} ${styles.grid}`}>
        <div className={styles.side}>
          <h2 id="treatments-title" className={`${ui.h2} ${styles.title} ${ui.rise}`} tabIndex={-1} data-jump-focus="">
            Choose what you need, <em className={ui.accent}>not what you should.</em>
          </h2>

          <fieldset className={styles.field}>
            <legend className={styles.legend}>How long do you have?</legend>
            <div className={styles.chips}>
              <label className={styles.chip}>
                <input
                  type="radio"
                  name={`${uid}-window`}
                  className={ui.srOnly}
                  checked={active == null}
                  onChange={() => setBudget(null)}
                />
                <span>Any length</span>
              </label>
              {windows.map((minutes) => (
                <label key={minutes} className={styles.chip}>
                  <input
                    type="radio"
                    name={`${uid}-window`}
                    className={ui.srOnly}
                    checked={active === minutes}
                    onChange={() => setBudget(minutes)}
                  />
                  <span>{formatDuration(minutes)}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className={styles.field}>
            <legend className={styles.legend}>Which room?</legend>
            <div className={styles.rooms}>
              {rooms.map((item) => (
                <label key={item.slug} className={styles.room}>
                  <input
                    type="radio"
                    name={`${uid}-room`}
                    className={ui.srOnly}
                    checked={item.slug === current.slug}
                    onChange={() => setRoom(item.slug)}
                  />
                  <span className={styles.roomDot} aria-hidden="true" />
                  <span className={styles.roomName}>{item.name}</span>
                  <span className={styles.roomTrade}>{item.trade}</span>
                </label>
              ))}
            </div>
          </fieldset>
        </div>

        <div className={styles.menu}>
          <p className={styles.summary} role="status" aria-live="polite">
            {summary}
          </p>

          {view === "ready" ? (
            <div className={styles.groups} key={`${current.slug}-${active ?? "any"}`}>
              {groups.map((group) => (
                <section key={group.slug} className={styles.group} aria-label={group.category}>
                  <h3 className={styles.groupTitle}>{group.category}</h3>
                  <ul>
                    {group.services.map((service) => (
                      <li key={service.id} className={styles.item}>
                        <button
                          type="button"
                          className={styles.row}
                          onClick={() => openBooking({ slug: current.slug, serviceId: service.id })}
                          onPointerEnter={warmBooking}
                          onFocus={warmBooking}
                        >
                          <span className={ui.srOnly}>
                            Book {service.name}, {formatDuration(service.duration)}, {formatPrice(service.price)}
                            {service.taxLabel ? ` ${service.taxLabel}` : ""}, at {current.name}
                          </span>
                          <span className={styles.rowMain} aria-hidden="true">
                            <span className={styles.rowName}>{service.name}</span>
                            <span className={styles.rowMeta}>
                              {formatDuration(service.duration)}
                              {service.description ? ` · ${service.description}` : ""}
                            </span>
                          </span>
                          <span className={styles.rowPrice} aria-hidden="true">
                            {formatPrice(service.price)}
                          </span>
                          <span className={styles.rowGo} aria-hidden="true">
                            <ArrowRight size={16} />
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          ) : null}

          {view === "loading" ? (
            <div className={styles.skeletons} aria-hidden="true">
              {Array.from({ length: 6 }, (_, index) => (
                <span key={index} className={styles.skeleton} />
              ))}
            </div>
          ) : null}

          {view === "none" ? (
            <div className={styles.state}>
              <p className={styles.stateText}>Nothing here is that short. A longer window opens the whole menu.</p>
              <button type="button" className={`${ui.btn} ${ui.ghost} ${ui.sm}`} onClick={() => setBudget(null)}>
                Show every length
              </button>
            </div>
          ) : null}

          {view === "empty" ? (
            <div className={styles.state}>
              <p className={styles.stateText}>{current.name} has nothing open for online booking at the moment.</p>
            </div>
          ) : null}

          {view === "error" ? (
            <div className={styles.state}>
              <p className={styles.stateText}>The menu at {current.name} isn&rsquo;t loading just now.</p>
              <button type="button" className={`${ui.btn} ${ui.ghost} ${ui.sm}`} onClick={retry}>
                Try again
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
