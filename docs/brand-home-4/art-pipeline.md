# Paloma art pipeline: every still is a cyanotype

The programme: every still image on Paloma is printed as a cyanotype. A cyanotype is Prussian blue on white, which is Paloma's cobalt on porcelain.

## Source

- The plates are Anna Atkins, *Photographs of British Algae: Cyanotype Impressions* (c. 1853), The Metropolitan Museum of Art, Gilman Collection, accession 2005.100.557.
- Long fronds read as falling hair, which echoes the cover film.
- Using one institution's scans keeps tone and grain consistent.
- Rights: on 13 Oct 2026 the Met collection API returned `isPublicDomain = true` for every plate below, which puts them under the Met's Open Access CC0 terms.
  - Re-check each object page at download time.
  - Record the check in `app/brand-home-4/data/art.ts` (`CREDITS`).
- Downloading the originals is a file download, so it needs the owner's explicit go-ahead.
- Until the art ships, commerce objects render their typographic fallback: the same layout, with a flat ground-colour band in place of the art.

Use is limited to two things:
- the commerce objects;
- the regraded object study.

Studio identity stays typographic, and the booking atmosphere uses the film poster, not art.

## Plates

Each original file is at `https://images.metmuseum.org/CRDImages/ph/original/{file}`. Each object page is at `https://www.metmuseum.org/art/collection/search/{objectID}`.

| Plate | Species | objectID | Accession | File | Use |
|---|---|---|---|---|---|
| P1 | *Himanthalia lorea* | 291507 | 2005.100.557 (10) | DP-17302-013.jpg | Paloma Circle ledger band |
| P2 | *Chorda filum* | 291518 | 2005.100.557 (21) | DP-17302-024.jpg | Studio Card ledger band |
| P3 | *Ptilota plumosa* | 291528 | 2005.100.557 (31) | DP-17302-034.jpg | Front Row ledger band |
| P4 | *Desmarestia aculeata* | 291514 | 2005.100.557 (17) | DP-17302-020.jpg | The Wedding Week (wide middle set card) |
| P5 | *Polysiphonia elongata* | 291548 | 2005.100.557 (51) | DP-17302-054.jpg | Open Edition gift face |
| P6 | *Dictyota dichotoma* | 291515 | 2005.100.557 (18) | DP-17302-021.jpg | First Proof gift face |
| P7 | *Laminaria saccharina* | 291508 | 2005.100.557 (11) | DP-17302-014.jpg | Late Edition gift face |

The alternates are also verified public domain:
- *Polysiphonia byssoides*: 291549 · (52) · DP-17302-055.jpg
- *Schizonema helminthosum*: 291560 · (63) · DP-17302-066.jpg

## Handling

- Save downloads into a new, empty folder in the scratchpad, never in the repo.
- Keep the scripts in a different folder, and run Python with `-I`.
- Don't commit the masters. Commit the exports in `public/brand-home-4/art/` and the credits in `data/art.ts`.

## Recipe

The toolchain is PIL, numpy and scipy for steps 1–5, then sharp for the export.

### 1. Contact sheet and crop

Crop inside the plate:
1. Find the Prussian-blue ground (B − R > 40).
2. Take its bounding box.
3. Inset 2%.

This removes the album margin, the plate border and Atkins's pencilled specimen label. The label must never appear.

### 2. Compose for the container

- Strands enter from the top edge and leave at the bottom or a side, on a diagonal of 30–60°, like falling hair.
- Never centre a frond like a specimen.
- Rotation in 90° steps is allowed.
- Keep calm the area a solid band will cover: the bottom 34% on gift faces, or the text side.

### 3. Tone

1. L = Rec.709 luminance, from linear RGB.
2. Black point at the 3rd percentile, white point at the 99.5th, gamma 0.92.
3. Apply a 3px median filter to the ground only (mask L < 0.35), blended 80/20 with the original so the paper grain survives.
4. Unsharp mask: radius 1.2, amount 0.4.

### 4. Gradient maps

Use a 256-step LUT with sRGB interpolation. These stops are the only colours in the output.

| Map | Used for | Stops |
|---|---|---|
| Open (cobalt ground, light fronds) | Open Edition | 0 `#214a87` · .30 `#2459a6` · .72 `#c7d3e6` · 1 `#f5f4ef` |
| Ink (ink ground, wash fronds) | Late Edition, The Wedding Week, object study | 0 `#15171a` · .38 `#1a2b44` · .62 `#2459a6` · .85 `#c7d3e6` · 1 `#f5f4ef` |
| Proof (porcelain ground, cobalt fronds), t = 1 − L | First Proof | 0 `#f5f4ef` · .22 `#dee4ea` · .45 `#c7d3e6` · .80 `#2459a6` · 1 `#214a87` |
| Ledger (a paler Proof, so the ledger reads), t = 1 − L | Ledger bands | 0 `#f5f4ef` · .35 `#dee4ea` · .75 `#c7d3e6` · 1 `#2459a6` |

