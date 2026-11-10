import { FILM_GOP, FPS, KNOTS, LAST_FRAME, PORTRAIT_QUERY } from "../data/film";
import { clamp, envelope, isLowMemoryAndroid, mapProgress, ramp } from "../lib/film";

/*
 * Serein's scrub engine, ported from app/brand-home-2/components/walk-engine.ts
 * without the doors, chapters or timecode (spec §5.5).
 * - Geometry is cached and re-measured by ResizeObserver and width changes only:
 *   no layout reads inside requestAnimationFrame.
 * - Scroll progress is eased per frame (τ .11 s fine / .07 s coarse) and mapped
 *   to a frame through the monotone curve; one mid-frame seek is in flight at a time.
 * - Slow decoders are quantised to even frames, then to keyframes.
 * - The film is fetched once as a Blob at idle (or on the first interaction),
 *   so every seek is local; rotation swaps the encode once the new blob is in hand.
 * - rAF runs only while the section is on screen, the tab is visible and there
 *   is work; otherwise there is no loop at all.
 * It writes only opacity, transform, textContent, inert and data attributes to
 * [data-part] nodes, each only when its rounded value changes. Never React state.
 */

export type FilmEngine = {
  /** Re-read the scroll position and show it at once (after an instant jump). */
  snap(): void;
  destroy(): void;
};

export type FilmEngineOptions = {
  /** section#film */
  root: HTMLElement;
  /** [data-part=stage] */
  stage: HTMLElement;
  /** [data-part=video] */
  video: HTMLVideoElement;
  /** The film failed to load. atTop = the visitor has not scrolled into it (p < .02): switch to the lite layout. */
  onFail: (atTop: boolean) => void;
};

type SourceKind = keyof typeof FILM_GOP;

/** Smallest progress step worth easing towards; below it the value snaps. */
const EPSILON = 0.0005;
/** Larger jumps (anchors, Home/End, Skip) snap instead of scrubbing the whole film. */
const SNAP = 0.2;
const MAX_DT = 0.064;
const SEEK_WATCHDOG_MS = 600;
const METADATA_TIMEOUT_MS = 8000;
const IDLE_TIMEOUT_MS = 1200;
const LATENCY_SAMPLES = 12;
/** poster-last fades in over the bed once the visitor is past the threshold (failure path only). */
const POSTER_LAST_FROM = 0.62;

const roundOpacity = (value: number) => String(Math.round(clamp(value) * 100) / 100);
const roundPx = (value: number) => {
  const half = Math.round(value * 2) / 2;
  return half === 0 ? 0 : half;
};

