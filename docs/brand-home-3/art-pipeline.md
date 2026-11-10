# Serein art pipeline: every still is a sky after rain

The programme: every still image after the film is a sky. The skies are John Constable's open-air cloud studies, painted at Hampstead in 1821–22 and held by the Yale Center for British Art (YCBA), Paul Mellon Collection. Each one is cropped to sky only and recoloured with one of Serein's five gradient maps.

- *Serein* is the fine rain that falls from a clear evening sky, and the intro reads "The quiet that arrives after rain."
- Cropped skies are calm, true abstracts with no objects in them.
- One painter and one institution keep the tone and grain consistent.
- They are unlike T2's katagami stencils and T4's Atkins cyanotypes.

Film stills stay in the film. They are never section imagery or the booking atmosphere.

## Sources and licence evidence

Downloaded on 13 Oct 2026 from the YCBA IIIF image server at `{IIIF base}/full/!3000,3000/0/default.jpg`, with the owner's standing approval for public-domain art.

- The IIIF base is `https://images.collections.yale.edu/iiif/2/{id}`.
- The record page is `https://collections.britishart.yale.edu/catalog/tms:{tms}`.
- The manifest is `https://manifests.collections.yale.edu/ycba/obj/{tms}`.

**Licence evidence.** On 13 Oct 2026, every manifest below returned:
- `rights: "https://creativecommons.org/publicdomain/zero/1.0/"`;
- the metadata field "Copyright Statement" = "Public Domain";
- "Credit Line" = "Yale Center for British Art, Paul Mellon Collection".

The manifests' `requiredStatement` notes that the metadata is CC0, while "copyright or other restrictions may apply" to works generally. For these works the object-level `rights` is CC0 1.0, and Constable died in 1837.

| Key | Title, date | Call number | tms | IIIF id | Medium | Master px | Download px · bytes · SHA-256 (first 16) |
|---|---|---|---|---|---|---|---|
| A1 | Cloud Study, 1821 | B1981.25.156 | 667 | `ycba:0a1d55a5-5120-4aad-af0d-5aedb0b8a8c1` | Oil on paper on board | 4260×3610 | 3000×2542 · 1,602,493 · `07441e4d5915e34d` |
| A2 | Cloud Study, 1821 | B1981.25.147 | 658 | `ycba:3a83aff3-605a-4608-9d8d-43ecf6e38797` | Oil on paper laid on panel | 4176×3544 | 3000×2546 · 1,379,697 · `f719c244b0968f3d` |
| A3 | Cloud Study, ca. 1821 | B1981.25.146 | 5026 | `ycba:d52b2eed-f1fd-46d9-b274-5331c0f0fdb2` | Oil on paper laid on card | 4140×3508 | 3000×2542 · 1,625,468 · `93af0c7382687823` |
| A4 | Study of a Cloudy Sky, ca. 1825 | B1981.25.124 | 635 | `ycba:2d85dfd3-ad24-4762-b795-7bd4b0a108ff` | Oil on paper on millboard | 4218×3496 | 3000×2486 · 1,645,113 · `6f9b75656c32ce28` |
| A5 | Cloud Study, 1822 | B1981.25.116 | 627 | `ycba:a1a011a9-da67-4438-97e4-afe1151cd62b` | Oil on paper laid on panel | 3660×2167 | 3000×1776 · 639,941 · `a0e61e8b233d50b6` |
| A6 | Cloud Study, Early Morning, Looking East from Hampstead, 1821 | B1981.25.117 | 628 | `ycba:cf622dc4-3b02-4be8-90d3-0a4c64b5373a` | Oil on paper on board | 7158×3160 | 3000×1324 · 601,202 · `e88240a8e3d5a739` |
| A7 | A Cloud Study, Sunset, ca. 1821 | B1981.25.128 | 639 | `ycba:89904500-2fb5-438d-9e54-dd82d104b63e` | Oil on paper on millboard | 4098×2752 | 3000×2015 · 1,203,692 · `a950cd0c43d519b7` |
| A8 | Cloud Study, ca. 1821 | B1981.25.148 | 659 | `ycba:de757799-ce5a-4cfd-9e76-ee23b50e62db` | Oil on paper laid on card | 4656×3368 | 3000×2170 · 922,227 · `5f816e45175f092c` |
| A9 | Cloud Study, 1822 | B1981.25.144 | 655 | `ycba:b4156409-8156-47c9-b7f0-c90e323ea9be` | Oil on paper laid on canvas | 7020×4180 | 3000×1786 · 726,264 · `a6b1f5fbd8b5e38c` |

