# STUDIO / 07 — Design brief

## Identity (locked)

| Token | Value |
| --- | --- |
| Canvas | `#090909` |
| Ivory | `#F3F0E9` |
| Graphite | `#252525` |
| Champagne | `#B8A28A` (restrained) |
| Display | Oswald / condensed utility |
| Motion | Press 180–250ms · editorial 500–700ms · transform/opacity · reduced-motion respected |

## Page order

1. Cinematic intro → hero aperture  
2. THE SIGNATURE EDIT — live services + **Find your look** (All / Sharp / Soft / Expressive)  
3. CRAFT WITH CONSEQUENCE — story beats  
4. **THE PEOPLE BEHIND THE LOOK.** — ivory chapter (`#people`)  
5. MAKE TIME — booking invite  
6. THE INNER CIRCLE — membership deck + comparison table (demo)  
7. GIVE A MOMENT — gift preview (demo)  
8. FIND YOUR STUDIO — live venues + explore panel  
9. EVERY VISIT COUNTS — loyalty placeholder (demo)  

## Media decisions (2026-09 polish)

### Service photography

Assignment is **never** by catalog index.

`app/brand-home-7/service-media.ts`:

1. Prefer `serviceMediaById[service.id]` when approved assets exist.  
2. Else conservative **treatment-name** rules.  
3. Else typographic panel (`COLOUR`, `MASSAGE`, `FACIAL`, `NAILS`, `EDIT`).

| Asset | Allowed use |
| --- | --- |
| `service-01.jpg` | Hair craft (cut / beard / scalp) |
| `service-04.jpg` | Soft hair finish (blow-dry / wash / finish) |
| `service-02.jpg` | **Not** used as treatment photo (product bowl) |
| `service-03.jpg` | Story / people portrait only |
| Typographic panels | Massage, colour, facial, nails until treatment plates arrive |

### Menu previews

Destination-matched: craft photo (services/people), portrait (story), architecture (studios), designed compositions (membership / gift / booking / loyalty).

### Venues

Live `PublicVenue` records drive names/cities. Illustrative architecture plates are labelled unless `venueExtrasById[venueId]` supplies verified photo/address/hours/directions.

## Booking (studio theme only)

- Vertical DATE / TIME reels with perspective fade, settle gate, post-settle slot fetch.  
- Compact service summary (media + venue + duration + live price) into the booking panel.  
- Persistent floating dock + `sessionStorage` draft (`studio-07-booking-draft`) for service/venue/date/time/guest fields.  
- Revalidate availability when restoring a draft; surface sold-out/changed notices.  
- Confirmation card after successful API: reference, venue, payment due at venue, Add to calendar when timezone exists, Directions only with verified URL.  
- Other Brand Home themes keep prior chip UI and confirmation.

## Still needed for production

- Treatment photography for massage, colour, facial, nails keyed by service ID.  
- Verified venue photos, addresses, hours, amenities, directions URLs in `venueExtrasById`.  
- Optional hero film (`assets.heroFilm`).  
- Verified team bios if the people chapter should name staff.

## Intro trailer

Cinematic opening (~8.4s desktop) with exact copy from `trailer` in `config.ts`.

Beat treatments:
1. “YOU KNOW THAT FEELING.” — masked statement reveal
2. “WHEN YOU LOOK LIKE YOURSELF.” — typewriter
3. “ONLY LOUDER.” — stronger scale reveal (no clipping)

Plays once per browser session. Skipped for `prefers-reduced-motion`, deep-link hashes (`#services`, etc.), booking query params, or when already seen this session.

Timing (desktop; ~8% faster on mobile):
- 0.0–0.5s settle
- 0.5–2.1s beat 1
- 2.1–2.8s pause
- 2.8–5.2s beat 2 typewriter
- 5.2–6.5s beat 3
- 6.5–7.5s aperture into hero
- 7.5–8.4s hero copy + actions

Skip intro throughout; Replay intro after completion.
## Preview

```sh
npm run dev
# open http://localhost:3000/brand-home-7
```

Do not create production appointments while testing; use staging Partner API credentials in `.env.local`.
