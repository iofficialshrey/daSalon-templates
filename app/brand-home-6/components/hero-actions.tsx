"use client";

import { ArrowRight } from "./icons";
import { JumpLink } from "./jump-link";
import { useNeroli } from "./provider";
import styles from "./hero.module.css";
import ui from "./ui.module.css";

export function HeroActions() {
  const { openBooking, warmBooking } = useNeroli();
  return (
    <div className={styles.actions}>
      <button
        type="button"
        className={`${ui.btn} ${ui.primary}`}
        onClick={() => openBooking()}
        onPointerEnter={warmBooking}
        onFocus={warmBooking}
      >
        Book a visit
        <ArrowRight />
      </button>
      <JumpLink to="treatments" className={ui.link}>
        See treatments
      </JumpLink>
    </div>
  );
}
