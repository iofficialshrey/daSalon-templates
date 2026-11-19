/*
 * Oru's memberships, journeys and gift cards. Demonstration content: the
 * prices are illustrative and the checkout never takes a payment.
 */

export type Tone = "aubergine" | "mist" | "vermilion";

type Base = {
  id: string;
  name: string;
  tone: Tone;
  line: string;
  details: readonly string[];
  /** What the guest pays, in S$. */
  pay: number;
  /** How long it stays valid, in months (null: no expiry). */
  months: number | null;
};

export type Membership = Base & { kind: "membership"; credit: number; term: string };
export type Journey = Base & { kind: "journey"; worth: number; minutes: number; stops: readonly string[] };
export type GiftCard = Base & { kind: "gift"; value: number };
export type Offer = Membership | Journey | GiftCard;

export const MEMBERSHIPS: readonly Membership[] = [
  {
    kind: "membership",
    id: "quiet-hour",
    name: "The Quiet Hour",
    tone: "mist",
    term: "3 months",
    line: "A light wallet for short visits: steam, a massage on the way home, an hour with nothing in it.",
    details: [
      "S$265 of treatment credit for S$240",
      "Steam and the resting room with every visit",
      "Sized for 30 to 75 minute treatments",
      "Use it in any of the four rooms",
    ],
    pay: 240,
    credit: 265,
    months: 3,
  },
  {
    kind: "membership",
    id: "oru-house",
    name: "Oru House",
    tone: "aubergine",
    term: "6 months",
    line: "Recovery as part of your ordinary rhythm: credit for a monthly ritual and open days at the bath.",
    details: [
      "S$820 of treatment credit for S$720",
      "Bath, steam and resting room on any day you visit",
      "Guest treatments 10% less",
      "One balance across all four rooms",
    ],
    pay: 720,
    credit: 820,
    months: 6,
  },
  {
    kind: "membership",
    id: "year-of-water",
    name: "Year of Water",
    tone: "vermilion",
    term: "12 months",
    line: "A full year of water, warmth and touch, with the deepest credit and first sight of each season.",
    details: [
      "S$1,720 of treatment credit for S$1,450",
      "Booking opens to you a week before everyone else",
      "Seasonal journeys offered to members first",
      "One balance across all four rooms",
    ],
    pay: 1450,
    credit: 1720,
    months: 12,
  },
];

export const JOURNEYS: readonly Journey[] = [
  {
    kind: "journey",
    id: "deep-exhale",
    name: "The Deep Exhale",
    tone: "aubergine",
    minutes: 120,
    stops: ["Mineral steam", "Full-body massage", "Quiet pool time"],
    line: "The long version of putting everything down.",
    details: [
      "One 120 minute visit, booked when it suits you",
      "Begins in the steam room and ends beside the pool",
      "Your therapist is matched after a short conversation",
      "Valid for 3 months from purchase",
    ],
    pay: 144,
    worth: 160,
    months: 3,
  },
  {
    kind: "journey",
    id: "skin-and-stillness",
    name: "Skin and Stillness",
    tone: "mist",
    minutes: 105,
    stops: ["Mineral steam", "Skin reset facial", "Cooling tea and rest"],
    line: "Steam first, so the treatment settles deeper.",
    details: [
      "One 105 minute visit shaped around skin",
      "Steam before the facial, rest and tea after it",
      "Home-care notes written for you before you leave",
      "Valid for 3 months from purchase",
    ],
    pay: 128,
    worth: 145,
    months: 3,
  },
  {
    kind: "journey",
    id: "sunday-at-oru",
    name: "Sunday at Oru",
    tone: "vermilion",
    minutes: 180,
    stops: ["Bath and steam circuit", "Full-body massage", "Seasonal lunch"],
    line: "Half a day, and no clock anywhere in the building.",
    details: [
      "Half a day held open for one guest",
      "Lunch is served between the water and the treatment",
      "Best on a Sunday, though any day is yours",
      "Valid for 4 months from purchase",
    ],
    pay: 196,
    worth: 230,
    months: 4,
  },
];

export const GIFT_CARDS: readonly GiftCard[] = [
  {
    kind: "gift",
    id: "a-little-room",
    name: "A Little Room",
    tone: "mist",
    value: 100,
    line: "Enough for a treatment and the slow hour after it.",
    details: [
      "Spend it on any treatment or journey",
      "Sent by email, or as a wrapped card with your note",
      "Valid for 12 months from purchase",
      "Welcome in all four rooms",
    ],
    pay: 100,
    months: 12,
  },
  {
    kind: "gift",
    id: "an-afternoon-off",
    name: "An Afternoon Off",
    tone: "vermilion",
    value: 200,
    line: "Steam, a treatment, the pool, and nowhere else to be.",
    details: [
      "Covers a full journey with room to spare",
      "Sent by email, or as a wrapped card with your note",
      "Valid for 12 months from purchase",
      "The day and the therapist are theirs to choose",
    ],
    pay: 200,
    months: 12,
  },
  {
    kind: "gift",
    id: "open-card",
    name: "The Open Card",
    tone: "aubergine",
    value: 350,
    line: "A card that waits for as long as they need it to.",
    details: [
      "No expiry date",
      "Spend it on treatments, journeys or a membership",
      "The balance can be used across more than one visit",
      "Welcome in all four rooms",
    ],
    pay: 350,
    months: null,
  },
];

export const OFFERS: readonly Offer[] = [...MEMBERSHIPS, ...JOURNEYS, ...GIFT_CARDS];

export function offerById(id: string | null | undefined) {
  return OFFERS.find((offer) => offer.id === id);
}

export const KIND_LABEL: Record<Offer["kind"], string> = {
  membership: "Membership",
  journey: "Journey",
  gift: "Gift card",
};
