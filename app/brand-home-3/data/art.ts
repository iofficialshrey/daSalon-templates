/*
 * "Every still after the film is a sky after rain." John Constable's open-air
 * cloud studies (Hampstead, 1821–c. 1825; Yale Center for British Art, Paul Mellon
 * Collection, CC0), cropped to sky only and recoloured with one of Serein's
 * five gradient maps. Files are pre-sized AVIF + WebP served through
 * <picture>, never re-encoded at runtime.
 *
 * Until the approved exports land, ART_READY stays false and every slot renders
 * its designed fallback: the same box, filled flat with the map's t = .5 colour.
 */

export const ART_READY: boolean = true; // the CC0 exports are in public/brand-home-3/art (docs/brand-home-3/art-pipeline.md)
export const ART_DIR = "/brand-home-3/art";

export type ArtMap = "pool" | "sage" | "clay" | "light" | "dusk";

export type ArtKey =
  | "ritual-ground" | "ritual-float" | "ritual-illuminate" | "ritual-unwind"
  | "journey-ground" | "journey-float" | "journey-illuminate" | "journey-unwind"
  | "place-serenity-spa-house" | "place-the-grooming-room" | "place-lumiere-aesthetics" | "place-bride-groom"
  | "membership-panel" | "face-house-rhythm" | "face-restored-year" | "face-weekly-quiet"
  | "set-three-grounds" | "set-unwind-ritual" | "set-water-hours"
  | "gift-quiet-hour" | "gift-after-rain" | "gift-open-door";

export type ArtSet = {
  /** Smallest first. `base` has no extension: `${base}.avif`, `${base}.webp`. */
  files: { width: number; height: number; base: string }[];
  /** The largest export's size (the <img> intrinsic size). */
  width: number;
  height: number;
  map: ArtMap;
  /** The map's t = .5 colour: the designed placeholder until ART_READY. */
  fallback: string;
  /** object-position for the crop. */
  focus: string;
  /** The slot's default `sizes` attribute (§9.5). */
  sizes: string;
};

/** Flat fills at t = .5 of each map (maps.py). */
export const MAP_FALLBACK: Record<ArtMap, string> = {
  pool: "#96aea8",
  sage: "#7f9184",
  clay: "#b06f57",
  light: "#b7c5b9",
  dusk: "#475a50",
};

type Slot = { map: ArtMap; sizes: readonly (readonly [number, number])[]; attr: string; focus?: string };

const RITUAL_SIZES = [[400, 500], [640, 800], [1040, 1300]] as const;
const RITUAL_ATTR = "(min-width:1100px) 38vw, (min-width:760px) 688px, 92vw";
const JOURNEY_SIZES = [[480, 600], [720, 900], [1200, 1500]] as const;
const JOURNEY_ATTR = "(min-width:1100px) 50vw, 100vw";
const PLACE_SIZES = [[360, 480], [600, 800], [900, 1200]] as const;
const PLACE_ATTR = "(min-width:1200px) 23vw, (min-width:760px) 45vw, 82vw";
const FACE_SIZES = [[428, 270], [856, 540]] as const;
const FACE_ATTR = "(min-width:760px) 320px, 90vw";
const SET_SIZES = [[600, 400], [960, 640]] as const;
const SET_ATTR = "(min-width:1100px) 30vw, (min-width:760px) 34vw, 92vw";
const GIFT_ATTR = "(min-width:1100px) 30vw, (min-width:760px) 216px, 82vw";

const SLOTS: Record<ArtKey, Slot> = {
  "ritual-ground": { map: "clay", sizes: RITUAL_SIZES, attr: RITUAL_ATTR },
  "ritual-float": { map: "pool", sizes: RITUAL_SIZES, attr: RITUAL_ATTR },
  "ritual-illuminate": { map: "light", sizes: RITUAL_SIZES, attr: RITUAL_ATTR },
  "ritual-unwind": { map: "dusk", sizes: RITUAL_SIZES, attr: RITUAL_ATTR },
  "journey-ground": { map: "clay", sizes: JOURNEY_SIZES, attr: JOURNEY_ATTR },
  "journey-float": { map: "pool", sizes: JOURNEY_SIZES, attr: JOURNEY_ATTR },
  "journey-illuminate": { map: "light", sizes: JOURNEY_SIZES, attr: JOURNEY_ATTR },
  "journey-unwind": { map: "dusk", sizes: JOURNEY_SIZES, attr: JOURNEY_ATTR },
  "place-serenity-spa-house": { map: "pool", sizes: PLACE_SIZES, attr: PLACE_ATTR },
  "place-the-grooming-room": { map: "sage", sizes: PLACE_SIZES, attr: PLACE_ATTR },
  "place-lumiere-aesthetics": { map: "light", sizes: PLACE_SIZES, attr: PLACE_ATTR },
  "place-bride-groom": { map: "clay", sizes: PLACE_SIZES, attr: PLACE_ATTR },
  "membership-panel": { map: "sage", sizes: [[720, 900], [1200, 1500]], attr: "(min-width:1100px) 42vw, 100vw" },
  "face-house-rhythm": { map: "sage", sizes: FACE_SIZES, attr: FACE_ATTR },
  "face-restored-year": { map: "clay", sizes: FACE_SIZES, attr: FACE_ATTR },
  "face-weekly-quiet": { map: "pool", sizes: FACE_SIZES, attr: FACE_ATTR },
  "set-three-grounds": { map: "clay", sizes: SET_SIZES, attr: SET_ATTR },
  "set-unwind-ritual": { map: "dusk", sizes: SET_SIZES, attr: SET_ATTR },
  "set-water-hours": { map: "pool", sizes: SET_SIZES, attr: SET_ATTR },
  "gift-quiet-hour": { map: "pool", sizes: FACE_SIZES, attr: GIFT_ATTR },
  "gift-after-rain": { map: "light", sizes: FACE_SIZES, attr: GIFT_ATTR },
  "gift-open-door": { map: "clay", sizes: FACE_SIZES, attr: GIFT_ATTR },
};

