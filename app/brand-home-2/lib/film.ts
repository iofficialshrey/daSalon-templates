/*
 * Pure maths and device checks for the walk-through. No DOM writes here; the
 * section's controller owns those.
 */

export const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));

export const smoothstep = (value: number) => {
  const x = clamp(value);
  return x * x * (3 - 2 * x);
};

/** smoothstep across [from, to]. */
export const ramp = (p: number, from: number, to: number) => smoothstep((p - from) / Math.max(1e-6, to - from));

/** Fade in a→b, hold, fade out c→d. With c = d = 1 the beat holds to the end. */
export function envelope(p: number, [a, b, c, d]: readonly [number, number, number, number]) {
  const fadeIn = ramp(p, a, b);
  const fadeOut = c >= 1 ? 0 : ramp(p, c, d);
  return fadeIn * (1 - fadeOut);
}

/** Piecewise-linear progress → frame index. */
export function mapProgress(p: number, map: ReadonlyArray<readonly [number, number]>) {
  for (let index = 1; index < map.length; index++) {
    const [x1, y1] = map[index];
    const [x0, y0] = map[index - 1];
    if (p <= x1) return y0 + ((p - x0) / Math.max(1e-6, x1 - x0)) * (y1 - y0);
  }
  return map[map.length - 1][1];
}

type NavigatorExtras = Navigator & {
  connection?: { saveData?: boolean; effectiveType?: string };
  deviceMemory?: number;
};

const REDUCED_QUERY = "(prefers-reduced-motion: reduce)";

/** Reduced motion, Save-Data, 2G or very low memory: static mode, zero video bytes. */
export function liteSnapshot() {
  const nav = navigator as NavigatorExtras;
  return window.matchMedia(REDUCED_QUERY).matches
    || nav.connection?.saveData === true
    || nav.connection?.effectiveType === "2g"
    || nav.connection?.effectiveType === "slow-2g"
    || (typeof nav.deviceMemory === "number" && nav.deviceMemory <= 2);
}

export function subscribeLite(onChange: () => void) {
  const query = window.matchMedia(REDUCED_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

/** Android with ≤ 4 GB gets the GOP-2 portrait encode. */
export function isLowMemoryAndroid() {
  const nav = navigator as NavigatorExtras;
  return /Android/i.test(nav.userAgent) && typeof nav.deviceMemory === "number" && nav.deviceMemory <= 4;
}

export function saveData() {
  return (navigator as NavigatorExtras).connection?.saveData === true;
}

/** "00:04" */
export function timecode(seconds: number) {
  const whole = Math.max(0, Math.floor(seconds));
  return `${String(Math.floor(whole / 60)).padStart(2, "0")}:${String(whole % 60).padStart(2, "0")}`;
}
