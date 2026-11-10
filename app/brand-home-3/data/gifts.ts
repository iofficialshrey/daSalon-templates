import type { PublicService } from "@/lib/dasalon/types";
import type { ArtKey } from "./art";
import type { PlaceSlug } from "./places";

/*
 * Demonstration gift cards (all four places, 12 months), split from offers.ts so
 * the gifts section and its client parts ship without the memberships and
 * packages, which only the offer sheet needs. Figures from the live menus of
 * 13 Oct 2026 (`price` only); savings are computed in offers.ts, never typed.
 * Nothing here is sold: no payment, no network, no storage.
 */

export type GiftCard = {
  id: "quiet-hour" | "after-rain" | "open-door";
  name: string;
  occasion: string;
  value: number;
  pay: number;
  months: 12;
  covers: { place: PlaceSlug; services: readonly string[]; text: string };
  art: ArtKey;
};

export type GiftDraft = { mode: "gift" | "self"; recipient: string; message: string; from: string; self: string };

export const GIFTS: readonly GiftCard[] = [
  {
    id: "quiet-hour",
    name: "A Quiet Hour",
    occasion: "For thanks, birthdays, a hard week",
    value: 100,
    pay: 100,
    months: 12,
    covers: { place: "serenity-spa-house", services: ["Swedish Massage"], text: "Covers a Swedish Massage at Serenity Spa House." },
    art: "gift-quiet-hour",
  },
  {
    id: "after-rain",
    name: "After Rain",
    occasion: "For someone who never stops",
    value: 250,
    pay: 230,
    months: 12,
    covers: {
      place: "serenity-spa-house",
      services: ["Hot Stone Massage", "Body Wrap"],
      text: "Covers a Hot Stone Massage and a Body Wrap at Serenity Spa House.",
    },
    art: "gift-after-rain",
  },
  {
    id: "open-door",
    name: "The Open Door",
    occasion: "For a milestone, or the week before one",
    value: 450,
    pay: 400,
    months: 12,
    covers: {
      place: "serenity-spa-house",
      services: ["Hot Stone Massage", "Body Polishing", "Body Wrap", "Steam Therapy"],
      text: "Covers a whole day at Serenity Spa House: a Hot Stone Massage, Body Polishing, a Body Wrap and Steam Therapy.",
    },
    art: "gift-open-door",
  },
];

export const GIFT_DESCRIPTION = "Any treatment at any of the four places, for twelve months. Send it with a few words, or keep it for yourself.";
export const GIFT_DELIVERY = "In the live product, sent by email or SMS with your message. This demonstration sends nothing.";

/** The amount a service costs on the live menu: `total` when the payload carries it, else `price`. */
function amountOf(service: PublicService) {
  return Number.isFinite(service.total) ? service.total : service.price;
}

/** "Covers …" only when every named service is on that place's live menu and the sum fits the card value. */
export function coversLine(gift: GiftCard, services: readonly PublicService[] | null | undefined): string | null {
  if (!services?.length) return null;
  let sum = 0;
  for (const name of gift.covers.services) {
    const service = services.find((entry) => entry.name === name)
      ?? services.find((entry) => entry.name.toLowerCase() === name.toLowerCase());
    if (!service) return null;
    sum += amountOf(service);
  }
  return sum <= gift.value ? gift.covers.text : null;
}

export const giftById = (id: string) => GIFTS.find((g) => g.id === id);
