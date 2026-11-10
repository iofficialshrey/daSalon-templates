/*
 * The entrance film: walnut doors open onto a candle-lit room, then the view
 * moves slowly to the bed. 145 frames at 24 fps, re-encoded from
 * public/assets/spa-entrance.mp4 (which stays where it is for the tests).
 * Every encode has a keyframe every 4 frames (2 in the safe one), no B-frames
 * and faststart, so a seek is local and cheap once the blob is in hand.
 */

export const FPS = 24;
export const LAST_FRAME = 144;
export const PORTRAIT_QUERY = "(max-aspect-ratio: 4/5)";

/** (progress, frame) knots, interpolated with monotone cubic Hermite (Fritsch–Carlson). */
export const KNOTS = [[0, 0], [0.06, 0], [0.34, 46], [0.58, 76], [0.88, 138], [0.96, 144], [1, 144]] as const;

export const FILM_DIR = "/brand-home-3/film";

export const FILM_SOURCES = {
  landscape: `${FILM_DIR}/serein-film-1280x720.v1.mp4`,
  portrait: `${FILM_DIR}/serein-film-576x768.v1.mp4`,
  /** Keyframe every 2 frames: portrait Android with deviceMemory ≤ 4. */
  safe: `${FILM_DIR}/serein-film-576x768-safe.v1.mp4`,
} as const;

/** Keyframe spacing of each encode: the coarsest quantisation step, so slow decoders only ever seek to keyframes. */
export const FILM_GOP = { landscape: 4, portrait: 4, safe: 2 } as const;

export type PosterSize = "1280x720" | "576x768";
export type PosterFrame = "first" | "last";
export type PosterFormat = "avif" | "webp" | "jpg";

/** "/brand-home-3/film/serein-film-1280x720-first.v1.avif" */
export const posterSrc = (size: PosterSize, frame: PosterFrame, format: PosterFormat) =>
  `${FILM_DIR}/serein-film-${size}-${frame}.v1.${format}`;

export const GRAIN_SRC = `${FILM_DIR}/grain.v1.png`;
