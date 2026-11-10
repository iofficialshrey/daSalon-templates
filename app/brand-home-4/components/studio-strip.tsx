"use client";

import { useVenueEntry } from "@/lib/dasalon/venue-cache";
import { venueStatus } from "@/lib/dasalon/venue-status";
import { useClock } from "@/lib/page/use-clock";
import { BookButton } from "./book-button";
import { usePaloma, type LiveStudio } from "./provider";
import styles from "./back-cover.module.css";
import ui from "./ui.module.css";

/**
 * "Book at": the four studios as buttons. Each opens booking at that studio
 * (which becomes the page's current studio). Status is live SGT wording from
 * menus already cached; until then each shows its published hours. It fetches
 * nothing itself.
 */
export function StudioStrip({ labelledBy }: { labelledBy: string }) {
  const { studios } = usePaloma();
  const now = useClock();
  return (
    <div className={styles.stripGrid} role="group" aria-labelledby={labelledBy}>
      {studios.map((studio) => (
        <StripButton key={studio.slug} studio={studio} now={now} />
      ))}
    </div>
  );
}

function StripButton({ studio, now }: { studio: LiveStudio; now: Date | null }) {
  const entry = useVenueEntry(studio.venueId);
  const status = now ? venueStatus(studio.hours, entry.data, now) : null;
  const tone = status?.tone === "open" ? ui.statusOpen : status?.tone === "none" ? ui.statusNone : "";
  return (
    <BookButton slug={studio.slug} className={styles.studio}>
      <span className={styles.studioTop}>
        <span className={styles.studioNo}>{studio.no}</span>{" "}
        <span className={styles.studioName}>{studio.name}</span>
      </span>{" "}
      <span className={styles.studioArea}>{studio.area}</span>{" "}
      {status ? (
        <span className={`${ui.status} ${tone} ${styles.studioStatus}`}>{status.text}</span>
      ) : (
        <span className={styles.studioStatus}>{studio.hoursLabel}</span>
      )}
    </BookButton>
  );
}
