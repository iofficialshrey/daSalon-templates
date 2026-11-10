"use client";

import type { ReactNode } from "react";
import { placeBySlug, type PlaceSlug } from "../data/places";
import { ArrowUpRight, Ring } from "./icons";
import { useSerein } from "./provider";
import ui from "./ui.module.css";

type BookButtonProps = {
  /** Omit for the current place. */
  slug?: PlaceSlug;
  /** Resolved against that place's live menu (case-insensitive). */
  serviceName?: string;
  serviceId?: string;
  className?: string;
  /** Visible content. Keep it short ("Book", "Book a ritual", "Book Hot Stone Massage"). */
  children: ReactNode;
  /** Screen-reader continuation after the visible text, e.g. " Hot Stone Massage at Serenity Spa House". */
  srSuffix?: string;
  /** Screen-reader text before the visible text, e.g. "Book at " before a bare place name. */
  srPrefix?: string;
  /** Appends " at {place name}" (the slug's place, else currentPlace) as sr text. For generic "Book a ritual". */
  autoPlaceSuffix?: boolean;
  /** Trailing icon; Ring replaces it (by CSS) while the tap waits. Default "arrow" (ArrowUpRight). */
  icon?: "arrow" | "none";
  /** Runs before opening (e.g. close the menu sheet). */
  onBeforeOpen?: () => void;
};

/**
 * The one client island server sections need to open booking. It captures the
 * button as the focus-return target (Safari does not focus clicked buttons),
 * warms the booking chunk on intent and opens at the right place. The accessible
 * name always contains the visible text and names the place; no aria-label.
 */
export function BookButton({
  slug,
  serviceName,
  serviceId,
  className,
  children,
  srSuffix,
  srPrefix,
  autoPlaceSuffix = false,
  icon = "arrow",
  onBeforeOpen,
}: BookButtonProps) {
  const { openBooking, prefetchBooking, currentPlace } = useSerein();
  const suffix = srSuffix ?? (autoPlaceSuffix ? ` at ${placeBySlug(slug ?? currentPlace).name}` : null);
  return (
    <button
      type="button"
      data-book=""
      className={className}
      onClick={(event) => {
        onBeforeOpen?.();
        openBooking({ slug, serviceId, serviceName }, { returnTo: event.currentTarget });
      }}
      onPointerEnter={prefetchBooking}
      onFocus={prefetchBooking}
      onTouchStart={prefetchBooking}
    >
      {srPrefix ? <span className={ui.srOnly}>{srPrefix}</span> : null}
      <span>{children}</span>
      {suffix ? <span className={ui.srOnly}>{suffix}</span> : null}
      {icon === "arrow" ? (
        <>
          <ArrowUpRight className={ui.iconIdle} />
          <Ring className={ui.iconBusy} />
        </>
      ) : null}
    </button>
  );
}
