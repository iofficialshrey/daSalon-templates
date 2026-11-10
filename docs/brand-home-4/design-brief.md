# Brand Home 4 design brief: Paloma, Issue 04

Route: `/brand-home-4`. Code: `app/brand-home-4/`. Title: "Paloma — Hair, Form and Colour".

## Identity

- Brand: Paloma, four Singapore studios under one name: hair and grooming and a spa side by side at 463 Clementi Road, a private skin clinic on Airport Boulevard in Changi, and a bridal studio at 24 Sentosa Gateway.
- Point of view: the site reads like a living fashion magazine. This is Issue 04, the Singapore edition, in ten chapters.
- Palette: four brand colours. Every other colour is a tint or shade mixed from them.
  - porcelain `#f5f4ef`
  - ink `#15171a`
  - cobalt `#2459a6`
  - wash `#c7d3e6`
  - Derived mixes: cobalt-deep `#214a87`, muted `#5c626c`, muted-deep `#3e4249`, mist `#a3adbd`, wash-2 `#dee4ea`, porcelain-2 `#e8e7e2`, and ink-2 `#1a2b44`, which appears only inside the art gradient maps.
- Type: one family, Manrope (variable, 200–800).
  - Display text is weight 800, uppercase and tracked tight.
  - Body text is 400, ledes and the note are 500, and labels are 700.
  - `font-synthesis: none`. There is no italic face.
- Shape: square edges everywhere. Only a few things are round: the rotated cobalt "Book the look" cover circle, the DEMO stamp, the booking confirmation mark and the 8px status dots.
- Voice: copy speaks for all four trades (hair and grooming, spa, skin, bridal). It uses Singapore facts only: S$, GST where a studio adds it, en-SG dates, Singapore time (SGT) and +65. It never invents stats, staff, press, reviews or cities.

## Principles

1. Keep the issue the owner likes: the palette, Manrope 800, the dark cover film, the ghost numerals, the cobalt ticker, the two-band interlude, the wash and cobalt bands, and the rotated cover circle.
2. One frame, no exceptions. The grid is 4, 8 or 12 columns with `minmax(0, 1fr)` tracks and symmetric margins of 20 / 32 / 48 / 96px. From 1200px the issue rail sits inside the right margin. Every chapter uses the same head, the same section padding and the same left edge.
3. The index is the navigation. One chapter list (`data/chapters.ts`) and one active-chapter store drive six things: the header nav, the issue rail, the Contents sheet, the cover lines, the running feet and the phone Contents numeral. There is no bottom bar, which is template 1's pattern.
4. Booking is one decision away, at the right studio. The studio a guest picks anywhere becomes the default for every Book. Where the studio is not otherwise visible, the Book label names it.
5. Truth over decoration. Menus and prices are live. Savings and "covers a …" lines are computed, never typed. Every commerce object is visibly a demonstration.
6. Commerce is made of magazine objects, not widgets. Each one runs card → full-viewport offer spread → Buy → DEMO stamp. There are no card fields, no network calls, no storage and no login.
7. A readable, operable floor:
   - nothing below 12px, and sentences at 13px or larger;
   - targets of at least 44px;
   - text contrast of at least 4.5:1 from solid colours, never opacity;
   - a 3px focus ring;
   - two skip links;
   - the page goes inert behind overlays.
8. Motion is garnish and optional:
   - CSS view-timeline reveals that never hide text;
   - seamless marquees with one global "Pause motion";
   - the film plays once and holds;
   - reduced motion gives a complete still issue;
   - lite visitors download no film.
9. Server first. Every chapter is a server component; small client islands handle the live parts. Booking, the offer spread and the Contents sheet load on intent or idle.

## The ten chapters

Every chapter is a `<section data-chapter="NN" aria-labelledby="{id}-title">` on the `.frame` grid, with a tone (`data-tone`).

The chapter head has the same parts everywhere: a kicker ("NN — Label"), the H2 and an aside.
- Desktop: kicker in columns 1–2, H2 in 3–9, aside in 10–12.
- Tablet: the head spans the full width.
- Phone: the parts stack.

Chapters 01–08 end with a running foot: "Paloma · Issue 04 · NN Label", then "Next: NN Label".

