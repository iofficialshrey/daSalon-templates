import { VENUE_FACTS, VENUE_SLUGS, type VenueFacts, type VenueSlug } from "@/lib/dasalon/venues";

/*
 * Paloma's four studios: the verified public facts from lib/dasalon/venues.ts
 * plus Paloma descriptors. Names, menus, prices and dates are live.
 */

export type StudioSlug = VenueSlug;

export type Studio = VenueFacts & {
  /** "01" … "04" */
  no: string;
  /** Short name for Book labels: "Book the look / at Lumiere". */
  short: string;
  /** One word for tiles and labels: "Hair & grooming". */
  trade: string;
  /** What the studio does, checked against the live categories on 13 Oct 2026. */
  specialty: string;
};

const DESCRIPTORS: Record<StudioSlug, Pick<Studio, "no" | "short" | "trade" | "specialty">> = {
  "the-grooming-room": { no: "01", short: "Grooming Room", trade: "Hair & grooming", specialty: "Hair, beard, make-up and nails" },
  "serenity-spa-house": { no: "02", short: "Serenity", trade: "Spa", specialty: "Massage, body treatments, sauna and steam" },
  "lumiere-aesthetics": { no: "03", short: "Lumiere", trade: "Skin", specialty: "Facials, skin care, aesthetic and medical" },
  "bride-groom": { no: "04", short: "Bride & Groom", trade: "Bridal", specialty: "Bridal make-up, nails, body care and grooming" },
};

/** Display order: the two Clementi studios first, then Changi, then Sentosa. */
const ORDER: readonly StudioSlug[] = ["the-grooming-room", "serenity-spa-house", "lumiere-aesthetics", "bride-groom"];

export const STUDIOS: readonly Studio[] = ORDER.map((slug) => ({ ...VENUE_FACTS[slug], ...DESCRIPTORS[slug] }));

export const STUDIO_BY_SLUG = new Map(STUDIOS.map((studio) => [studio.slug, studio]));

export function studioBySlug(slug: string | null | undefined): Studio | undefined {
  return slug ? STUDIO_BY_SLUG.get(slug as StudioSlug) : undefined;
}

export const STUDIO_SLUGS: readonly StudioSlug[] = VENUE_SLUGS;

/** "01 · Clementi" */
export function studioLabel(studio: Studio) {
  return `${studio.no} · ${studio.area}`;
}

/** The other studio at the same address, if any. */
export function sisterOf(studio: Studio): Studio | undefined {
  return studio.sister ? studioBySlug(studio.sister) : undefined;
}
