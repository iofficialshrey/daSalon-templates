import { VENUE_FACTS, type VenueFacts, type VenueSlug } from "@/lib/dasalon/venues";
import type { ArtKey } from "./art";

/*
 * Serein's four places: the shared venue facts (address, hours, directions)
 * plus Serein's own copy. Venues are "places" everywhere on this page.
 */

export type PlaceSlug = VenueSlug;
export const PLACE_ORDER: readonly PlaceSlug[] = ["serenity-spa-house", "the-grooming-room", "lumiere-aesthetics", "bride-groom"];
export const DEFAULT_PLACE: PlaceSlug = "serenity-spa-house";

export type Place = VenueFacts & {
  number: "01" | "02" | "03" | "04";
  kind: "spa" | "grooming" | "skin" | "bridal";
  line: string;
  /** "Next door: …" or the VENUE_FACTS note. */
  neighbour: string | null;
  art: ArtKey;
};

const SEREIN: Record<PlaceSlug, Omit<Place, keyof VenueFacts>> = {
  "serenity-spa-house": {
    number: "01",
    kind: "spa",
    art: "place-serenity-spa-house",
    neighbour: "Next door: The Grooming Room",
    line: "Serein's home. Massage, body treatments, and half-hour sessions of steam, sauna or jacuzzi.",
  },
  "the-grooming-room": {
    number: "02",
    kind: "grooming",
    art: "place-the-grooming-room",
    neighbour: "Next door: Serenity Spa House",
    line: "Next door to the spa. Haircuts, beards, nails and evening make-up, unhurried.",
  },
  "lumiere-aesthetics": {
    number: "03",
    kind: "skin",
    art: "place-lumiere-aesthetics",
    neighbour: VENUE_FACTS["lumiere-aesthetics"].note,
    line: "Skin care by the airport. Facials, peels and aesthetic treatments in private rooms.",
  },
  "bride-groom": {
    number: "04",
    kind: "bridal",
    art: "place-bride-groom",
    neighbour: null,
    line: "For the weeks before a wedding: make-up, nails, scrubs and grooming, for both of you.",
  },
};

export const PLACES: readonly Place[] = PLACE_ORDER.map((slug) => ({ ...VENUE_FACTS[slug], ...SEREIN[slug] }));
export const placeBySlug = (slug: PlaceSlug) => PLACES.find((place) => place.slug === slug)!;
/** "Clementi · spa" */
export const subLine = (place: Place) => `${place.area} · ${place.kind}`;
