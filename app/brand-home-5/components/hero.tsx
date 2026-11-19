import Image from "next/image";
import heroPhoto from "../assets/hero.jpg";
import { HeroActions } from "./hero-actions";
import styles from "./hero.module.css";
import ui from "./ui.module.css";

/**
 * The arrival: one photograph, one line, and the question the whole page
 * turns on (how long do you have?). It holds still while the rest of the
 * page rises over it, darkening a little as it goes.
 */
export function Hero() {
  return (
    <section className={`${styles.hero} ${ui.light}`} data-tone="light" aria-labelledby="hero-title">
      <div className={styles.media}>
        <Image
          src={heroPhoto}
          alt="A guest in a linen robe stands beside the round lavender-tiled bath at Oru Spa."
          fill
          priority
          sizes="(max-aspect-ratio: 1/1) 188vh, 100vw"
          quality={75}
          className={styles.img}
        />
        <div className={styles.wash} aria-hidden="true" />
        <div className={styles.dusk} aria-hidden="true" />
      </div>
      <div className={`${ui.container} ${styles.inner}`}>
        <div className={styles.copy}>
          <h1 id="hero-title" className={`${ui.h1}`}>
            <span className={styles.line}>The art of</span>{" "}
            <em className={`${ui.accent} ${styles.line} ${styles.second}`}>exhale.</em>
          </h1>
          <p className={`${ui.lead} ${styles.lead}`}>
            Rest is not an escape. It is how you return with more of yourself.
          </p>
          <HeroActions />
        </div>
      </div>
    </section>
  );
}
