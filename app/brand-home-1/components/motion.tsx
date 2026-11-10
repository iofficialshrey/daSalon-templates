"use client";

import type { gsap as GsapInstance } from "gsap";
import type { ScrollTrigger as ScrollTriggerClass } from "gsap/ScrollTrigger";
import type { SplitText as SplitTextClass } from "gsap/SplitText";
import type Lenis from "lenis";
import { useEffect } from "react";
import { JUMP_EVENT } from "@/lib/page/jump";

/*
 * Maison Élan's page motion, loaded once the page is interactive and only for visitors
 * who have not asked for reduced motion. Everything here is decoration over a page that
 * is complete without it:
 *  - section titles ([data-mx-split]) rise line by line out of a mask as they arrive;
 *  - the standard ([data-mx-words]) lights up word by word as it scrolls through;
 *  - the closing still ([data-mx-zoom]) eases back from a slight zoom;
 *  - Lenis smooths mouse and trackpad scrolling (touch stays native), driven by GSAP's
 *    ticker so ScrollTrigger reads the frame Lenis has just scrolled. It stops whenever a
 *    sheet, flow or the booking window locks the page, and dialogs always scroll natively.
 * gsap.matchMedia reverts all of it if the preference changes, and on unmount.
 */

type Gsap = typeof GsapInstance;
type ScrollTriggerType = typeof ScrollTriggerClass;
type SplitTextType = typeof SplitTextClass;
type LenisClass = typeof Lenis;

const MOTION = "(prefers-reduced-motion: no-preference)";
const FINE_POINTER = "(hover: hover) and (pointer: fine)";

/** Titles rise line by line out of a mask, once, as they come into view. */
function splitTitles(gsap: Gsap, SplitText: SplitTextType) {
  const splits = gsap.utils.toArray<HTMLElement>("[data-mx-split]").map((title) =>
    SplitText.create(title, {
      type: "lines",
      mask: "lines",
      linesClass: "mx-line",
      autoSplit: true,
      onSplit: (self) =>
        gsap.from(self.lines, {
          yPercent: 110,
          duration: 1.15,
          ease: "expo.out",
          stagger: 0.09,
          scrollTrigger: { trigger: title, start: "top 86%", once: true },
        }),
    }),
  );
  return () => splits.forEach((split) => split.revert());
}

/** The standard: each word brightens in turn while the statement crosses the screen. */
function lightWords(gsap: Gsap, SplitText: SplitTextType) {
  const splits = gsap.utils.toArray<HTMLElement>("[data-mx-words]").map((statement) => {
    const split = SplitText.create(statement, { type: "words", wordsClass: "mx-word" });
    gsap.fromTo(
      split.words,
      { opacity: 0.18 },
      {
        opacity: 1,
        ease: "none",
        stagger: 0.12,
        scrollTrigger: { trigger: statement, start: "top 82%", end: "bottom 46%", scrub: 0.6 },
      },
    );
    return split;
  });
  return () => splits.forEach((split) => split.revert());
}

/** The closing still settles from a slight zoom as its band scrolls up into place. */
function settleClosing(gsap: Gsap) {
  gsap.utils.toArray<HTMLElement>("[data-mx-zoom]").forEach((media) => {
    gsap.fromTo(
      media,
      { scale: 1.12 },
      {
        scale: 1,
        ease: "none",
        scrollTrigger: { trigger: media.parentElement, start: "top bottom", end: "bottom bottom", scrub: true },
      },
    );
  });
}

/** Smooth wheel scrolling for mouse and trackpad. */
function smoothScroll(LenisCtor: LenisClass, gsap: Gsap, ScrollTrigger: ScrollTriggerType) {
  const lenis = new LenisCtor({
    autoRaf: false,
    allowNestedScroll: true,
    stopInertiaOnNavigate: true,
    // Dialogs (sheets, flows, the booking window) always scroll natively.
    prevent: (node) => node.getAttribute("role") === "dialog" || node.hasAttribute("aria-modal"),
    // Sideways swipes (and back/forward) and wheel events another element has handled stay native.
    virtualScroll: ({ deltaX, deltaY, event }) =>
      !(event instanceof WheelEvent) || !(event.defaultPrevented || Math.abs(deltaX) > Math.abs(deltaY)),
  });
  lenis.on("scroll", () => ScrollTrigger.update());
  const tick = () => lenis.raf(performance.now());
  gsap.ticker.add(tick);

  // The page locks by hiding the body's overflow (provider.tsx and the booking window).
  const body = document.body;
  const locked = () => body.style.overflow === "hidden";
  const syncLock = () => (locked() ? lenis.stop() : lenis.start());
  const lockObserver = new MutationObserver(syncLock);
  lockObserver.observe(body, { attributes: true, attributeFilter: ["style"] });
  syncLock();

  // An instant jump (header, footer, skip and film links) must not be undone by a glide in
  // progress: stopping and starting resets Lenis, which then follows the jump.
  const onJump = () => {
    if (locked()) return;
    lenis.stop();
    lenis.start();
  };
  window.addEventListener(JUMP_EVENT, onJump);

  return () => {
    window.removeEventListener(JUMP_EVENT, onJump);
    lockObserver.disconnect();
    gsap.ticker.remove(tick);
    lenis.destroy();
  };
}

export function MaisonMotion() {
  useEffect(() => {
    if (!window.matchMedia(MOTION).matches) return;
    let cancelled = false;
    let teardown: (() => void) | undefined;
    const wantsLenis = window.matchMedia(FINE_POINTER).matches;

    Promise.all([
      import("gsap"),
      import("gsap/ScrollTrigger"),
      import("gsap/SplitText"),
      wantsLenis ? import("lenis") : Promise.resolve(null),
      // Lines are measured in the display face, not its fallback.
      document.fonts?.ready ?? Promise.resolve(),
    ])
      .then(([{ gsap }, { ScrollTrigger }, { SplitText }, lenisModule]) => {
        if (cancelled) return;
        gsap.registerPlugin(ScrollTrigger, SplitText);
        const media = gsap.matchMedia();
        media.add({ motion: MOTION, fine: FINE_POINTER }, (context) => {
          const { motion, fine } = context.conditions ?? {};
          if (!motion) return;
          const cleanups = [splitTitles(gsap, SplitText), lightWords(gsap, SplitText)];
          settleClosing(gsap);
          if (fine && lenisModule) cleanups.push(smoothScroll(lenisModule.default, gsap, ScrollTrigger));
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
