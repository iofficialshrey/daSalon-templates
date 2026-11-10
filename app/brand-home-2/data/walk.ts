/*
 * The threshold: one 12 s film (289 frames at 24 fps), scrubbed by scroll
 * behind two black fluted doors that slide apart onto the film's own doors.
 * Ranges are fractions of the section's pinned travel (p, 0 → 1): the first
 * 30% belongs to the doors (about a screen and a quarter of scrolling on
 * desktop, near the production site's pace), the rest to the film.
 */

export const FPS = 24;
export const LAST_FRAME = 288;
export const PORTRAIT_QUERY = "(max-aspect-ratio: 4/5)";

const FILM = "/brand-home-2/film";

export const FILM_SOURCES = {
  landscape: `${FILM}/atelier-film-1280x720.v1.mp4`,
  portrait: `${FILM}/atelier-film-576x768.v1.mp4`,
  /** GOP 2: kinder to low-memory Android decoders. */
  portraitSafe: `${FILM}/atelier-film-576x768-safe.v1.mp4`,
} as const;

/** Poster files: `${FILM}/atelier-film-{1280x720|576x768}-{first|last}.v1.{avif|webp|jpg}`. */
export function posterSrc(size: "1280x720" | "576x768", which: "first" | "last", format: "avif" | "webp" | "jpg") {
  return `${FILM}/atelier-film-${size}-${which}.v1.${format}`;
}

/** Static-mode stills, 3:4. */
export function stillSrc(look: 1 | 2 | 3 | 4, format: "avif" | "webp") {
  return `${FILM}/walk-look-${look}-600x800.v1.${format}`;
}

/** p → frame. Frame 0 is held while the doors start to part; 0→24 is the footage's own camera push. */
export const MAP: ReadonlyArray<readonly [number, number]> = [
  [0, 0],
  [0.12, 0],
  [0.3, 24],
  [0.417, 72],
  [0.458, 90],
  [0.575, 126],
  [0.642, 156],
  [0.767, 214],
  [0.833, 246],
  [0.95, 288],
  [1, 288],
];

/** Door choreography: the leaves slide apart (eased in and out) and the sign lifts away. */
export const DOORS = {
  /** Dead zone: closed, frame 0, the sign is read. */
  slideStart: 0.03,
  slideEnd: 0.29,
  /** From here the leaves are hidden and data-doors="open". */
  open: 0.295,
  /** How far each leaf travels, as a fraction of its own width: clear of the frame, shadow and all. */
  travel: 1.04,
  /** The sign has faded by this fraction of the slide, rising this many pixels as it goes. */
  signFade: 1 / 1.45,
  signLift: 42,
} as const;

export type Beat = {
  id: "beat-1" | "beat-2" | "beat-3" | "beat-4";
  /** Envelope: fade in a→b, hold, fade out c→d. The last beat holds to the end (c = d = 1). */
  range: readonly [number, number, number, number];
  title: string;
  body: string;
};

export const BEATS: readonly Beat[] = [
  {
    id: "beat-1",
    range: [0.3, 0.325, 0.4, 0.425],
    title: "The door is held for you.",
    body: "Expected at the desk, your name already on the day\u2019s list.",
  },
  {
    id: "beat-2",
    range: [0.458, 0.483, 0.558, 0.583],
    title: "Walk into calm.",
    body: "Limestone, orchids, low light. The street falls away behind you.",
  },
  {
    id: "beat-3",
    range: [0.642, 0.667, 0.733, 0.758],
    title: "Made personal.",
    body: "Every visit begins at the mirror: what you want, and how long you have today.",
  },
  {
    id: "beat-4",
    range: [0.833, 0.867, 1, 1],
    title: "Your hour, at any atelier.",
    body: "Choose a time from any atelier\u2019s live diary. You pay after your visit.",
  },
];

/** The four stretches of the film, for the progress hairlines. */
export type Chapter = { from: number; to: number };

export const CHAPTERS: readonly Chapter[] = [
  { from: 0, to: 0.442 },
  { from: 0.442, to: 0.608 },
  { from: 0.608, to: 0.8 },
  { from: 0.8, to: 1 },
];

/** Skip hides once the film has reached its last frame and the last line carries the invitation. */
export const SKIP_HIDE = 0.95;

/** Skip and the static-mode text link land here: the section after the film. */
export const AFTER_WALK_ID = "ritual";

export const WALK_COPY = {
  srTitle: "Step inside Atelier",
  srDescription:
    "A 12-second illustrative film: a guest walks through tall timber doors, along a vaulted limestone corridor with orchids and lit mirrors, to a stylist and a client at a mirror.",
  sign: "Atelier",
  signHint: "Scroll to enter",
  loading: "Loading film",
  skip: "Skip the film",
  skipShort: "Skip",
  ateliersLink: "See the ateliers",
  staticTitle: "From the door to the mirror.",
  staticSkip: "Continue",
  stillAlts: [
    "Still from the film: a woman in champagne satin passes through tall timber doors.",
    "Still: white orchids on timber plinths in a vaulted limestone corridor.",
    "Still: a stylist in black talks with a seated client at a lit mirror.",
    "Still: the guest walks on past arched mirror bays.",
  ],
} as const;
