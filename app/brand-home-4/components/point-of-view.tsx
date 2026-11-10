import { ChapterHead, Ghost } from "./chapter-head";
import { RunningFoot } from "./running-foot";
import styles from "./point-of-view.module.css";
import ui from "./ui.module.css";

/* 01 — Point of view: the porcelain manifesto. Server-only; the reveal and the wipe are CSS. */
export function PointOfView() {
  return (
    <section
      id="point-of-view"
      data-chapter="01"
      data-tone="porcelain"
      aria-labelledby="point-of-view-title"
      className={`${ui.frame} ${ui.chapter} ${styles.section}`}
    >
      <Ghost id="point-of-view" />
      <ChapterHead
        id="point-of-view"
        className={styles.head}
        title={
          <>
            <span className={styles.line}>Not a makeover.</span>{" "}
            <span className={`${styles.line} ${ui.accent} ${ui.wipe}`}>A clearer version.</span>
          </>
        }
        aside={
          <div className={styles.standfirst}>
            <p>
              We begin with how you live — your hair, your skin, your week — then work through line, texture and tone:
              hair and grooming and a spa on Clementi Road, skin at Changi, bridal on Sentosa. No reference photo is
              copied. No finish is prescribed.
            </p>
            <p>
              Every appointment leaves room for instinct, with the technical discipline to make it last beyond the
              mirror.
            </p>
          </div>
        }
      />
      <RunningFoot id="point-of-view" />
    </section>
  );
}
