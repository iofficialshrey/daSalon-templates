import { OBJECT_STUDY } from "../data/art";
import { ArtPicture } from "./art-picture";
import { ChapterHead, Ghost } from "./chapter-head";
import { RunningFoot } from "./running-foot";
import styles from "./method.module.css";
import ui from "./ui.module.css";

/* 06 — Method: the ink split with the object study. "Then edit.": three of the four studios don't cut. */

const STEPS = [
  {
    title: "Read the material",
    text: "Hair, skin or body: texture, history, routine and condition, before anything is decided.",
  },
  {
    title: "Find the line",
    text: "A plan drawn for the person, not the season — agreed with you, not on you.",
  },
  {
    title: "Teach the finish",
    text: "Simple steps to repeat at home, so the result lasts beyond the mirror.",
  },
] as const;

export function Method() {
  return (
    <section
      id="method"
      data-chapter="06"
      data-tone="ink"
      aria-labelledby="method-title"
      className={`${ui.frame} ${ui.chapter} ${styles.section}`}
    >
      <Ghost id="method" />
      <figure className={styles.media}>
        <ArtPicture
          art={OBJECT_STUDY}
          sizes="(max-width: 1099px) 100vw, 50vw"
          alt="Object study: a comb and a dropper bottle on stone, printed in Paloma blue."
          className={styles.picture}
          imgClassName={styles.image}
        />
        <figcaption className={`${ui.label} ${styles.caption}`}>Object study No. 09</figcaption>
      </figure>
      <div className={styles.copy}>
        <ChapterHead
          id="method"
          className={styles.head}
          title={
            <>
              <span className={styles.line}>Look.</span>{" "}
              <span className={styles.line}>Listen.</span>{" "}
              <span className={`${styles.line} ${ui.accent}`}>Then edit.</span>
            </>
          }
        />
        <ol className={styles.steps}>
          {STEPS.map((step) => (
            <li key={step.title} className={styles.step}>
              <h3 className={styles.stepTitle}>{step.title}</h3>
              <p className={styles.stepText}>{step.text}</p>
            </li>
          ))}
        </ol>
        <RunningFoot id="method" />
      </div>
    </section>
  );
}
