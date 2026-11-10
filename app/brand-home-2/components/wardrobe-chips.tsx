import type { CSSProperties } from "react";
import type { Redemption } from "../data/pieces";
import ui from "./ui.module.css";
import styles from "./chips.module.css";

type ChipsProps = {
  redemption: Redemption;
  /** "lg" in the fitting room. */
  size?: "md" | "lg";
  /** Kept for callers; the cells no longer animate. */
  animate?: boolean;
  /** Screen-reader caption; omit when the row already exposes it. */
  srLabel?: string;
};

const step = (index: number) => ({ "--i": index }) as CSSProperties;

/**
 * Redemption drawn as chips: six numbered session squares, six value cells
 * joined in one bar (coral to rouge), or three 60-minute time cells. The chips
 * are decoration; the caption carries the meaning.
 */
export function RedemptionChips({ redemption, size = "md", animate = false, srLabel }: ChipsProps) {
  const chipsClass = `${styles.chips} ${size === "lg" ? styles.chipsLg : ""} ${animate ? styles.chipsAnimate : ""}`;
  let chips;
  if (redemption.type === "sessions") {
    chips = Array.from({ length: redemption.count }, (_, index) => (
      <span key={index} className={styles.session} style={step(index)}>{index + 1}</span>
    ));
  } else if (redemption.type === "value") {
    const last = Math.max(1, redemption.cells - 1);
    chips = Array.from({ length: redemption.cells }, (_, index) => (
      <span
        key={index}
        className={styles.valueCell}
        style={{ "--i": index, "--mix": `${Math.round((index / last) * 100)}%` } as CSSProperties}
      />
    ));
  } else {
    chips = Array.from({ length: redemption.cells }, (_, index) => (
      <span key={index} className={styles.timeCell} style={step(index)}>{redemption.cellMinutes} min</span>
    ));
  }

  return (
    <div className={`${styles.redeem} ${size === "lg" ? styles.redeemLg : ""}`}>
      <span className={chipsClass} data-type={redemption.type} aria-hidden="true">{chips}</span>
      <span className={styles.chipCaption} aria-hidden="true">{redemption.caption}</span>
      {srLabel ? <span className={ui.srOnly}>{srLabel}</span> : null}
    </div>
  );
}
