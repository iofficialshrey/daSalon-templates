import { venueSlug } from "@/lib/dasalon/slug";
import type { PublicVenue } from "@/lib/dasalon/types";
import { ATELIERS, type AtelierSlug } from "../data/ateliers";

/**
 * Static ateliers → live venue ids. Exact name equality first, then the slug of
 * the API name, so a venue renamed only in case or punctuation still binds.
 */
export function venueIdsBySlug(venues: readonly PublicVenue[] | undefined): Map<AtelierSlug, string> {
  const ids = new Map<AtelierSlug, string>();
  if (!venues?.length) return ids;
  for (const atelier of ATELIERS) {
    const match = venues.find((venue) => venue.name === atelier.name)
      ?? venues.find((venue) => venueSlug(venue.name) === atelier.slug);
    if (match) ids.set(atelier.slug, match.id);
  }
  return ids;
}

/** Live venues that match no static atelier (shown as a plain row "V"). */
export function unknownVenues(venues: readonly PublicVenue[] | undefined, known: Map<AtelierSlug, string>) {
  const ids = new Set(known.values());
  return (venues ?? []).filter((venue) => !ids.has(venue.id));
}
