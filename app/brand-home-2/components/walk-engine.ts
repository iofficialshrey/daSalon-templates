import { BEATS, CHAPTERS, DOORS, FILM_SOURCES, FPS, LAST_FRAME, MAP, PORTRAIT_QUERY, SKIP_HIDE } from "../data/walk";
import { clamp, envelope, isLowMemoryAndroid, mapProgress, ramp, timecode } from "../lib/film";

/*
 * The threshold controller. The scrub engine is a port of Maison Élan's
 * arrival film (app/brand-home-1/components/film.tsx), adapted for the sliding
 * doors, the captions and the progress hairlines:
 * - one <video>, fetched once as a Blob at idle (AbortController per load),
 *   preload "auto" + load() so WebKit and Gecko decode the blob;
 * - scroll progress eased per animation frame (τ .11 s fine / .07 s coarse,
 *   and less while Lenis is already gliding the page); while the doors open
 *   they glide on a longer ease (τ .24 s fine / .16 s coarse); an instant
 *   jump of more than .2 (anchor, Home/End, Skip) snaps instead;
 * - frame-quantised mid-frame seeks, one seek in flight, a 600 ms watchdog;
 * - reveal on the first painted frame (requestVideoFrameCallback, else seeked);
 * - paused off-screen and in hidden tabs; rAF runs only while there is work.
 *
 * Per frame it writes only opacity, transform, textContent and data / aria
 * attributes, each only when its rounded value changes. Every DOM part is
 * optional, so missing art, posters or video never throw.
 */

export type WalkEngine = {
  /** Re-read the scroll position and show it at once (after Skip or another instant jump). */
  snap: () => void;
  /** Scroll instantly to progress p inside the section and show it without scrubbing. */
  goTo: (progress: number) => void;
  destroy: () => void;
};

type WalkEngineOptions = {
  root: HTMLElement;
  stage: HTMLElement;
  video: HTMLVideoElement;
  /** The film could not load while the visitor was still at the top: fall back to the static walk. */
  onFail: () => void;
  /** Until the film paints, the poster follows the position: the last frame once the visitor is past the middle. */
  onPoster: (which: "first" | "last") => void;
};

const TOTAL = timecode((LAST_FRAME + 1) / FPS);
/** The light spill rises and falls as the doors part. */
const SPILL_START = DOORS.slideStart;
const SPILL_SPAN = DOORS.slideEnd - DOORS.slideStart;
/** A change of target larger than this in one read is a jump, shown at once rather than scrubbed. */
const JUMP = 0.2;

type Written = { opacity?: string; transform?: string };

const fixed = (value: number, digits: number) => {
  const text = value.toFixed(digits);
  // "-0.00" and "0.00" are the same paint.
  return Number(text) === 0 ? "0" : text;
};

