"use client";

import type { gsap as GsapInstance } from "gsap";
import type { ScrollTrigger as ScrollTriggerClass } from "gsap/ScrollTrigger";
import type Lenis from "lenis";
import { useEffect } from "react";

/*
 * The landing page's motion, loaded once the page is interactive and only for
 * visitors who have not asked for reduced motion:
 *  - Lenis smooth scrolling for mouse and trackpad (touch stays native), driven by
 *    GSAP's ticker so ScrollTrigger reads the very frame Lenis has just scrolled;
 *  - quiet reveals as sections and cards arrive (whatever is already on screen is never hidden);
 *  - on large screens, the hero window settles as you scroll and card images drift a touch.
 * gsap.matchMedia reverts all of it if the preference or the screen size changes, and on unmount.
 */

type Gsap = typeof GsapInstance;
type ScrollTriggerType = typeof ScrollTriggerClass;
type LenisClass = typeof Lenis;

const MOTION = "(prefers-reduced-motion: no-preference)";
const FINE_POINTER = "(hover: hover) and (pointer: fine)";
const LARGE = "(min-width: 1024px)";

/** Smooth wheel scrolling; in-page links glide too and hand focus to the section they open. */
function smoothScroll(LenisCtor: LenisClass, gsap: Gsap, ScrollTrigger: ScrollTriggerType) {
  const lenis = new LenisCtor({
    autoRaf: false,
    allowNestedScroll: true,
    stopInertiaOnNavigate: true,
    // Sideways swipes (and back/forward) and wheel events another element has handled stay native.
    virtualScroll: ({ deltaX, deltaY, event }) =>
      !(event instanceof WheelEvent) || !(event.defaultPrevented || Math.abs(deltaX) > Math.abs(deltaY)),
  });
  lenis.on("scroll", () => ScrollTrigger.update());
  const tick = () => lenis.raf(performance.now());
  gsap.ticker.add(tick);

  const onClick = (event: MouseEvent) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = (event.target as Element | null)?.closest?.('a[href^="#"]');
    if (!(link instanceof HTMLAnchorElement)) return;
    let id: string;
    try {
      id = decodeURIComponent(link.hash.slice(1));
    } catch {
      return; // a malformed hash: leave it to the browser
    }
    const target = id && id !== "top" ? document.getElementById(id) : null;
    if (id && id !== "top" && !target) return;
    event.preventDefault();
    lenis.scrollTo(target ?? 0, { duration: 1.2 });
    history.replaceState(null, "", target ? link.hash : window.location.pathname);
    target?.querySelector<HTMLElement>("h2[tabindex]")?.focus({ preventScroll: true });
  };
  document.addEventListener("click", onClick);

  return () => {
    document.removeEventListener("click", onClick);
    gsap.ticker.remove(tick);
    lenis.destroy();
  };
}

/** Fade-and-rise for [data-reveal] blocks that start below the fold. */
function reveal(gsap: Gsap, ScrollTrigger: ScrollTriggerType) {
  const fold = window.innerHeight * 0.9;
  const later = gsap.utils.toArray<HTMLElement>("[data-reveal]").filter((element) => element.getBoundingClientRect().top > fold);
  if (!later.length) return () => undefined;

  gsap.set(later, { opacity: 0, y: 32 });
  ScrollTrigger.batch(later, {
    start: "top 88%",
    once: true,
    onEnter: (batch) => gsap.to(batch, { opacity: 1, y: 0, duration: 1, ease: "power3.out", stagger: 0.09, overwrite: true }),
  });

  // A keyboard visitor can tab ahead of the scroll: show whatever receives focus at once.
  const onFocus = (event: FocusEvent) => {
    const host = (event.target as Element | null)?.closest?.<HTMLElement>("[data-reveal]");
    if (host && later.includes(host)) gsap.to(host, { opacity: 1, y: 0, duration: 0.3, overwrite: true });
  };
  document.addEventListener("focusin", onFocus);
  return () => document.removeEventListener("focusin", onFocus);
}

/** The hero window starts slightly set back (CSS sets the same start) and settles over the first screen of scroll. */
function settleStage(gsap: Gsap) {
  const frame = document.querySelector("[data-stage-window]");
  if (!frame) return;
  const phone = document.querySelector("[data-stage-phone]");
  const timeline = gsap.timeline({
    scrollTrigger: { start: 0, end: () => window.innerHeight * 0.85, scrub: 0.6, invalidateOnRefresh: true },
  });
  timeline.fromTo(frame, { y: 28, scale: 0.95 }, { y: 0, scale: 1, ease: "none" }, 0);
  if (phone) timeline.fromTo(phone, { y: 56, rotate: 6 }, { y: -32, rotate: 2, ease: "none" }, 0);
}

/** Card images drift a few percent against the scroll (their frames have 6% to spare). */
function driftCards(gsap: Gsap) {
  gsap.utils.toArray<HTMLElement>("[data-parallax]").forEach((media) => {
    gsap.fromTo(
      media,
      { yPercent: -4 },
      { yPercent: 4, ease: "none", scrollTrigger: { trigger: media.parentElement, start: "top bottom", end: "bottom top", scrub: true } },
    );
  });
}

export function HomeMotion() {
  useEffect(() => {
    if (!window.matchMedia(MOTION).matches) return;
    let cancelled = false;
    let teardown: (() => void) | undefined;
    const wantsLenis = window.matchMedia(FINE_POINTER).matches;

    Promise.all([import("gsap"), import("gsap/ScrollTrigger"), wantsLenis ? import("lenis") : Promise.resolve(null)])
      .then(([{ gsap }, { ScrollTrigger }, lenisModule]) => {
        if (cancelled) return;
        gsap.registerPlugin(ScrollTrigger);
        const media = gsap.matchMedia();
        media.add({ motion: MOTION, fine: FINE_POINTER, large: LARGE }, (context) => {
          const { motion, fine, large } = context.conditions ?? {};
          if (!motion) return;
          const cleanups = [reveal(gsap, ScrollTrigger)];
          if (fine && lenisModule) cleanups.push(smoothScroll(lenisModule.default, gsap, ScrollTrigger));
          if (large) {
            settleStage(gsap);
            driftCards(gsap);
          }
          return () => cleanups.forEach((cleanup) => cleanup());
        });
        teardown = () => media.revert();
      })
      .catch(() => undefined); // the page is complete without motion

    return () => {
      cancelled = true;
      teardown?.();
    };
  }, []);

  return null;
}
