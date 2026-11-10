"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "./icons";
import ui from "./ui.module.css";

type CarouselControlsProps = {
  /** Id of the scroll-snap track (its children are the cards). */
  trackId: string;
  count: number;
  prevLabel: string;
  nextLabel: string;
  /** sr-only position: "{itemNoun} 1 of 4". */
  itemNoun?: string;
  className?: string;
};

type Position = { index: number; atStart: boolean; atEnd: boolean };

const pad = (value: number) => String(value).padStart(2, "0");

function stepOf(track: HTMLElement) {
  const first = track.firstElementChild;
  if (!(first instanceof HTMLElement)) return track.clientWidth;
  const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
  return first.getBoundingClientRect().width + gap;
}

function reducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Prev / next arrows and a "01 / 04" counter for a horizontal scroll-snap track.
 * The parent shows them below 760px only; every card stays reachable by Tab
 * without them. The arrows are aria-disabled at the ends (focus never drops to
 * the page); the sr position updates once scrolling settles.
 */
export function CarouselControls({ trackId, count, prevLabel, nextLabel, itemNoun = "Item", className }: CarouselControlsProps) {
  const [position, setPosition] = useState<Position>({ index: 0, atStart: true, atEnd: count <= 1 });
  const [settled, setSettled] = useState(0);

  useEffect(() => {
    const track = document.getElementById(trackId);
    if (!track) return;
    let frame = 0;
    let settle = 0;
    const read = () => {
      frame = 0;
      const max = track.scrollWidth - track.clientWidth;
      const left = Math.abs(track.scrollLeft);
      const atStart = left <= 2;
      const atEnd = left >= max - 2;
      const step = stepOf(track);
      const index = atEnd ? count - 1 : Math.max(0, Math.min(count - 1, Math.round(left / Math.max(step, 1))));
      setPosition((current) =>
        current.index === index && current.atStart === atStart && current.atEnd === atEnd ? current : { index, atStart, atEnd });
      return index;
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(read);
      window.clearTimeout(settle);
      settle = window.setTimeout(() => setSettled(read()), 160);
    };
    frame = window.requestAnimationFrame(read);
    track.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(settle);
      track.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [count, trackId]);

  const move = useCallback((direction: -1 | 1) => {
    const track = document.getElementById(trackId);
    if (!track) return;
    track.scrollBy({ left: direction * stepOf(track), behavior: reducedMotion() ? "auto" : "smooth" });
  }, [trackId]);

  return (
    <div className={`${ui.carousel} ${className ?? ""}`}>
      <button
        type="button"
        className={ui.iconBtn}
        aria-label={prevLabel}
        aria-controls={trackId}
        aria-disabled={position.atStart}
        onClick={() => {
          if (!position.atStart) move(-1);
        }}
      >
        <ChevronLeft />
      </button>
      <button
        type="button"
        className={ui.iconBtn}
        aria-label={nextLabel}
        aria-controls={trackId}
        aria-disabled={position.atEnd}
        onClick={() => {
          if (!position.atEnd) move(1);
        }}
      >
        <ChevronRight />
      </button>
      <span className={`${ui.label} ${ui.num} ${ui.carouselCount}`} aria-hidden="true">
        {pad(position.index + 1)} / {pad(count)}
      </span>
      <span className={ui.srOnly} role="status" aria-live="polite">
        {itemNoun} {settled + 1} of {count}
      </span>
    </div>
  );
}
