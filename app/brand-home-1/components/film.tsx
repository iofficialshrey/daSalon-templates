"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { jumpTo } from "@/lib/page/jump";
import { HOUSES } from "../data/houses";
import { ArrowDown, ArrowRight } from "./icons";
import { useMaison, type LiveHouse } from "./provider";
import styles from "./film.module.css";
import ui from "./ui.module.css";

/*
 * The arrival film: leg-01 and leg-02 joined into one continuous 11.75 s shot
 * (282 frames at 24 fps), scrubbed by scroll. One <video>, fetched once as a
 * Blob when the browser is idle, eased toward the scroll position each frame and
 * seeked to the middle of a frame with at most one seek in flight.
 */

const FPS = 24;
const LAST = 281;
const PORTRAIT_QUERY = "(max-aspect-ratio: 4/5)";
const REDUCED_QUERY = "(prefers-reduced-motion: reduce)";
const BASE = "/brand-home-1/scroll-film";
const SOURCES = {
  landscape: `${BASE}/maison-film-1280x720.v3.mp4`,
  portrait: `${BASE}/maison-film-576x768.v3.mp4`,
  /** GOP 2: kinder to low-memory Android decoders. */
  portraitSafe: `${BASE}/maison-film-576x768-safe.v3.mp4`,
} as const;

/**
 * Scroll progress → film position. 0–3 %: dead zone. 3–36 %: the near-still
 * doorway (frames 0–140). 36–46 %: through the doors into reception. 46–62 %:
 * the fast glide down the corridor (165–215) passes briskly, so the eye never
 * rests on a frame in motion. 62–84 %: the camera settles into the suite.
 * 84–100 %: the slow push-in on the chair while the final beat sits on screen.
 */
const MAP: ReadonlyArray<readonly [number, number]> = [
  [0, 0],
  [0.03, 0],
  [0.36, 140 / LAST],
  [0.46, 165 / LAST],
  [0.62, 215 / LAST],
  [0.84, 237 / LAST],
  [1, 1],
];

type NavigatorExtras = Navigator & {
  connection?: { saveData?: boolean; effectiveType?: string };
  deviceMemory?: number;
};

const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const smoothstep = (value: number) => {
  const x = clamp(value);
  return x * x * (3 - 2 * x);
};
const mapProgress = (progress: number) => {
  for (let index = 1; index < MAP.length; index++) {
    const [x1, y1] = MAP[index];
    const [x0, y0] = MAP[index - 1];
    if (progress <= x1) return y0 + ((progress - x0) / Math.max(1e-6, x1 - x0)) * (y1 - y0);
  }
  return 1;
};

/** Reduced motion, Save-Data, 2G or very low memory: a still, two-panel arrival with no video bytes. */
function liteSnapshot() {
  const nav = navigator as NavigatorExtras;
  return window.matchMedia(REDUCED_QUERY).matches
    || nav.connection?.saveData === true
    || nav.connection?.effectiveType === "2g"
    || nav.connection?.effectiveType === "slow-2g"
    || (typeof nav.deviceMemory === "number" && nav.deviceMemory <= 2);
}

