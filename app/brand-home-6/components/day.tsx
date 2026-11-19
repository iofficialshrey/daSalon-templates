"use client";

import Image, { type StaticImageData } from "next/image";
import { useEffect, useRef } from "react";
import restorePhoto from "../assets/restore.jpg";
import returnPhoto from "../assets/return.jpg";
import settlePhoto from "../assets/settle.jpg";
import drop from "./drop.module.css";
import styles from "./day.module.css";
import ui from "./ui.module.css";

type Step = { title: string; body: string; photo: StaticImageData; alt: string };

const STEPS: readonly Step[] = [
  {
    title: "Settle",
    body: "Neroli tea, mineral steam and time to arrive without rushing.",
    photo: settlePhoto,
    alt: "Illustrative photograph: a round mineral bath with a glass sphere resting on the water.",
  },
  {
    title: "Restore",
    body: "A treatment shaped around how your body and skin feel today.",
    photo: restorePhoto,
    alt: "Illustrative photograph: a stone treatment bed with folded celadon linen, neroli blossom and a glass bowl.",
  },
  {
    title: "Return",
    body: "Quiet pool time, seasonal fruit and a slow walk back into the city.",
    photo: returnPhoto,
    alt: "Illustrative photograph: a shallow courtyard pool under a curved white roof, with a lounger in the shade.",
  },
];

/** Wide, landscape screens that are tall enough pin the section and slide the panels sideways. */
const PINNED = "(min-width: 900px) and (min-aspect-ratio: 1/1) and (min-height: 600px)";

/**
 * A day at Néroli: Settle, Restore, Return. On wide screens the section holds
 * still while the three panels slide past, and the drop rolls along the
 * waterline beneath them from one step to the next. Phones read them in turn.
 */
export function Day() {
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLOListElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);
  const slotRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const track = trackRef.current;
    const line = lineRef.current;
    const slot = slotRef.current;
    if (!section || !track || !line || !slot) return;
    const pinned = window.matchMedia(PINNED);
    let top = 0;
    let travel = 1;
    let shift = 0;
    let span = 0;
    let frame = 0;
    let step = -1;

    const measure = () => {
      const rect = section.getBoundingClientRect();
      top = rect.top + window.scrollY;
      travel = Math.max(1, section.offsetHeight - window.innerHeight);
      shift = Math.max(0, track.scrollWidth - track.clientWidth);
      span = line.clientWidth;
    };

    const paint = () => {
      frame = 0;
      if (!pinned.matches) {
        track.style.transform = "";
        slot.style.transform = "";
        return;
      }
      const progress = Math.min(1, Math.max(0, (window.scrollY - top) / travel));
      track.style.transform = `translate3d(${(-progress * shift).toFixed(1)}px, 0, 0)`;
      slot.style.transform = `translate3d(${(progress * span).toFixed(1)}px, 0, 0)`;
      const next = Math.min(STEPS.length - 1, Math.round(progress * (STEPS.length - 1)));
      if (next !== step) {
        step = next;
        section.dataset.step = String(next);
      }
    };

    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(paint);
    };
    const onLayout = () => {
      measure();
      schedule();
    };

    const observer = new ResizeObserver(onLayout);
    observer.observe(document.body);
    observer.observe(track);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", onLayout);
    pinned.addEventListener("change", onLayout);
    onLayout();
    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", onLayout);
      pinned.removeEventListener("change", onLayout);
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      id="day"
      data-tone="light"
      data-drop-zone="light"
      data-step="0"
      aria-labelledby="day-title"
      className={`${ui.light} ${styles.day}`}
    >
      <div className={styles.stage}>
        <div className={`${ui.container} ${styles.head}`}>
          <h2 id="day-title" className={`${ui.h2} ${styles.title}`} tabIndex={-1} data-jump-focus="">
            Rest is not one moment. <span className={ui.soft}>It is a sequence.</span>
          </h2>
        </div>

        <ol ref={trackRef} className={styles.track}>
          {STEPS.map((step, index) => (
            <li key={step.title} className={styles.panel}>
              <div className={styles.photo}>
                <Image src={step.photo} alt={step.alt} fill sizes="(min-width: 900px) 40vw, 100vw" quality={75} className={styles.img} />
              </div>
              <div className={styles.text}>
                <p className={styles.count} aria-hidden="true">
                  {index + 1}
                </p>
                <h3 className={ui.h3}>{step.title}</h3>
                <p className={styles.body}>{step.body}</p>
              </div>
            </li>
          ))}
        </ol>

        <div className={`${ui.container} ${styles.water}`} aria-hidden="true">
          <div ref={lineRef} className={styles.line}>
            <span ref={slotRef} className={`${drop.slot} ${styles.slot}`} data-drop-slot="on" />
          </div>
          <div className={styles.stops}>
            {STEPS.map((step, index) => (
              <span key={step.title} className={styles.stop} data-index={index}>
                {step.title}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
