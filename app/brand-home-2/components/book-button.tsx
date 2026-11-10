"use client";

import type { ReactNode } from "react";
import type { AtelierSlug } from "../data/ateliers";
import { useAtelier } from "./provider";

type BookButtonProps = {
  className?: string;
  /** Book at this atelier (and remember it as the current one). */
  slug?: AtelierSlug;
  serviceId?: string;
  "aria-label"?: string;
  children: ReactNode;
};

/**
 * The one client island server sections need to open booking. Warms the
 * booking chunk on intent; opens at the current atelier unless told otherwise.
 */
export function BookButton({ className, slug, serviceId, children, ...rest }: BookButtonProps) {
  const { openBooking, prefetchBooking } = useAtelier();
  return (
    <button
      type="button"
      className={className}
      data-book=""
      aria-label={rest["aria-label"]}
      onClick={() => openBooking({ slug, serviceId })}
      onPointerEnter={prefetchBooking}
      onFocus={prefetchBooking}
      onTouchStart={prefetchBooking}
    >
      {children}
    </button>
  );
}
