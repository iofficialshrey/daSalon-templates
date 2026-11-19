/*
 * Néroli's memberships, rituals and gift cards. Demonstration content: the
 * prices are illustrative and the checkout never takes a payment.
 */

type Base = {
  id: string;
  name: string;
  line: string;
  details: readonly string[];
  /** What the guest pays, in S$. */
  pay: number;
  /** How long it stays valid, in months (null: no expiry). */
  months: number | null;
};

export type Membership = Base & { kind: "membership"; credit: number; term: string };
/** A ritual's stops, each with its minutes: drawn as layers of water. */
export type Ritual = Base & { kind: "ritual"; worth: number; stops: readonly { name: string; minutes: number }[] };
export type Gift = Base & { kind: "gift"; value: number; photo: "spring" | "pool" | "linen" };
export type Offer = Membership | Ritual | Gift;

export const MEMBERSHIPS: readonly Membership[] = [
  {
    kind: "membership",
    id: "visit-card",
    name: "The Visit Card",
    term: "3 months",
    line: "For the occasional reset: credit for your treatments and the pool on the days you come.",
    details: ["S$300 of treatment credit for S$270", "Pool and steam with every visit", "Use it in any of the four houses", "Valid for 3 months"],
    pay: 270,
    credit: 300,
    months: 3,
  },
  {
    kind: "membership",
    id: "neroli-house",
    name: "Néroli House",
    term: "6 months",
    line: "One treatment a month, open days at the pool and steam, and a quiet place between visits.",
    details: ["S$890 of treatment credit for S$780", "Pool and steam on any day you visit", "Guest treatments 12% less", "One balance across all four houses"],
    pay: 780,
    credit: 890,
    months: 6,
  },
  {
    kind: "membership",
    id: "long-year",
    name: "The Long Year",
    term: "12 months",
    line: "A year of water and warmth, with the deepest credit and first sight of each season.",
    details: ["S$1,900 of treatment credit for S$1,600", "Booking opens to you a week early", "Seasonal rituals offered to members first", "One balance across all four houses"],
    pay: 1600,
    credit: 1900,
    months: 12,
  },
];

export const RITUALS: readonly Ritual[] = [
  {
    kind: "ritual",
    id: "slow-morning",
    name: "The Slow Morning",
    line: "Steam to open the skin, a facial, then tea in the courtyard.",
    stops: [
      { name: "Mineral steam", minutes: 20 },
      { name: "Brightening facial", minutes: 60 },
      { name: "Neroli tea", minutes: 20 },
    ],
    details: ["One 100 minute visit, booked when it suits you", "Your therapist is matched after a short conversation", "Home-care notes before you leave", "Valid for 3 months from purchase"],
    pay: 150,
    worth: 175,
    months: 3,
  },
  {
    kind: "ritual",
    id: "full-immersion",
    name: "Full Immersion",
    line: "The long version: warmth, touch and water, in that order.",
    stops: [
      { name: "Steam and sauna", minutes: 30 },
      { name: "Hot stone massage", minutes: 75 },
      { name: "Pool time", minutes: 30 },
    ],
    details: ["One visit of a little over two hours", "Begins in the steam room and ends beside the pool", "Robe, slippers and towels provided", "Valid for 3 months from purchase"],
    pay: 210,
    worth: 245,
    months: 3,
  },
  {
    kind: "ritual",
    id: "return-to-water",
    name: "Return to Water",
    line: "Half a day: the pool first, a massage, then lunch with nowhere to be.",
    stops: [
      { name: "Pool and jacuzzi", minutes: 45 },
      { name: "Aromatherapy massage", minutes: 60 },
      { name: "Seasonal lunch", minutes: 60 },
    ],
    details: ["Half a day held open for one guest", "Lunch is served between the water and the treatment", "Best on a weekday morning", "Valid for 4 months from purchase"],
    pay: 260,
    worth: 300,
    months: 4,
  },
];

export const GIFTS: readonly Gift[] = [
  {
    kind: "gift",
    id: "quiet-hour",
    name: "A Quiet Hour",
    photo: "linen",
    line: "Enough for one treatment and the slow tea after it.",
    details: ["Spend it on any treatment or ritual", "Sent by email, or posted as a card with your note", "Valid for 12 months from purchase", "Welcome in all four houses"],
    pay: 120,
    value: 120,
    months: 12,
  },
  {
    kind: "gift",
    id: "long-afternoon",
    name: "The Long Afternoon",
    photo: "pool",
    line: "Steam, a treatment and the pool, with nowhere else to be.",
    details: ["Covers a full ritual with room to spare", "Sent by email, or posted as a card with your note", "Valid for 12 months from purchase", "The day and the therapist are theirs to choose"],
    pay: 250,
    value: 250,
    months: 12,
  },
  {
    kind: "gift",
    id: "open-water",
    name: "Open Water",
    photo: "spring",
    line: "A card that waits for as long as they need it to.",
    details: ["No expiry date", "Spend it on treatments, rituals or a membership", "The balance can be used across more than one visit", "Welcome in all four houses"],
    pay: 400,
    value: 400,
    months: null,
  },
];

export const OFFERS: readonly Offer[] = [...MEMBERSHIPS, ...RITUALS, ...GIFTS];

export function offerById(id: string | null | undefined) {
  return OFFERS.find((offer) => offer.id === id);
}

export const KIND_LABEL: Record<Offer["kind"], string> = {
  membership: "Membership",
  ritual: "Ritual",
  gift: "Gift card",
};
