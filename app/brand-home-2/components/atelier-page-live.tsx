"use client";

import type { AtelierSlug } from "../data/ateliers";
import { formatDate, formatPrice, relativeDay } from "@/lib/dasalon/locale";
import { menuFacts, venueStatus } from "@/lib/dasalon/venue-status";
import { useClock } from "@/lib/page/use-clock";
import { STATUS_WORDS, useLiveVenue } from "./ateliers-live";
import { Share } from "./icons";
import { useAtelier } from "./provider";
import styles from "./atelier-page.module.css";
import ui from "./ui.module.css";

type LiveProps = { slug: AtelierSlug };

function Placeholder({ wide = false }: { wide?: boolean }) {
  return <span className={`${styles.placeholder} ${wide ? styles.placeholderWide : ""}`} aria-hidden="true" />;
}

/** The live SGT status as the last item of the cover's facts row. */
export function CoverStatus({ slug }: LiveProps) {
  const { atelier, data, loading } = useLiveVenue(slug);
  const now = useClock();
  const status = now ? venueStatus(atelier.hours, data, now, STATUS_WORDS) : null;
  if (status) {
    return (
      <li className={styles.fact}>
        {status.tone === "open" ? <span className={`${ui.dot} ${styles.factDot}`} aria-hidden="true" /> : null}
        {status.text}
      </li>
    );
  }
  return loading || (data && !now) ? (
    <li className={styles.fact} aria-hidden="true">
      <Placeholder />
    </li>
  ) : null;
}

/** "14 services · from S$50" under the facts row. */
export function CoverMeta({ slug }: LiveProps) {
  const { data, loading } = useLiveVenue(slug);
  const facts = data ? menuFacts(data) : null;
  if (facts) {
    const count = facts.count
      ? `${facts.count} ${facts.count === 1 ? "service" : "services"}${facts.fromPrice != null ? ` · from ${formatPrice(facts.fromPrice)}` : ""}`
      : "No online services at the moment";
    return <p className={styles.meta}>{count}</p>;
  }
  return <p className={styles.meta}>{loading ? <Placeholder wide /> : null}</p>;
}

/** Shown only when the live API lists no venue with this atelier's name. */
export function LiveUnavailable({ slug }: LiveProps) {
  const { unmatched } = useLiveVenue(slug);
  return unmatched ? <p className={styles.unavailable}>Live details for this atelier are unavailable right now.</p> : null;
}

/** First working date from today (SGT): "Today", "Tomorrow" or "Wed, 14 Oct". */
export function NextBookableDay({ slug }: LiveProps) {
  const { data, loading } = useLiveVenue(slug);
  const now = useClock();
  if (data && now) {
    const next = menuFacts(data, now)?.nextDate ?? null;
    return <>{next ? relativeDay(next, now) ?? formatDate(next) : "No online dates at the moment"}</>;
  }
  if (loading || data) return <Placeholder />;
  return <>Shown when you book</>;
}

/** "{n} services in {k} lines · from S$X" */
export function OnlineCollection({ slug }: LiveProps) {
  const { data, loading } = useLiveVenue(slug);
  const facts = data ? menuFacts(data) : null;
  if (facts) {
    if (!facts.count) return <>No online services at the moment</>;
    const services = `${facts.count} ${facts.count === 1 ? "service" : "services"}`;
    const lines = `${facts.categories} ${facts.categories === 1 ? "line" : "lines"}`;
    const from = facts.fromPrice != null ? ` · from ${formatPrice(facts.fromPrice)}` : "";
    return <>{`${services} in ${lines}${from}`}</>;
  }
  if (loading) return <Placeholder wide />;
  return <>Shown when you book</>;
}

/** The system share sheet where there is one; otherwise copy the address. */
export function ShareButton({ name }: { name: string }) {
  const { showToast } = useAtelier();

  const share = async () => {
    const url = `${window.location.origin}${window.location.pathname}`;
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title: `${name} · Atelier`, url });
      } catch {
        // Dismissed or unavailable: nothing to report.
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      showToast("Link copied");
    } catch {
      showToast("Copy the link from the address bar");
    }
  };

  return (
    <button type="button" className={`${ui.iconBtn} ${styles.share}`} onClick={() => void share()}>
      <Share size={18} />
      <span className={styles.shareText}>Share</span>
    </button>
  );
}
