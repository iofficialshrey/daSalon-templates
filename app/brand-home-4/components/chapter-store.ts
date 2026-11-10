"use client";

import { useSyncExternalStore } from "react";
import type { ChapterId } from "../data/chapters";

/*
 * The chapter the reader is in, and whether the cover's Book circle has left
 * the screen. One IntersectionObserver each, started on the first subscriber,
 * so only the header actions, the rail and the Contents sheet re-render.
 */

type State = { chapter: ChapterId; pastCover: boolean };

let state: State = { chapter: "cover", pastCover: false };
const SERVER: State = { chapter: "cover", pastCover: false };
const listeners = new Set<() => void>();
let stop: (() => void) | null = null;

function publish(next: Partial<State>) {
  const merged = { ...state, ...next };
  if (merged.chapter === state.chapter && merged.pastCover === state.pastCover) return;
  state = merged;
  listeners.forEach((listener) => listener());
}

function start() {
  const inBand = new Set<HTMLElement>();
  const chapters = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const element = entry.target as HTMLElement;
        if (entry.isIntersecting) inBand.add(element);
        else inBand.delete(element);
      }
      // The latest chapter in document order that crosses the reading band.
      let pick: HTMLElement | null = null;
      for (const element of inBand) {
        if (!pick || pick.compareDocumentPosition(element) & Node.DOCUMENT_POSITION_FOLLOWING) pick = element;
      }
      if (pick?.id) publish({ chapter: pick.id as ChapterId });
    },
    { rootMargin: "-40% 0px -55% 0px" },
  );
  document.querySelectorAll<HTMLElement>("section[data-chapter]").forEach((section) => chapters.observe(section));

  const cover = new IntersectionObserver((entries) => {
    const entry = entries[entries.length - 1];
    if (entry) publish({ pastCover: !entry.isIntersecting });
  });
  const cta = document.querySelector<HTMLElement>("[data-cover-cta]");
  if (cta) cover.observe(cta);

  return () => {
    chapters.disconnect();
    cover.disconnect();
  };
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (!stop) stop = start();
  return () => {
    listeners.delete(listener);
    if (!listeners.size && stop) {
      stop();
      stop = null;
    }
  };
}

export function useActiveChapter(): ChapterId {
  return useSyncExternalStore(subscribe, () => state.chapter, () => SERVER.chapter);
}

/** True once the cover's Book circle has scrolled out of view. */
export function usePastCover(): boolean {
  return useSyncExternalStore(subscribe, () => state.pastCover, () => SERVER.pastCover);
}
