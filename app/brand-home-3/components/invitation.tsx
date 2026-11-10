import layout from "../layout.module.css";
import { BookButton } from "./book-button";
import styles from "./invitation.module.css";
import { Orb } from "./orb";
import { InvitationPlaces } from "./places-live";
import ui from "./ui.module.css";

/*
 * 10 · The invitation (spec §4.10): a centred stack over the drifting orb.
 * "Book a ritual" opens the current place (Serenity Spa House by default);
 * "Or book at" offers the other three, and the current place's live status
 * and address sit underneath.
 */
export function Invitation() {
  return (
    <section
      id="invitation"
      className={`${layout.section} ${layout.frame} ${styles.section}`}
      data-tone="paper-soft"
      aria-labelledby="invitation-title"
    >
      <div className={`${styles.stack} ${layout.reveal}`}>
        <p className={ui.label}>Your hour is waiting</p>
        <div className={styles.titleWrap}>
          <Orb variant="drift" className={styles.orb} />
          <h2 id="invitation-title" className={`${ui.displayL} ${styles.title}`}>
            <span className={ui.line}>Step out of the noise.</span>{" "}
            <span className={ui.line}><em>Come back restored.</em></span>
          </h2>
        </div>
        <BookButton autoPlaceSuffix className={`${ui.btn} ${ui.lg} ${ui.primary} ${styles.book}`}>
          Book a ritual
        </BookButton>
        <InvitationPlaces />
      </div>
    </section>
  );
}