export function startWalkEngine({ root, stage, video, onFail, onPoster }: WalkEngineOptions): WalkEngine {
  const html = document.documentElement;
  const part = (name: string) => root.querySelector<HTMLElement>(`[data-part="${name}"]`);
  const parts = (name: string) => Array.from(root.querySelectorAll<HTMLElement>(`[data-part="${name}"]`));

  const [leafLeft, leafRight] = parts("leaf");
  const doorTag = part("door-tag");
  const spill = part("spill");
  const dimmer = part("dimmer");
  const film = part("film");
  const captions = parts("caption");
  const lookShades = parts("look-shade");
  const fills = parts("fill");
  const chapters = parts("chapter");
  const rail = part("rail");
  const clock = part("timecode");

  const portrait = window.matchMedia(PORTRAIT_QUERY);
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const lowMemoryAndroid = isLowMemoryAndroid();
  // Touch scrolling already carries momentum, so ease less there.
  const TAU = coarse ? 0.07 : 0.11;
  // The doors glide on a longer ease while they open, like the production site's.
  const TAU_DOORS = coarse ? 0.16 : 0.24;
  const abort = new AbortController();

  /* ---------- Writes, each only when its rounded value changes ---------- */

  const written = new Map<HTMLElement, Written>();
  const slot = (element: HTMLElement) => {
    let entry = written.get(element);
    if (!entry) {
      entry = {};
      written.set(element, entry);
    }
    return entry;
  };
  const setOpacity = (element: HTMLElement | null | undefined, value: number) => {
    if (!element) return;
    const next = fixed(clamp(value), 3);
    const entry = slot(element);
    if (entry.opacity === next) return;
    entry.opacity = next;
    element.style.opacity = next;
  };
  const setTransform = (element: HTMLElement | null | undefined, next: string) => {
    if (!element) return;
    const entry = slot(element);
    if (entry.transform === next) return;
    entry.transform = next;
    element.style.transform = next;
  };

  /* ---------- State ---------- */

  let raf = 0;
  let lastTs = 0;
  let top = 0;
  let height = 1;
  let travel = 1;
  let layoutWidth = window.innerWidth;
  let inView = true;
  let targetP = 0;
  let smoothP = 0;
  let jumped = false;
  let ready = false;
  let painted = false;
  let requested = -1;
  let seekAt = 0;
  let objectUrl = "";
  let loadedSource = "";
  let pendingSource = "";
  let started = false;
  let lastKey = "";
  let doorsState = root.dataset.doors ?? "closed";
  let chapterIndex = Math.max(0, chapters.findIndex((button) => button.getAttribute("aria-current") === "step"));
  let lookState = "";
  let skipState = "";
  let second = -1;
  let pinned = false;
  let poster: "first" | "last" = "first";
  let posterFrame = 0;
  const captionInert = captions.map((caption) => caption.inert);

  const pickSource = () => {
    if (!portrait.matches) return FILM_SOURCES.landscape;
    return lowMemoryAndroid ? FILM_SOURCES.portraitSafe : FILM_SOURCES.portrait;
  };

  const measure = () => {
    const rect = root.getBoundingClientRect();
    top = rect.top + window.scrollY;
    height = root.offsetHeight;
    travel = Math.max(1, height - stage.offsetHeight);
    layoutWidth = window.innerWidth;
    // Repaint after any size change.
    lastKey = "";
  };

  const readScroll = () => {
    const scrollY = window.scrollY;
    const next = clamp((scrollY - top) / travel);
    if (Math.abs(next - targetP) > JUMP) jumped = true;
    targetP = next;
    const rectTop = top - scrollY;
    const rectBottom = rectTop + height;
    const nextPinned = rectTop <= 0 && rectBottom >= window.innerHeight;
    if (nextPinned !== pinned) {
      pinned = nextPinned;
      if (pinned) html.dataset.atFilm = "pinned";
      else delete html.dataset.atFilm;
    }
    // Until the film paints, the poster follows the position (with a little hysteresis): back from an
    // atelier page or past the middle it shows the last frame; back at the doors, the first again.
    if (!painted) {
      const next = rectBottom < 0 || targetP > 0.55 ? "last" : targetP < 0.45 ? "first" : poster;
      if (next !== poster) {
        poster = next;
        window.cancelAnimationFrame(posterFrame);
        posterFrame = window.requestAnimationFrame(() => {
          posterFrame = 0;
          onPoster(next);
        });
      }
    }
  };

  /* ---------- Paint: doors, film hand-over, captions, rail ---------- */

  const paint = (p: number) => {
    const key = p.toFixed(5);
    if (key === lastKey) return;
    lastKey = key;

    // Eased in and out, as on the production site.
    const slide = ramp(p, DOORS.slideStart, DOORS.slideEnd);
    const shift = DOORS.travel * 100 * slide;

    const doors = p < DOORS.slideStart ? "closed" : p < DOORS.open ? "opening" : "open";
    if (doors !== doorsState) {
      doorsState = doors;
      root.dataset.doors = doors;
    }

    // Each leaf slides into its wall, a percentage of its own width.
    setTransform(leafLeft, `translate3d(${fixed(-shift, 3)}%, 0, 0)`);
    setTransform(leafRight, `translate3d(${fixed(shift, 3)}%, 0, 0)`);
    // The house name lifts away and has gone before the doors are fully open.
    setOpacity(doorTag, 1 - slide / DOORS.signFade);
    setTransform(doorTag, `translate3d(0, ${fixed(-DOORS.signLift * slide, 2)}px, 0)`);
    setOpacity(spill, 0.8 * Math.sin(Math.PI * clamp((p - SPILL_START) / SPILL_SPAN)));
    setOpacity(dimmer, 0.5 * (1 - slide));
    setTransform(film, `scale(${fixed(1.04 - 0.04 * slide, 4)})`);

    BEATS.forEach((beat, index) => {
      const value = envelope(p, beat.range);
      const caption = captions[index];
      if (caption) {
        const rest = 1 - value;
        setOpacity(caption, value);
        setTransform(caption, `translate3d(0, ${fixed(22 * rest, 2)}px, 0)`);
        // A keyboard user never lands on a half-faded control.
        const inert = value < 0.5;
        if (captionInert[index] !== inert) {
          captionInert[index] = inert;
          caption.inert = inert;
        }
      }
      setOpacity(lookShades[index], value);
    });

    CHAPTERS.forEach((chapter, index) => {
      setTransform(fills[index], `scaleX(${fixed(clamp((p - chapter.from) / (chapter.to - chapter.from)), 4)})`);
    });
    const found = CHAPTERS.findIndex((chapter) => p < chapter.to);
    const active = found === -1 ? CHAPTERS.length - 1 : found;
    if (active !== chapterIndex) {
      chapters[chapterIndex]?.removeAttribute("aria-current");
      chapters[active]?.setAttribute("aria-current", "step");
      chapterIndex = active;
    }
    const look = String(active + 1);
    if (look !== lookState) {
      lookState = look;
      root.dataset.look = look;
    }
    const skip = p > SKIP_HIDE ? "off" : "on";
    if (rail && skip !== skipState) {
      skipState = skip;
      rail.dataset.skip = skip;
    }

    const nextSecond = Math.floor(Math.round(mapProgress(p, MAP)) / FPS);
    if (clock && nextSecond !== second) {
      second = nextSecond;
      clock.textContent = `${timecode(nextSecond)} / ${TOTAL}`;
    }
  };

  /* ---------- Scrub ---------- */

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
    // Anchor jumps, Home/End and Skip snap instead of scrubbing the whole film.
    if (jumped) {
      jumped = false;
      smoothP = targetP;
    } else {
      // Lenis already glides wheel and trackpad scrolling; easing the film again would only add lag.
      const filmTau = html.classList.contains("lenis-smooth") ? TAU * 0.4 : TAU;
      // The doors keep their longer glide until they are open, then hand over to the film's ease.
      const doorWeight = 1 - ramp(Math.min(smoothP, targetP), DOORS.slideEnd, DOORS.open + 0.04);
      const tau = filmTau + (TAU_DOORS - filmTau) * doorWeight;
      smoothP += (targetP - smoothP) * (1 - Math.exp(-dt / tau));
    }
    if (Math.abs(targetP - smoothP) < 0.25 / (LAST_FRAME * 1.2)) smoothP = targetP;

    paint(smoothP);

    let pending = false;
    if (ready) {
      const frame = Math.round(mapProgress(smoothP, MAP));
      // Watchdog: a seek that never completes must not freeze the film.
      const stuck = video.seeking && ts - seekAt > 600;
      if (frame !== requested && (!video.seeking || stuck)) seekTo(frame);
      pending = video.seeking || frame !== requested;
    }

    if (smoothP !== targetP || pending) schedule();
    else lastTs = 0;
  };

  /* ---------- Loading ---------- */

  const reveal = () => {
    if (painted) return;
    painted = true;
    root.dataset.film = "ready";
  };

  let loadAbort: AbortController | null = null;

  const releaseVideo = () => {
    try {
      video.removeAttribute("src");
      video.load();
    } catch {
      // Nothing to release.
    }
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    objectUrl = "";
  };

  /** Resolves on loadedmetadata; rejects on error, abort or after 8 s so a stall never pulses forever. */
  const whenMetadata = (signal: AbortSignal) =>
    new Promise<void>((resolve, reject) => {
      const done = (settle: () => void) => {
        window.clearTimeout(timer);
        video.removeEventListener("loadedmetadata", onMeta);
        video.removeEventListener("error", onError);
        signal.removeEventListener("abort", onAbort);
        settle();
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
    // A newer request (the phone rotated) replaces any fetch still in flight.
    loadAbort?.abort();
    const controller = new AbortController();
    loadAbort = controller;
    const { signal } = controller;
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
      if (root.dataset.film === "failed") delete root.dataset.film;
      // Reveal on the first painted frame, never on an undecoded element.
      if ("requestVideoFrameCallback" in video) {
        try {
          video.requestVideoFrameCallback(() => reveal());
        } catch {
          // 'seeked' below still reveals.
        }
      }
      video.addEventListener("seeked", () => window.requestAnimationFrame(reveal), { once: true });
      seekTo(Math.round(mapProgress(smoothP, MAP)));
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
      if (!loadedSource) {
        // A failure at the top of the page becomes the static walk; further down the poster stays
        // and the doors and tags keep running.
        if (window.scrollY < 10) onFail();
        else root.dataset.film = "failed";
      }
    }
  };

  let idle = 0;
  const hasIdle = "requestIdleCallback" in window;
  const startLoad = () => {
    if (started) return;
    started = true;
    // Let the cover, fonts and hydration have the network first.
    idle = hasIdle
      ? window.requestIdleCallback(() => void load(), { timeout: 1500 })
      : window.setTimeout(() => void load(), 300);
  };

  /* ---------- Events ---------- */

  const onScroll = () => {
    readScroll();
    schedule();
  };
  const onResize = () => {
    // The mobile toolbar changes only the height: ignore it.
    if (coarse && window.innerWidth === layoutWidth) return;
    measure();
    readScroll();
    schedule();
  };
  const onOrientation = () => {
    measure();
    readScroll();
    // The source is re-picked only when the portrait bucket changes.
    if (loadedSource || pendingSource) void load();
    schedule();
  };
  // iOS: a gesture unlocks the element. Stay armed until the unlock has actually run.
  let primed = false;
  const releaseGesture = () => {
    window.removeEventListener("touchstart", onGesture);
    window.removeEventListener("pointerdown", onGesture);
  };
  function onGesture() {
    if (primed || !ready || painted) return;
    primed = true;
    let attempt: Promise<void> | undefined;
    try {
      attempt = video.play();
    } catch {
      attempt = undefined;
    }
    Promise.resolve(attempt)
      .then(() => {
        video.pause();
        seekTo(Math.round(mapProgress(smoothP, MAP)));
        schedule();
      })
      .catch(() => undefined)
      .finally(releaseGesture);
  }
  const onVisibility = () => {
    if (!document.hidden) {
      lastTs = 0;
      schedule();
    }
  };

  const io = new IntersectionObserver((entries) => {
    const entry = entries[entries.length - 1];
    if (!entry) return;
    inView = entry.isIntersecting;
    const active = inView ? "on" : "off";
    if (root.dataset.active !== active) root.dataset.active = active;
    if (inView) {
      measure();
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
  jumped = false;
  paint(smoothP);
  startLoad();

  return {
    snap() {
      readScroll();
      smoothP = targetP;
      jumped = false;
      paint(smoothP);
      schedule();
    },
    goTo(progress: number) {
      measure();
      window.scrollTo({ top: Math.round(top + clamp(progress) * travel), behavior: "instant" });
      readScroll();
      smoothP = targetP;
      jumped = false;
      paint(smoothP);
      schedule();
    },
    destroy() {
      abort.abort();
      if (hasIdle) window.cancelIdleCallback(idle);
      else window.clearTimeout(idle);
      if (raf) window.cancelAnimationFrame(raf);
      if (posterFrame) window.cancelAnimationFrame(posterFrame);
      io.disconnect();
      ro.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      portrait.removeEventListener("change", onOrientation);
      releaseGesture();
      document.removeEventListener("visibilitychange", onVisibility);
      loadAbort?.abort();
      ready = false;
      if (pinned) delete html.dataset.atFilm;
      pinned = false;
      delete root.dataset.film;
      delete root.dataset.active;
      releaseVideo();
    },
  };
}
