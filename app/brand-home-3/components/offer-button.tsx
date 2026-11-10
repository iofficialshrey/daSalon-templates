"use client";

import { useEffect } from "react";
import type { IncludeLine, OfferKind, OfferRequest } from "../data/offers";
import type { PlaceSlug } from "../data/places";
import { ArrowUpRight } from "./icons";
import { usePlaceEntry } from "./live";
import { useSerein } from "./provider";
import ui from "./ui.module.css";

type OfferButtonProps = {
  request: OfferRequest;
  /** The visible label: "See details", "See the package", "Give this card". */
  label: string;
  /** Screen-reader continuation of the visible label, e.g. ": House Rhythm". */
  srSuffix?: string;
  /** pill: ui.btn + (className ?? ui.secondary). text: ui.text + className. */
  variant?: "pill" | "text";
  className?: string;
  /** Development only: compare a package's included prices with the place's live menu. */
  check?: { place: PlaceSlug; includes: readonly IncludeLine[] };
};

/**
 * Opens the offer sheet from a server-rendered card. Captures the button for
 * focus return (Safari does not focus clicked buttons) and warms the sheet's
 * chunk on intent. Once a membership or package has been bought this visit, it
 * reads "See your receipt" and opens the receipt. Gift buttons stay "Give this card".
 */
export function OfferButton({ request, label, srSuffix, variant = "pill", className, check }: OfferButtonProps) {
  const { openOffer, prefetchOffer, purchases } = useSerein();
  const bought = request.kind !== "gift" && (purchases.get(request.id) ?? 0) > 0;
  const target: OfferRequest = bought ? { ...request, view: "receipt" } : request;
  const classes = variant === "text" ? `${ui.text} ${className ?? ""}` : `${ui.btn} ${className ?? ui.secondary}`;
  return (
    <>
      <button
        type="button"
        className={classes}
        onClick={(event) => openOffer(target, { returnTo: event.currentTarget })}
        onPointerEnter={prefetchOffer}
        onFocus={prefetchOffer}
        onTouchStart={prefetchOffer}
      >
        <span>
          {bought ? "See your receipt" : label}
          {srSuffix ? <span className={ui.srOnly}>{srSuffix}</span> : null}
        </span>
        <ArrowUpRight />
      </button>
      {check ? <DevPriceCheck place={check.place} includes={check.includes} /> : null}
    </>
  );
}

/** "Yours · demonstration" once bought this visit, or "{n} bought · demonstration" for gifts. Nothing before. */
export function PurchaseBadge({ id, kind, className }: { id: string; kind: OfferKind; className?: string }) {
  const { purchases } = useSerein();
  const count = purchases.get(id) ?? 0;
  if (!count) return null;
  return (
    <span className={`${ui.badge} ${ui.badgeYours} ${className ?? ""}`}>
      {kind === "gift" ? `${count} bought · demonstration` : "Yours · demonstration"}
    </span>
  );
}

type DevPriceCheckProps = {
  place: PlaceSlug;
  /** Package lines: name, minutes and price are checked. */
  includes?: readonly IncludeLine[];
  /** Gift "covers" services: presence only. */
  names?: readonly string[];
};

/**
 * Offers are priced from the live menus of 13 Oct 2026. In development, say so in
 * the console when a place's menu has moved on (exact names), so the copy can be
 * updated. Renders nothing; never fetches; does nothing in production.
 */
export function DevPriceCheck(props: DevPriceCheckProps) {
  if (process.env.NODE_ENV === "production") return null;
  return <PriceCheck {...props} />;
}

function PriceCheck({ place, includes, names }: DevPriceCheckProps) {
  const { data, status } = usePlaceEntry(place);

  useEffect(() => {
    if (status !== "ready" || !data) return;
    const where = data.venues.find((venue) => venue.id === data.selectedVenueId)?.name ?? place;
    for (const line of includes ?? []) {
      const service = data.services.find((item) => item.name === line.service);
      if (!service) {
        console.warn(`[Serein offers] "${line.service}" is no longer on ${where}'s live menu.`);
        continue;
      }
      if (service.price !== line.price) {
        console.warn(`[Serein offers] ${line.service} at ${where} is S$${service.price} on the live menu; the offer says S$${line.price}.`);
      }
      if (service.duration !== line.minutes) {
        console.warn(`[Serein offers] ${line.service} at ${where} is ${service.duration} min on the live menu; the offer says ${line.minutes} min.`);
      }
    }
    for (const name of names ?? []) {
      if (!data.services.some((item) => item.name === name)) {
        console.warn(`[Serein offers] "${name}" is no longer on ${where}'s live menu.`);
      }
    }
  }, [data, includes, names, place, status]);

  return null;
}
