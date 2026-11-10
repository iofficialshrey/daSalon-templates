import { BookButton, GiftButton } from "./actions";
import styles from "./closing.module.css";
import { ArrowRight } from "./icons";
import ui from "./ui.module.css";

const STILL = "/brand-home-1/scroll-film/maison-film";

/**
 * Closing band: the film's last frame (the suite), easing back from a slight zoom as it
 * scrolls in (motion.tsx), with one calm Book action and a gifting alternative.
 */
export function Closing() {
  return (
    <section id="book" className={`${ui.section} ${ui.onDark} ${styles.closing}`} aria-labelledby="book-title">
      <picture className={styles.media} data-mx-zoom="">
        <source media="(max-aspect-ratio: 4/5)" type="image/avif" srcSet={`${STILL}-576x768-last.v3.avif`} />
        <source media="(max-aspect-ratio: 4/5)" type="image/webp" srcSet={`${STILL}-576x768-last.v3.webp`} />
        <source type="image/avif" srcSet={`${STILL}-1280x720-last.v3.avif`} />
        <source type="image/webp" srcSet={`${STILL}-1280x720-last.v3.webp`} />
        <img
          className={styles.image}
          src={`${STILL}-1280x720-last.v3.jpg`}
          width={1280}
          height={720}
          alt=""
          loading="lazy"
          decoding="async"
        />
      </picture>
      <div className={styles.shade} aria-hidden="true" />

      <div className={`${ui.containerWide} ${styles.inner}`}>
        <div className={`${styles.copy} ${ui.reveal}`}>
          <h2 id="book-title" className={styles.title} tabIndex={-1} data-mx-split="">
            Your suite is prepared.
          </h2>
          <p className={styles.lead}>Four houses, live availability, and payment at the house after your visit.</p>
          <div className={styles.actions}>
            <BookButton className={`${ui.btn} ${ui.lg} ${ui.primaryOnDark} ${styles.book}`}>Book a visit</BookButton>
            <GiftButton giftId="house-card" className={`${ui.btn} ${ui.textBtn} ${styles.gift}`}>
              <span className={ui.underline}>Give a gift card</span>
              <ArrowRight />
            </GiftButton>
          </div>
        </div>
      </div>
    </section>
  );
}
