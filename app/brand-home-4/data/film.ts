/*
 * The cover film: the model turns through a sleek bob, soft waves, a high
 * ponytail, curls and long straight hair, and ends facing the camera. It plays
 * once and holds on that last frame. The grade is baked into the encodes.
 */

const FILM = "/brand-home-4/film";

export const FILM_SOURCES = {
  /** 1280×720, H.264 CRF 24, 7.04 s. */
  landscape: `${FILM}/paloma-film-1280x720.v2.mp4`,
  /** A static 3:4 crop that follows the model, 576×768. */
  portrait: `${FILM}/paloma-film-576x768.v2.mp4`,
} as const;

export type PosterSize = "1280x720" | "576x768";
export type PosterFrame = "first" | "last";
export type PosterFormat = "avif" | "webp" | "jpg";

export function posterSrc(size: PosterSize, frame: PosterFrame, format: PosterFormat) {
  return `${FILM}/paloma-film-${size}-${frame}.v2.${format}`;
}

/** Portrait encode and posters below this. */
export const PORTRAIT_QUERY = "(max-width: 1099px) and (orientation: portrait)";

/** object-position for each orientation, so the model's turn always stays in frame. */
export const FILM_POSITION = { landscape: "76% 42%", portrait: "50% 22%" } as const;

export const FILM_COPY = {
  altFirst: "Cover: a model with a sleek dark bob, in profile.",
  altLast: "Cover: a model with long dark hair faces the camera and smiles.",
  caption:
    "The cover film turns the model through a sleek bob, soft waves, a high ponytail, curls and long straight hair, and ends facing the camera.",
} as const;
