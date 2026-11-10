import { posterSrc } from "../data/walk";
import { GiftButton } from "./back-cover-actions";
import { BookButton } from "./book-button";
import { ArrowRight } from "./icons";
import styles from "./closing.module.css";
import ui from "./ui.module.css";

/**
 * Section 7: the close. The room the film ended in, dimmed, and one
 * invitation: book, or give someone else the hour.
 */
export function Closing() {
  return (
    <section id="closing" data-tone="noir" aria-labelledby="closing-title" className={`${ui.noir} ${styles.closing}`}>
      <picture className={styles.picture}>
        <source type="image/avif" srcSet={posterSrc("1280x720", "last", "avif")} />
        <source type="image/webp" srcSet={posterSrc("1280x720", "last", "webp")} />
        <img
          className={styles.img}
          src={posterSrc("1280x720", "last", "jpg")}
          width={1280}
          height={720}
          alt=""
          loading="lazy"
          decoding="async"
        />
      </picture>
      <div className={styles.shade} aria-hidden="true" />
      <span className={styles.pane} aria-hidden="true" />

      <div className={`${ui.container} ${styles.inner}`}>
        <h2 id="closing-title" className={`${ui.h2} ${styles.title} ${ui.rise}`}>
          Your chair <em className={`${ui.italic} ${styles.em}`}>is waiting.</em>
        </h2>
        <p className={`${styles.lead} ${ui.rise} ${ui.rise2}`}>
          Four ateliers, live times in Singapore, and payment at the atelier after your visit.
        </p>
        <div className={`${styles.actions} ${ui.rise} ${ui.rise3}`} data-tag-hide="">
          <BookButton className={`${ui.btn} ${ui.lg} ${ui.primary} ${styles.book}`}>
            Book an appointment
            <ArrowRight />
          </BookButton>
          <GiftButton className={`${ui.btn} ${ui.textBtn} ${styles.gift}`}>
            <span className={ui.underline}>Give a gift card</span>
            <ArrowRight />
          </GiftButton>
        </div>
      </div>
    </section>
  );
}