Alternates were not needed; no crop read as a landscape once the boxes below were chosen. These were cleared in the spec and are still available:
- Constable, Cloud Study, 1821 (B1981.25.155, tms 666);
- Lionel Constable, Sky Study, ca. 1850 (B1981.25.139, tms 650);
- Monet, *Branch of the Seine near Giverny (Mist)*, AIC 1933.1156 (Pool only);
- Cleveland Museum of Art 1980.108–.115.

## Handling

- The downloads live in a new, empty scratch folder (`scratchpad/t3/art-src/`), never in the repo. They are read as image data only.
- The scripts live in a separate folder (`scratchpad/t3/art-tools/`). Python runs with `-I`.
- Never commit the masters. The repo holds only:
  - the 112 exports in `public/brand-home-3/art/` (56 rungs, each as AVIF and WebP);
  - this file;
  - the credits in `app/brand-home-3/data/art.ts` (`CREDITS`).

## Recipe

The toolchain is PIL, numpy, scipy and scikit-image (QA only), then sharp from the repo's `node_modules/sharp` for the export.

### 1. Crop inside the paint

- Every box sits inside a 3% inset from the board edge. This removes the bare board strip at the top of A3, the red board edge along the top of A6 and the ragged top edge of A9.
- Boxes also avoid each source's no-go zones:

  | Source | No-go zone (fractions of the board) | Why |
  |---|---|---|
  | A4 | x < .40 and y > .68; all of y > .80 | Trees, then the land strip |
  | A6 | y > .66 | Horizon, distant sea and heath |
  | A7 | y > .50 | Below .50, the dark cloud bank over pale ground reads as a horizon (tested and rejected). Hills start at y .94. |
  | A8 | x .10–.50 and y > .44; x .45–.65 and y > .75; all of y > .85 | The elms, the small tree and the tree line |

- Sky only: no horizon, tree, roof, bird, inscription, stamp or board edge survives.
- Crops of one painting never overlap. The tool fails the build if two boxes from one source intersect.
- **Retouch, A6 only.** Two raised paint-lump rings sat inside the Bride & Groom crop. They are at (1648, 755, r 11) and (2135, 657, r 9) in download px. Their luminance is inpainted (biharmonic) before the tone statistics are taken. Constable's scratched hatching next to the first ring is paint, so it stays.

### 2. Compose for the slot

- Cloud masses run on a diagonal where the painting allows. The A6 and A7 skies are horizontal by nature and stay that way: there are no free rotations.
- The bottom-left 35% stays calm wherever a chip, badge, card label block or the journey word sits.
- No crop centres a single cloud.
- The 4:5 ritual crops are denser at the top and clear lower down.
- The journey crops are detail crops from the same painting as the ritual crop: 38–53% of its area, so 1.4–1.6× closer. They never overlap it. The spec asked for about 3× deeper. At 3× linear, a 3,000-px download would have to be upsampled about 3× for the 1200×1500 rung, so the detail stops where the brushwork still holds.
- The membership panel and the three membership faces come from one painting (A9). The panel is the right-hand cloud tower; the three faces form one vertical strip of the left half, recoloured Sage, Clay and Pool: "one sky at three times of day".
- No 90° rotations were needed. They are allowed only for the 3:2 package bands.
- Resolution: the downloads are 3,000 px on the long side, as approved. Three kinds of crop are smaller than their largest rung, so that rung is upsampled (Lanczos, on the tone layer before the map):
  - the journeys, about 1.3×;
  - Lumiere (A7), 1.27×;
  - Bride & Groom (A6), 1.5×, because the sky band above A6's horizon is only about 800 px tall.

  Every other slot is downsampled.

  Brushwork survives this at 2×. A sharper top rung would need a larger IIIF region request for A6 and A7, which would be a new download.

