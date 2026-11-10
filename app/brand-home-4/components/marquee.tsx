import { Fragment } from "react";
import { BANDS } from "../data/chapters";
import { Diamond } from "./icons";
import { MotionToggle } from "./motion-toggle";
import styles from "./marquee.module.css";
import ui from "./ui.module.css";

/*
 * The ticker and the kinetic interlude. Each band is a static rotated wrapper
 * around an aria-hidden track of two identical halves; the track slides −50 %
 * so the loop is seamless at any width. Rotation and translation never share an
 * element. The provider pauses any [data-marquee] off-screen (data-run="false");
 * the global Pause motion pauses every track; reduced motion keeps them still.
 */

type HalfProps = {
  phrases: readonly string[];
  repeat: number;
  /** Indexes of phrases shown in the accent colour. */
  accent?: readonly number[];
  accentClassName?: string;
};

function Half({ phrases, repeat, accent, accentClassName }: HalfProps) {
  const items = Array.from({ length: repeat }, (_, round) =>
    phrases.map((phrase, index) => ({ key: `${round}-${index}`, phrase, accent: accent?.includes(index) ?? false })),
  ).flat();
  return (
    <div className={styles.half}>
      {items.map((item) => (
        <Fragment key={item.key}>
          <span className={item.accent ? accentClassName : undefined}>{item.phrase}</span>
          <Diamond className={styles.diamond} />
        </Fragment>
      ))}
    </div>
  );
}

function Track({ className, ...half }: HalfProps & { className: string }) {
  return (
    <div className={styles.window} aria-hidden="true">
      <div className={`${styles.track} ${className}`}>
        <Half {...half} />
        <Half {...half} />
      </div>
    </div>
  );
}

/** The cobalt band under the cover: Paloma's four principles. */
export function Ticker() {
  const { phrases, repeat, sr } = BANDS.ticker;
  return (
    <>
      <div className={`${styles.band} ${styles.ticker}`} data-tone="cobalt" data-marquee="">
        <Track className={styles.tickerTrack} phrases={phrases} repeat={repeat} />
        <MotionToggle className={`${styles.toggle} ${styles.tickerToggle}`} />
      </div>
      <p className={ui.srOnly}>{sr}</p>
    </>
  );
}

/** Two huge bands between Method and Studios: ink on porcelain, then porcelain on cobalt running the other way. */
export function Interlude() {
  const one = BANDS.interludeOne;
  const two = BANDS.interludeTwo;
  return (
    <div className={`${styles.band} ${styles.interlude}`} data-tone="porcelain" data-marquee="">
      <div className={`${ui.interlude} ${styles.bandOne}`}>
        <Track className={styles.trackOne} phrases={one.phrases} repeat={one.repeat} />
      </div>
      <div className={`${ui.interlude} ${styles.bandTwo}`} data-tone="cobalt">
        <Track
          className={styles.trackTwo}
          phrases={two.phrases}
          repeat={two.repeat}
          accent={two.accent}
          accentClassName={styles.washWord}
        />
      </div>
      <p className={ui.srOnly}>{one.sr}</p>
      <div className={styles.interludeFoot}>
        <MotionToggle className={`${styles.toggle} ${styles.interludeToggle}`} />
      </div>
    </div>
  );
}
