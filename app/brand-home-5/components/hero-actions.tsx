"use client";

import { jumpTo } from "@/lib/page/jump";
import { ArrowRight } from "./icons";
import { useOru } from "./provider";
import styles from "./hero.module.css";
import ui from "./ui.module.css";

const WINDOWS = [30, 60, 90] as const;

/** Book, or say how long you have: the treatments below are filtered to fit. */
export function HeroActions() {
  const { openBooking, warmBooking, setBudget } = useOru();

  const choose = (minutes: number) => {
    setBudget(minutes);
    jumpTo("treatments");
  };

  return (
    <div className={styles.actions}>
      <button
        type="button"
        className={`${ui.btn} ${ui.primary}`}
        onClick={() => openBooking()}
        onPointerEnter={warmBooking}
        onFocus={warmBooking}
      >
        Book a treatment
        <ArrowRight />
      </button>
      <div className={styles.window} role="group" aria-labelledby="hero-window">
        <p id="hero-window" className={styles.windowLabel}>
          How long do you have?
        </p>
        <div className={styles.chips}>
          {WINDOWS.map((minutes) => (
            <button key={minutes} type="button" className={styles.chip} onClick={() => choose(minutes)}>
              {minutes} min
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
