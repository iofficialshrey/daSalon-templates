"use client";

import { useEffect, useRef } from "react";
import styles from "./orb.module.css";

type OrbProps = {
  /** breath: three rings and a pool glow that exhale once. drift: a pool and sage glow disc that drifts once. still: never moves. */
  variant: "breath" | "drift" | "still";
  /** Size and position come from the caller (the orb is a square that fills its box). */
  className?: string;
};

/**
 * Serein's signature circle. Decorative (aria-hidden). When at least 40% of it
 * is visible, an IntersectionObserver sets data-play once and CSS runs the
 * 4.8s one-shot, only under prefers-reduced-motion: no-preference.
 */
export function Orb({ variant, className }: OrbProps) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element || variant === "still") return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        element.dataset.play = "";
        observer.disconnect();
      },
      { threshold: 0.4 },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [variant]);

  return (
    <span ref={ref} className={`${styles.orb} ${styles[variant]} ${className ?? ""}`} aria-hidden="true">
      {variant === "drift" ? null : <span className={styles.core} />}
    </span>
  );
}
