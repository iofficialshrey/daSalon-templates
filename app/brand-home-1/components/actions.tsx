"use client";

import type { ReactNode } from "react";
import type { HouseSlug } from "../data/houses";
import { jumpTo, scrollToTop } from "@/lib/page/jump";
import { useMaison } from "./provider";

type ActionProps = {
  className?: string;
  children: ReactNode;
  "aria-label"?: string;
};

/** Opens the booking window, at a given house when provided, otherwise at the visitor's current house. */
export function BookButton({ house, className, children, "aria-label": ariaLabel }: ActionProps & { house?: HouseSlug }) {
  const { openBooking, prefetchBooking } = useMaison();
  return (
    <button
      type="button"
      className={className}
      aria-label={ariaLabel}
      data-book=""
      onClick={() => openBooking(house ? { house } : {})}
      onPointerEnter={prefetchBooking}
      onFocus={prefetchBooking}
      onTouchStart={prefetchBooking}
    >
      {children}
    </button>
  );
}

/** Opens a house's detail sheet. */
export function HouseButton({ house, className, children, "aria-label": ariaLabel }: ActionProps & { house: HouseSlug }) {
  const { openHouse, prefetchHouseSheet } = useMaison();
  return (
    <button
      type="button"
      className={className}
      aria-label={ariaLabel}
      onClick={() => openHouse(house)}
      onPointerEnter={prefetchHouseSheet}
      onFocus={prefetchHouseSheet}
      onTouchStart={prefetchHouseSheet}
    >
      {children}
    </button>
  );
}

/** Opens the gift-card flow for one card. */
export function GiftButton({ giftId, className, children, "aria-label": ariaLabel }: ActionProps & { giftId: string }) {
  const { openGift, prefetchFlows } = useMaison();
  return (
    <button
      type="button"
      className={className}
      aria-label={ariaLabel}
      onClick={() => openGift(giftId)}
      onPointerEnter={prefetchFlows}
      onFocus={prefetchFlows}
      onTouchStart={prefetchFlows}
    >
      {children}
    </button>
  );
}

/** In-page link that jumps instantly across long distances and focuses the target heading. */
export function JumpLink({ to, className, children, "aria-label": ariaLabel }: ActionProps & { to: string }) {
  return (
    <a
      href={`#${to}`}
      className={className}
      aria-label={ariaLabel}
      onClick={(event) => {
        event.preventDefault();
        jumpTo(to);
      }}
    >
      {children}
    </a>
  );
}

/** Returns to the very top of the page (the film's first frame). */
export function TopButton({ className, children, "aria-label": ariaLabel }: ActionProps) {
  return (
    <button
      type="button"
      className={className}
      aria-label={ariaLabel}
      onClick={() => {
        scrollToTop();
        document.getElementById("mx-skip")?.focus({ preventScroll: true });
      }}
    >
      {children}
    </button>
  );
}
