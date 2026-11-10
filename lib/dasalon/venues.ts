import { venueSlug } from "./slug";
import type { PublicVenue } from "./types";

/*
 * Public facts for the four live venues, taken from each venue's dasalon.com
 * page and verified on 11 Oct 2026. Nothing here is invented: venues that do
 * not publish opening hours say so. Templates add their own copy and imagery.
 */

export type VenueSlug = "the-grooming-room" | "lumiere-aesthetics" | "serenity-spa-house" | "bride-groom";

export type VenueFacts = {
  slug: VenueSlug;
  /** Exactly as the Partner API names the venue. */
  name: string;
  /** Singapore area, e.g. "Clementi". */
  area: string;
  address: string;
  /** Published opening hours in SGT, or null when the venue does not publish them. */
  hours: { open: string; close: string } | null;
  hoursLabel: string;
  note: string | null;
  amenities: string[];
  directionsUrl: string;
  /** The other venue at the same address, if any. */
  sister: VenueSlug | null;
};

function mapsUrl(address: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

const CLEMENTI = "463 Clementi Road, Singapore 599494";

export const VENUE_FACTS: Readonly<Record<VenueSlug, VenueFacts>> = {
  "the-grooming-room": {
    slug: "the-grooming-room",
    name: "The Grooming Room",
    area: "Clementi",
    address: CLEMENTI,
    hours: null,
    hoursLabel: "Hours shown when you book",
    note: null,
    amenities: ["Wi-Fi", "Towels provided", "Waiting area", "Parking", "Air purifier", "Changing rooms", "Loyalty programme", "Gift cards"],
    directionsUrl: mapsUrl(CLEMENTI),
    sister: "serenity-spa-house",
  },
  "lumiere-aesthetics": {
    slug: "lumiere-aesthetics",
    name: "Lumiere Aesthetics",
    area: "Changi",
    address: "60 Airport Boulevard, Singapore 819643",
    hours: null,
    hoursLabel: "Hours shown when you book",
    note: "Adults only · private treatment rooms",
    amenities: ["Private treatment rooms", "Adults only", "Loyalty programme", "Flexible payment options"],
    directionsUrl: mapsUrl("60 Airport Boulevard, Singapore 819643"),
    sister: null,
  },
  "serenity-spa-house": {
    slug: "serenity-spa-house",
    name: "Serenity Spa House",
    area: "Clementi",
    address: CLEMENTI,
    hours: { open: "09:00", close: "18:00" },
    hoursLabel: "Daily, 9:00 am – 6:00 pm",
    note: null,
    amenities: [],
    directionsUrl: mapsUrl(CLEMENTI),
    sister: "the-grooming-room",
  },
  "bride-groom": {
    slug: "bride-groom",
    name: "Bride & Groom",
    area: "Sentosa",
    address: "24 Sentosa Gateway, Singapore 098137",
    hours: { open: "09:00", close: "18:00" },
    hoursLabel: "Daily, 9:00 am – 6:00 pm",
    note: null,
    amenities: [],
    directionsUrl: mapsUrl("24 Sentosa Gateway, Singapore 098137"),
    sister: null,
  },
};

export const VENUE_SLUGS = Object.keys(VENUE_FACTS) as VenueSlug[];

export function isVenueSlug(value: string | null | undefined): value is VenueSlug {
  return Boolean(value && Object.hasOwn(VENUE_FACTS, value));
}

/**
 * Static venues → live venue ids. Exact name equality first, then the slug of
 * the API name, so a venue renamed only in case or punctuation still binds.
 */
export function venueIdsBySlug(
  venues: readonly PublicVenue[] | undefined,
  slugs: readonly VenueSlug[] = VENUE_SLUGS,
): Map<VenueSlug, string> {
  const ids = new Map<VenueSlug, string>();
  if (!venues?.length) return ids;
  for (const slug of slugs) {
    const name = VENUE_FACTS[slug].name;
    const match = venues.find((venue) => venue.name === name) ?? venues.find((venue) => venueSlug(venue.name) === slug);
    if (match) ids.set(slug, match.id);
  }
  return ids;
}