export function startFilmEngine({ root, stage, video, onFail }: FilmEngineOptions): FilmEngine {
  const part = (name: string) => root.querySelector<HTMLElement>(`[data-part="${name}"]`);

  const beatA = part("a");
  const beatB = part("b");
  const beatC = part("c");
  const cue = part("cue");
  const skip = part("skip");
  const rail = part("rail");
  const railFill = part("rail-fill");
  const railCount = part("rail-count");
  const shadeRail = part("shade-rail");
  const shadeA = part("shade-a");
  const shadeB = part("shade-b");
  const shadeC = part("shade-c");
  const linen = part("linen");
  const posterLast = part("poster-last");

  const sources: Record<SourceKind, string> = {
    landscape: root.dataset.filmLandscape ?? "",
    portrait: root.dataset.filmPortrait ?? "",
    safe: root.dataset.filmSafe ?? "",
  };
  const portraitQuery = window.matchMedia(PORTRAIT_QUERY);
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  // Touch scrolling already carries momentum, so ease less there.
  const tau = coarse ? 0.07 : 0.11;
  const lowMemoryAndroid = isLowMemoryAndroid();
  const engineAbort = new AbortController();

  /* ---------- Writes, each only when its rounded value changes ---------- */

  const opacities = new Map<HTMLElement, string>();
  const transforms = new Map<HTMLElement, string>();

  const setOpacity = (element: HTMLElement | null, value: number) => {
    if (!element) return;
    const next = roundOpacity(value);
    if (opacities.get(element) === next) return;
    opacities.set(element, next);
    element.style.opacity = next;
  };
  const setTransform = (element: HTMLElement | null, next: string) => {
    if (!element || transforms.get(element) === next) return;
    transforms.set(element, next);
    element.style.transform = next;
  };
  const setLift = (element: HTMLElement | null, px: number) => {
    const value = roundPx(px);
    setTransform(element, value === 0 ? "none" : `translateY(${value}px)`);
  };
  /** An invisible element is never clickable or focusable. */
  const setInert = (element: HTMLElement | null, inert: boolean) => {
    if (!element || element.inert === inert) return;
    element.inert = inert;
  };

  /* ---------- State ---------- */

  let destroyed = false;
  let raf = 0;
  let lastTs = 0;
  let rootTop = 0;
  let travel = 1;
  let layoutWidth = window.innerWidth;
  let inView = true;
  let visible = !document.hidden;
  let target = 0;
  let smooth = 0;
  let lastPainted = "";
  let railPercent = -1;

  let started = false;
  let failed = false;
  let ready = false;
  let painted = false;
  let requested = -1;
  let seekAt = 0;
  let seekPending = false;
  let measureNextSeek = false;
  const latencies: number[] = [];
  let quantum = 1;
  let gop: number = FILM_GOP.landscape;
  let objectUrl = "";
  let loadedSource = "";
  let pendingSource = "";
  let loadAbort: AbortController | null = null;

  let showLast = false;
  let lastFrameRaf = 0;

  /* ---------- Geometry (never inside rAF) ---------- */

  const measure = () => {
    rootTop = root.getBoundingClientRect().top + window.scrollY;
    // The stage height, not innerHeight: the stage is 100lvh, the section 320svh.
    travel = Math.max(1, root.offsetHeight - stage.offsetHeight);
    layoutWidth = window.innerWidth;
  };

  const readScroll = () => {
    target = clamp((window.scrollY - rootTop) / travel);
  };

  /* ---------- Paint: beats, shades, rail ---------- */

  const setPosterLast = (show: boolean) => {
    if (!posterLast || show === showLast) return;
    showLast = show;
    window.cancelAnimationFrame(lastFrameRaf);
    lastFrameRaf = 0;
    if (show) {
      posterLast.hidden = false;
      // Next frame, so the 400 ms opacity transition starts from 0 once it is displayed.
      lastFrameRaf = window.requestAnimationFrame(() => {
        lastFrameRaf = 0;
        if (showLast) posterLast.dataset.show = "";
      });
    } else {
      delete posterLast.dataset.show;
    }
  };

  const paint = (p: number) => {
    const key = p.toFixed(5);
    if (key === lastPainted) return;
    lastPainted = key;

    const leaveA = ramp(p, 0.06, 0.16);
    setOpacity(beatA, 1 - leaveA);
    setLift(beatA, -24 * leaveA);

    setOpacity(beatB, envelope(p, [0.36, 0.42, 0.56, 0.62]));
    setLift(beatB, 16 * (1 - ramp(p, 0.36, 0.42)) - 16 * ramp(p, 0.56, 0.62));

    // Held at 1 through p = 1: it rides up with the stage after the pin releases.
    const arriveC = ramp(p, 0.82, 0.9);
    setOpacity(beatC, arriveC);
    setLift(beatC, 20 * (1 - arriveC));
    setInert(beatC, arriveC < 0.5);

    setOpacity(cue, 1 - ramp(p, 0, 0.06));
    const skipOpacity = 1 - ramp(p, 0.78, 0.82);
    setOpacity(skip, skipOpacity);
    setInert(skip, skipOpacity < 0.5);
    setOpacity(rail, 1 - ramp(p, 0.82, 0.88));

    setOpacity(shadeRail, 1 - ramp(p, 0.86, 0.92));
    setOpacity(shadeA, 1 - ramp(p, 0.08, 0.18));
    setOpacity(shadeB, envelope(p, [0.34, 0.4, 0.58, 0.64]));
    setOpacity(shadeC, ramp(p, 0.8, 0.86));
    setOpacity(linen, ramp(p, 0.94, 1));

    setTransform(railFill, `scaleY(${Math.round(p * 1000) / 1000})`);
    const percent = Math.round(p * 100);
    if (railCount && percent !== railPercent) {
      railPercent = percent;
      railCount.textContent = String(percent).padStart(2, "0");
    }

    if (failed) setPosterLast(p >= POSTER_LAST_FROM);
  };

  /* ---------- Scrub ---------- */

  const frameFor = (p: number) => {
    const exact = Math.round(mapProgress(p, KNOTS));
    if (quantum === 1) return exact;
    return Math.min(LAST_FRAME, Math.round(exact / quantum) * quantum);
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

  /** Issue the next seek if the frame moved and nothing is in flight (or the one in flight is stuck). */
  const pump = (now: number) => {
    if (!ready) {
      seekPending = false;
      return;
    }
    const frame = frameFor(smooth);
    const stuck = video.seeking && now - seekAt > SEEK_WATCHDOG_MS;
    if (frame !== requested && (!video.seeking || stuck) && video.readyState >= 1) seekTo(frame);
    seekPending = video.seeking || frame !== requested;
  };

  const busy = () => Math.abs(target - smooth) > EPSILON || seekPending;

  const schedule = () => {
    if (destroyed || raf || !inView || !visible || !busy()) return;
    raf = window.requestAnimationFrame(tick);
  };

  function tick(ts: number) {
    raf = 0;
    const dt = lastTs ? Math.min(MAX_DT, (ts - lastTs) / 1000) : 1 / 60;
    lastTs = ts;
    const delta = target - smooth;
    if (Math.abs(delta) > SNAP || Math.abs(delta) < EPSILON) smooth = target;
    else smooth += delta * (1 - Math.exp(-dt / tau));

    paint(smooth);
    pump(performance.now());

    if (busy()) schedule();
    else lastTs = 0;
  }

  /* ---------- Reveal and adaptive quantisation ---------- */

  const stopLoadingDot = () => rail?.removeAttribute("data-loading");

  const reveal = () => {
    if (painted || !ready || destroyed) return;
    painted = true;
    root.dataset.film = "ready";
    stopLoadingDot();
  };

  const onSeeked = () => {
    if (!ready) return;
    if (measureNextSeek) {
      // The first seek after a load includes decoder warm-up: not a fair sample.
      measureNextSeek = false;
    } else {
      latencies.push(performance.now() - seekAt);
      if (latencies.length > LATENCY_SAMPLES) latencies.shift();
      const sorted = [...latencies].sort((a, b) => a - b);
      const median = sorted[Math.floor(sorted.length / 2)] ?? 0;
      quantum = median > 120 ? gop : median > 60 ? 2 : 1;
    }
    if (!painted) window.requestAnimationFrame(reveal);
    pump(performance.now());
    schedule();
  };

  /* ---------- Loading ---------- */

  const releaseVideo = () => {
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    objectUrl = "";
    try {
      video.removeAttribute("src");
      video.load();
    } catch {
      // Nothing to release.
    }
  };

  const fail = () => {
    if (failed || destroyed) return;
    failed = true;
    loadAbort?.abort();
    loadAbort = null;
    pendingSource = "";
    loadedSource = "";
    ready = false;
    painted = false;
    seekPending = false;
    releaseVideo();
    // Keep the posters; the beats, rail, shades and header keep working off progress.
    root.dataset.film = "poster";
    stopLoadingDot();
    const atTop = target < 0.02;
    onFail(atTop);
    if (!atTop) {
      lastPainted = "";
      paint(smooth);
    }
  };

  /** Resolves on loadedmetadata; rejects on a media error, abort, or after 8 s. */
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
      const timer = window.setTimeout(() => done(() => reject(new Error("Film metadata timed out"))), METADATA_TIMEOUT_MS);
      if (video.readyState >= 1) {
        done(resolve);
        return;
      }
      video.addEventListener("loadedmetadata", onMeta);
      video.addEventListener("error", onError);
      signal.addEventListener("abort", onAbort);
    });

  const pick = (): { url: string; kind: SourceKind } => {
    if (!portraitQuery.matches) return { url: sources.landscape, kind: "landscape" };
    return lowMemoryAndroid ? { url: sources.safe, kind: "safe" } : { url: sources.portrait, kind: "portrait" };
  };

  const load = async () => {
    if (failed || destroyed) return;
    const { url, kind } = pick();
    if (!url) {
      fail();
      return;
    }
    if (url === loadedSource) {
      // Rotated away and back while the other encode was still downloading: drop that fetch.
      if (pendingSource) {
        loadAbort?.abort();
        loadAbort = null;
        pendingSource = "";
      }
      return;
    }
    if (url === pendingSource) return;

    // A newer request (the phone rotated) replaces any fetch still in flight.
    loadAbort?.abort();
    const controller = new AbortController();
    loadAbort = controller;
    const { signal } = controller;
    const onEngineAbort = () => controller.abort();
    engineAbort.signal.addEventListener("abort", onEngineAbort, { once: true });
    pendingSource = url;
    let swapped = false;

    try {
      const response = await fetch(url, { signal });
      if (!response.ok) throw new Error(`Film unavailable (${response.status})`);
      const blob = await response.blob();
      if (signal.aborted) return;

      // Swap only once the new file is in hand, so the current picture stays meanwhile.
      swapped = true;
      const previousUrl = objectUrl;
      objectUrl = URL.createObjectURL(blob);
      pendingSource = "";
      loadedSource = url;
      gop = FILM_GOP[kind];
      quantum = 1;
      latencies.length = 0;
      measureNextSeek = true;
      ready = false;
      painted = false;
      requested = -1;
      // Until the new encode paints, the posters show again.
      if (root.dataset.film === "ready") root.dataset.film = "poster";

      // iOS: muted and inline before src; preload must allow loading or WebKit never decodes a blob.
      video.muted = true;
      video.defaultMuted = true;
      video.playsInline = true;
      video.setAttribute("muted", "");
      video.setAttribute("playsinline", "");
      video.preload = "auto";
      video.src = objectUrl;
      video.load();
      if (previousUrl) URL.revokeObjectURL(previousUrl);

      // This encode is on the element now: a later rotation must not cancel its wait, or rotating
      // away and back before metadata would leave the film never ready. Only a newer swap
      // (or destroy) supersedes it.
      await whenMetadata(engineAbort.signal);
      if (destroyed || loadedSource !== url) return;
      ready = true;
      stopLoadingDot();

      // Reveal on the first presented frame, never on an undecoded element.
      if (typeof video.requestVideoFrameCallback === "function") {
        try {
          video.requestVideoFrameCallback(() => reveal());
        } catch {
          // 'seeked' still reveals.
        }
      }
      pump(performance.now());
      schedule();
    } catch {
      if (destroyed) return;
      // After the swap, a metadata failure fails the film unless a newer swap has replaced this encode.
      if (swapped) {
        if (loadedSource === url) fail();
        return;
      }
      if (signal.aborted) return;
      if (pendingSource === url) pendingSource = "";
      // A rotation fetch that failed before the swap keeps the encode already on the element
      // (ready, or still in its own metadata wait, which fails the film itself if it times out).
      if (loadedSource) return;
      fail();
    } finally {
      engineAbort.signal.removeEventListener("abort", onEngineAbort);
    }
  };

  const onMediaError = () => {
    // Errors from releasing the element (no object URL) are not failures.
    if (!objectUrl || !video.error) return;
    fail();
  };

  /* ---------- Start: idle after load, or the first interaction ---------- */

  const hasIdle = typeof window.requestIdleCallback === "function";
  let idleHandle = 0;
  const START_EVENTS = ["pointerdown", "touchstart", "keydown"] as const;

  const removeStartListeners = () => {
    for (const type of START_EVENTS) window.removeEventListener(type, begin);
    window.removeEventListener("load", onWindowLoad);
  };

  function begin() {
    if (started || destroyed) return;
    started = true;
    if (idleHandle) {
      if (hasIdle) window.cancelIdleCallback(idleHandle);
      else window.clearTimeout(idleHandle);
      idleHandle = 0;
    }
    removeStartListeners();
    void load();
  }

  function onWindowLoad() {
    if (started || destroyed) return;
    idleHandle = hasIdle
      ? window.requestIdleCallback(begin, { timeout: IDLE_TIMEOUT_MS })
      : window.setTimeout(begin, 300);
  }

  /* ---------- iOS: a gesture unlocks the element; stay armed until it works ---------- */

  let primed = false;
  let priming = false;
  const releaseGesture = () => {
    window.removeEventListener("touchstart", onGesture);
    window.removeEventListener("pointerdown", onGesture);
  };
  function onGesture() {
    if (primed || priming || !ready) return;
    // Desktop browsers paint seeks without a play; only touch devices need the unlock.
    if (!coarse && painted) {
      primed = true;
      releaseGesture();
      return;
    }
    let attempt: Promise<void> | undefined;
    try {
      attempt = video.play();
    } catch {
      attempt = undefined;
    }
    if (!attempt) return;
    priming = true;
    attempt
      .then(() => {
        video.pause();
        primed = true;
        releaseGesture();
        requested = -1;
        pump(performance.now());
        schedule();
      })
      // Low Power Mode rejects play(): the poster remains and the listener stays armed.
      .catch(() => undefined)
      .finally(() => {
        priming = false;
      });
  }

  /* ---------- Events ---------- */

  const onScroll = () => {
    if (!started) begin();
    readScroll();
    schedule();
  };

  const onResize = () => {
    // The mobile toolbar changes only the height: ignore it.
    if (coarse && window.innerWidth === layoutWidth) return;
    measure();
    readScroll();
    // A rotation also arrives here; load() keeps the encode when the portrait bucket is unchanged.
    if (started && !failed) void load();
    schedule();
  };

  const onPortraitChange = () => {
    measure();
    readScroll();
    // Re-pick the encode; the new blob swaps in only once it has arrived.
    if (started && !failed) void load();
    schedule();
  };

  const onVisibility = () => {
    visible = !document.hidden;
    if (!visible) return;
    lastTs = 0;
    measure();
    readScroll();
    schedule();
  };

  const io = new IntersectionObserver(
    (entries) => {
      const entry = entries[entries.length - 1];
      if (!entry) return;
      inView = entry.isIntersecting;
      if (inView) {
        measure();
        readScroll();
        schedule();
        return;
      }
      // Off screen: no loop. Settle on the final state so beat C and Skip are never left half-inert.
      if (raf) window.cancelAnimationFrame(raf);
      raf = 0;
      lastTs = 0;
      readScroll();
      smooth = target;
      paint(smooth);
    },
    { threshold: 0 },
  );
  const ro = new ResizeObserver(() => {
    measure();
    readScroll();
    schedule();
  });

  /* ---------- Go ---------- */

  measure();
  readScroll();
  smooth = target;
  paint(smooth);

  io.observe(root);
  ro.observe(root);
  ro.observe(stage);
  video.addEventListener("seeked", onSeeked);
  video.addEventListener("error", onMediaError);
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onResize, { passive: true });
  portraitQuery.addEventListener("change", onPortraitChange);
  document.addEventListener("visibilitychange", onVisibility);
  window.addEventListener("touchstart", onGesture, { passive: true });
  window.addEventListener("pointerdown", onGesture, { passive: true });
  for (const type of START_EVENTS) window.addEventListener(type, begin, { passive: true });
  if (document.readyState === "complete") onWindowLoad();
  else window.addEventListener("load", onWindowLoad, { once: true });

  return {
    snap() {
      if (destroyed) return;
      readScroll();
      smooth = target;
      paint(smooth);
      pump(performance.now());
      schedule();
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      engineAbort.abort();
      loadAbort?.abort();
      loadAbort = null;
      if (idleHandle) {
        if (hasIdle) window.cancelIdleCallback(idleHandle);
        else window.clearTimeout(idleHandle);
      }
      if (raf) window.cancelAnimationFrame(raf);
      if (lastFrameRaf) window.cancelAnimationFrame(lastFrameRaf);
      io.disconnect();
      ro.disconnect();
      video.removeEventListener("seeked", onSeeked);
      video.removeEventListener("error", onMediaError);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      portraitQuery.removeEventListener("change", onPortraitChange);
      document.removeEventListener("visibilitychange", onVisibility);
      releaseGesture();
      removeStartListeners();
      ready = false;
      releaseVideo();
      // Back to the server state, unless React has already moved the section on (data-film="static").
      if (root.dataset.film === "ready") root.dataset.film = "poster";
    },
  };
}
