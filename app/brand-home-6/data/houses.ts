import type { StaticImageData } from "next/image";
import { VENUE_FACTS, type VenueFacts, type VenueSlug } from "@/lib/dasalon/venues";
import clinic from "../assets/house-clinic.jpg";
import pavilion from "../assets/house-pavilion.jpg";
import salon from "../assets/house-salon.jpg";
import spring from "../assets/house-spring.jpg";

/*
 * Néroli's four houses. Each is one live da Salon venue, bound by the slug of
 * its API name; addresses, hours and directions are the venue's published
 * facts. The house names and photographs are Néroli's own (illustrative).
 */

export type HouseSlug = VenueSlug;

export type House = Omit<VenueFacts, "name"> & {
  name: string;
  /** What the house is for, in a few words. */
  trade: string;
  photo: StaticImageData;
  photoAlt: string;
};

function house(slug: HouseSlug, extra: Pick<House, "name" | "trade" | "photo" | "photoAlt">): House {
  return { ...VENUE_FACTS[slug], ...extra };
}

/** The spa leads: it is Néroli's home menu. */
export const HOUSES: readonly House[] = [
  house("serenity-spa-house", {
    name: "The Spring",
    trade: "Massage, steam and water",
    photo: spring,
    photoAlt: "Illustrative photograph: a stone bench with a branch of neroli blossom beside a mineral pool.",
  }),
  house("lumiere-aesthetics", {
    name: "The Clinic",
    trade: "Facials, skin and aesthetics",
    photo: clinic,
    photoAlt: "Illustrative photograph: folded celadon linen, neroli blossom and a glass bowl on a stone treatment bed.",
  }),
  house("the-grooming-room", {
    name: "The Salon",
    trade: "Hair, grooming, hands and feet",
    photo: salon,
    photoAlt: "Illustrative photograph: a curved lounger beside a shallow courtyard pool and an olive tree.",
  }),
  house("bride-groom", {
    name: "The Pavilion",
    trade: "Weddings and occasions",
    photo: pavilion,
    photoAlt: "Illustrative photograph: a white curved roof opening to the sky above a pool, with linen curtains.",
  }),
];

export const DEFAULT_HOUSE: HouseSlug = "serenity-spa-house";
