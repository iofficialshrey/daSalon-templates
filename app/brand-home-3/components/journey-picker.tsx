"use client";

import { useRef, useState, type ReactNode } from "react";
import { flushSync } from "react-dom";
import { formatDuration, formatPrice } from "@/lib/dasalon/locale";
import type { PublicService } from "@/lib/dasalon/types";
import { jumpTo } from "@/lib/page/jump";
import layout from "../layout.module.css";
import { artSet } from "../data/art";
import { DEFAULT_PLACE, placeBySlug, type PlaceSlug } from "../data/places";
import { NEEDS, RITUALS, ritualById, type Need, type Ritual, type RitualId } from "../data/rituals";
import { ArtPicture } from "./art-picture";
import { BookButton } from "./book-button";
import { ArrowDown } from "./icons";
import { findService, ServiceMeta, usePlaceEntry, useWarmPlaces, type PlaceEntry } from "./live";
import { showRitual } from "./menu-store";
import ui from "./ui.module.css";
import styles from "./journey.module.css";

const SERENITY: PlaceSlug = "serenity-spa-house";
const LUMIERE: PlaceSlug = "lumiere-aesthetics";
/** Under Save-Data the provider leaves Serenity to the sections; Lumiere carries Illuminate. */
const WARM: readonly PlaceSlug[] = [SERENITY, LUMIERE];

type Recommendation = {
  place: PlaceSlug;
  /** The service's name as the ritual data writes it. */
  name: string;
  service: PublicService | null;
  state: "loading" | "ready" | "missing" | "error";
};

function resolve(place: PlaceSlug, name: string, entry: PlaceEntry | null): Recommendation {
  if (!entry || entry.status === "loading") return { place, name, service: null, state: "loading" };
  if (entry.status === "error" || entry.status === "unbound") return { place, name, service: null, state: "error" };
  const service = findService(entry.data?.services, name);
  return { place, name, service, state: service ? "ready" : "missing" };
}

/** The need's recommended service; if the live menu has dropped it, the first available service in that ritual. */
function recommend(need: Need, ritual: Ritual, entryFor: (slug: PlaceSlug) => PlaceEntry | null): Recommendation {
  const first = resolve(need.recommend.place, need.recommend.service, entryFor(need.recommend.place));
  if (first.state !== "missing") return first;
  for (const group of ritual.groups) {
    for (const name of group.services) {
      const candidate = resolve(group.place, name, entryFor(group.place));
      if (candidate.state === "ready") return candidate;
    }
  }
  return first;
}

/**
 * "See every {Ritual} treatment": open that ritual row, then jump to it and focus its button.
 * The row opens without transitions (the browser's [data-instant]) and is committed at once
 * (flushSync), so the jump measures where the row ends up, not where it starts.
 */
function seeRitual(id: RitualId) {
  const browser = document.querySelector<HTMLElement>("[data-ritual-browser]");
  browser?.setAttribute("data-instant", "");
  flushSync(() => showRitual(id));
  jumpTo(`ritual-${id}`);
  if (browser) {
    browser.getBoundingClientRect();
    browser.removeAttribute("data-instant");
  }
}

/*
 * Only the first need's sky loads with the page. The other three are the map's
 * flat colour (hidden under it) until the guest reaches for the needs (pointer or
 * focus) or changes the need; then all four mount, so every crossfade is ready.
 */
