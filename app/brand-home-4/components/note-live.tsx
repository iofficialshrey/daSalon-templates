"use client";

import { useVenueEntry } from "@/lib/dasalon/venue-cache";
import { usePaloma } from "./provider";

type LiveServicesFactProps = {
  className?: string;
  labelClassName?: string;
  figureClassName?: string;
};

/**
 * "{N} services on the live menus": the sum of all four studios' live menus,
 * shown only once every one of them is cached. Never estimated, and it fetches
 * nothing itself: the menus arrive as the visitor uses the edit and the studios.
 */
export function LiveServicesFact({ className, labelClassName, figureClassName }: LiveServicesFactProps) {
  const { studios } = usePaloma();
  // Paloma has exactly four studios; one subscription each.
  const first = useVenueEntry(studios[0]?.venueId);
  const second = useVenueEntry(studios[1]?.venueId);
  const third = useVenueEntry(studios[2]?.venueId);
  const fourth = useVenueEntry(studios[3]?.venueId);
  const entries = [first, second, third, fourth];

  const complete = studios.length === entries.length
    && studios.every((studio) => studio.venueId)
    && entries.every((entry, index) => entry.data?.selectedVenueId === studios[index].venueId);
  if (!complete) return null;

  const total = entries.reduce((sum, entry) => sum + (entry.data?.services.length ?? 0), 0);
  return (
    <div className={className}>
      <dt className={labelClassName}>services on the live menus</dt>
      <dd className={figureClassName}>{total}</dd>
    </div>
  );
}
