import type { StaticImageData } from "next/image";
import { VENUE_FACTS, type VenueFacts, type VenueSlug } from "@/lib/dasalon/venues";
import bath from "../assets/room-bath.jpg";
import garden from "../assets/room-garden.jpg";
import rest from "../assets/room-rest.jpg";
import wall from "../assets/room-wall.jpg";

/*
 * Oru's four rooms. Each is one live da Salon venue, bound by the slug of its
 * API name; addresses, hours and directions are the venue's published facts.
 * The room names and photographs are Oru's own (fictional, illustrative).
 */

export type RoomSlug = VenueSlug;

export type Room = Omit<VenueFacts, "name"> & {
  /** Oru's name for the room; the booking window shows it too. */
  name: string;
  /** What the room is for, in two or three words. */
  trade: string;
  line: string;
  photo: StaticImageData;
  photoAlt: string;
  /** object-position for the arch crop. */
  focus: string;
};

function room(slug: RoomSlug, extra: Pick<Room, "name" | "trade" | "line" | "photo" | "photoAlt" | "focus">): Room {
  return { ...VENUE_FACTS[slug], ...extra };
}

/** The spa leads: it is Oru's home menu. */
export const ROOMS: readonly Room[] = [
  room("serenity-spa-house", {
    name: "The Bathhouse",
    trade: "Massage, steam and water",
    line: "Warm stone, mineral water and unhurried hands.",
    photo: bath,
    photoAlt: "Illustrative photograph: a round lavender-tiled bath beside a tall branch of eucalyptus.",
    focus: "40% 60%",
  }),
  room("lumiere-aesthetics", {
    name: "The Skin Room",
    trade: "Facials and skin",
    line: "Slow, exact work for skin that needs a reset.",
    photo: wall,
    photoAlt: "Illustrative photograph: leaf shadows on a plaster wall above a lavender pool.",
    focus: "50% 45%",
  }),
  room("the-grooming-room", {
    name: "The Parlour",
    trade: "Hair, hands and feet",
    line: "The small rituals that put a week back in order.",
    photo: rest,
    photoAlt: "Illustrative photograph: two linen daybeds and a clay vessel beneath an arched niche.",
    focus: "50% 55%",
  }),
  room("bride-groom", {
    name: "The Garden Suite",
    trade: "Weddings and occasions",
    line: "A private suite for the days that matter most.",
    photo: garden,
    photoAlt: "Illustrative photograph: an arched doorway opening from the pool onto a walled garden.",
    focus: "50% 40%",
  }),
];

export const DEFAULT_ROOM: RoomSlug = "serenity-spa-house";

export function roomBySlug(slug: string | null | undefined) {
  return ROOMS.find((item) => item.slug === slug);
}
