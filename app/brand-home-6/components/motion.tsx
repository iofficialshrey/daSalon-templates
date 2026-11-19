"use client";

import { useEffect } from "react";
import { JUMP_EVENT } from "@/lib/page/jump";

const MOTION = "(prefers-reduced-motion: no-preference)";
const FINE_POINTER = "(hover: hover) and (pointer: fine)";

/**
 * Mouse and trackpad scrolling glides (Lenis), so the travelling drop and the
 * sliding day panels move with the page in one continuous glide. Touch keeps
 * its native momentum; windows scroll natively and stop the page while open.
 */
export function Motion() {
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
          prevent: (node) => node instanceof HTMLDialogElement || node.getAttribute("role") === "dialog" || node.hasAttribute("aria-modal"),
          virtualScroll: ({ deltaX, deltaY, event }) =>
            !(event instanceof WheelEvent) || !(event.defaultPrevented || Math.abs(deltaX) > Math.abs(deltaY)),
        });

        // The booking window, the offers and the menu lock the page by hiding the body's overflow.
        const body = document.body;
        const locked = () => body.style.overflow === "hidden";
        const syncLock = () => (locked() ? lenis.stop() : lenis.start());
        const lockObserver = new MutationObserver(syncLock);
        lockObserver.observe(body, { attributes: true, attributeFilter: ["style"] });
        syncLock();

        // An in-page jump must not be undone by a glide already in progress.
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