### 5. Anti-banding

Add luminance noise N(0, 1.2/255) on flat ground areas only.

### 6. Treatment in CSS, not pixels

- A 1px inner rule: ink on light tones, porcelain at 24% on ink.
- Square edges.
- No gradients, vignettes, glows or shadows on the art.
- Text sits only on solid bands or plates, never on the art.

### 7. Export with sharp

- AVIF: quality 52, effort 7, `chromaSubsampling: '4:4:4'`. 4:2:0 fringes the cobalt edges.
- WebP: quality 72, `smartSubsample: true`.
- Names: `public/brand-home-4/art/{piece}-{w}x{h}.v1.{avif,webp}`. Bump the version to replace a file; the folder is served `immutable` for a year.
- Serve as `<picture>` (`components/art-picture.tsx`) with `loading="lazy"`, `decoding="async"`, and `width` and `height` set. Never use `next/image`.

### 8. QA

- Make contact sheets at 1× and 2×, on porcelain and on ink.
- Before adding noise, check every pixel is within ΔE00 6 of its gradient path.
- Check the byte budgets below.
- If a crop reads as a specimen rather than abstract art, swap in an alternate plate.

## Pieces, placements and ratios

| Piece | Plate and map | Ratio | Exports | Shown at |
|---|---|---|---|---|
| Ledger bands: `ledger-paloma-circle`, `ledger-studio-card`, `ledger-front-row` | P1–P3, Ledger | 3:1 | 1080×360, 720×240 | Top of the Circle ledger (532×177 at 1440, 350×117 on phones) and the membership spread stage. Only the selected tier's band loads. |
| `set-wedding-week` | P4, Ink | 2:1 | 1224×612, 720×360 | Top of the 612px middle triptych card (704×352 on tablets) |
| `set-wedding-week-band` | P4, Ink | 3:1 | 720×240 | The Wedding Week card on phones |
| Gift faces: `gift-open-edition`, `gift-first-proof`, `gift-late-edition` | P5 Open, P6 Proof, P7 Ink | 1.586:1 | 856×540, 428×270 | Configurator preview (446px at 1440, up to 340px on phones) and the spread stage (520px). Only the selected design's large face loads. |
| Gift thumbnails | the same as the gift faces | 1.586:1 | 192×121 | The 96×61 design swatches |
| `object-study` | the existing photograph, Ink map | 3:2 | 800×533, 1200×800, 1536×1024 (`.v2`) | Method, columns 1–6 |

How the object study differs:
- It is a regrade only. The Ink map is applied to the photograph's own luminance, not inverted: shadows go to ink, midtones to cobalt and highlights to porcelain.
- Its exports are `.v2`. With them shipped:
  - the source photograph lives at `docs/brand-home-4/masters/object-study.png`, outside `public/`;
  - the warm-gold `object-study-*.v1.*` files are retired.

## Byte budgets

Figures are for AVIF; WebP runs about 1.4× larger.

| Piece | Budget |
|---|---|
| Ledger bands | ≤ 22 KB at 1080w, ≤ 12 KB at 720w |
| The Wedding Week | ≤ 40 KB at 1224w, ≤ 18 KB at 720w, ≤ 12 KB for the band |
| Gift faces | ≤ 30 KB at 856w, ≤ 14 KB at 428w; thumbnails ≤ 5 KB each |
| Object study v2 | ≤ 25 / 40 / 55 KB |

Totals:
- A desktop visitor who sees every chapter downloads about 160 KB of art.
- A phone visitor downloads about 80 KB.
- Nothing is in the first view.

## Credits

`app/brand-home-4/data/art.ts` lists each piece in `CREDITS`, with these fields:
- `id`, `use` and `title`;
- `objectID` and `accession`;
- `date`, recording when the rights check was made;
- `objectURL`;
- `licence`: "CC0 — The Met Open Access";
- `treatment`, for example "Detail, rotated 90°; recoloured Open Edition".

The footer carries a one-line credit, `CREDITS_LEAD`, and a "Picture credits" `<details>` that lists every plate. While `CREDITS` is empty, the footer should show only the lead line.
