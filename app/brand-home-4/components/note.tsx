import { STUDIOS } from "../data/studios";
import { ChapterHead, Ghost } from "./chapter-head";
import { LiveServicesFact } from "./note-live";
import { RunningFoot } from "./running-foot";
import styles from "./note.module.css";
import ui from "./ui.module.css";

/* 08 — Editor's note. Only true, derived facts: the live total appears once every menu is in hand. */

const STUDIO_COUNT = STUDIOS.length;
const AREA_COUNT = new Set(STUDIOS.map((studio) => studio.area)).size;

export function Note() {
  return (
    <section
      id="note"
      data-chapter="08"
      data-tone="wash"
      aria-labelledby="note-title"
      className={`${ui.frame} ${ui.chapter} ${styles.section}`}
    >
      <Ghost id="note" />
      <div className={styles.spread}>
        <ChapterHead id="note" className={styles.head} kickerIsTitle />
        <p className={`${ui.note} ${styles.paragraph}`}>
          Paloma is four studios under one name — hair and grooming and a spa side by side in Clementi, a private skin
          clinic in Changi, a bridal studio on Sentosa — with one conviction: personal style should feel considered, not
          corrected.
        </p>
        <dl className={styles.facts}>
          <div className={styles.fact}>
            <dt className={`${ui.label} ${styles.factLabel}`}>studios</dt>
            <dd className={styles.factFigure}>{STUDIO_COUNT}</dd>
          </div>
          <div className={styles.fact}>
            <dt className={`${ui.label} ${styles.factLabel}`}>neighbourhoods</dt>
            <dd className={styles.factFigure}>{AREA_COUNT}</dd>
          </div>
          <LiveServicesFact
            className={styles.fact}
            labelClassName={`${ui.label} ${styles.factLabel}`}
            figureClassName={styles.factFigure}
          />
        </dl>
      </div>
      <RunningFoot id="note" />
    </section>
  );
}