function subscribeLite(onChange: () => void) {
  const query = window.matchMedia(REDUCED_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

function Poster({ which, eager = false, className }: { which: "first" | "last"; eager?: boolean; className?: string }) {
  return (
    <picture className={className}>
      <source media={PORTRAIT_QUERY} type="image/avif" srcSet={`${BASE}/maison-film-576x768-${which}.v3.avif`} />
      <source media={PORTRAIT_QUERY} type="image/webp" srcSet={`${BASE}/maison-film-576x768-${which}.v3.webp`} />
      <source media={PORTRAIT_QUERY} srcSet={`${BASE}/maison-film-576x768-${which}.v3.jpg`} />
      <source type="image/avif" srcSet={`${BASE}/maison-film-1280x720-${which}.v3.avif`} />
      <source type="image/webp" srcSet={`${BASE}/maison-film-1280x720-${which}.v3.webp`} />
      <img
        src={`${BASE}/maison-film-1280x720-${which}.v3.jpg`}
        alt=""
        width={1280}
        height={720}
        decoding="async"
        loading={eager ? "eager" : "lazy"}
        fetchPriority={eager ? "high" : undefined}
      />
    </picture>
  );
}

const COVER_LINES = HOUSES.map((house) => `${house.name} · ${house.area}`);

export function Film() {
  const { houses, openBooking, prefetchBooking, filmHold } = useMaison();
  const lite = useSyncExternalStore(subscribeLite, liteSnapshot, () => false);
  const [failed, setFailed] = useState(false);
  const isStatic = lite || failed;

  const rootRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const beatARef = useRef<HTMLDivElement>(null);
  const beatBRef = useRef<HTMLDivElement>(null);
  const beatCRef = useRef<HTMLDivElement>(null);
  const coverRef = useRef<HTMLUListElement>(null);
  const suiteShadeRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<HTMLSpanElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const cueRef = useRef<HTMLDivElement>(null);
  const holdRef = useRef(filmHold);
  const startLoadRef = useRef<() => void>(() => undefined);

  useEffect(() => {
    holdRef.current = filmHold;
    if (!filmHold) startLoadRef.current();
  }, [filmHold]);

  useEffect(() => {
    if (isStatic) return;
    const root = rootRef.current;
    const stage = stageRef.current;
    const video = videoRef.current;
    if (!root || !stage || !video) return;

    const portrait = window.matchMedia(PORTRAIT_QUERY);
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    const nav = navigator as NavigatorExtras;
    const lowMemoryAndroid = /Android/i.test(nav.userAgent) && typeof nav.deviceMemory === "number" && nav.deviceMemory <= 4;
    // Touch scrolling already carries momentum, so ease less there.
    const TAU = coarse ? 0.07 : 0.11;
    const docEl = document.documentElement;
    const abort = new AbortController();

    let raf = 0;
    let lastTs = 0;
    let top = 0;
    let travel = 1;
    let layoutWidth = window.innerWidth;
    let inView = true;
    let targetP = 0;
    let smoothP = 0;
    let ready = false;
    let painted = false;
    let requested = -1;
    let seekAt = 0;
    let objectUrl = "";
    let loadedSource = "";
    let lastPaint = "";
    let started = false;

    const pickSource = () => {
      if (!portrait.matches) return SOURCES.landscape;
      return lowMemoryAndroid ? SOURCES.portraitSafe : SOURCES.portrait;
    };

    const measure = () => {
      top = root.getBoundingClientRect().top + window.scrollY;
      travel = Math.max(1, root.offsetHeight - stage.offsetHeight);
      layoutWidth = window.innerWidth;
    };

    const readScroll = () => {
      targetP = clamp((window.scrollY - top) / travel);
    };

    const setBeat = (element: HTMLElement | null, value: number, shift: number, interactive: boolean) => {
      if (!element) return;
      element.style.opacity = value.toFixed(3);
      element.style.transform = `translate3d(0, ${(shift * (1 - value)).toFixed(2)}px, 0)`;
      if (interactive) element.inert = value < 0.5;
    };

    // Only opacity and transform are written, and only when a rounded value changes.
    const paint = (progress: number) => {
      const a = 1 - smoothstep((progress - 0.12) / 0.10);
      const b = smoothstep((progress - 0.30) / 0.08) * (1 - smoothstep((progress - 0.54) / 0.08));
      const c = smoothstep((progress - 0.80) / 0.08);
      const key = `${a.toFixed(3)}|${b.toFixed(3)}|${c.toFixed(3)}|${progress.toFixed(4)}`;
      if (key === lastPaint) return;
      lastPaint = key;

      setBeat(beatARef.current, a, -24, true);
      setBeat(beatBRef.current, b, 16, false);
      setBeat(beatCRef.current, c, 24, true);
      if (coverRef.current) coverRef.current.style.opacity = a.toFixed(3);
      if (suiteShadeRef.current) suiteShadeRef.current.style.opacity = c.toFixed(3);
      if (fillRef.current) fillRef.current.style.transform = `scaleX(${progress.toFixed(4)})`;
      if (cueRef.current) cueRef.current.style.opacity = (1 - smoothstep(progress / 0.06)).toFixed(3);
      if (railRef.current) {
        const chapter = progress < 0.3 ? "1" : progress < 0.7 ? "2" : "3";
        if (railRef.current.dataset.chapter !== chapter) railRef.current.dataset.chapter = chapter;
        const intro = progress < 0.06 ? "on" : "off";
        if (railRef.current.dataset.intro !== intro) railRef.current.dataset.intro = intro;
      }
    };

    const seekTo = (frame: number) => {
      requested = frame;
      seekAt = performance.now();
      try {
        // The middle of the frame is never ambiguous at a frame boundary.
        video.currentTime = (frame + 0.5) / FPS;
      } catch {
        requested = -1;
      }
    };

    const schedule = () => {
      if (!raf && inView && !document.hidden) raf = window.requestAnimationFrame(tick);
    };

    const tick = (ts: number) => {
      raf = 0;
      const dt = lastTs ? Math.min(0.1, (ts - lastTs) / 1000) : 1 / 60;
      lastTs = ts;
      // Anchor jumps and keyboard Home/End snap instead of scrubbing the whole film.
      // While Lenis is gliding the scroll is already smooth, so the film eases only lightly on top.
      const tau = docEl.classList.contains("lenis-smooth") ? TAU * 0.4 : TAU;
      if (Math.abs(targetP - smoothP) > 0.2) smoothP = targetP;
      else smoothP += (targetP - smoothP) * (1 - Math.exp(-dt / tau));
      if (Math.abs(targetP - smoothP) < 0.25 / (LAST * 1.2)) smoothP = targetP;

      paint(smoothP);

      let pending = false;
      if (ready) {
        const frame = Math.round(mapProgress(smoothP) * LAST);
        // Watchdog: a seek that never completes must not freeze the film.
        const stuck = video.seeking && ts - seekAt > 600;
        if (frame !== requested && (!video.seeking || stuck)) seekTo(frame);
        pending = video.seeking || frame !== requested;
      }

      if (smoothP !== targetP || pending) schedule();
      else lastTs = 0;
    };

    const reveal = () => {
      if (painted) return;
      painted = true;
      root.dataset.film = "ready";
    };

    let loadAbort: AbortController | null = null;
    let pendingSource = "";

    const releaseVideo = () => {
      video.removeAttribute("src");
      video.load();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      objectUrl = "";
    };

    /** Resolves on loadedmetadata; rejects on error, abort or after 8 s so a stall never pulses forever. */
    const whenMetadata = (signal: AbortSignal) => new Promise<void>((resolve, reject) => {
      const done = (fn: () => void) => {
        window.clearTimeout(timer);
        video.removeEventListener("loadedmetadata", onMeta);
        video.removeEventListener("error", onError);
        signal.removeEventListener("abort", onAbort);
        fn();
      };
      const onMeta = () => done(resolve);
      const onError = () => done(() => reject(video.error ?? new Error("Film failed to decode")));
      const onAbort = () => done(() => reject(new DOMException("Aborted", "AbortError")));
      const timer = window.setTimeout(() => done(() => reject(new Error("Film metadata timed out"))), 8000);
      if (video.readyState >= 1) {
        done(resolve);
        return;
      }
      video.addEventListener("loadedmetadata", onMeta);
      video.addEventListener("error", onError);
      signal.addEventListener("abort", onAbort);
    });

    const load = async () => {
      const source = pickSource();
      if (source === loadedSource) {
        // Rotated away and back while the other encode was still downloading: drop that fetch.
        if (pendingSource) {
          loadAbort?.abort();
          loadAbort = null;
          pendingSource = "";
        }
        return;
      }
      if (source === pendingSource) return;
      // A newer request (e.g. the phone rotated) replaces any fetch still in flight.
      loadAbort?.abort();
      const controller = new AbortController();
      loadAbort = controller;
      const signal = controller.signal;
      abort.signal.addEventListener("abort", () => controller.abort(), { once: true });
      pendingSource = source;
      try {
        const response = await fetch(source, { signal });
        if (!response.ok) throw new Error(`Film unavailable (${response.status})`);
        const blob = await response.blob();
        if (signal.aborted) return;
        // Swap only once the new file is in hand, so the current picture stays on screen meanwhile.
        const previousUrl = objectUrl;
        objectUrl = URL.createObjectURL(blob);
        loadedSource = source;
        pendingSource = "";
        ready = false;
        requested = -1;
        // preload must allow loading: WebKit and Gecko otherwise never decode a blob source.
        video.preload = "auto";
        video.src = objectUrl;
        video.load();
        if (previousUrl) URL.revokeObjectURL(previousUrl);
        await whenMetadata(signal);
        ready = true;
        // Reveal on the first painted frame, never on an undecoded element.
        if ("requestVideoFrameCallback" in video) video.requestVideoFrameCallback(() => reveal());
        video.addEventListener("seeked", () => window.requestAnimationFrame(reveal), { once: true });
        seekTo(Math.round(mapProgress(smoothP) * LAST));
        schedule();
      } catch {
        if (signal.aborted) return;
        if (pendingSource === source) pendingSource = "";
        if (loadedSource === source && !ready) {
          loadedSource = "";
          painted = false;
          delete root.dataset.film;
          releaseVideo();
        }
        // A failed load at the top of the page becomes the still arrival; further down the poster stays.
        if (!loadedSource && window.scrollY < 10) setFailed(true);
      }
    };

    let idle = 0;
    const hasIdle = "requestIdleCallback" in window;
    const begin = () => {
      // A ?house= deep link may have raised the hold after scheduling: wait for it to clear.
      if (holdRef.current) {
        started = false;
        return;
      }
      void load();
    };
    const startLoad = () => {
      if (started || holdRef.current) return;
      started = true;
      // Let the poster, fonts and hydration have the network first.
      idle = hasIdle
        ? window.requestIdleCallback(begin, { timeout: 1200 })
        : window.setTimeout(begin, 300);
    };
    startLoadRef.current = startLoad;

    const onScroll = () => {
      readScroll();
      schedule();
    };
    const onResize = () => {
      // The mobile URL bar changes only the height: ignore it.
      if (coarse && window.innerWidth === layoutWidth) return;
      measure();
      readScroll();
      schedule();
    };
    const onOrientation = () => {
      measure();
      readScroll();
      if (loadedSource || pendingSource) void load();
      schedule();
    };
    // iOS: a gesture unlocks the element. Stay armed until the unlock has actually run.
    let primed = false;
    const onGesture = () => {
      if (primed || !ready || painted) return;
      primed = true;
      video.play().then(() => {
        video.pause();
        seekTo(Math.round(mapProgress(smoothP) * LAST));
        schedule();
      }).catch(() => undefined).finally(() => {
        window.removeEventListener("touchstart", onGesture);
        window.removeEventListener("pointerdown", onGesture);
      });
    };
    const onVisibility = () => {
      if (!document.hidden) {
        lastTs = 0;
        schedule();
      }
    };

    const io = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      root.dataset.active = inView ? "on" : "off";
      if (inView) {
        readScroll();
        schedule();
      }
    });
    io.observe(root);
    const ro = new ResizeObserver(() => {
      measure();
      readScroll();
      schedule();
    });
    ro.observe(root);

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize, { passive: true });
    portrait.addEventListener("change", onOrientation);
    window.addEventListener("touchstart", onGesture, { passive: true });
    window.addEventListener("pointerdown", onGesture, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);

    measure();
    readScroll();
    smoothP = targetP;
    paint(smoothP);
    startLoad();

    return () => {
      abort.abort();
      if (hasIdle) window.cancelIdleCallback(idle);
      else window.clearTimeout(idle);
      if (raf) window.cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      portrait.removeEventListener("change", onOrientation);
      window.removeEventListener("touchstart", onGesture);
      window.removeEventListener("pointerdown", onGesture);
      document.removeEventListener("visibilitychange", onVisibility);
      startLoadRef.current = () => undefined;
      loadAbort?.abort();
      ready = false;
      delete root.dataset.film;
      releaseVideo();
    };
  }, [isStatic]);

  const bookProps = {
    onPointerEnter: prefetchBooking,
    onFocus: prefetchBooking,
    onTouchStart: prefetchBooking,
  };

  const skip = (
    <button type="button" className={`${ui.btn} ${ui.textBtn} ${styles.skip}`} onClick={() => jumpTo("houses")}>
      <span className={ui.underline}>Skip the film</span>
      <ArrowDown />
    </button>
  );

  const beatA = (
    <>
      <h1 className={`${ui.h1} ${styles.h1}`}>Come in.<br />The hour is yours.</h1>
      <p className={styles.lead}>Four private houses in Singapore for grooming, aesthetics, spa and bridal care, with live availability at each.</p>
      <div className={styles.actions}>
        <button type="button" className={`${ui.btn} ${ui.lg} ${ui.primaryOnDark} ${styles.bookBtn}`} data-book="" onClick={() => openBooking()} {...bookProps}>
          Book a visit <ArrowRight />
        </button>
        <button type="button" className={`${ui.btn} ${ui.textBtn}`} onClick={() => jumpTo("houses")}>
          <span className={ui.underline}>View the houses</span> <ArrowDown />
        </button>
      </div>
    </>
  );

  const beatB = (
    <>
      <p className={styles.reception}>Every visit begins with a conversation, never a queue.</p>
    </>
  );

  const beatC = (
    <>
      <h2 className={styles.h2}>One guest, one suite, our full attention.</h2>
      <p className={`${styles.lead} ${styles.suiteLead}`}>Choose a house, a service and an hour. You pay at the house, after your visit.</p>
      <div className={styles.actions}>
        <button type="button" className={`${ui.btn} ${ui.lg} ${ui.primaryOnDark} ${styles.bookBtn}`} data-book="" onClick={() => openBooking()} {...bookProps}>
          Book a visit <ArrowRight />
        </button>
        <button type="button" className={`${ui.btn} ${ui.textBtn} ${styles.servicesLink}`} onClick={() => jumpTo("menu")}>
          <span className={ui.underline}>See the services</span> <ArrowRight />
        </button>
      </div>
      <HousePicker houses={houses} onPick={(house) => openBooking({ house: house.slug })} bookProps={bookProps} />
      <button type="button" className={`${ui.btn} ${ui.textBtn} ${styles.chooseLink}`} onClick={() => jumpTo("houses")}>
        <span className={ui.underline}>Or choose a house</span> <ArrowDown />
      </button>
    </>
  );

  if (isStatic) {
    return (
      <>
        <section id="film" data-scrub-film="" className={`${styles.film} ${styles.static} ${ui.onDark}`} aria-label="Maison Élan, arrival">
          <div className={styles.panel}>
            {skip}
            <Poster which="first" eager className={styles.picture} />
            <div className={styles.shadeBase} aria-hidden="true" />
            <CoverLines />
            <div className={`${styles.beat} ${styles.beatA}`}>{beatA}</div>
          </div>
          <div className={styles.interlude}>{beatB}</div>
          <div className={styles.panel}>
            <Poster which="last" className={styles.picture} />
            <div className={`${styles.shadeSuite} ${styles.shadeFull}`} aria-hidden="true" />
            <div className={`${styles.beat} ${styles.beatC}`}>{beatC}</div>
          </div>
        </section>
        <div id="film-end" className={styles.sentinel} aria-hidden="true" />
      </>
    );
  }

  return (
    <>
      <section id="film" data-scrub-film="" ref={rootRef} className={`${styles.film} ${ui.onDark}`} aria-label="Maison Élan, arrival">
        <div className={styles.stage} ref={stageRef}>
          {skip}
          <div className={styles.media} aria-hidden="true">
            <Poster which="first" eager className={styles.picture} />
            <video
              ref={videoRef}
              className={styles.video}
              muted
              playsInline
              preload="auto"
              disablePictureInPicture
              disableRemotePlayback
              tabIndex={-1}
              aria-hidden="true"
            />
            <div className={styles.shadeBase} />
            <div className={styles.shadeSuite} ref={suiteShadeRef} />
          </div>

          <CoverLines listRef={coverRef} />

          <div className={`${styles.beat} ${styles.beatA}`} ref={beatARef}>{beatA}</div>
          <div className={`${styles.beat} ${styles.beatB}`} ref={beatBRef}>{beatB}</div>
          <div className={`${styles.beat} ${styles.beatC}`} ref={beatCRef} inert>{beatC}</div>

          <div className={styles.rail} ref={railRef} data-chapter="1" data-intro="on">
            <div className={styles.track} aria-hidden="true">
              <span className={styles.fill} ref={fillRef} />
            </div>
            <ol className={styles.chapters} aria-hidden="true">
              <li data-step="1"><span>01 Arrival</span><span className={styles.introHint}> · scroll to enter</span></li>
              <li data-step="2">02 Reception</li>
              <li data-step="3">03 The suite</li>
            </ol>
            <div className={styles.cue} ref={cueRef} aria-hidden="true">
              <span>Scroll to enter</span>
              <i />
            </div>
          </div>
        </div>
      </section>
      <div id="film-end" className={styles.sentinel} aria-hidden="true" />
    </>
  );
}

function CoverLines({ listRef }: { listRef?: React.Ref<HTMLUListElement> }) {
  return (
    <ul className={styles.cover} ref={listRef} aria-hidden="true">
      {COVER_LINES.map((line) => <li key={line}>{line}</li>)}
    </ul>
  );
}

function HousePicker({
  houses,
  onPick,
  bookProps,
}: {
  houses: LiveHouse[];
  onPick: (house: LiveHouse) => void;
  bookProps: Record<string, () => void>;
}): ReactNode {
  return (
    <div className={styles.picker} role="group" aria-labelledby="mx-film-picker">
      <p id="mx-film-picker" className={`${ui.label} ${styles.pickerLabel}`}>Or book at a house</p>
      <div className={styles.pickerGrid}>
        {houses.map((house) => (
          <button
            key={house.slug}
            type="button"
            className={styles.glass}
            aria-label={`Book at ${house.name}`}
            onClick={() => onPick(house)}
            {...bookProps}
          >
            <span className={styles.glassLabel}>{house.specialty}</span>
            <span className={styles.glassName}>{house.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
