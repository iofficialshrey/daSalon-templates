import layout from "../layout.module.css";
import { BookButton } from "./book-button";
import { ServiceMeta } from "./live";
import { MassageRange, WarmthFrom } from "./places-live";
import styles from "./slow-hours.module.css";
import ui from "./ui.module.css";

/*
 * 06 · The Serein hour, "Don't book yourself back-to-back." (spec §4.6), on
 * the sage band. Serein's pace as advice to the guest, not a venue policy: a
 * four-step timeline (two figures live from Serenity's menu, with the 13 Oct
 * values as fallbacks), a Book for the warmth step, then the pull quote.
 */
export function SlowHours() {
  return (
    <section
      id="slow-hours"
      className={`${layout.section} ${layout.frame}`}
      data-tone="band"
      aria-labelledby="slow-hours-title"
    >
      <div className={`${layout.head} ${layout.reveal}`}>
        <div className={layout.headMain}>
          <p className={ui.label}>The Serein hour</p>
          <h2 id="slow-hours-title" className={ui.displayL}>
            <span className={ui.line}>Don&apos;t book yourself</span> <span className={ui.line}><em>back-to-back.</em></span>
          </h2>
        </div>
        <p className={`${layout.headNote} ${styles.note}`}>
          Give the hour room on either side. Arrive a little early, leave a little late, so your calm does not end at the
          treatment-room door.
        </p>
      </div>

      <ol className={`${styles.timeline} ${layout.reveal}`}>
        <li className={styles.step}>
          <span className={styles.dot} aria-hidden="true" />
          <p className={styles.numeral}>−15</p>
          <p className={`${ui.label} ${styles.stepLabel}`}>Arrive</p>
          <p className={`${ui.bodyS} ${styles.stepLine}`}>Fifteen minutes early. Leave the day at the door.</p>
        </li>
        <li className={styles.step}>
          <span className={styles.dot} aria-hidden="true" />
          <p className={styles.numeral}>00</p>
          <p className={`${ui.label} ${styles.stepLabel}`}>Your ritual begins</p>
          <p className={`${ui.bodyS} ${styles.stepLine}`}>
            Massages at Serenity Spa House run from <MassageRange /> minutes.
          </p>
        </li>
        <li className={styles.step}>
          <span className={styles.dot} aria-hidden="true" />
          <p className={styles.numeral}>60</p>
          <p className={`${ui.label} ${styles.stepLabel}`}>Stay in the warmth</p>
          <p className={`${ui.bodyS} ${styles.stepLine}`}>
            Add a half-hour of steam, sauna or jacuzzi, from <WarmthFrom />.
          </p>
        </li>
        <li className={styles.step}>
          <span className={styles.dot} aria-hidden="true" />
          <p className={styles.numeral}>90</p>
          <p className={`${ui.label} ${styles.stepLabel}`}>Leave slowly</p>
          <p className={`${ui.bodyS} ${styles.stepLine}`}>Keep the next hour free. That part is up to you.</p>
        </li>
      </ol>

      <div className={styles.cta}>
        <BookButton
          slug="serenity-spa-house"
          serviceName="Steam Therapy"
          srSuffix=" at Serenity Spa House"
          className={`${ui.btn} ${ui.onDark}`}
        >
          Book Steam Therapy
        </BookButton>
        <ServiceMeta slug="serenity-spa-house" name="Steam Therapy" withPlace />
      </div>

      <figure className={`${styles.quote} ${layout.reveal}`}>
        <blockquote className={`${ui.displayM} ${styles.quoteText}`}>
          <p>
            <span className={ui.line}>“For the first time in weeks,</span>{" "}
            <span className={ui.line}><em>I heard my own breath.</em>”</span>
          </p>
        </blockquote>
        <figcaption className={ui.label}>What we hope you&apos;ll say on the way out</figcaption>
      </figure>
    </section>
  );
}
