import type { PublicService } from "@/lib/dasalon/types";
import type { StudioSlug } from "./studios";

/*
 * Demonstration offers. They mirror daSalon's real structures: memberships
 * are a credit wallet or a discount plan; packages redeem by sessions, value or
 * time; gift cards have an issue price and a face value. Set values use the
 * studios' live menu prices of 13 Oct 2026. Savings are always computed, never
 * typed. Nothing here is sold: no payment, no network, no storage.
 */

export type ArtKey =
  | "ledger-paloma-circle"
  | "ledger-studio-card"
  | "ledger-front-row"
  | "set-wedding-week"
  | "gift-open-edition"
  | "gift-first-proof"
  | "gift-late-edition";

export type Membership = {
  id: "paloma-circle" | "studio-card" | "front-row";
  name: string;
  kind: "credit" | "discount";
  /** What the guest pays, in S$. */
  pay: number;
  /** Credit wallets: the wallet credit. */
  credit: number | null;
  /** Discount plans. */
  discountPercent: number | null;
  minSpend: number | null;
  discountBudget: number | null;
  months: number;
  /** "Credit wallet · 12 months" */
  typeLine: string;
  tagline: string;
  description: string;
  howItWorks: [string, string, string];
  art: ArtKey;
};

export type SetOffer = {
  id: "the-standing-edit" | "the-wedding-week" | "four-slow-hours";
  name: string;
  studio: StudioSlug;
  redemption: "COUNT" | "MONEY" | "TIME";
  /** The big figure on the card: "6", "S$720", "240". */
  figure: string;
  /** Under the figure: "sessions", "to spend", "minutes". */
  unit: string;
  /** Redemption tag: "Sessions · 6". */
  tag: string;
  /** Detail-view redemption line: "6 sessions". */
  redemptionLine: string;
  line: string;
  includes: string[];
  /** Worth at today's menu prices (a minimum for time sets). */
  value: number;
  valueIsMinimum: boolean;
  pay: number;
  months: number;
  /** Live service name that "Book your first session" opens at the Time step. */
  firstService: string;
  tone: "cobalt" | "ink" | "outline";
  art: ArtKey | null;
};

export type GiftDesign = {
  id: "open-edition" | "first-proof" | "late-edition";
  name: string;
  coverLine: string;
  ground: "cobalt" | "porcelain" | "ink";
  art: ArtKey;
};

export type GiftValue = {
  value: number;
  pay: number;
  /** A computed "Covers a …" line, shown only when the live menu confirms it. */
  covers: { studio: StudioSlug; services: string[]; text: string };
};

export const MEMBERSHIPS: readonly Membership[] = [
  {
    id: "paloma-circle",
    name: "Paloma Circle",
    kind: "credit",
    pay: 360,
    credit: 420,
    discountPercent: null,
    minSpend: null,
    discountBudget: null,
    months: 12,
    typeLine: "Credit wallet · 12 months",
    tagline: "S$420 to spend across all four studios.",
    description: "Our fullest wallet, for guests who move between studios — a cut in Clementi, a facial in Changi, a massage next door.",
    howItWorks: [
      "Spend the credit on any service at any of the four studios.",
      "Your balance is applied when you confirm a booking, and shown at every visit.",
      "Unused credit closes when the membership ends.",
    ],
    art: "ledger-paloma-circle",
  },
  {
    id: "studio-card",
    name: "Studio Card",
    kind: "credit",
    pay: 180,
    credit: 200,
    discountPercent: null,
    minSpend: null,
    discountBudget: null,
    months: 6,
    typeLine: "Credit wallet · 6 months",
    tagline: "S$200 for the half-year.",
    description: "A half-year balance for guests who keep one shape and refresh it often — finishes, nails or a massage.",
    howItWorks: [
      "Spend the credit on any service at any of the four studios.",
      "Your balance is applied when you confirm a booking, and shown at every visit.",
      "Unused credit closes when the membership ends.",
    ],
    art: "ledger-studio-card",
  },
  {
    id: "front-row",
    name: "Front Row",
    kind: "discount",
    pay: 80,
    credit: null,
    discountPercent: 15,
    minSpend: 40,
    discountBudget: 240,
    months: 6,
    typeLine: "Discount plan · 6 months",
    tagline: "15% off every visit from S$40.",
    description: "For frequent visits: 15% off each eligible visit until the plan has saved you S$240 or six months pass.",
    howItWorks: [
      "15% comes off each eligible visit of S$40 or more.",
      "The plan ends once it has saved you S$240, or after 6 months.",
      "Use it at any of the four studios.",
    ],
    art: "ledger-front-row",
  },
];

