"use client";

import { useEffect, useRef } from "react";

const CARD_FILM = "/brand-home-3/film/serein-card-960x540.v1.mp4";
const CARD_POSTER = "/brand-home-3/film/serein-film-1280x720-first.v1.jpg";
const REDUCED_QUERY = "(prefers-reduced-motion: reduce)";

/**
 * Serein House's card on the collection page: a 485 KB loop of the entrance
 * film with its first-frame poster. Nothing downloads until the card is at
 * least half visible (preload="none"); it plays only while it stays so, pauses
 * in hidden tabs, and never plays under prefers-reduced-motion.
 */
export function SereinCardFilm() {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    const reduced = window.matchMedia(REDUCED_QUERY);
    let visible = false;

    const sync = () => {
      if (visible && !reduced.matches && !document.hidden) {
        video.muted = true;
        void video.play().catch(() => undefined);
      } else if (!video.paused) {
        video.pause();
      }
    };

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[entries.length - 1];
        // Crossing 0.5 either way fires; the ratio says which side the card is on.
        visible = Boolean(entry?.isIntersecting && entry.intersectionRatio >= 0.49);
        sync();
      },
      { threshold: 0.5 },
    );
    observer.observe(video);
    reduced.addEventListener("change", sync);
    document.addEventListener("visibilitychange", sync);
    return () => {
      observer.disconnect();
      reduced.removeEventListener("change", sync);
      document.removeEventListener("visibilitychange", sync);
      video.pause();
    };
  }, []);

  return <video ref={ref} src={CARD_FILM} poster={CARD_POSTER} muted loop playsInline preload="none" aria-hidden="true" />;
}
