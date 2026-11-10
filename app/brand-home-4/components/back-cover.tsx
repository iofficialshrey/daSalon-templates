import { ISSUE } from "../data/chapters";
import { FILM_COPY, posterSrc } from "../data/film";
import { BookButton } from "./book-button";
import { Ghost } from "./chapter-head";
import { ArrowRight } from "./icons";
import { StudioStrip } from "./studio-strip";
import styles from "./back-cover.module.css";
import ui from "./ui.module.css";

/*
 * 09 — Back cover. Bookends the cover with the film's final frame, then the
 * mark, the finale and one call to action that names the chosen studio, and a
 * light "Book at" strip of the four studios. The real footer follows it.
 */

const STRIP_LABEL_ID = "back-cover-book-at";

export function BackCover() {
  return (
    <section
      id="back-cover"
      data-chapter="09"
      data-tone="ink"
      aria-labelledby="back-cover-title"
      className={`${ui.frame} ${ui.chapter} ${styles.section}`}
    >
      <Ghost id="back-cover" />
      <div className={styles.stack}>
        <figure className={styles.thumb}>
          <picture className={styles.thumbFrame}>
            <source type="image/avif" srcSet={posterSrc("576x768", "last", "avif")} />
            <source type="image/webp" srcSet={posterSrc("576x768", "last", "webp")} />
            <img
              className={styles.thumbImg}
              src={posterSrc("576x768", "last", "jpg")}
              width={576}
              height={768}
              alt={FILM_COPY.altLast}
              loading="lazy"
              decoding="async"
            />
          </picture>
          <figcaption className={`${ui.label} ${styles.thumbCaption}`}>The cover, final frame.</figcaption>
        </figure>

        <p className={styles.mark}>
          <span className={styles.markName}>Paloma</span>{" "}
          <span className={`${ui.label} ${styles.markIssue}`}>{ISSUE.label}</span>
        </p>

        <h2 id="back-cover-title" className={`${ui.displayFinale} ${ui.rise} ${styles.title}`} tabIndex={-1} data-jump-focus="">
          <span className={styles.line}>Ready for</span>{" "}
          <span className={`${styles.line} ${ui.accent} ${ui.wipe}`}>your next shape?</span>
        </h2>

        <BookButton className={`${ui.btn} ${ui.btnPrimary} ${ui.btnLg} ${styles.cta}`} studioLine lineClassName={styles.ctaLine}>
          <span className={styles.ctaLabel}>Book the look</span>
          <ArrowRight className={styles.ctaArrow} />
        </BookButton>
      </div>

      <div className={styles.strip}>
        <p id={STRIP_LABEL_ID} className={`${ui.label} ${styles.stripLabel}`}>
          Book at
        </p>
        <StudioStrip labelledBy={STRIP_LABEL_ID} />
      </div>
    </section>
  );
}