const SETS = new Map<ArtKey, ArtSet>();

export function artSet(key: ArtKey): ArtSet {
  const cached = SETS.get(key);
  if (cached) return cached;
  const slot = SLOTS[key];
  const files = [...slot.sizes]
    .sort((a, b) => a[0] - b[0])
    .map(([width, height]) => ({ width, height, base: `${ART_DIR}/${key}-${width}x${height}.v1` }));
  const largest = files[files.length - 1];
  const set: ArtSet = {
    files,
    width: largest.width,
    height: largest.height,
    map: slot.map,
    fallback: MAP_FALLBACK[slot.map],
    focus: slot.focus ?? "50% 50%",
    sizes: slot.attr,
  };
  SETS.set(key, set);
  return set;
}

export function srcSet(art: ArtSet, format: "avif" | "webp"): string {
  return art.files.map((file) => `${file.base}.${format} ${file.width}w`).join(", ");
}

/* ---------- Picture credits (the footer renders these) ---------- */

export type ArtCredit = {
  key: string;
  title: string;
  date: string;
  maker: string;
  callNumber: string;
  url: string;
  licence: string;
  treatment: string;
  uses: string;
};

export const CREDITS_LEAD =
  "Skies by John Constable, 1821–c. 1825, Yale Center for British Art, Paul Mellon Collection (public domain, CC0), cropped and recoloured for Serein.";

const MAKER = "John Constable";
const LICENCE = "Public domain (CC0 1.0), Yale Center for British Art, Paul Mellon Collection";
const record = (tms: number) => `https://collections.britishart.yale.edu/catalog/tms:${tms}`;

export const CREDITS: readonly ArtCredit[] = [
  {
    key: "A1",
    title: "Cloud Study",
    date: "1821",
    maker: MAKER,
    callNumber: "B1981.25.156",
    url: record(667),
    licence: LICENCE,
    treatment: "Details, sky only; recoloured (Pool)",
    uses: "Float ritual and journey; The Water Hours",
  },
  {
    key: "A2",
    title: "Cloud Study",
    date: "1821",
    maker: MAKER,
    callNumber: "B1981.25.147",
    url: record(658),
    licence: LICENCE,
    treatment: "Details, sky only; recoloured (Dusk)",
    uses: "Unwind ritual and journey; The Unwind Ritual",
  },
  {
    key: "A3",
    title: "Cloud Study",
    date: "ca. 1821",
    maker: MAKER,
    callNumber: "B1981.25.146",
    url: record(5026),
    licence: LICENCE,
    treatment: "Details, sky only; recoloured (Light)",
    uses: "Illuminate ritual and journey; After Rain gift card",
  },
  {
    key: "A4",
    title: "Study of a Cloudy Sky",
    date: "ca. 1825",
    maker: MAKER,
    callNumber: "B1981.25.124",
    url: record(635),
    licence: LICENCE,
    treatment: "Details, sky only; recoloured (Clay)",
    uses: "Ground ritual and journey; Three Grounds",
  },
  {
    key: "A5",
    title: "Cloud Study",
    date: "1822",
    maker: MAKER,
    callNumber: "B1981.25.116",
    url: record(627),
    licence: LICENCE,
    treatment: "Details, sky only; recoloured (Pool)",
    uses: "Serenity Spa House; A Quiet Hour gift card",
  },
  {
    key: "A6",
    title: "Cloud Study, Early Morning, Looking East from Hampstead",
    date: "1821",
    maker: MAKER,
    callNumber: "B1981.25.117",
    url: record(628),
    licence: LICENCE,
    treatment: "Details, sky only; recoloured (Clay)",
    uses: "Bride & Groom; The Open Door gift card",
  },
  {
    key: "A7",
    title: "A Cloud Study, Sunset",
    date: "ca. 1821",
    maker: MAKER,
    callNumber: "B1981.25.128",
    url: record(639),
    licence: LICENCE,
    treatment: "Detail, sky only; recoloured (Light)",
    uses: "Lumiere Aesthetics",
  },
  {
    key: "A8",
    title: "Cloud Study",
    date: "ca. 1821",
    maker: MAKER,
    callNumber: "B1981.25.148",
    url: record(659),
    licence: LICENCE,
    treatment: "Detail, sky only; recoloured (Sage)",
    uses: "The Grooming Room",
  },
  {
    key: "A9",
    title: "Cloud Study",
    date: "1822",
    maker: MAKER,
    callNumber: "B1981.25.144",
    url: record(655),
    licence: LICENCE,
    treatment: "Details, sky only; recoloured (Sage, Clay, Pool)",
    uses: "Membership; House Rhythm, The Restored Year and Weekly Quiet cards",
  },
];