### 3. Tone

1. L = Rec.709 luminance from linear RGB, then back to perceptual (L^(1/2.2)).
2. Black point at the 2nd percentile, white at the 99.5th (of the crop), gamma .95.
3. Texture, at the crop's source resolution:
   - **The spec level is a 3×3 median, blended 70/30 with the original.**
   - **Budget ladder (a deviation, see below):** when the largest AVIF cannot meet its budget at q50 or q44, the slot steps up to a full k×k median. The ladder is k = 5, 7, 8, 9, 10, 11, 13, 15, and the first (k, quality) that fits wins. The per-slot k is listed in the crop table.
4. Resize t to each rung (Lanczos on float data), then unsharp mask: radius (σ) 1.0, amount .3.

**Why the ladder.** The spec texture keeps every pigment speck and paper fleck. At the spec's sizes this measured 2–3× over budget even at q44: for example, `ritual-float` 1040×1300 came out at 180 KB at q50 and 130 KB at q44, against a 45 KB budget. The spec's next step would be to reduce pixels, which would break the export ladder that `data/art.ts` encodes. A k×k median at source resolution removes the specks but keeps the brushwork, and at the shown size it is hard to tell apart from the spec texture (proofed on the contact sheets). Every slot uses the lowest level that fits.

### 4. Gradient maps

A 256-step LUT, interpolated in sRGB. The stops are the only colours in the output. Every stop is a token or a documented token mix.

| Map | Stops | Fallback fill (t = .5) |
|---|---|---|
| Pool | 0 `#3e5148` · .30 `#5d7165` · .62 `#b9d3d1` · .88 `#dce5df` · 1 `#f7f4ec` | `#96aea8` |
| Sage | 0 `#3e5148` · .35 `#5d7165` · .68 `#a8b8aa` · .90 `#dce5df` · 1 `#f1eee5` | `#7f9184` |
| Clay | 0 `#604436` · .32 `#8b513c` · .62 `#c98369` · .86 `#e9dacf` · 1 `#f7f4ec` | `#b06f57` |
| Light | 0 `#5d7165` · .40 `#a8b8aa` · .75 `#dce5df` · 1 `#f7f4ec` | `#b7c5b9` |
| Dusk | 0 `#20312c` · .40 `#3e5148` · .75 `#5d7165` · 1 `#b9d3d1` | `#475a50` |

`#3e5148` is sage-deep 50% + ink 50%. `#604436` is clay-deep 60% + ink 40%.

### 5. Anti-banding

Add luminance noise N(0, 1/255) on flat areas only, where the local standard deviation of t over 7×7 px is under .018, with a soft ramp. The noise is seeded per rung, so a re-run is byte-identical before encoding.

### 6. Export with sharp

- AVIF: quality 50, effort 7, `chromaSubsampling: "4:4:4"`, 8-bit. If the largest AVIF is over budget, it is re-encoded at q44. Smaller rungs stay at q50.
- WebP: quality 72, effort 6.
- Names: `public/brand-home-3/art/{key}-{w}x{h}.v1.{avif,webp}`. Bump the version to replace a file, because `/brand-home-3/art/:file*` is served `immutable` for a year.
- Each rung is rendered from the float t at its own size, then encoded. sharp never resizes, so every pixel is still a map colour before encoding.

### 7. QA

- Contact sheets at 1× (the 1440 layout size), on paper `#f1eee5` and on ink `#20312c`, made from the decoded AVIFs.
- A mock sheet with the chips, badges, card label blocks and rings, and the journey veil and word drawn on, to check the calm areas.
- A responsive sheet of the 4:5 pieces at their 3:2 and phone crops.
- Map fidelity: before noise, every pixel is a LUT colour. Its ΔE00 to the path is ≤ .59, which is 8-bit rounding, well inside the spec's 6.
- The decoded AVIFs are measured too (table below). The mean is ≤ .95 and the 99.9th percentile is ≤ 5.4. The few pixels above 6 are encoder ringing on single pigment flecks, and none is visible at 1× or 2×.
- No recognisable object survives. The rejected candidates were:
  - A7 below its cloud bank (it read as a horizon);
  - A5's right edge (its dark cloud read as a bush on a skyline);
  - A6's lower right (its dark streak read as land).

