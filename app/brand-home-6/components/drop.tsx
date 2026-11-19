"use client";

import { useEffect, useId, useRef } from "react";
import { BOX, startDrop } from "./drop-engine";
import styles from "./drop.module.css";

const REDUCED = "(prefers-reduced-motion: reduce)";

/**
 * The glass drop's layer: a backdrop that softens and brightens what lies
 * behind the drop, then the body, the light it catches and its shadow. With
 * reduced motion it never starts, and each resting place shows a still drop.
 */
export function Drop() {
  const uid = useId().replace(/:/g, "");
  const rootRef = useRef<HTMLDivElement>(null);
  const glassRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<SVGPathElement>(null);
  const lightsRef = useRef<SVGGElement>(null);
  const shadowRef = useRef<SVGEllipseElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const glass = glassRef.current;
    const body = bodyRef.current;
    const lights = lightsRef.current;
    const shadow = shadowRef.current;
    if (!root || !glass || !body || !lights || !shadow) return;
    const query = window.matchMedia(REDUCED);
    let stop: (() => void) | null = null;
    const sync = () => {
      stop?.();
      stop = query.matches ? null : startDrop({ root, glass, body, lights, shadow });
    };
    sync();
    query.addEventListener("change", sync);
    return () => {
      query.removeEventListener("change", sync);
      stop?.();
    };
  }, []);

  const body = `${uid}-body`;
  const shade = `${uid}-shade`;
  const soft = `${uid}-soft`;

  return (
    <div ref={rootRef} className={styles.layer} data-visible="off" data-tone="light" aria-hidden="true">
      <div ref={glassRef} className={styles.glass} />
      <svg className={styles.svg} width={BOX} height={BOX} viewBox={`0 0 ${BOX} ${BOX}`}>
        <defs>
          <radialGradient id={body} cx="36%" cy="30%" r="78%">
            <stop offset="0%" className={styles.stop0} />
            <stop offset="38%" className={styles.stop1} />
            <stop offset="78%" className={styles.stop2} />
            <stop offset="100%" className={styles.stop3} />
          </radialGradient>
          <radialGradient id={shade} cx="50%" cy="50%" r="50%">
            <stop offset="0%" className={styles.shadow0} />
            <stop offset="100%" className={styles.shadow1} />
          </radialGradient>
          <filter id={soft} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2.4" />
          </filter>
        </defs>
        <ellipse ref={shadowRef} cx="0" cy="0" rx="46" ry="9" fill={`url(#${shade})`} />
        <path ref={bodyRef} className={styles.body} fill={`url(#${body})`} />
        {/* Light it catches, drawn for a radius of 50 and scaled to the drop. */}
        <g ref={lightsRef}>
          <ellipse cx="-17" cy="-22" rx="15" ry="8" transform="rotate(-32 -17 -22)" className={styles.glint} filter={`url(#${soft})`} />
          <ellipse cx="13" cy="25" rx="20" ry="7" transform="rotate(-14 13 25)" className={styles.caustic} filter={`url(#${soft})`} />
          <circle cx="24" cy="-6" r="2.6" className={styles.spark} />
        </g>
      </svg>
    </div>
  );
}
