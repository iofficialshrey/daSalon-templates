"use client";

import { useEffect, useRef, useState } from "react";
import layout from "../layout.module.css";
import { artSet } from "../data/art";
import { DEFAULT_PLACE, placeBySlug, type PlaceSlug } from "../data/places";
import { RITUALS, ritualById, type Ritual, type RitualGroup } from "../data/rituals";
import { ArtPicture } from "./art-picture";
import { BookButton } from "./book-button";
import { Minus, Plus } from "./icons";
import { findService, ServiceMeta, useLiveService, usePlaceEntry, useWarmPlaces } from "./live";
import { showRitual, useMenuState } from "./menu-store";
import { OfferButton } from "./offer-button";
import ui from "./ui.module.css";
import styles from "./rituals.module.css";

/*
 * The ritual browser: four stacked skies that crossfade, and the square
 * hairline accordion. One row is open at a time (Ground first), opened by
 * click or keyboard only; hover never selects. Collapsed panels are inert, so
 * their Book buttons are never tabbable. Serenity's 14 live services appear
 * once each; Illuminate adds three at Lumiere Aesthetics.
 *
 * The journey's "See every … treatment" sets [data-instant] on the root for
 * one change, so the panels snap and its jump lands where the row ends up.
 *
 * Only the open ritual's sky loads with the page. The other three are the
 * map's flat colour (hidden under the open one) until the guest reaches for
 * the list (pointer or focus) or a ritual opens from elsewhere; then all four
 * mount, so every crossfade after that has its picture ready.
 */

/** Serenity (warmed by the provider, except under Save-Data) and Lumiere, for Illuminate. */
const WARM: readonly PlaceSlug[] = ["serenity-spa-house", "lumiere-aesthetics"];

export function RitualBrowser() {
  const ref = useRef<HTMLDivElement>(null);
  useWarmPlaces(ref, WARM);
  const { ritual: active } = useMenuState();
  const caption = ritualById(active).caption;

  const [warm, setWarm] = useState(false);
  const [shown, setShown] = useState(active);
  if (shown !== active) {
    // A ritual opened (here, or from the journey's showRitual): keep every sky mounted from now on.
    setShown(active);
    setWarm(true);
  }
  const warmUp = () => setWarm(true);

  return (
    <div ref={ref} className={`${styles.browser} ${layout.reveal}`} data-ritual-browser="">
      <div className={styles.visual} aria-hidden="true">
        {RITUALS.map((ritual) => {
          const className = `${styles.art} ${ritual.id === active ? styles.artActive : ""}`;
          return warm || ritual.id === active ? (
            <ArtPicture key={ritual.id} art={ritual.art.browser} className={className} imgClassName={styles.artImg} />
          ) : (
            <span key={ritual.id} className={`${ui.artFallback} ${className}`} style={{ background: artSet(ritual.art.browser).fallback }} />
          );
        })}
        <span className={`${ui.chip} ${styles.caption}`}>{caption}</span>
      </div>
      <div className={styles.list} onPointerEnter={warmUp} onFocus={warmUp}>
        {RITUALS.map((ritual) => (
          <RitualRow key={ritual.id} ritual={ritual} open={ritual.id === active} />
        ))}
      </div>
    </div>
  );
}

/* ---------- One accordion row ---------- */