## Slots, boxes and texture

| Slot | Source · crop | Map | Box in the 3000-px download (x0, y0, x1, y1) | Box as fractions of the board | Box in master px | Texture | Largest AVIF |
|---|---|---|---|---|---|---|---|
| `ritual-ground` | A4 A | Clay | 90, 75, 1338, 1635 (1248×1560) | 0.030, 0.030, 0.446, 0.658 | 127, 105, 1881, 2299 | 7×7 median, AVIF q50 | 44.4 KB / 45 KB |
| `ritual-float` | A1 A | Pool | 90, 77, 1530, 1877 (1440×1800) | 0.030, 0.030, 0.510, 0.738 | 128, 109, 2173, 2665 | 8×8 median, AVIF q44 | 39.3 KB / 45 KB |
| `ritual-illuminate` | A3 A | Light | 1490, 77, 2910, 1852 (1420×1775) | 0.497, 0.030, 0.970, 0.729 | 2056, 106, 4016, 2556 | 7×7 median, AVIF q50 | 44.1 KB / 45 KB |
| `ritual-unwind` | A2 A | Dusk | 1490, 77, 2910, 1852 (1420×1775) | 0.497, 0.030, 0.970, 0.727 | 2074, 107, 4051, 2578 | 5×5 median, AVIF q44 | 35.2 KB / 45 KB |
| `journey-ground` | A4 B | Clay | 1996, 75, 2908, 1215 (912×1140) | 0.665, 0.030, 0.969, 0.489 | 2806, 105, 4089, 1708 | 7×7 median, AVIF q44 | 49.2 KB / 50 KB |
| `journey-float` | A1 B | Pool | 1980, 77, 2908, 1237 (928×1160) | 0.660, 0.030, 0.969, 0.487 | 2812, 109, 4129, 1757 | 7×7 median, AVIF q44 | 43.0 KB / 50 KB |
| `journey-illuminate` | A3 B | Light | 90, 120, 970, 1220 (880×1100) | 0.030, 0.047, 0.323, 0.480 | 124, 166, 1339, 1684 | 5×5 median, AVIF q44 | 37.2 KB / 50 KB |
| `journey-unwind` | A2 B | Dusk | 520, 120, 1400, 1220 (880×1100) | 0.173, 0.047, 0.467, 0.479 | 724, 167, 1949, 1698 | 3×3 median, 70/30 (spec), AVIF q44 | 38.9 KB / 50 KB |
| `place-serenity-spa-house` | A5 A | Pool | 1000, 54, 1960, 1334 (960×1280) | 0.333, 0.030, 0.653, 0.751 | 1220, 66, 2391, 1627 | 7×7 median, AVIF q44 | 31.8 KB / 35 KB |
| `place-the-grooming-room` | A8 A | Sage | 1830, 66, 2910, 1506 (1080×1440) | 0.610, 0.030, 0.970, 0.694 | 2840, 102, 4516, 2337 | 5×5 median, AVIF q44 | 29.8 KB / 35 KB |
| `place-lumiere-aesthetics` | A7 A | Light | 1500, 61, 2209, 1006 (709×945) | 0.500, 0.030, 0.736, 0.499 | 2049, 83, 3017, 1374 | 5×5 median, AVIF q44 | 34.6 KB / 35 KB |
| `place-bride-groom` | A6 A | Clay | 1560, 40, 2160, 840 (600×800) | 0.520, 0.030, 0.720, 0.634 | 3722, 95, 5154, 2004 | 5×5 median, AVIF q44 | 29.0 KB / 35 KB |
| `membership-panel` | A9 A | Sage | 1570, 54, 2910, 1729 (1340×1675) | 0.523, 0.030, 0.970, 0.968 | 3674, 126, 6809, 4046 | 5×5 median, AVIF q44 | 46.3 KB / 50 KB |
| `face-house-rhythm` | A9 B | Sage | 520, 54, 1390, 603 (870×549) | 0.173, 0.030, 0.463, 0.338 | 1217, 126, 3253, 1411 | 3×3 median, 70/30 (spec), AVIF q44 | 22.8 KB / 28 KB |
| `face-restored-year` | A9 C | Clay | 520, 610, 1390, 1159 (870×549) | 0.173, 0.342, 0.463, 0.649 | 1217, 1427, 3253, 2712 | 3×3 median, 70/30 (spec), AVIF q44 | 27.7 KB / 28 KB |
| `face-weekly-quiet` | A9 D | Pool | 520, 1166, 1390, 1715 (870×549) | 0.173, 0.653, 0.463, 0.960 | 1217, 2728, 3253, 4013 | 5×5 median, AVIF q50 | 23.3 KB / 28 KB |
| `set-three-grounds` | A4 C | Clay | 1400, 1270, 2405, 1940 (1005×670) | 0.467, 0.511, 0.802, 0.780 | 1968, 1786, 3381, 2728 | 5×5 median, AVIF q44 | 22.7 KB / 30 KB |
| `set-unwind-ritual` | A2 C | Dusk | 90, 1600, 1390, 2467 (1300×867) | 0.030, 0.628, 0.463, 0.969 | 125, 2227, 1935, 3434 | 3×3 median, 70/30 (spec), AVIF q44 | 29.2 KB / 30 KB |
| `set-water-hours` | A1 C | Pool | 1600, 1590, 2905, 2460 (1305×870) | 0.533, 0.625, 0.968, 0.968 | 2272, 2258, 4125, 3493 | 8×8 median, AVIF q44 | 28.2 KB / 30 KB |
| `gift-quiet-hour` | A5 B | Pool | 90, 54, 990, 622 (900×568) | 0.030, 0.030, 0.330, 0.350 | 110, 66, 1208, 759 | 5×5 median, AVIF q44 | 27.7 KB / 28 KB |
| `gift-after-rain` | A3 C | Light | 90, 1630, 1410, 2463 (1320×833) | 0.030, 0.641, 0.470, 0.969 | 124, 2249, 1946, 3399 | 5×5 median, AVIF q44 | 24.4 KB / 28 KB |
| `gift-open-door` | A6 B | Clay | 90, 40, 1360, 841 (1270×801) | 0.030, 0.030, 0.453, 0.635 | 215, 95, 3245, 2007 | 5×5 median, AVIF q44 | 22.3 KB / 28 KB |

