import type { ArtKey } from "./art";
import type { OfferRequest } from "./offers";
import type { PlaceSlug } from "./places";

/*
 * The four Serein states, each made of named live services at a real place.
 * Services are matched by exact live name at their place (case-insensitive
 * fallback). Prices and durations always render live; nothing here is a price.
 * Serenity's 14 live services appear exactly once (4 + 3 + 3 + 4).
 */

export type RitualId = "ground" | "float" | "illuminate" | "unwind";

export type RitualGroup = { heading: string | null; place: PlaceSlug; services: readonly string[] };

export type Ritual = {
  id: RitualId;
  number: "01" | "02" | "03" | "04";
  name: string;
  /** The pick's place and live service name. */
  place: PlaceSlug;
  pick: string;
  typeLine: string;
  note: string;
  caption: string;
  groups: readonly RitualGroup[];
  crossLink: { text: string; label: string; request: OfferRequest };
  art: { browser: ArtKey; journey: ArtKey };
};

export type Need = {
  label: string;
  ritual: RitualId;
  recommend: { place: PlaceSlug; service: string };
  alt: { label: "Shorter visit" | "Or try" | "For the body"; place: PlaceSlug; service: string };
};

const SERENITY: PlaceSlug = "serenity-spa-house";
const LUMIERE: PlaceSlug = "lumiere-aesthetics";

/** Order: ground, float, illuminate, unwind. */
export const RITUALS: readonly Ritual[] = [
  {
    id: "ground",
    number: "01",
    name: "Ground",
    place: SERENITY,
    pick: "Hot Stone Massage",
    typeLine: "Massage · Serenity Spa House",
    note: "Warm stones and long, slow pressure bring the body gently back to earth.",
    caption: "Warmth · Weight · Stillness",
    groups: [
      { heading: null, place: SERENITY, services: ["Hot Stone Massage", "Deep Tissue Massage", "Swedish Massage", "Back Massage"] },
    ],
    crossLink: {
      text: "Or take three: Three Grounds, S$360.",
      label: "See Three Grounds",
      request: { kind: "package", id: "three-grounds" },
    },
    art: { browser: "ritual-ground", journey: "journey-ground" },
  },
  {
    id: "float",
    number: "02",
    name: "Float",
    place: SERENITY,
    pick: "Jacuzzi Session",
    typeLine: "Spa services · Serenity Spa House",
    note: "Warm water and nothing to do. Half an hour to soften physical and mental noise; stay longer with a sauna or steam session.",
    caption: "Water · Heat · Weightlessness",
    groups: [
      { heading: null, place: SERENITY, services: ["Jacuzzi Session", "Sauna Session", "Steam Therapy"] },
    ],
    crossLink: {
      text: "Six half-hours for S$240.",
      label: "See The Water Hours",
      request: { kind: "package", id: "water-hours" },
    },
    art: { browser: "ritual-float", journey: "journey-float" },
  },
  {
    id: "illuminate",
    number: "03",
    name: "Illuminate",
    place: LUMIERE,
    pick: "Brightening Facial",
    typeLine: "Facial · Lumiere Aesthetics, Changi",
    note: "An unhurried hour of skin care at our sister place by the airport, for rested, light-reflective skin. For the body, Serenity's polish and scrubs do the same.",
    caption: "Light · Skin · Clarity",
    groups: [
      { heading: "At Lumiere Aesthetics · Changi", place: LUMIERE, services: ["Brightening Facial", "HydraFacial", "Skin Analysis"] },
      { heading: "For the body, at Serenity Spa House", place: SERENITY, services: ["Body Polishing", "Body Scrub and Exfoliation", "Body Scrub"] },
    ],
    crossLink: {
      text: "Regular visits? Weekly Quiet takes 20% off every visit from S$45.",
      label: "See Weekly Quiet",
      request: { kind: "membership", id: "weekly-quiet" },
    },
    art: { browser: "ritual-illuminate", journey: "journey-illuminate" },
  },
  {
    id: "unwind",
    number: "04",
    name: "Unwind",
    place: SERENITY,
    pick: "Aromatherapy Massage",
    typeLine: "Massage · Serenity Spa House",
    note: "Scented oils and quiet, unhurried touch, to prepare the body for deep, uninterrupted sleep.",
    caption: "Scent · Quiet · Sleep",
    groups: [
      { heading: null, place: SERENITY, services: ["Aromatherapy Massage", "Head Massage", "Foot Massage", "Body Wrap"] },
    ],
    crossLink: {
      text: "The whole sequence: The Unwind Ritual, S$215.",
      label: "See The Unwind Ritual",
      request: { kind: "package", id: "unwind-ritual" },
    },
    art: { browser: "ritual-unwind", journey: "journey-unwind" },
  },
];

/** Order: slow down, better sleep, feel lighter, glow back. */
export const NEEDS: readonly Need[] = [
  {
    label: "I need to slow down",
    ritual: "ground",
    recommend: { place: SERENITY, service: "Hot Stone Massage" },
    alt: { label: "Shorter visit", place: SERENITY, service: "Back Massage" },
  },
  {
    label: "I need better sleep",
    ritual: "unwind",
    recommend: { place: SERENITY, service: "Aromatherapy Massage" },
    alt: { label: "Shorter visit", place: SERENITY, service: "Head Massage" },
  },
  {
    label: "I need to feel lighter",
    ritual: "float",
    recommend: { place: SERENITY, service: "Jacuzzi Session" },
    alt: { label: "Or try", place: SERENITY, service: "Steam Therapy" },
  },
  {
    label: "I need my glow back",
    ritual: "illuminate",
    recommend: { place: LUMIERE, service: "Brightening Facial" },
    alt: { label: "For the body", place: SERENITY, service: "Body Polishing" },
  },
];

export const ritualById = (id: RitualId): Ritual => RITUALS.find((ritual) => ritual.id === id)!;
