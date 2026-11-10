"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useLite, useReducedMotion } from "@/lib/page/lite";
import { FILM_COPY, FILM_SOURCES, PORTRAIT_QUERY } from "../data/film";
import { Replay } from "./icons";
import { usePaloma } from "./provider";
import styles from "./cover.module.css";

/*
 * The cover film. Lite visitors (reduced motion, Save-Data, 2G, low memory) get
 * no film bytes at all. Everyone else gets one <video>, created after the page
 * has loaded, the browser is idle and the cover is at least 10 % visible. It
 * plays once and holds on the final, front-facing frame; it pauses off-screen,
 * in a hidden tab and with the global Pause motion. Any failure keeps the poster.
 */

type Phase = "idle" | "playing" | "ended";
type Orient = "landscape" | "portrait";
type Source = { src: string; orient: Orient };

/* ---------- A tiny store shared with the Replay button in the cover controls ---------- */

let phase: Phase = "idle";
let replay: ((from: HTMLElement) => void) | null = null;
const listeners = new Set<() => void>();

function setPhase(next: Phase) {
  if (phase === next) return;
  phase = next;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function usePhase(): Phase {
  return useSyncExternalStore(subscribe, () => phase, () => "idle");
}

const VISIBLE = 0.1;
const IDLE_TIMEOUT = 2000;
const IDLE_FALLBACK = 1200;

function pickSource(): Source {
  const orient: Orient = window.matchMedia(PORTRAIT_QUERY).matches ? "portrait" : "landscape";
  return {
    orient,
    src: FILM_SOURCES[orient],
  };
}

export function CoverFilm() {
  const lite = useLite();
  const reduced = useReducedMotion();
  const current = usePhase();
  const { motion, toggleMotion } = usePaloma();
  const [source, setSource] = useState<Source | null>(null);
  const [failed, setFailed] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const flags = useRef({ inView: false, ended: false, motion });
  const syncRef = useRef<() => void>(() => undefined);
  const active = !lite && !failed && source !== null;

  // The poster's alt follows the frame it shows: the last one under reduced motion or once the film has ended.
  useEffect(() => {
    const img = document.querySelector<HTMLImageElement>("[data-cover-poster]");
    if (img) img.alt = reduced || current === "ended" ? FILM_COPY.altLast : FILM_COPY.altFirst;
  }, [reduced, current]);

  // Gate: window load → idle → the cover at least 10 % visible. The source is picked once, here.
  useEffect(() => {
    if (lite || failed || source) return;
    const cover = document.getElementById("cover");
    if (!cover) return;
    let idle = false;
    let visible = false;
    let idleId = 0;
    let timer = 0;
    const start = () => {
      if (idle && visible) setSource(pickSource());
    };
    const onIdle = () => {
      idle = true;
      start();
    };
    const afterLoad = () => {
      if (typeof window.requestIdleCallback === "function") idleId = window.requestIdleCallback(onIdle, { timeout: IDLE_TIMEOUT });
      else timer = window.setTimeout(onIdle, IDLE_FALLBACK);
    };
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[entries.length - 1];
        visible = Boolean(entry?.isIntersecting && entry.intersectionRatio >= VISIBLE);
        start();
      },
      { threshold: [0, VISIBLE] },
    );
    observer.observe(cover);
    if (document.readyState === "complete") afterLoad();
    else window.addEventListener("load", afterLoad, { once: true });
    return () => {
      observer.disconnect();
      window.removeEventListener("load", afterLoad);
      if (idleId && typeof window.cancelIdleCallback === "function") window.cancelIdleCallback(idleId);
      window.clearTimeout(timer);
    };
  }, [lite, failed, source]);

  // Playback: play only while visible, in a visible tab, with motion on, and never again after it ends.
  useEffect(() => {
    const video = videoRef.current;
    const cover = document.getElementById("cover");
    if (!active || !video || !cover) return;
    const state = flags.current;
    video.muted = true;

    /** `now`: a Replay click, which may start before the seek has buffered. */
    const sync = (now = false) => {
      const play = !state.ended && state.inView && state.motion === "on" && document.visibilityState === "visible";
      if (!play) {
        if (!video.paused) video.pause();
        return;
      }
      if (!video.paused || (!now && video.readyState < HTMLMediaElement.HAVE_FUTURE_DATA)) return;
      video.play().catch((error: unknown) => {
        // Autoplay refused (iOS Low Power Mode): keep the poster and offer "Play motion".
        if (error instanceof DOMException && error.name === "NotAllowedError" && state.motion === "on") toggleMotion();
      });
    };
    syncRef.current = () => sync();
    const onVisibility = () => sync();

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[entries.length - 1];
        state.inView = Boolean(entry?.isIntersecting && entry.intersectionRatio >= VISIBLE);
        sync();
      },
      { threshold: [0, VISIBLE] },
    );
    observer.observe(cover);
    document.addEventListener("visibilitychange", onVisibility);

    replay = (from) => {
      // The Replay button leaves with this click: hand focus to the Pause toggle beside it first.
      if (document.activeElement === from) from.parentElement?.querySelector<HTMLElement>("[data-motion-toggle]")?.focus();
      state.ended = false;
      video.currentTime = 0;
      setPhase("playing");
      if (state.motion === "on") sync(true);
      else toggleMotion();
    };

    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      syncRef.current = () => undefined;
      replay = null;
      state.ended = false;
      video.pause();
      setPhase("idle");
    };
  }, [active, toggleMotion]);

  useEffect(() => {
    flags.current.motion = motion;
    syncRef.current();
  }, [motion]);

  if (!active || !source) return null;

  return (
    <video
      ref={videoRef}
      className={styles.film}
      data-orient={source.orient}
      data-state={current}
      src={source.src}
      muted
      playsInline
      preload="auto"
      disablePictureInPicture
      disableRemotePlayback
      aria-hidden="true"
      tabIndex={-1}
      onCanPlay={() => syncRef.current()}
      onPlaying={() => setPhase("playing")}
      onEnded={() => {
        flags.current.ended = true;
        setPhase("ended");
      }}
      onError={() => setFailed(true)}
    />
  );
}

/** "Replay film": joins the cover's Pause toggle once the film has ended and holds its last frame. */
export function FilmReplay() {
  const current = usePhase();
  if (current !== "ended") return null;
  return (
    <button type="button" className={styles.control} onClick={(event) => replay?.(event.currentTarget)}>
      <Replay />
      <span className={styles.controlLabel}>Replay film</span>
    </button>
  );
}
