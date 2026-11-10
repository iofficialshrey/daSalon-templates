"use client";

import { useEffect } from "react";
import { JUMP_EVENT } from "@/lib/page/jump";

const MOTION = "(prefers-reduced-motion: no-preference)";
const FINE_POINTER = "(hover: hover) and (pointer: fine)";

/**
 * Mouse and trackpad scrolling glides (Lenis), so the threshold film scrubs
 * continuously rather than in wheel steps. Touch keeps its native momentum,
 * dialogs scroll natively, and the page stops gliding while a layer or the
 * booking window locks it.
 */
export function SmoothScroll() {
  useEffect(() => {
    if (!window.matchMedia(MOTION).matches || !window.matchMedia(FINE_POINTER).matches) return;
    let cancelled = false;
    let teardown: (() => void) | undefined;

    import("lenis")
      .then(({ default: Lenis }) => {
        if (cancelled) return;
        const lenis = new Lenis({
          autoRaf: true,
          allowNestedScroll: true,
          stopInertiaOnNavigate: true,
          prevent: (node) => node.getAttribute("role") === "dialog" || node.hasAttribute("aria-modal"),
          // Sideways swipes (and back/forward) and wheel events another element has handled stay native.
          virtualScroll: ({ deltaX, deltaY, event }) =>
            !(event instanceof WheelEvent) || !(event.defaultPrevented || Math.abs(deltaX) > Math.abs(deltaY)),
        });

        // Layers and the booking window lock the page by hiding the body's overflow.
        const body = document.body;
        const locked = () => body.style.overflow === "hidden";
        const syncLock = () => (locked() ? lenis.stop() : lenis.start());
        const lockObserver = new MutationObserver(syncLock);
        lockObserver.observe(body, { attributes: true, attributeFilter: ["style"] });
        syncLock();

        // An instant jump (header, skip and section links) must not be undone by a glide in progress.
        const onJump = () => {
          if (locked()) return;
          lenis.stop();
          lenis.start();
        };
        window.addEventListener(JUMP_EVENT, onJump);

        teardown = () => {
          window.removeEventListener(JUMP_EVENT, onJump);
          lockObserver.disconnect();
          lenis.destroy();
        };
      })
      .catch(() => undefined); // the page is complete without it

    return () => {
      cancelled = true;
      teardown?.();
    };
  }, []);

  return null;
}