export function JourneyPicker({ children }: { children: ReactNode }) {
  const [needIndex, setNeedIndex] = useState(0);
  const [warm, setWarm] = useState(false);
  const warmUp = () => setWarm(true);
  const contentRef = useRef<HTMLDivElement>(null);
  useWarmPlaces(contentRef, WARM);

  const serenity = usePlaceEntry(SERENITY);
  const lumiere = usePlaceEntry(LUMIERE);
  const entryFor = (slug: PlaceSlug) => (slug === SERENITY ? serenity : slug === LUMIERE ? lumiere : null);

  // One ritual record drives the word, the sky, the recommendation and the Book, so they never disagree.
  const need = NEEDS[needIndex];
  const ritual = ritualById(need.ritual);
  const pick = recommend(need, ritual, entryFor);
  const pickPlace = placeBySlug(pick.place);
  const where = pick.place === DEFAULT_PLACE ? pickPlace.name : `${pickPlace.name}, ${pickPlace.area}`;
  const altPlace = placeBySlug(need.alt.place);

  return (
    <>
      <div className={styles.visual} aria-hidden="true">
        {RITUALS.map((item) => {
          const className = `${styles.art} ${item.id === ritual.id ? styles.active : ""}`;
          return warm || item.id === ritual.id ? (
            <ArtPicture key={item.id} art={item.art.journey} className={className} imgClassName={styles.artImg} />
          ) : (
            <span key={item.id} className={`${ui.artFallback} ${className}`} style={{ background: artSet(item.art.journey).fallback }} />
          );
        })}
        <span className={styles.veil} />
        <span className={styles.words}>
          {RITUALS.map((item) => (
            <span key={item.id} className={`${ui.displayXl} ${styles.word} ${item.id === ritual.id ? styles.active : ""}`}>
              {item.name}
            </span>
          ))}
        </span>
      </div>

      <div ref={contentRef} className={`${styles.content} ${layout.reveal}`}>
        <div className={styles.head}>{children}</div>

        <fieldset className={styles.needs} onPointerEnter={warmUp} onFocus={warmUp}>
          <legend className={ui.srOnly}>What do you need today?</legend>
          {NEEDS.map((item, index) => (
            <label key={item.ritual} className={styles.need}>
              <span className={`${ui.serif} ${styles.needLabel}`}>{item.label}</span>
              <input
                type="radio"
                name="sr-need"
                value={item.ritual}
                checked={index === needIndex}
                onChange={() => {
                  setNeedIndex(index);
                  warmUp();
                }}
                className={styles.radio}
              />
            </label>
          ))}
        </fieldset>

        <div className={styles.recommend}>
          <p className={ui.label}>We recommend</p>
          <p className={`${ui.titleS} ${styles.title}`} aria-live="polite" aria-atomic="true">
            {`${ritual.name} · ${pick.name}`}
          </p>
          <p className={`${ui.small} ${ui.muted} ${ui.num} ${styles.meta}`}>
            {pick.state === "loading" ? (
              <>
                <span className={`${ui.skeleton} ${styles.skelMeta}`} aria-hidden="true" />
                {` · ${where}`}
              </>
            ) : pick.state === "ready" && pick.service ? (
              `${formatDuration(pick.service.duration)} · ${formatPrice(pick.service.price)} · ${where}`
            ) : (
              `${pick.state === "error" ? "Price shown when you book" : "See today's menu"} · ${where}`
            )}
          </p>
          <p className={`${ui.body} ${styles.note}`}>{ritual.note}</p>
          <BookButton
            slug={pick.place}
            serviceName={pick.service?.name ?? pick.name}
            srSuffix={` at ${pickPlace.name}`}
            className={`${ui.btn} ${ui.primary} ${styles.book}`}
          >
            {`Book ${pick.name}`}
          </BookButton>

          <div className={styles.alt}>
            <p className={ui.label}>{need.alt.label}</p>
            <div className={styles.altRow}>
              <span className={styles.altText}>
                <span className={`${ui.serif} ${styles.altName}`}>{need.alt.service}</span>
                <ServiceMeta slug={need.alt.place} name={need.alt.service} />
              </span>
              <BookButton
                slug={need.alt.place}
                serviceName={need.alt.service}
                srSuffix={` ${need.alt.service} at ${altPlace.name}`}
                className={`${ui.btn} ${ui.sm} ${ui.secondary} ${styles.altBook}`}
              >
                Book
              </BookButton>
            </div>
          </div>

          <button type="button" className={`${ui.text} ${styles.see}`} onClick={() => seeRitual(ritual.id)}>
            <span>{`See every ${ritual.name} treatment`}</span>
            <ArrowDown />
          </button>
        </div>
      </div>
    </>
  );
}
