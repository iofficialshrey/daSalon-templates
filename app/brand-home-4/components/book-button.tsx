"use client";

import type { ReactNode } from "react";
import type { StudioSlug } from "../data/studios";
import { usePaloma } from "./provider";

type BookButtonProps = {
  className?: string;
  /** Book at this studio (and remember it as the current one). */
  slug?: StudioSlug;
  serviceId?: string;
  serviceName?: string;
  /** Adds a second line "at {short}" once a studio has been chosen (or for `slug`). */
  studioLine?: boolean;
  lineClassName?: string;
  /** Only when the visible text alone would be ambiguous; it must start with the visible text. */
  "aria-label"?: string;
  children: ReactNode;
};

/**
 * The one client island server chapters need to open booking. It captures the
 * button as the focus-return target (Safari does not focus clicked buttons),
 * warms the booking chunk on intent and opens at the chosen studio.
 */
export function BookButton({
  className,
  slug,
  serviceId,
  serviceName,
  studioLine = false,
  lineClassName,
  children,
  ...rest
}: BookButtonProps) {
  const { openBooking, prefetchBooking, currentStudio, studioBySlug } = usePaloma();
  const studio = studioLine ? studioBySlug(slug ?? currentStudio) : undefined;
  return (
    <button
      type="button"
      className={className}
      data-book=""
      aria-label={rest["aria-label"]}
      onClick={(event) => openBooking({ slug, serviceId, serviceName }, { returnTo: event.currentTarget })}
      onPointerEnter={prefetchBooking}
      onFocus={prefetchBooking}
      onTouchStart={prefetchBooking}
    >
      {children}
      {studio ? (
        <>
          {" "}
          <span className={lineClassName}>at {studio.short}</span>
        </>
      ) : null}
    </button>
  );
}
