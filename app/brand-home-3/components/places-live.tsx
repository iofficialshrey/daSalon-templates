"use client";

import { useEffect, useRef, useState, type ReactNode, type SyntheticEvent } from "react";
import { formatPrice } from "@/lib/dasalon/locale";
import { fetchVenue, useVenueEntry } from "@/lib/dasalon/venue-cache";
import { VENUE_FACTS, isVenueSlug } from "@/lib/dasalon/venues";
import { jumpTo } from "@/lib/page/jump";
import { readSaveData, useSaveData } from "@/lib/page/use-clock";
import { PLACE_ORDER, placeBySlug, type PlaceSlug } from "../data/places";
import { BookButton } from "./book-button";
import { ArrowDown } from "./icons";
import invitation from "./invitation.module.css";
import { FactsLine, StatusLine, findService, usePlaceEntry, useWarmPlaces } from "./live";
import { showMenu } from "./menu-store";
import { useSerein } from "./provider";
import ui from "./ui.module.css";

/*
 * Client islands for builder 4's sections: places (§4.5), slow hours (§4.6)
 * and the invitation (§4.10). Every one renders the same thing on the server
 * and during hydration (skeletons or the static fallbacks); live values land
 * after, from the shared venue cache.
 */

const SERENITY: PlaceSlug = "serenity-spa-house";
/** Serenity is warmed by the provider; the other three are fetched when #places comes within 600px. */
const NEARBY: readonly PlaceSlug[] = ["the-grooming-room", "lumiere-aesthetics", "bride-groom"];

/* ---------- Places ---------- */

/**
 * The #places section element. It warms the other three places' menus as it
 * nears the viewport (skipped under Save-Data), and under Save-Data fetches a
 * card's place on intent instead: pointer, focus or touch on that card.
 */
export function PlacesSection({ className, children }: { className?: string; children: ReactNode }) {
  const ref = useRef<HTMLElement>(null);
  const requested = useRef<Set<string>>(new Set());
  const { placeBySlug: livePlace } = useSerein();
  useWarmPlaces(ref, NEARBY, "600px");

  const onIntent = (event: SyntheticEvent) => {
    if (!readSaveData() || !(event.target instanceof Element)) return;
    const slug = event.target.closest("[data-place]")?.getAttribute("data-place");
    if (!isVenueSlug(slug)) return;
    const venueId = livePlace(slug)?.venueId;
    // Once per place: an error stays an error (the card shows the published hours) rather than refetching on every move.
    if (!venueId || requested.current.has(venueId)) return;
    requested.current.add(venueId);
    void fetchVenue(venueId);
  };

  return (
    <section
      ref={ref}
      id="places"
      className={className}
      data-tone="paper"
      aria-labelledby="places-title"
      onPointerOver={onIntent}
      onFocus={onIntent}
      onTouchStart={onIntent}
    >
      {children}
    </section>
  );
}

/**
 * A card's live lines: status ("Open now · until 6:00 pm", the published hours on error) and
 * facts ("14 services · from S$45", hidden on error). Skeletons while the menu is on its way.
 * Under Save-Data nothing is on its way until the guest reaches for the card, so the card reads
 * the published hours instead of a skeleton that would never resolve.
 */
export function PlaceLive({ slug }: { slug: PlaceSlug }) {
  const { venueId, status } = usePlaceEntry(slug);
  const entry = useVenueEntry(venueId);
  const saveData = useSaveData();
  const idle = saveData && status === "loading" && venueId !== null && !entry.loading;

  if (idle) {
    return (
      <span className={ui.status}>
        <span className={ui.dotNone} aria-hidden="true" />
        <span>{VENUE_FACTS[slug].hoursLabel}</span>
      </span>
    );
  }
  return (
    <>
      <StatusLine slug={slug} />
      <FactsLine slug={slug} skeleton className={ui.muted} />
    </>
  );
}

/** "See the menu": opens "05 · The whole menu" at this place, then jumps there and focuses its disclosure. */
export function SeeMenuButton({ slug, name }: { slug: PlaceSlug; name: string }) {
  const { setCurrentPlace } = useSerein();
  return (
    <button
      type="button"
      className={ui.text}
      onClick={() => {
        setCurrentPlace(slug);
        showMenu(slug);
        jumpTo("menu");
      }}
    >
      <span>
        See the menu<span className={ui.srOnly}>{` at ${name}`}</span>
      </span>
      <ArrowDown />
    </button>
  );
}

/* ---------- Slow hours: live figures from Serenity's menu, with the 13 Oct values as fallbacks ---------- */

const WARMTH = ["Steam Therapy", "Sauna Session", "Jacuzzi Session"] as const;

/** "30 to 75": the shortest and longest massage in Serenity's live Massage category. */
export function MassageRange() {
  const { data, status } = usePlaceEntry(SERENITY);
  const durations =
    status === "ready" && data
      ? data.services
          .filter((service) => service.category?.trim().toLowerCase() === "massage" && service.duration > 0)
          .map((service) => service.duration)
      : [];
  if (!durations.length) return <>30 to 75</>;
  return <>{`${Math.min(...durations)} to ${Math.max(...durations)}`}</>;
}

/** "S$45": the lowest live price of Steam Therapy, Sauna Session and Jacuzzi Session at Serenity. */
export function WarmthFrom() {
  const { data, status } = usePlaceEntry(SERENITY);
  const prices =
    status === "ready" && data
      ? WARMTH.map((name) => findService(data.services, name)?.price).filter(
          (price): price is number => typeof price === "number" && Number.isFinite(price) && price > 0,
        )
      : [];
  return <>{prices.length ? formatPrice(Math.min(...prices)) : "S$45"}</>;
}

/* ---------- Invitation: the other three places, the current place's status and address ---------- */

/**
 * "Or book at" the three places other than currentPlace, in PLACE_ORDER, then the current
 * place's live status and address. A Book pressed here makes its place current; the list keeps
 * its buttons until the guest moves on (focus or a pointer elsewhere, never while booking is
 * open), so the pressed button stays in place to show the busy ring and take focus back.
 */
export function InvitationPlaces() {
  const { currentPlace, bookingOpen } = useSerein();
  const [frozen, setFrozen] = useState<PlaceSlug | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const shown = frozen ?? currentPlace;
  const place = placeBySlug(currentPlace);

  useEffect(() => {
    if (!frozen || bookingOpen) return;
    const release = (event: Event) => {
      const list = listRef.current;
      if (list && event.target instanceof Node && list.contains(event.target)) return;
      setFrozen(null);
    };
    document.addEventListener("focusin", release);
    document.addEventListener("pointerdown", release);
    return () => {
      document.removeEventListener("focusin", release);
      document.removeEventListener("pointerdown", release);
    };
  }, [frozen, bookingOpen]);

  return (
    <>
      <div
        ref={listRef}
        className={invitation.others}
        onClickCapture={(event) => {
          if (event.target instanceof Element && event.target.closest("button")) setFrozen((value) => value ?? currentPlace);
        }}
      >
        <span className={ui.small}>Or book at</span>
        {PLACE_ORDER.filter((slug) => slug !== shown).map((slug) => (
          <BookButton key={slug} slug={slug} srPrefix="Book at " className={ui.text}>
            {placeBySlug(slug).name}
          </BookButton>
        ))}
      </div>
      <p className={invitation.status}>
        <StatusLine slug={currentPlace} withName />
      </p>
      <p className={`${ui.small} ${ui.muted} ${invitation.address}`}>{place.address}</p>
    </>
  );
}
