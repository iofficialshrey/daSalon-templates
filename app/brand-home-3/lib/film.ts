/*
 * Pure maths and one device check for the entrance film. No DOM writes here;
 * the engine (components/film-engine.ts) owns those. clamp, smoothstep, ramp
 * and envelope are copied from app/brand-home-2/lib/film.ts; mapProgress is a
 * monotone cubic (Fritsch–Carlson) instead of T2's piecewise-linear map.
 */

export const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));

export const smoothstep = (value: number) => {
  const x = clamp(value);
  return x * x * (3 - 2 * x);
};

/** smoothstep across [from, to]. */
export const ramp = (p: number, from: number, to: number) => smoothstep((p - from) / Math.max(1e-6, to - from));

/** Fade in a→b, hold, fade out c→d. With c ≥ 1 the value holds to the end. */
export function envelope(p: number, [a, b, c, d]: readonly [number, number, number, number]) {
  const fadeIn = ramp(p, a, b);
  const fadeOut = c >= 1 ? 0 : ramp(p, c, d);
  return fadeIn * (1 - fadeOut);
}

export type Knots = ReadonlyArray<readonly [number, number]>;

/**
 * Fritsch–Carlson tangents: harmonic-mean interior tangents, zero at extrema
 * and on flat segments, end tangents equal to the end secants, then each
 * segment's (α, β) is scaled into the radius-3 circle so the curve never overshoots.
 */
export function monotoneTangents(knots: Knots): number[] {
  const n = knots.length;
  const secants: number[] = [];
  for (let k = 0; k < n - 1; k++) {
    secants.push((knots[k + 1][1] - knots[k][1]) / Math.max(1e-9, knots[k + 1][0] - knots[k][0]));
  }
  const tangents = new Array<number>(n).fill(0);
  if (n < 2) return tangents;
  tangents[0] = secants[0];
  tangents[n - 1] = secants[n - 2];
  for (let k = 1; k < n - 1; k++) {
    const before = secants[k - 1];
    const after = secants[k];
    tangents[k] = before * after <= 0 ? 0 : 2 / (1 / before + 1 / after);
  }
  for (let k = 0; k < n - 1; k++) {
    const d = secants[k];
    if (d === 0) {
      tangents[k] = 0;
      tangents[k + 1] = 0;
      continue;
    }
    const alpha = tangents[k] / d;
    const beta = tangents[k + 1] / d;
    const sum = alpha * alpha + beta * beta;
    if (sum > 9) {
      const tau = 3 / Math.sqrt(sum);
      tangents[k] = tau * alpha * d;
      tangents[k + 1] = tau * beta * d;
    }
  }
  return tangents;
}

const tangentCache = new WeakMap<Knots, number[]>();

/** Progress (0–1) → frame, through the knots with monotone cubic Hermite interpolation. */
export function mapProgress(p: number, knots: Knots): number {
  let tangents = tangentCache.get(knots);
  if (!tangents) {
    tangents = monotoneTangents(knots);
    tangentCache.set(knots, tangents);
  }
  const last = knots.length - 1;
  if (p <= knots[0][0]) return knots[0][1];
  if (p >= knots[last][0]) return knots[last][1];
  for (let k = 0; k < last; k++) {
    const [x0, y0] = knots[k];
    const [x1, y1] = knots[k + 1];
    if (p > x1) continue;
    const h = x1 - x0;
    const t = (p - x0) / h;
    const t2 = t * t;
    const t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * y0 + (t3 - 2 * t2 + t) * h * tangents[k] + (-2 * t3 + 3 * t2) * y1 + (t3 - t2) * h * tangents[k + 1];
  }
  return knots[last][1];
}

type NavigatorExtras = Navigator & { deviceMemory?: number };

/** Android with ≤ 4 GB gets the GOP-2 portrait encode (copied from T2). */
export function isLowMemoryAndroid() {
  const nav = navigator as NavigatorExtras;
  return /Android/i.test(nav.userAgent) && typeof nav.deviceMemory === "number" && nav.deviceMemory <= 4;
}