function RitualRow({ ritual, open }: { ritual: Ritual; open: boolean }) {
  const titleId = `ritual-${ritual.id}-title`;
  const panelId = `ritual-${ritual.id}-panel`;

  return (
    <div id={`ritual-${ritual.id}`} className={styles.row} data-open={open ? "" : undefined}>
      <h3 id={titleId}>
        {/* The open row can't be collapsed (one is always open), so it is aria-disabled, as the APG accordion says. */}
        <button
          type="button"
          className={styles.rowButton}
          data-jump-focus=""
          aria-expanded={open}
          aria-controls={panelId}
          aria-disabled={open || undefined}
          onClick={() => showRitual(ritual.id)}
        >
          <span className={`${ui.label} ${ui.num} ${styles.numeral}`} aria-hidden="true">
            {ritual.number}
          </span>
          <span className={styles.rowText}>
            <span className={`${ui.displayM} ${styles.name}`}>{ritual.name}</span>
            <span className={styles.rowMeta}>
              <ServiceMeta slug={ritual.place} name={ritual.pick} />
              {ritual.place !== DEFAULT_PLACE ? <AreaSuffix slug={ritual.place} name={ritual.pick} /> : null}
            </span>
          </span>
          {open ? <Minus className={styles.icon} /> : <Plus className={styles.icon} />}
        </button>
      </h3>
      <div id={panelId} role="region" aria-labelledby={titleId} className={styles.panel} data-open={open ? "" : undefined} inert={!open}>
        <div className={styles.clip}>
          <div className={styles.panelBody}>
            <p className={ui.label}>{ritual.typeLine}</p>
            <p className={`${ui.body} ${styles.note}`}>{ritual.note}</p>
            {ritual.groups.map((group, index) => (
              <ServiceGroup key={`${group.place}-${index}`} ritual={ritual} group={group} index={index} />
            ))}
            <p className={`${ui.small} ${styles.cross}`}>
              {ritual.crossLink.text}{" "}
              <OfferButton variant="text" request={ritual.crossLink.request} label={ritual.crossLink.label} />
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/** " · Changi" after a pick at a sister place, once its live meta is in. */
function AreaSuffix({ slug, name }: { slug: PlaceSlug; name: string }) {
  const { state } = useLiveService(slug, name);
  if (state !== "ready") return null;
  return <span className={`${ui.ui} ${ui.muted}`}>{` · ${placeBySlug(slug).area}`}</span>;
}

/* ---------- A group of named services at one place ---------- */

function ServiceGroup({ ritual, group, index }: { ritual: Ritual; group: RitualGroup; index: number }) {
  const { data, status } = usePlaceEntry(group.place);
  const place = placeBySlug(group.place);
  // Once the place's menu is in, a service that isn't on it is dropped (never shown with a guessed price).
  const settled = status === "ready" || status === "empty";
  const rows = group.services.map((name) => ({ name, live: settled ? findService(data?.services, name) : null }));
  const shown = settled ? rows.filter((row) => row.live) : rows;
  const missing = settled ? rows.filter((row) => !row.live).map((row) => row.name).join(", ") : "";
  const headingId = group.heading ? `ritual-${ritual.id}-group-${index}` : undefined;

  useEffect(() => {
    if (process.env.NODE_ENV === "production" || !missing) return;
    console.warn(`[Serein rituals] Not on the live menu at ${place.name} today: ${missing}.`);
  }, [missing, place.name]);

  return (
    <div className={styles.group}>
      {group.heading ? (
        <p id={headingId} className={`${ui.small} ${ui.muted} ${styles.groupHead}`}>
          {group.heading}
        </p>
      ) : null}
      {shown.length ? (
        <ul className={styles.services} aria-labelledby={headingId}>
          {shown.map(({ name, live }) => {
            const pick = group.place === ritual.place && name === ritual.pick;
            return (
              <li key={name} className={styles.service}>
                <span className={styles.serviceText}>
                  <span className={`${ui.serif} ${styles.serviceName}`}>{name}</span>
                  {pick ? <span className={ui.pick}>Our pick</span> : null}
                  <ServiceMeta slug={group.place} name={name} className={styles.serviceMeta} />
                </span>
                <BookButton
                  slug={group.place}
                  serviceName={live?.name ?? name}
                  srSuffix={` ${name} at ${place.name}`}
                  className={`${ui.btn} ${ui.sm} ${pick ? ui.primary : ui.secondary} ${styles.serviceBook}`}
                >
                  Book
                </BookButton>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className={styles.groupMissing}>
          <p className={`${ui.small} ${ui.muted}`}>Not on the online menu today.</p>
          <BookButton slug={group.place} className={`${ui.btn} ${ui.sm} ${ui.secondary}`}>
            {`Book at ${place.name}`}
          </BookButton>
        </div>
      )}
    </div>
  );
}
