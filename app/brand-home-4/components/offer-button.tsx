"use client";

import { useEffect, type ReactNode } from "react";
import { useVenueEntry } from "@/lib/dasalon/venue-cache";
import type { StudioSlug } from "../data/studios";
import { ArrowRight } from "./icons";
import { usePaloma, type OfferRequest } from "./provider";
import ui from "./ui.module.css";

type OfferButtonProps = {
  request: OfferRequest;
  className?: string;
  /** The visible label, e.g. "See the set". */
  children: ReactNode;
  /** Screen-reader continuation of the visible label, e.g. ": The Standing Edit, S$165". */
  srLabel?: string;
  /** Development only: compare the set's included prices with the studio's live menu. */
  check?: { studio: StudioSlug; includes: readonly string[] };
};

/**
 * Opens an offer spread from a server-rendered object. Captures the button for
 * focus return (Safari does not focus clicked buttons) and warms the spread's
 * chunk on intent.
 */
export function OfferButton({ request, className, children, srLabel, check }: OfferButtonProps) {
  const { openOffer, prefetchOffer } = usePaloma();
  return (
    <>
      <button
        type="button"
        className={className}
        onClick={(event) => openOffer(request, { returnTo: event.currentTarget })}
        onPointerEnter={prefetchOffer}
        onFocus={prefetchOffer}
        onTouchStart={prefetchOffer}
      >
        <span>
          {children}
          {srLabel ? <span className={ui.srOnly}>{srLabel}</span> : null}
        </span>
        <ArrowRight />
      </button>
      {process.env.NODE_ENV !== "production" && check ? <DevPriceCheck studio={check.studio} includes={check.includes} /> : null}
    </>
  );
}

/** "Bought · Demo" on an object once its demo purchase is done (this tab only). */
export function BoughtBadge({ id, className }: { id: string; className?: string }) {
  const { purchased } = usePaloma();
  if (!purchased.has(id)) return null;
  return <span className={`${ui.badge} ${ui.badgeBought} ${className ?? ""}`}>Bought · Demo</span>;
}

/** "Hair Spa · 1 hr · S$45 × 3" → name and unit price. Ranges ("S$100–S$120") are not checked. */
const INCLUDE = /^(.+?) · [^·]+ · S\$(\d+(?:\.\d+)?)/;

/**
 * Sets are priced from the live menus of 13 Oct 2026. In development, say so in
 * the console when a studio's menu has moved on, so the copy can be updated.
 */
function DevPriceCheck({ studio, includes }: { studio: StudioSlug; includes: readonly string[] }) {
  const { studioBySlug } = usePaloma();
  const live = studioBySlug(studio);
  const { data } = useVenueEntry(live?.venueId);

  useEffect(() => {
    if (!data || !live) return;
    for (const line of includes) {
      const match = INCLUDE.exec(line);
      if (!match) continue;
      const [, name, price] = match;
      const service = data.services.find((item) => item.name.toLowerCase() === name.toLowerCase());
      if (!service) {
        console.warn(`[Paloma sets] "${name}" is no longer on ${live.name}'s live menu.`);
      } else if (service.price !== Number(price)) {
        console.warn(`[Paloma sets] ${name} at ${live.name} is S$${service.price} on the live menu; the set says S$${price}.`);
      }
    }
  }, [data, includes, live]);

  return null;
}
