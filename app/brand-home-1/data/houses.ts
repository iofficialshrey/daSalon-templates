import type { StaticImageData } from "next/image";
import { VENUE_FACTS, type VenueFacts, type VenueSlug } from "@/lib/dasalon/venues";
import bronzeImage from "../assets/houses/bronze-house.jpg";
import ivoryImage from "../assets/houses/ivory-house.jpg";
import travertineImage from "../assets/houses/travertine-house.jpg";
import walnutImage from "../assets/houses/walnut-house.jpg";

export type HouseSlug = VenueSlug;

export type House = VenueFacts & {
  /** One word for chips and pickers, e.g. "Grooming". */
  specialty: string;
  /** Kind of house, e.g. "Hair salon". */
  kind: string;
  /** Card label, e.g. "Grooming · Hair salon". */
  label: string;
  /** "01" to "04", the house's place in the collection. */
  number: string;
  blurb: string;
  /** Why the house carries its name, in one line. */
  namedFor: string;
  image: StaticImageData;
  imageAlt: string;
  sisterLine: string | null;
};

/*
 * Maison Élan and its four house names are fictional. Each house is bound by its slug to a
 * live da Salon venue, whose address, hours and amenities come from lib/dasalon/venues.ts;
 * the booking window shows the same house names (see `venueLabel` in provider.tsx).
 *
 * Photographs are illustrative, used under the Unsplash License, cropped and colour graded:
 *   bronze-house.jpg      unsplash.com/photos/g2u8gq5XcwE (@tilemerchant)
 *   travertine-house.jpg  unsplash.com/photos/HIu7A27ptE0 (@eladepure)
 *   walnut-house.jpg      unsplash.com/photos/npE_I2GzpHY (@s_g_arch)
 *   ivory-house.jpg       unsplash.com/photos/sztngWiRp-I (@nickynoodles13)
 */
export const HOUSES: readonly House[] = [
  {
    ...VENUE_FACTS["the-grooming-room"],
    name: "Bronze House",
    specialty: "Grooming",
    kind: "Hair salon",
    label: "Grooming · Hair salon",
    number: "01",
    blurb: "Cuts, colour, beard work, make-up and nails, kept to a calm and unhurried rhythm.",
    namedFor: "Named for the bronze of its arched mirrors.",
    image: bronzeImage,
    imageAlt: "Illustrative photograph: a salon of arched mirrors, oak slats and a marble floor.",
    sisterLine: "Walnut House next door, for massage and body",
  },
  {
    ...VENUE_FACTS["lumiere-aesthetics"],
    name: "Travertine House",
    specialty: "Aesthetics",
    kind: "Skin clinic",
    label: "Aesthetics · Skin clinic",
    number: "02",
    blurb: "Facials, skin care and aesthetic treatments, each in a private room of pale stone.",
    namedFor: "Named for the travertine of its treatment rooms.",
    image: travertineImage,
    imageAlt: "Illustrative photograph: an arched mirror and stone basin against a travertine wall.",
    sisterLine: null,
  },
  {
    ...VENUE_FACTS["serenity-spa-house"],
    name: "Walnut House",
    specialty: "Spa",
    kind: "Massage & body",
    label: "Spa · Massage & body",
    number: "03",
    blurb: "Massage and body treatments in low light, behind walnut-panelled doors.",
    namedFor: "Named for the walnut that lines every room.",
    image: walnutImage,
    imageAlt: "Illustrative photograph: a treatment room with walnut panelling, two massage beds and a palm.",
    sisterLine: "Bronze House next door, for hair, make-up and nails",
  },
  {
    ...VENUE_FACTS["bride-groom"],
    name: "Ivory House",
    specialty: "Bridal",
    kind: "Hair & make-up",
    label: "Bridal · Hair & make-up",
    number: "04",
    blurb: "Bridal hair and make-up for the day itself, and for everyone standing beside you.",
    namedFor: "Named for the colour of the day it was made for.",
    image: ivoryImage,
    imageAlt: "Illustrative photograph: a lace wedding gown hanging in a bridal suite.",
    sisterLine: null,
  },
];

export const HOUSE_BY_SLUG = new Map(HOUSES.map((house) => [house.slug, house]));

export function isHouseSlug(value: string | null | undefined): value is HouseSlug {
  return Boolean(value && HOUSE_BY_SLUG.has(value as HouseSlug));
}
