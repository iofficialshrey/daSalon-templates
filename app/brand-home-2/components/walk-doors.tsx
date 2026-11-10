import { WALK_COPY } from "../data/walk";
import styles from "./walk-doors.module.css";

/*
 * The doors, as on the production site: two black fluted leaves, each with a
 * champagne hairline inset and a slim outlined pull, sliding apart into the
 * walls to reveal the film. Everything here is decoration (aria-hidden); the
 * controller finds the moving parts by data-part and writes only their
 * opacity and transform.
 */

function Leaf({ side }: { side: "left" | "right" }) {
  return (
    <div className={`${styles.leaf} ${side === "left" ? styles.leafLeft : styles.leafRight}`} data-part="leaf">
      <span className={styles.pull} />
    </div>
  );
}

/** The two leaves and the house name across them (z6). */
export function Doors() {
  return (
    <div className={styles.doors} aria-hidden="true">
      <Leaf side="left" />
      <Leaf side="right" />
      <span className={styles.sign} data-part="door-tag">
        <span className={styles.signWord}>{WALK_COPY.sign}</span>
        <span className={styles.signHint}>{WALK_COPY.signHint}</span>
      </span>
    </div>
  );
}

/** Static mode: the same closed doors as a band, with the house name across them. */
export function DoorBand() {
  return (
    <div className={styles.band} aria-hidden="true">
      <span className={`${styles.bandLeaf} ${styles.leafLeft}`}>
        <span className={styles.pull} />
      </span>
      <span className={`${styles.bandLeaf} ${styles.leafRight}`}>
        <span className={styles.pull} />
      </span>
      <span className={styles.bandWord}>{WALK_COPY.sign}</span>
    </div>
  );
}
