import type { ArtKey } from "./offers";

/*
 * Every still on Paloma is printed as a cyanotype: Anna Atkins's algae plates
 * (The Met, Open Access, CC0), cropped and recoloured into the palette, and the
 * object study regraded the same way. Files are pre-sized AVIF + WebP served
 * through <picture>, never re-encoded at runtime.
 */

const ART = "/brand-home-4/art";

export type ArtSet = {
  files: ReadonlyArray<{ width: number; height: number; base: string }>;
  width: number;
  height: number;
};

function set(files: ReadonlyArray<[number, number, string]>): ArtSet {
  const sorted = [...files].sort((a, b) => a[0] - b[0]);
  const largest = sorted[sorted.length - 1];
  return {
    files: sorted.map(([width, height, base]) => ({ width, height, base: `${ART}/${base}` })),
    width: largest[0],
    height: largest[1],
  };
}

export function srcSet(art: ArtSet, format: "avif" | "webp") {
  return art.files.map((file) => `${file.base}.${format} ${file.width}w`).join(", ");
}

const PIECES: Record<ArtKey, ArtSet> = {
  "ledger-paloma-circle": set([[720, 240, "ledger-paloma-circle-720x240.v1"], [1080, 360, "ledger-paloma-circle-1080x360.v1"]]),
  "ledger-studio-card": set([[720, 240, "ledger-studio-card-720x240.v1"], [1080, 360, "ledger-studio-card-1080x360.v1"]]),
  "ledger-front-row": set([[720, 240, "ledger-front-row-720x240.v1"], [1080, 360, "ledger-front-row-1080x360.v1"]]),
  "set-wedding-week": set([[720, 360, "set-wedding-week-720x360.v1"], [1224, 612, "set-wedding-week-1224x612.v1"]]),
  "gift-open-edition": set([[428, 270, "gift-open-edition-428x270.v1"], [856, 540, "gift-open-edition-856x540.v1"]]),
  "gift-first-proof": set([[428, 270, "gift-first-proof-428x270.v1"], [856, 540, "gift-first-proof-856x540.v1"]]),
  "gift-late-edition": set([[428, 270, "gift-late-edition-428x270.v1"], [856, 540, "gift-late-edition-856x540.v1"]]),
};

export function artFor(key: ArtKey): ArtSet {
  return PIECES[key];
}

/** The Wedding Week's 3:1 band for phones. */
export const WEDDING_BAND: ArtSet = set([[720, 240, "set-wedding-week-band-720x240.v1"]]);

/** 192×121 swatches for the gift design rows (shown at 96×61). */
export function giftThumb(key: ArtKey): ArtSet {
  const name = key.replace(/^gift-/, "");
  return set([[192, 121, `gift-${name}-192x121.v1`]]);
}

/** The method photograph, regraded into the cyanotype programme. */
export const OBJECT_STUDY: ArtSet = set([
  [800, 533, "object-study-800x533.v2"],
  [1200, 800, "object-study-1200x800.v2"],
  [1536, 1024, "object-study-1536x1024.v2"],
]);

export type ArtCredit = {
  id: string;
  use: string;
  title: string;
  objectID: string;
  accession: string;
  date: string;
  objectURL: string;
  licence: string;
  treatment: string;
};

export const CREDITS_LEAD =
  "Cyanotypes: Anna Atkins, Photographs of British Algae: Cyanotype Impressions, c. 1853. The Metropolitan Museum of Art, Open Access (CC0). Cropped and recoloured for Paloma.";

export const CREDITS: readonly ArtCredit[] = [
  {
    id: "P1",
    use: "Paloma Circle ledger",
    title: "Himanthalia lorea",
    objectID: "291507",
    accession: "2005.100.557 (10)",
    date: "ca. 1853",
    objectURL: "https://www.metmuseum.org/art/collection/search/291507",
    licence: "CC0 — The Met Open Access",
    treatment: "Detail of the upper strap strands, not rotated; recoloured Ledger",
  },
  {
    id: "P2",
    use: "Studio Card ledger",
    title: "Chorda filum",
    objectID: "291518",
    accession: "2005.100.557 (21)",
    date: "ca. 1853",
    objectURL: "https://www.metmuseum.org/art/collection/search/291518",
    licence: "CC0 — The Met Open Access",
    treatment: "Detail of the lower sweep of cords, not rotated; recoloured Ledger",
  },
  {
    id: "P3",
    use: "Front Row ledger",
    title: "Ptilota plumosa",
    objectID: "291528",
    accession: "2005.100.557 (31)",
    date: "ca. 1853",
    objectURL: "https://www.metmuseum.org/art/collection/search/291528",
    licence: "CC0 — The Met Open Access",
    treatment: "Detail of hanging feathered fronds, rotated 90°; recoloured Ledger",
  },
  {
    id: "P4",
    use: "The Wedding Week set",
    title: "Desmarestia aculeata",
    objectID: "291514",
    accession: "2005.100.557 (17)",
    date: "ca. 1853",
    objectURL: "https://www.metmuseum.org/art/collection/search/291514",
    licence: "CC0 — The Met Open Access",
    treatment: "Detail of cascading branches, rotated 90°; recoloured Ink",
  },
  {
    id: "P5",
    use: "Open Edition gift card",
    title: "Polysiphonia elongata",
    objectID: "291548",
    accession: "2005.100.557 (51)",
    date: "ca. 1853",
    objectURL: "https://www.metmuseum.org/art/collection/search/291548",
    licence: "CC0 — The Met Open Access",
    treatment: "Detail, rotated 180°; recoloured Open Edition",
  },
  {
    id: "P6",
    use: "First Proof gift card",
    title: "Dictyota dichotoma",
    objectID: "291515",
    accession: "2005.100.557 (18)",
    date: "ca. 1853",
    objectURL: "https://www.metmuseum.org/art/collection/search/291515",
    licence: "CC0 — The Met Open Access",
    treatment: "Detail, rotated 180°; recoloured First Proof",
  },
  {
    id: "P7",
    use: "Late Edition gift card",
    title: "Laminaria saccharina",
    objectID: "291508",
    accession: "2005.100.557 (11)",
    date: "ca. 1853",
    objectURL: "https://www.metmuseum.org/art/collection/search/291508",
    licence: "CC0 — The Met Open Access",
    treatment: "Detail, rotated 180°; recoloured Late Edition",
  },
];
