"use client";

import { PORTRAIT_QUERY, posterSrc, type PosterFrame } from "../data/film";
import { BookButton } from "./book-button";
import { ArrowDown } from "./icons";
import { StatusLine } from "./live";
import { useSerein } from "./provider";
import styles from "./film.module.css";
import ui from "./ui.module.css";

/*
 * The film's still pieces. FilmPoster, BeatACopy and ArrivalStatus are shared
 * with the scrub film (film.tsx); StaticDoor and StaticArrival are the lite
 * layout (spec §5.10): reduced motion, Save-Data, 2G, deviceMemory ≤ 2, or a
 * film that failed while the visitor was still at the top. Zero film bytes:
 * no <video>, no engine. Film renders them inside the same section#film, with
 * the same #film-end node between them, so the header's observer keeps its target.
 */

/** frame 0 (the closed doors) or frame 144 (the bed), portrait or landscape by PORTRAIT_QUERY. */
export function FilmPoster({
  frame,
  eager = false,
  part,
  hidden,
  className,
}: {
  frame: PosterFrame;
  eager?: boolean;
  part?: string;
  hidden?: boolean;
  className?: string;
}) {
  return (
    <picture data-part={part} hidden={hidden} className={className}>
      <source media={PORTRAIT_QUERY} type="image/avif" srcSet={posterSrc("576x768", frame, "avif")} />
      <source media={PORTRAIT_QUERY} type="image/webp" srcSet={posterSrc("576x768", frame, "webp")} />
      <source media={PORTRAIT_QUERY} srcSet={posterSrc("576x768", frame, "jpg")} />
      <source type="image/avif" srcSet={posterSrc("1280x720", frame, "avif")} />
      <source type="image/webp" srcSet={posterSrc("1280x720", frame, "webp")} />
      <img
        src={posterSrc("1280x720", frame, "jpg")}
        width={1280}
        height={720}
        alt=""
        fetchPriority={eager ? "high" : undefined}
        loading={eager ? "eager" : "lazy"}
        decoding="async"
      />
    </picture>
  );
}

/** Beat A: the one h1 on the page. */
export function BeatACopy() {
  return (
    <>
      <p className={ui.label}>A spa experience by da Salon</p>
      <h1 id="film-title" className={`${ui.displayXl} ${styles.titleA}`}>
        <span className={ui.line}>Come back</span> <span className={ui.line}>to <em>yourself.</em></span>
      </h1>
      <p className={`${ui.lead} ${styles.leadA}`}>Your restorative hour begins beyond these doors.</p>
    </>
  );
}

/** The live status of the place every generic Book opens: "Serenity Spa House · Open until 9 pm". */
export function ArrivalStatus({ onDark = false, className }: { onDark?: boolean; className?: string }) {
  const { currentPlace } = useSerein();
  return <StatusLine slug={currentPlace} withName onDark={onDark} className={className} />;
}

/** Panel 1: the first viewport, identical to the scrub version at p = 0, with no motion, cue, rail or Skip. */
export function StaticDoor() {
  return (
    <div className={styles.door} data-tone="film">
      <div className={styles.media} aria-hidden="true">
        <FilmPoster frame="first" eager />
      </div>
      <div className={styles.shadeTop} aria-hidden="true" />
      <div className={styles.shadeBase} aria-hidden="true" />
      <div className={styles.shadeA} aria-hidden="true" />
      <div className={`${styles.beat} ${styles.beatA}`}>
        <BeatACopy />
      </div>
    </div>
  );
}

/** Panel 2: Serein's arrival split, the last frame beside the arrival copy. */
export function StaticArrival() {
  return (
    <div className={styles.arrival} data-tone="paper-soft">
      <div className={styles.arrivalArt} aria-hidden="true">
        <picture>
          <source type="image/avif" srcSet={posterSrc("576x768", "last", "avif")} />
          <source type="image/webp" srcSet={posterSrc("576x768", "last", "webp")} />
          <img src={posterSrc("576x768", "last", "jpg")} width={576} height={768} alt="" loading="lazy" decoding="async" />
        </picture>
      </div>
      <div className={styles.arrivalCopy}>
        <p className={ui.label}>You have arrived</p>
        <h2 id="film-arrival-title" className={`${ui.displayL} ${styles.arrivalTitle}`}>
          <span className={ui.line}>The luxury of</span> <span className={ui.line}><em>feeling restored.</em></span>
        </h2>
        <p className={`${ui.lead} ${styles.arrivalLead}`}>Leave the pace of the day behind.</p>
        <div className={styles.actions}>
          <BookButton autoPlaceSuffix className={`${ui.btn} ${ui.primary}`}>
            Book a ritual
          </BookButton>
          <a className={ui.text} href="#rituals" data-jump="">
            See the rituals <ArrowDown />
          </a>
        </div>
        <ArrivalStatus className={styles.status} />
      </div>
    </div>
  );
}
