import type { StaticImageData } from "next/image";
import { VENUE_FACTS, type VenueFacts, type VenueSlug } from "@/lib/dasalon/venues";
import changiPhoto from "../assets/ateliers/changi.jpg";
import clementiPhoto from "../assets/ateliers/clementi.jpg";
import gardenPhoto from "../assets/ateliers/garden.jpg";
import sentosaPhoto from "../assets/ateliers/sentosa.jpg";

/*
 * The four ateliers of the demonstration house. Addresses, hours and amenities
 * come from lib/dasalon/venues.ts (verified public facts); menus, prices and
 * dates are live. The names are the house's own and fictional: each atelier
 * still binds to its live venue by slug (lib/match.ts), and the booking window
 * shows these names through its venueLabel prop. Photographs are illustrative.
 */

export type AtelierSlug = VenueSlug;

export type Atelier = VenueFacts & {
  /** "I" … "IV". */
  numeral: string;
  /** One word for chips, switchers and the floating Book, e.g. "Hair". */
  trade: string;
  /** What the atelier does, e.g. "Hair, make-up & nails". */
  tradeLine: string;
  /** Atelier-page sub-line under the H1. */
  subLine: string;
  blurb: string;
  /** Static fact shown before the live status arrives, and the honest note. */
  addressNote: string | null;
  photo: StaticImageData;
  photoAlt: string;
  /** Where the photograph's subject sits when it is cropped tall. */
  focus: string;
};

export const ATELIERS: readonly Atelier[] = [
  {
    ...VENUE_FACTS["the-grooming-room"],
    name: "The Clementi Atelier",
    numeral: "I",
    trade: "Hair",
    tradeLine: "Hair, make-up & nails",
    subLine: "Hair, make-up and nails",
    blurb: "Cuts, colour and styling, evening make-up and nails, shaped around your face and your week.",
    addressNote: "Shares the address with The Garden Spa",
    photo: clementiPhoto,
    photoAlt: "Illustrative photograph: a white plaster facade with palms, its glass doors open on a salon of lit mirrors.",
    focus: "38% 50%",
  },
  {
    ...VENUE_FACTS["serenity-spa-house"],
    name: "The Garden Spa",
    numeral: "II",
    trade: "Spa",
    tradeLine: "Massage, body & sauna",
    subLine: "Massage, body treatments and sauna",
    blurb: "Hot stone, aromatherapy and Swedish massage, body treatments and a quiet sauna, in the garden behind The Clementi Atelier.",
    addressNote: "Shares the address with The Clementi Atelier",
    photo: gardenPhoto,
    photoAlt: "Illustrative photograph: a shaded garden terrace of ferns and wet stone, a lounge and treatment chairs beyond.",
    focus: "62% 50%",
  },
  {
    ...VENUE_FACTS["lumiere-aesthetics"],
    name: "The Changi Studio",
    numeral: "III",
    trade: "Skin",
    tradeLine: "Facials & skin",
    subLine: "Facials, skin care and aesthetic treatments",
    blurb: "Facials, skin analysis and aesthetic treatments in private rooms, for adults only.",
    addressNote: "Adults only · private treatment rooms",
    photo: changiPhoto,
    photoAlt: "Illustrative photograph: a pale stone courtyard with a single tree and a reflecting pool before a glass pavilion.",
    focus: "70% 50%",
  },
  {
    ...VENUE_FACTS["bride-groom"],
    name: "The Sentosa Suite",
    numeral: "IV",
    trade: "Bridal",
    tradeLine: "Bridal hair, make-up & nails",
    subLine: "Bridal hair, make-up and nails",
    blurb: "Bridal make-up, manicures and grooming for the day itself, and for the people beside you.",
    addressNote: null,
    photo: sentosaPhoto,
    photoAlt: "Illustrative photograph: white orchids on a timber plinth in a vaulted limestone corridor.",
    focus: "50% 40%",
  },
];

export const ATELIER_BY_SLUG = new Map(ATELIERS.map((atelier) => [atelier.slug, atelier]));

export function atelierBySlug(slug: string | null | undefined): Atelier | undefined {
  return slug ? ATELIER_BY_SLUG.get(slug as AtelierSlug) : undefined;
}

/** "I · Hair · Clementi" */
export function atelierLabel(atelier: Atelier, withArea = false) {
  return withArea ? `${atelier.numeral} · ${atelier.trade} · ${atelier.area}` : `${atelier.numeral} · ${atelier.trade}`;
}

/** The atelier before and after this one, wrapping round. */
export function neighbours(slug: AtelierSlug): [Atelier, Atelier] {
  const index = ATELIERS.findIndex((atelier) => atelier.slug === slug);
  const count = ATELIERS.length;
  return [ATELIERS[(index - 1 + count) % count], ATELIERS[(index + 1) % count]];
}

export const atelierHref = (slug: AtelierSlug) => `/brand-home-2/ateliers/${slug}`;