`focus` (object-position) suggestions for `data/art.ts` are given where the layout crops a 4:5 piece to 3:2, 4:3 or 1:1. Everything else is shown uncropped at its own ratio, so the default `50% 50%` applies.

| Slot | Where the layout crops it | Suggested `focus` |
|---|---|---|
| `ritual-*` | 3:2 at 760–1099, 4:3 below 760 | `50% 50%` (the default; the centred crops keep the dense top and the calm lower left) |
| `journey-*` | 3:2 at 760–1099, 1:1 below 760 | `50% 50%` |
| `membership-panel` | 3:2 at 760–1099, 4:3 below 760 | `50% 50%` |

## Export ladder and bytes

| Slot family | Ratio | Rungs (w×h) | Largest AVIF budget |
|---|---|---|---|
| `ritual-*` | 4:5 | 400×500, 640×800, 1040×1300 | 45 KB |
| `journey-*` | 4:5 | 480×600, 720×900, 1200×1500 | 50 KB |
| `place-*` | 3:4 | 360×480, 600×800, 900×1200 | 35 KB |
| `membership-panel` | 4:5 | 720×900, 1200×1500 | 50 KB |
| `face-*` | 1.586:1 | 428×270, 856×540 | 28 KB |
| `set-*` | 3:2 | 600×400, 960×640 | 30 KB |
| `gift-*` | 1.586:1 | 428×270, 856×540 | 28 KB |

KB = 1,000 bytes.

Totals, measured:
- All 112 files: 1,396,375 bytes of AVIF and 2,069,148 of WebP.
- The 22 largest AVIFs: 731,038 bytes.
- A desktop full scroll at 1440 and 1× (the rungs the `sizes` attributes pick, with all four stacked ritual and journey images loaded): about 438 KB. The spec estimated about 420 KB.
- On 2× and 3× screens, including phones, the same layout picks the largest rungs, about 657 KB. Most of that is the stacked ritual and journey images: each set is about 160–180 KB. The spec's phone estimate of about 210 KB holds only if the inactive stacked images are not fetched until they are chosen.

