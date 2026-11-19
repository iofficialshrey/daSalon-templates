import Image from "next/image";
import lensPhoto from "../assets/lens.jpg";
import { HeroActions } from "./hero-actions";
import drop from "./drop.module.css";
import styles from "./hero.module.css";
import ui from "./ui.module.css";

/**
 * The surface. Copy on one side, a round lens of the mineral bath on the
 * other. The headline's full stop is the drop: it leaves as the page moves.
 */
export function Hero() {
  return (
    <section className={`${styles.hero} ${ui.light}`} data-tone="light" data-drop-zone="light" aria-labelledby="hero-title">
      <div className={`${ui.container} ${styles.grid}`}>
        <div className={styles.copy}>
          <h1 id="hero-title" className={ui.h1}>
            <span className={styles.line}>Come back</span>{" "}
            <span className={styles.line}>
              to your senses
              <span className={`${drop.slot} ${styles.stop}`} data-drop-slot="on" aria-hidden="true" />
            </span>
          </h1>
          <p className={`${ui.lead} ${styles.lead}`}>Water, warmth, touch, and enough time to feel the difference.</p>
          <HeroActions />
        </div>
        <div className={styles.lens}>
          <div className={styles.lensInner}>
            <Image
              src={lensPhoto}
              alt="A round mineral bath with a glass sphere resting in the water, beneath a curved white ceiling."
              fill
              priority
              sizes="(min-width: 900px) 46vw, 88vw"
              quality={75}
              className={styles.img}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
