import layout from "../layout.module.css";
import { JourneyPicker } from "./journey-picker";
import ui from "./ui.module.css";
import styles from "./journey.module.css";

/*
 * "What do you need today?" A guided pick: one need, one ritual, one Book.
 * The eyebrow and h2 are server rendered and handed to the picker, which owns
 * the sky, the giant word, the need radios and the recommendation, so all
 * three always read the same ritual record.
 */
export function Journey() {
  return (
    <section id="journey" className={`${layout.frame} ${styles.journey}`} data-tone="mist" aria-labelledby="journey-title">
      <JourneyPicker>
        <p className={ui.label}>Let the body answer</p>
        <h2 id="journey-title" className={ui.displayL}>
          <span className={ui.line}>What do you</span> <span className={ui.line}>need <em>today?</em></span>
        </h2>
      </JourneyPicker>
    </section>
  );
}