| File (`public/brand-home-3/art/`) | AVIF bytes | WebP bytes |
|---|---|---|
| `ritual-ground-400x500.v1` | 12,713 | 14,074 |
| `ritual-ground-640x800.v1` | 23,064 | 25,814 |
| `ritual-ground-1040x1300.v1` | 44,422 | 50,458 |
| `ritual-float-400x500.v1` | 16,216 | 20,284 |
| `ritual-float-640x800.v1` | 28,882 | 35,758 |
| `ritual-float-1040x1300.v1` | 39,256 | 67,568 |
| `ritual-illuminate-400x500.v1` | 14,478 | 17,076 |
| `ritual-illuminate-640x800.v1` | 26,922 | 31,282 |
| `ritual-illuminate-1040x1300.v1` | 44,076 | 59,332 |
| `ritual-unwind-400x500.v1` | 12,031 | 13,180 |
| `ritual-unwind-640x800.v1` | 25,786 | 26,564 |
| `ritual-unwind-1040x1300.v1` | 35,206 | 52,996 |
| `journey-ground-480x600.v1` | 19,313 | 26,282 |
| `journey-ground-720x900.v1` | 34,098 | 44,726 |
| `journey-ground-1200x1500.v1` | 49,249 | 86,198 |
| `journey-float-480x600.v1` | 17,645 | 23,016 |
| `journey-float-720x900.v1` | 31,178 | 39,286 |
| `journey-float-1200x1500.v1` | 43,028 | 74,794 |
| `journey-illuminate-480x600.v1` | 18,724 | 21,678 |
| `journey-illuminate-720x900.v1` | 27,468 | 36,348 |
| `journey-illuminate-1200x1500.v1` | 37,196 | 69,840 |
| `journey-unwind-480x600.v1` | 10,745 | 10,814 |
| `journey-unwind-720x900.v1` | 24,442 | 23,874 |
| `journey-unwind-1200x1500.v1` | 38,918 | 52,710 |
| `place-serenity-spa-house-360x480.v1` | 14,785 | 19,954 |
| `place-serenity-spa-house-600x800.v1` | 27,390 | 36,596 |
| `place-serenity-spa-house-900x1200.v1` | 31,768 | 61,656 |
| `place-the-grooming-room-360x480.v1` | 12,307 | 13,514 |
| `place-the-grooming-room-600x800.v1` | 25,721 | 27,954 |
| `place-the-grooming-room-900x1200.v1` | 29,836 | 46,750 |
| `place-lumiere-aesthetics-360x480.v1` | 14,905 | 20,172 |
| `place-lumiere-aesthetics-600x800.v1` | 29,436 | 39,030 |
| `place-lumiere-aesthetics-900x1200.v1` | 34,551 | 64,202 |
| `place-bride-groom-360x480.v1` | 12,253 | 16,578 |
| `place-bride-groom-600x800.v1` | 23,400 | 31,806 |
| `place-bride-groom-900x1200.v1` | 28,988 | 52,714 |
| `membership-panel-720x900.v1` | 35,129 | 39,710 |
| `membership-panel-1200x1500.v1` | 46,262 | 74,828 |
| `face-house-rhythm-428x270.v1` | 10,623 | 14,634 |
| `face-house-rhythm-856x540.v1` | 22,834 | 40,388 |
| `face-restored-year-428x270.v1` | 13,505 | 19,418 |
| `face-restored-year-856x540.v1` | 27,719 | 51,600 |
| `face-weekly-quiet-428x270.v1` | 10,315 | 13,796 |
| `face-weekly-quiet-856x540.v1` | 23,346 | 31,344 |
| `set-three-grounds-600x400.v1` | 15,874 | 19,104 |
| `set-three-grounds-960x640.v1` | 22,654 | 37,066 |
| `set-unwind-ritual-600x400.v1` | 17,866 | 22,960 |
| `set-unwind-ritual-960x640.v1` | 29,246 | 55,868 |
| `set-water-hours-600x400.v1` | 19,158 | 28,986 |
| `set-water-hours-960x640.v1` | 28,174 | 53,788 |
| `gift-quiet-hour-428x270.v1` | 14,583 | 26,468 |
| `gift-quiet-hour-856x540.v1` | 27,695 | 62,568 |
| `gift-after-rain-428x270.v1` | 12,211 | 17,610 |
| `gift-after-rain-856x540.v1` | 24,357 | 45,038 |
| `gift-open-door-428x270.v1` | 12,171 | 17,268 |
| `gift-open-door-856x540.v1` | 22,257 | 41,828 |
| **Total (112 files)** | **1,396,375** | **2,069,148** |

