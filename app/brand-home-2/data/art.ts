/*
 * Pre-sized art in public/brand-home-2/art: the cover photograph in its crops.
 * Files are served as-is through <picture>, never re-encoded by the optimiser.
 */

const ART = "/brand-home-2/art";

export type ArtFormat = "avif" | "webp";

export type ArtSet = {
  /** Width descriptors per format, widest last. */
  files: ReadonlyArray<{ width: number; height: number; base: string }>;
  /** Intrinsic ratio for the <img> box. */
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

export function srcSet(art: ArtSet, format: ArtFormat) {
  return art.files.map((file) => `${file.base}.${format} ${file.width}w`).join(", ");
}

/** Cover photograph: 16:9 for desktop and landscape, 2:3 for the stacked phone cover. */
export const COVER_ART = {
  wide: set([
    [1200, 675, "cover-1200x675.v1"],
    [1600, 900, "cover-1600x900.v1"],
  ]),
  tall: set([[620, 930, "cover-620x930.v1"]]),
} as const;
