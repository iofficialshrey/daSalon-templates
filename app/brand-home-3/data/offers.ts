import { formatDuration, formatPrice } from "@/lib/dasalon/locale";
import type { ArtKey } from "./art";
import type { GiftCard, GiftDraft } from "./gifts";
import type { PlaceSlug } from "./places";
import type { RitualId } from "./rituals";

/*
 * Demonstration offers. Every figure comes from the live menus of 13 Oct 2026
 * and uses `price` only (the public payload has no `total`). Savings are
 * computed, never typed. Nothing here is sold: no payment, no network, no
 * storage. Memberships and gift cards are valid at all four places; each
 * package belongs to one place. The gift cards live in gifts.ts (re-exported
 * here), so the gifts section never ships the memberships and packages.
 */

export { GIFTS, GIFT_DELIVERY, GIFT_DESCRIPTION, coversLine, giftById, type GiftCard, type GiftDraft } from "./gifts";

export const PRICED_ON = "2026-10-13";

export type OfferKind = "membership" | "package" | "gift";
export type OfferRequest = { kind: OfferKind; id: string; view?: "details" | "receipt" };

export type Membership = {
  id: "house-rhythm" | "restored-year" | "weekly-quiet";
  number: "01" | "02" | "03";
  name: string;
  kind: "credit" | "discount";
  pay: number;
  /** Credit tiers. */
  credit: number | null;
  /** Discount plan. */
  discountPercent: number | null;
  minSpend: number | null;
  /** A budget, not a saving. */
  discountBudget: number | null;
  months: number;
  typeLine: string;
  figureLine: string;
  badge: string;
  tagline: string;
  description: string;
  howItWorks: readonly [string, string, string];
  examples: readonly { service: string; usual: number; pay: number }[] | null;
  art: ArtKey;
};

export type IncludeLine = { service: string; minutes: number; price: number; count: number };

export type PackageOffer = {
  id: "three-grounds" | "unwind-ritual" | "water-hours";
  name: string;
  place: PlaceSlug;
  ritual: RitualId;
  redemption: "COUNT" | "TIME";
  chip: string;
  line: string;
  includes: readonly IncludeLine[];
  /** TIME packages: minutes, spent in rounds. */
  time: { minutes: number; round: number } | null;
  value: number;
  valueMax: number | null;
  valueIsMinimum: boolean;
  pay: number;
  months: number;
  firstService: string;
  equation: string;
  perUnit: string;
  note: string | null;
  receiptLine: string;
  art: ArtKey;
};

export type Receipt = { reference: string; stamp: string; until: string; pay: number; draft: GiftDraft | null };

/* ---------- Memberships (valid at all four places) ---------- */

export const MEMBERSHIPS: readonly Membership[] = [
  {
    id: "house-rhythm",
    number: "01",
    name: "House Rhythm",
    kind: "credit",
    pay: 540,
    credit: 600,
    discountPercent: null,
    minSpend: null,
    discountBudget: null,
    months: 6,
    typeLine: "Credit · 6 months · all four places",
    figureLine: "Pay S$540 · S$600 to spend",
    badge: "S$60 extra",
    tagline: "S$600 to draw on, about one ritual a month.",
    description:
      "For the person who has decided rest is not an emergency. Draw it down an hour at a time: a Swedish Massage at Serenity Spa House, a facial in Changi, a Hair Spa next door at The Grooming Room.",
    howItWorks: [
      "Spend the credit on any treatment at any of the four places.",
      "Your balance is used when you pay, after each visit.",
      "Whatever is left closes when the six months end.",
    ],
    examples: null,
    art: "face-house-rhythm",
  },
  {
    id: "restored-year",
    number: "02",
    name: "The Restored Year",
    kind: "credit",
    pay: 1000,
    credit: 1200,
    discountPercent: null,
    minSpend: null,
    discountBudget: null,
    months: 12,
    typeLine: "Credit · 12 months · all four places",
    figureLine: "Pay S$1,000 · S$1,200 to spend",
    badge: "S$200 extra",
    tagline: "S$1,200 for the year, about a ritual a month.",
    description:
      "Our fullest balance, for a year of returning: twelve Swedish Massages' worth, or a Hot Stone hour one month and a Brightening Facial the next, at whichever place suits the day.",
    howItWorks: [
      "Spend the credit on any treatment at any of the four places.",
      "Your balance is used when you pay, after each visit.",
      "Whatever is left closes when the twelve months end.",
    ],
    examples: null,
    art: "face-restored-year",
  },
  {
    id: "weekly-quiet",
    number: "03",
    name: "Weekly Quiet",
    kind: "discount",
    pay: 60,
    credit: null,
    discountPercent: 20,
    minSpend: 45,
    discountBudget: 180,
    months: 3,
    typeLine: "Plan · 3 months · all four places",
    figureLine: "Pay S$60 · 20% off every visit from S$45",
    badge: "Saves up to S$180",
    tagline: "20% off every short ritual from S$45.",
    description:
      "For shorter, more frequent resets: a Head Massage after work, Steam Therapy on a Sunday, a Foot Massage when the week has been long.",
    howItWorks: [
      "20% comes off every visit of S$45 or more, at any of the four places.",
      "The plan ends when it has saved you S$180, or after three months, whichever comes first.",
      "It pays for itself after S$300 of visits.",
    ],
    examples: [
      { service: "Aromatherapy Massage", usual: 110, pay: 88 },
      { service: "Head Massage", usual: 50, pay: 40 },
      { service: "Steam Therapy", usual: 45, pay: 36 },
    ],
    art: "face-weekly-quiet",
  },
];