| No | Chapter | Tone | Substance |
|---|---|---|---|
| 00 | Cover | ink | The H1 "Form / follows / feeling." is real server text with a CSS word rise. The cover film turns the model through five looks and holds on her face. A rotated 144px cobalt "Book the look" circle. Cover lines link to 02, 05 and 07 (tablet and desktop only). |
| — | Ticker | cobalt band | "Hair is material ◆ Style is personal ◆ Change is welcome ◆ Care is a craft". It loops seamlessly with a visible Pause motion. |
| 01 | Point of view | porcelain | "Not a makeover. / A clearer version." The accent line uses a wrapping mask wipe. A two-paragraph standfirst speaks for all four trades. |
| 02 | The edit | wash | The live menu at all four studios. Studio tiles are native radios. Services are radio "editions", with a sticky detail spread on desktop and the detail inline on phones. Then "Book this edit" opens booking at Day & time for that studio. Phones and tablets get a running head ("Lumiere · Facial", with Change). |
| 03 | The Circle | cobalt | Memberships: a tier picker beside a tilted porcelain member ledger with a 3:1 cyanotype band. |
| 04 | Seasonal sets | porcelain | An asymmetric 3/6/3 triptych: The Standing Edit (cobalt), The Wedding Week (ink, with a wide cyanotype) and Four Slow Hours (outline). |
| 05 | The gift issue | porcelain + wash panel | A gift card made like a cover, at the real card ratio of 1.586:1. It has three cyanotype designs and four values. |
| 06 | Method | ink | "Look. / Listen. / Then edit." beside the object study, regraded as a cyanotype. Three numbered steps. |
| — | Interlude | porcelain + cobalt band | Two rotated kinetic bands, "Shape with intention ◆ Colour with memory ◆ Style that moves" and "Look ◆ Listen ◆ Then edit". |
| 07 | Studios | porcelain | "Find your Paloma." A masthead-table directory of the four real studios. Each row shows live status and service counts, has a Book that opens its own studio, and has an in-place gatefold "studio file" with three quick-book rows. |
| 08 | Editor's note | wash | One large paragraph and true derived facts: 4 studios, 3 neighbourhoods, and the live service total. The total appears only once every menu has loaded. |
| 09 | Back cover | ink | A thumbnail of the film's final frame, the centred PALOMA mark, "Ready for / your next shape?", a cobalt "Book the look" that names the chosen studio, and a "Book at" strip of the four studios. |

The footer is a real `<footer>` after `<main>`. It carries:
- the four addresses, each with Directions;
- the S$ / GST / SGT note;
- the demonstration statement;
- picture credits;
- "Powered by da Salon";
- "Back to the cover" and "All contents".

## Commerce objects (demonstrations)

All three mirror daSalon products. All figures come from `data/offers.ts` helpers. Prices are S$ integers.

### The Circle: memberships

All three work at all four studios, on any service.

| Membership | Type | You pay | You get |
|---|---|---|---|
| Paloma Circle (default) | Credit wallet, 12 months | S$360 | S$420 credit (S$60 extra) |
| Studio Card | Credit wallet, 6 months | S$180 | S$200 credit (S$20 extra) |
| Front Row | Discount plan, 6 months | S$80 | 15% off every visit from S$40, up to S$240 |

### Seasonal sets

Priced from the live menus of 13 Oct 2026. Each set is used at one studio.

| Set | Studio | Redemption | You pay | Worth |
|---|---|---|---|---|
| The Standing Edit | The Grooming Room | 6 sessions | S$165 | S$195 |
| The Wedding Week | Bride & Groom | S$720 to spend | S$620 | S$720 |
| Four Slow Hours | Serenity Spa House | 240 minutes | S$340 | at least S$400 |

### The gift issue

- Designs: Open Edition (cobalt), First Proof (porcelain) and Late Edition (ink).
- Values, as card value / you pay: S$80 / S$80, S$150 / S$140 (default), S$300 / S$270, S$500 / S$450.
- Every card is valid for 12 months at all four studios.
- A "Covers a …" line appears only when the live menu proves it.

### Offer spread and rules

The offer spread is a full-viewport, two-page layer:
- the object stage on the left;
- the details on the right;
- a sticky "Buy · S$…" footer.

Buying runs details → processing (Confirming…, then Issuing…) → done. The done view shows a rotated DEMO stamp and a receipt built from `lib/dasalon/demo.ts`. Gift personalisation (To, From, a message of up to 140 characters) stays in component state and is cleared on close.

