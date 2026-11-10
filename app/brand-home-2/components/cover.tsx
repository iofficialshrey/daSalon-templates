import { COVER_ART, srcSet } from "../data/art";
import { BookButton } from "./book-button";
import { StepInside } from "./cover-actions";
import { ArrowDown, ArrowRight } from "./icons";
import styles from "./cover.module.css";
import ui from "./ui.module.css";

const ALT = "A woman in a black wrap dress steps out of a dark timber doorway, her reflection in the mirror beside her.";

/* Landscape phones keep the wide crop; phones and portrait screens take the 2:3 crop. */
const LANDSCAPE_PHONE = "(max-height: 500px) and (pointer: coarse)";
const STACKED = "(max-width: 759px), (max-aspect-ratio: 4/5)";

/**
 * Section 1: the arrival. One photograph, one line, one invitation. As the
 * visitor scrolls, the room darkens and settles towards the doors that follow
 * (CSS scroll-driven, still where unsupported).
 */
export function Cover() {
  const wide = COVER_ART.wide;
  const tall = COVER_ART.tall;
  const tallSize = tall.files[0];
  const fallback = wide.files[wide.files.length - 1];

  return (
    <section id="cover" data-tone="cover" aria-labelledby="cover-title" className={`${ui.noir} ${styles.cover}`}>
      <div className={styles.media}>
        <picture className={styles.picture}>
          <source media={LANDSCAPE_PHONE} type="image/avif" srcSet={srcSet(wide, "avif")} sizes="100vw" />
          <source media={LANDSCAPE_PHONE} type="image/webp" srcSet={srcSet(wide, "webp")} sizes="100vw" />
          <source
            media={STACKED}
            type="image/avif"
            srcSet={srcSet(tall, "avif")}
            sizes="100vw"
            width={tallSize.width}
            height={tallSize.height}
          />
          <source
            media={STACKED}
            type="image/webp"
            srcSet={srcSet(tall, "webp")}
            sizes="100vw"
            width={tallSize.width}
            height={tallSize.height}
          />
          <source type="image/avif" srcSet={srcSet(wide, "avif")} sizes="100vw" />
          <source type="image/webp" srcSet={srcSet(wide, "webp")} sizes="100vw" />
          {/* The LCP: eager and high priority; nothing else on the page asks for that. */}
          <img
            className={styles.img}
            src={`${fallback.base}.webp`}
            srcSet={srcSet(wide, "webp")}
            sizes="100vw"
            width={wide.width}
            height={wide.height}
            alt={ALT}
            loading="eager"
            decoding="async"
            fetchPriority="high"
          />
        </picture>
        <div className={styles.shade} aria-hidden="true" />
        <div className={styles.dusk} aria-hidden="true" />
      </div>

      <div className={styles.frame}>
        <div className={styles.copy}>
          <h1 id="cover-title" className={`${ui.h1} ${styles.h1}`}>
            <span className={styles.line}>Beauty, made</span>{" "}
            <em className={`${ui.italic} ${styles.line} ${styles.em}`}>personal.</em>
          </h1>
          <p className={styles.lead}>
            Considered cuts, restorative rituals and unhurried care, composed around you from the moment you arrive.
          </p>
          <div className={styles.cta} data-tag-hide="">
            <BookButton className={`${ui.btn} ${ui.lg} ${ui.primary} ${styles.book}`}>
              Book an appointment
              <ArrowRight />
            </BookButton>
            <StepInside className={`${ui.btn} ${ui.textBtn} ${styles.step}`}>
              <span className={ui.underline}>Step inside</span>
              <ArrowDown />
            </StepInside>
          </div>
        </div>
      </div>

      <div className={styles.cue} aria-hidden="true">
        <i />
      </div>
    </section>
  );
}
