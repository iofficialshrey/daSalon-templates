"use client";

import type { ReactNode } from "react";
import { isPlainClick } from "./header-links";

/**
 * "Step inside ↓": lands exactly on the top of #walk (p = 0, doors closed),
 * gliding there unless reduced motion asks for an instant move, then hands
 * focus to the walk-through's heading so Tab continues inside the film.
 */
export function StepInside({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <a
      href="#walk"
      className={className}
      onClick={(event) => {
        if (!isPlainClick(event)) return;
        const walk = document.getElementById("walk");
        if (!walk) return;
        event.preventDefault();
        const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        const top = Math.max(0, walk.getBoundingClientRect().top + window.scrollY);
        window.scrollTo({ top, behavior: reduced ? "instant" : "smooth" });
        const heading = walk.querySelector<HTMLElement>("[data-jump-focus]") ?? walk.querySelector<HTMLElement>("h2");
        if (heading) {
          if (!heading.hasAttribute("tabindex")) heading.setAttribute("tabindex", "-1");
          heading.focus({ preventScroll: true });
        }
      }}
    >
      {children}
    </a>
  );
}