Rules for every object:
- square corners;
- states what you pay;
- carries a Demo badge;
- has one action of 44px or more;
- no carousels;
- never blocks vertical scroll.

## Navigation

- Header: fixed and solid porcelain, with a 3px cobalt reading-progress bar.
  - Desktop: the nav items "The edit", "Circle", "Sets", "Gifts" and "Studios", then Contents and a two-line Book ("Book the look / at Lumiere").
  - Phone: the wordmark, then Contents with the current chapter numeral, then Book. Book is hidden while the cover circle is on screen.
- Issue rail: shown from 1200px on fine pointers, inside the right margin. It has ten 56 × 44px links whose accessible names include the number ("02 The edit").
- Contents sheet: a full-viewport ink sheet that rises from the bottom. It lists the ten chapters with their deks, has a "Book at" grid of the four studios and holds a Pause motion toggle.
- In-page links: `<a href="#id" data-jump>`, handled by `lib/page/jump.ts`. A jump is instant when far away, focuses the chapter H2 and pushes no hash.
- Skip links: "Skip to content" and "Skip to the live menu".

## Booking window

Template 4 uses the shared `app/salon-booking.tsx` with theme `paloma`. Its styles are the Paloma block in `app/salon-booking.css`.

- Size: a 980px porcelain drawer, full height and flush right, sliding in from the right. Below 821px it is full screen.
- Tokens: on the palette. Type is Manrope 800.
- Atmosphere panel: the film's final frame as a cobalt luminosity duotone in the top 300px; all text sits on solid cobalt.
- Contrast: 12px type floor, solid-colour contrast, 44px targets and a 3px cobalt focus ring.
- Selections: the selected service, day and time get a 4px ink offset.
- Next: lifted on a 6px ink offset.
- Errors: ink, with an "!" square.
- Confirmation: left-aligned, with a round cobalt mark rotated −8deg like the cover circle.
- Copy:
  - "Paloma · Book the look" / "Book your edit."
  - Steps: Edit, Day & time, Details.
  - Done: "Your edit is booked."

The QA rule: never submit a real appointment. Test only up to Confirm.

## Film and art

- Cover film: `public/brand-home-4/film/`, v2 encodes with the grade baked in. There is a 1280×720 landscape and a 576×768 portrait that follows the model.
  - Posters: the first and last frames in AVIF, WebP and JPG.
  - The `<picture>` poster is the LCP element: the first frame for motion visitors, the last frame for reduced motion.
  - The film loads after load and idle, only when the cover is visible and never for lite visitors (Save-Data, slow networks, low memory or reduced motion).
  - It plays once, holds the front-facing frame and has Replay.
- Art: every still is a cyanotype. The pieces are Anna Atkins's algae plates (The Met, Open Access, CC0) and the regraded object study. All are pre-encoded AVIF and WebP served through `<picture>`, lazy, never through `next/image`. The recipe is in [art-pipeline.md](./art-pipeline.md).
- Caching: `next.config.ts` sends `Cache-Control: public, max-age=31536000, immutable` for `/brand-home-4/film/*` and `/brand-home-4/art/*`. Every file name carries `.v1` or `.v2`; bump the version to replace a file.
- Masters: `docs/brand-home-4/masters/` keeps the retired originals, outside `public/` so they are not deployed:
  - the 2.17 MB hero video;
  - the old poster;
  - the unused `hero.png`;
  - `object-study.png`, retired by the v2 cyanotype regrade.

## Performance budgets

| Budget | Limit |
|---|---|
| HTML | 20 KB gz or less |
| Render-blocking CSS | 16 KB gz or less |
| Route JS on first load | 14 KB gz or less |
| First view before the film, including the framework | about 215 KB (was about 2.45 MB) |

- Booking, the offer spread and Contents are lazy chunks.
- Live data: one bootstrap request per studio per 5 minutes. There is no polling.
- Lighthouse targets on mobile: LCP ≤ 2.0 s (the poster), CLS ≤ 0.02, TBT ≤ 150 ms and INP ≤ 200 ms.

## Primary actions

- Book the look (cover circle, header, back cover). It opens booking at the current studio.
- Book this edit (the menu detail). It opens booking at Day & time.
- Book at {studio} (studio rows, studio files, the Contents sheet, the back-cover strip).
- See the details (Circle), See the set (sets), Personalise and buy (gifts). These open the offer spread, which ends in a demo purchase.
- Contents, Pause motion and Replay film.