/* ---------- Packages (all at Serenity Spa House) ---------- */

export const PACKAGES: readonly PackageOffer[] = [
  {
    id: "three-grounds",
    name: "Three Grounds",
    place: "serenity-spa-house",
    ritual: "ground",
    redemption: "COUNT",
    chip: "Sessions · 3",
    line: "Three Hot Stone hours, spaced the way the body actually recovers.",
    includes: [{ service: "Hot Stone Massage", minutes: 75, price: 140, count: 3 }],
    time: null,
    value: 420,
    valueMax: null,
    valueIsMinimum: false,
    pay: 360,
    months: 4,
    firstService: "Hot Stone Massage",
    equation: "3 × S$140 = S$420 · you pay S$360 · you save S$60",
    perUnit: "S$120 a session",
    note: null,
    receiptLine: "Three Hot Stone Massages",
    art: "set-three-grounds",
  },
  {
    id: "unwind-ritual",
    name: "The Unwind Ritual",
    place: "serenity-spa-house",
    ritual: "unwind",
    redemption: "COUNT",
    chip: "Ritual · 3 steps",
    line: "Steam, quiet touch, then a warm cocoon. Take the whole sequence in one unhurried afternoon, or one step at a time.",
    includes: [
      { service: "Steam Therapy", minutes: 30, price: 45, count: 1 },
      { service: "Aromatherapy Massage", minutes: 60, price: 110, count: 1 },
      { service: "Body Wrap", minutes: 60, price: 100, count: 1 },
    ],
    time: null,
    value: 255,
    valueMax: null,
    valueIsMinimum: false,
    pay: 215,
    months: 3,
    firstService: "Steam Therapy",
    equation: "S$45 + S$110 + S$100 = S$255 · you pay S$215 · you save S$40",
    perUnit: "150 minutes in all",
    note: "Two and a half hours in all. To take it in one visit, start by 3:30 pm; Serenity Spa House closes at 6:00 pm.",
    receiptLine: "Steam Therapy, an Aromatherapy Massage and a Body Wrap",
    art: "set-unwind-ritual",
  },
  {
    id: "water-hours",
    name: "The Water Hours",
    place: "serenity-spa-house",
    ritual: "float",
    redemption: "TIME",
    chip: "Time · 3 hours",
    line: "Six half-hours of warm water, dry heat and steam. Mix them however the week asks.",
    includes: [
      { service: "Jacuzzi Session", minutes: 30, price: 60, count: 0 },
      { service: "Sauna Session", minutes: 30, price: 50, count: 0 },
      { service: "Steam Therapy", minutes: 30, price: 45, count: 0 },
    ],
    time: { minutes: 180, round: 30 },
    value: 270,
    valueMax: 360,
    valueIsMinimum: true,
    pay: 240,
    months: 3,
    firstService: "Jacuzzi Session",
    equation: "6 × 30 min · worth S$270 (all steam) to S$360 (all jacuzzi) · you pay S$240",
    perUnit: "S$40 a half hour",
    note: null,
    receiptLine: "Three hours of jacuzzi, sauna or steam, 30 minutes at a time",
    art: "set-water-hours",
  },
];

/* ---------- Helpers: pure, numbers computed, never typed ---------- */

export const extraCredit = (m: Membership) => (m.credit == null ? null : m.credit - m.pay);
export const saving = (o: PackageOffer | GiftCard) => (o.value > o.pay ? o.value - o.pay : null);
export const savePercent = (o: PackageOffer | GiftCard) => {
  const s = saving(o);
  return s == null ? null : Math.floor((s / o.value) * 100);
};

export const membershipById = (id: string) => MEMBERSHIPS.find((m) => m.id === id);
export const packageById = (id: string) => PACKAGES.find((p) => p.id === id);
/** "Hot Stone Massage · 1 hr 15 min · S$140 × 3" */
export const includeText = (line: IncludeLine) =>
  `${line.service} · ${formatDuration(line.minutes)} · ${formatPrice(line.price)}${line.count > 1 ? ` × ${line.count}` : ""}`;
