"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * Follows the ritual's three steps: the last step whose top has passed the
 * middle of the screen is the current one (data-step on the wrapper; step 1
 * until then), and the CSS turns the photograph and the type to it. It reads
 * the position on scroll, and only while the section is on screen.
 * The server renders step 1, and without this script every step simply reads
 * at full strength.
 */
export function RitualSequence({ className, children }: { className?: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root || typeof IntersectionObserver !== "function") return;
    const steps = Array.from(root.querySelectorAll<HTMLElement>("[data-ritual-step]"));
    if (!steps.length) return;

    let listening = false;

    // Scroll events already arrive once a frame; three reads and a rare attribute write each.
    const pick = () => {
      const middle = window.innerHeight / 2;
      let current = 1;
      steps.forEach((step, index) => {
        if (step.getBoundingClientRect().top <= middle) current = index + 1;
      });
      const next = String(current);
      if (root.dataset.step !== next) root.dataset.step = next;
    };
    const listen = (on: boolean) => {
      if (on === listening) return;
      listening = on;
      if (on) {
        window.addEventListener("scroll", pick, { passive: true });
        window.addEventListener("resize", pick);
        pick();
      } else {
        window.removeEventListener("scroll", pick);
        window.removeEventListener("resize", pick);
      }
    };

    const observer = new IntersectionObserver(([entry]) => listen(entry.isIntersecting));
    observer.observe(root);
    root.dataset.live = "on";

    return () => {
      observer.disconnect();
      listen(false);
      delete root.dataset.live;
    };
  }, []);

  return (
    <div ref={ref} className={className} data-step="1">
      {children}
    </div>
  );
}