## Map fidelity of what ships

| Slot | ΔE00 to the map path, decoded largest AVIF: mean · 99.9th pct · max |
|---|---|
| `ritual-ground` | 0.52 · 2.99 · 9.92 |
| `ritual-float` | 0.55 · 2.74 · 4.24 |
| `ritual-illuminate` | 0.58 · 2.47 · 4.80 |
| `ritual-unwind` | 0.48 · 2.54 · 5.56 |
| `journey-ground` | 0.59 · 3.16 · 10.58 |
| `journey-float` | 0.48 · 2.51 · 6.89 |
| `journey-illuminate` | 0.50 · 2.15 · 3.92 |
| `journey-unwind` | 0.51 · 2.85 · 6.26 |
| `place-serenity-spa-house` | 0.60 · 2.73 · 5.95 |
| `place-the-grooming-room` | 0.41 · 2.81 · 7.25 |
| `place-lumiere-aesthetics` | 0.64 · 3.02 · 7.85 |
| `place-bride-groom` | 0.61 · 3.17 · 8.21 |
| `membership-panel` | 0.42 · 3.06 · 7.66 |
| `face-house-rhythm` | 0.62 · 4.41 · 8.26 |
| `face-restored-year` | 0.80 · 5.42 · 11.75 |
| `face-weekly-quiet` | 0.57 · 2.90 · 5.95 |
| `set-three-grounds` | 0.66 · 4.59 · 10.49 |
| `set-unwind-ritual` | 0.65 · 3.30 · 8.51 |
| `set-water-hours` | 0.79 · 3.64 · 4.96 |
| `gift-quiet-hour` | 0.95 · 4.52 · 9.34 |
| `gift-after-rain` | 0.66 · 3.07 · 6.17 |
| `gift-open-door` | 0.75 · 5.02 · 10.83 |

## How to re-run

The masters are not in the repo. Re-download them with the URLs above, check the manifests' `rights` again, then run the scratch tools:

```sh
T=scratchpad/t3                     # session scratch; the tools sit outside art-src
mkdir $T/art-src && cd $T/art-src   # new, empty folder for the downloads
curl -fO "https://images.collections.yale.edu/iiif/2/ycba:{id}/full/!3000,3000/0/default.jpg"   # per source, saved as A1.jpg … A9.jpg
cd ../art-tools
python3 -I rights.py ../art-src/manifests/*.json   # licence evidence from the saved manifests
python3 -I overlay.py         # boxes: 3% inset, no-go zones, no overlaps; draws art-qa/boxes/*
python3 -I ladder.py          # picks each slot's texture level (writes texture.json); slow, encodes AVIFs
python3 -I build.py           # renders every rung to art-build/*.png
node export.mjs               # sharp: AVIF q50 (q44 if the largest is over budget) + WebP q72
python3 -I qa.py              # exact sizes, budgets, decoded ΔE00 to the map path
python3 -I sheets.py --from export          # 1× contact sheets on paper and ink + responsive sheet
python3 -I sheets.py --from export --mock   # chips, badges, label blocks, veil + word
```

- `slots.json` holds every box as `[x0, y0, w]` in download px. The height comes from the slot ratio, so every crop is exact.
- `texture.json` holds each slot's chosen median size and AVIF quality. To reproduce these exports without re-running the ladder, keep both files as they are. The crop and texture tables above hold the same data.