export const SETS: readonly SetOffer[] = [
  {
    id: "the-standing-edit",
    name: "The Standing Edit",
    studio: "the-grooming-room",
    redemption: "COUNT",
    figure: "6",
    unit: "sessions",
    tag: "Sessions · 6",
    redemptionLine: "6 sessions",
    line: "A standing appointment with your hair: three spa treatments and three finishes, booked when you like.",
    includes: ["Hair Spa · 1 hr · S$45 × 3", "Hair Styling · 30 min · S$20 × 3"],
    value: 195,
    valueIsMinimum: false,
    pay: 165,
    months: 3,
    firstService: "Hair Spa",
    tone: "cobalt",
    art: null,
  },
  {
    id: "the-wedding-week",
    name: "The Wedding Week",
    studio: "bride-groom",
    redemption: "MONEY",
    figure: "S$720",
    unit: "to spend",
    tag: "Value · S$720",
    redemptionLine: "S$720 to spend",
    line: "S$720 of bridal care for S$620: make-up for the day, with a scrub, manicure and pedicure in the week before.",
    includes: [
      "Bridal Makeup · 2 hr · S$450",
      "Bridal Body Scrub · 1 hr · S$120",
      "Bridal Pedicure · 1 hr · S$80",
      "Bridal Manicure · 1 hr · S$70",
    ],
    value: 720,
    valueIsMinimum: false,
    pay: 620,
    months: 6,
    firstService: "Bridal Body Scrub",
    tone: "ink",
    art: "set-wedding-week",
  },
  {
    id: "four-slow-hours",
    name: "Four Slow Hours",
    studio: "serenity-spa-house",
    redemption: "TIME",
    figure: "240",
    unit: "minutes",
    tag: "Time · 240 min",
    redemptionLine: "240 minutes",
    line: "Four hours of massage, taken an hour at a time.",
    includes: ["Swedish, Aromatherapy or Deep Tissue Massage · 1 hr each (S$100–S$120)"],
    value: 400,
    valueIsMinimum: true,
    pay: 340,
    months: 4,
    firstService: "Swedish Massage",
    tone: "outline",
    art: null,
  },
];

export const GIFT_DESIGNS: readonly GiftDesign[] = [
  { id: "open-edition", name: "Open Edition", coverLine: "For the change", ground: "cobalt", art: "gift-open-edition" },
  { id: "first-proof", name: "First Proof", coverLine: "For a first time", ground: "porcelain", art: "gift-first-proof" },
  { id: "late-edition", name: "Late Edition", coverLine: "For after hours", ground: "ink", art: "gift-late-edition" },
];

export const GIFT_VALUES: readonly GiftValue[] = [
  { value: 80, pay: 80, covers: { studio: "the-grooming-room", services: ["Manicure", "Pedicure"], text: "Covers a Manicure and a Pedicure at The Grooming Room." } },
  { value: 150, pay: 140, covers: { studio: "serenity-spa-house", services: ["Deep Tissue Massage"], text: "Covers a Deep Tissue Massage at Serenity Spa House." } },
  { value: 300, pay: 270, covers: { studio: "lumiere-aesthetics", services: ["HydraFacial", "Skin Analysis"], text: "Covers a HydraFacial and a Skin Analysis at Lumiere Aesthetics." } },
  { value: 500, pay: 450, covers: { studio: "bride-groom", services: ["Bridal Makeup"], text: "Covers Bridal Makeup at Bride & Groom." } },
];

export const DEFAULT_GIFT = { design: "open-edition" as GiftDesign["id"], value: 150 };

export const GIFT_MONTHS = 12;

/* ---------- Helpers: numbers are computed, never typed ---------- */

/** What the offer is worth. */
export function worthOf(offer: Membership | SetOffer | GiftValue): number {
  if ("kind" in offer) return offer.kind === "credit" ? offer.credit ?? offer.pay : offer.discountBudget ?? 0;
  return offer.value;
}

/** S$ saved; null for a discount plan (its value is a budget, not a saving). */
export function saving(offer: Membership | SetOffer | GiftValue): number | null {
  if ("kind" in offer && offer.kind === "discount") return null;
  return Math.max(0, worthOf(offer) - offer.pay);
}

export function savePercent(offer: Membership | SetOffer | GiftValue): number | null {
  const saved = saving(offer);
  if (saved === null) return null;
  return Math.floor((saved / worthOf(offer)) * 100);
}

export function giftValue(value: number): GiftValue | undefined {
  return GIFT_VALUES.find((item) => item.value === value);
}

/** What the guest pays for a gift card of this face value. */
export function giftPay(value: number): number {
  return giftValue(value)?.pay ?? value;
}

/**
 * The "Covers a …" line, only when every named service is on that studio's live
 * menu and their total (with GST where the API gives it) fits the card value.
 */
export function coversLine(value: number, services: readonly PublicService[] | null | undefined): string | null {
  const item = giftValue(value);
  if (!item || !services?.length) return null;
  let sum = 0;
  for (const name of item.covers.services) {
    const service = services.find((entry) => entry.name.toLowerCase() === name.toLowerCase());
    if (!service) return null;
    sum += Number.isFinite(service.total) ? service.total : service.price;
  }
  return sum <= value ? item.covers.text : null;
}

export function membershipById(id: string) {
  return MEMBERSHIPS.find((item) => item.id === id);
}

export function setById(id: string) {
  return SETS.find((item) => item.id === id);
}

export function giftDesignById(id: string) {
  return GIFT_DESIGNS.find((item) => item.id === id);
}
