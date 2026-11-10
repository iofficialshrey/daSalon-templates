import type { HouseSlug } from "./houses";

/*
 * Demonstration offers. They mirror daSalon's real offer structures
 * (credit wallet and discount plan memberships; session, value and time
 * packages; gift cards with an issue price and a face value). Package values
 * are priced from the houses' live menus as of 11 Oct 2026. Nothing here is sold.
 */

/**
 * The card's material. Memberships are member cards whose metal marks the tier;
 * packages are tickets whose stub is cut from their house's namesake material;
 * gift cards are laid paper in the colour of the occasion.
 */
export type Face =
  | "pearl" | "champagne" | "onyx"
  | "bronze" | "travertine" | "walnut"
  | "olive" | "rose" | "ivory";

type OfferBase = {
  id: string;
  name: string;
  face: Face;
  /** Short badge on the card, e.g. "Best value". */
  badge: string;
  /** Badge inside the detail view, e.g. "Best value deal". */
  detailBadge: string;
  tagline: string;
  description: string;
  chips: [string, string, string];
  pay: number;
  validityMonths: number;
};

export type Membership = OfferBase & {
  kind: "membership";
  type: "credit" | "discount";
  /** The tier, embossed on the card. */
  numeral: "I" | "II" | "III";
  /** Credit wallets: the wallet credit. Discount plans: the discount budget. */
  value: number;
  discountPercent: number | null;
  minSpend: number | null;
  faceLine: string;
};

export type Package = OfferBase & {
  kind: "package";
  house: HouseSlug;
  redemption: "COUNT" | "MONEY" | "TIME";
  /** The big figure on the card face, e.g. "5", "S$400" or "150". */
  figure: string;
  figureUnit: string;
  redemptionLabel: string;
  value: number;
  perSession: number | null;
  includes: string[];
};

export type GiftCard = OfferBase & {
  kind: "gift";
  value: number;
  occasion: string;
};

export type Offer = Membership | Package | GiftCard;

export const MEMBERSHIPS: readonly Membership[] = [
  {
    kind: "membership",
    id: "habitue",
    name: "Habitué",
    type: "discount",
    numeral: "I",
    face: "pearl",
    badge: "25% off",
    detailBadge: "Special membership",
    tagline: "Unlocks 25% off all eligible services",
    description: "For the regular guest: a quarter off every service, at any house, until the plan has saved you S$300 or three months pass.",
    chips: ["Valid for 3 months", "Valid at 4 houses", "Min spend S$50"],
    pay: 100,
    value: 300,
    discountPercent: 25,
    minSpend: 50,
    validityMonths: 3,
    faceLine: "25% off every visit",
  },
  {
    kind: "membership",
    id: "resident",
    name: "Résident",
    type: "credit",
    numeral: "II",
    face: "champagne",
    badge: "Best value",
    detailBadge: "Best value deal",
    tagline: "Get S$300 in wallet credit",
    description: "A balance for the regular rhythm of cuts, facials and massage, drawn down at whichever house you visit.",
    chips: ["Valid for 6 months", "Valid at 4 houses", "Spend on any service"],
    pay: 200,
    value: 300,
    discountPercent: null,
    minSpend: null,
    validityMonths: 6,
    faceLine: "S$300 wallet credit",
  },
  {
    kind: "membership",
    id: "patron",
    name: "Patron",
    type: "credit",
    numeral: "III",
    face: "onyx",
    badge: "Save S$200",
    detailBadge: "Best value deal",
    tagline: "Get S$700 in wallet credit",
    description: "Our fullest balance, for guests who visit more than one house through the year.",
    chips: ["Valid for 12 months", "Valid at 4 houses", "Spend on any service"],
    pay: 500,
    value: 700,
    discountPercent: null,
    minSpend: null,
    validityMonths: 12,
    faceLine: "S$700 wallet credit",
  },
];

export const PACKAGES: readonly Package[] = [
  {
    kind: "package",
    id: "hair-spa-five",
    name: "Hair Spa, Five Visits",
    house: "the-grooming-room",
    face: "bronze",
    redemption: "COUNT",
    figure: "5",
    figureUnit: "Sessions",
    redemptionLabel: "Sessions · 5",
    badge: "Save S$45",
    detailBadge: "Bundled savings",
    tagline: "Five Hair Spa visits for the price of four",
    description: "Five unhurried Hair Spa appointments, booked whenever your hair asks for one.",
    chips: ["Valid for 3 months", "5 sessions", "Book as you go"],
    pay: 180,
    value: 225,
    perSession: 36,
    includes: ["Hair Spa · 1 hr · S$45 × 5"],
    validityMonths: 3,
  },
  {
    kind: "package",
    id: "skin-reset",
    name: "Skin Reset",
    house: "lumiere-aesthetics",
    face: "travertine",
    redemption: "MONEY",
    figure: "S$400",
    figureUnit: "Value",
    redemptionLabel: "Value · S$400",
    badge: "Save S$80",
    detailBadge: "Bundled savings",
    tagline: "S$400 of skin treatments for S$320",
    description: "A HydraFacial to begin and microneedling to follow, spaced across three months as your specialist advises.",
    chips: ["Valid for 3 months", "S$400 to spend", "Private rooms"],
    pay: 320,
    value: 400,
    perSession: null,
    includes: ["HydraFacial · S$180", "Microneedling · S$220"],
    validityMonths: 3,
  },
  {
    kind: "package",
    id: "slow-afternoon",
    name: "A Slow Afternoon",
    house: "serenity-spa-house",
    face: "walnut",
    redemption: "TIME",
    figure: "150",
    figureUnit: "Minutes",
    redemptionLabel: "Time · 150 min",
    badge: "Save S$50",
    detailBadge: "Bundled savings",
    tagline: "150 minutes of massage, in one visit or two",
    description: "Two and a half hours of hot stone massage, taken together or split across two quieter afternoons.",
    chips: ["Valid for 3 months", "150 minutes", "One visit or two"],
    pay: 230,
    value: 280,
    perSession: null,
    includes: ["Hot Stone Massage · 1 hr 15 min · S$140 × 2"],
    validityMonths: 3,
  },
];

export const GIFT_CARDS: readonly GiftCard[] = [
  {
    kind: "gift",
    id: "house-card",
    name: "The House Card",
    face: "olive",
    badge: "Save S$20",
    detailBadge: "Special gift offer",
    tagline: "Worth S$200 for any treatment",
    description: "A card for any treatment at any of the four houses, sent with your message or kept for yourself.",
    chips: ["Valid for 12 months", "Valid at 4 houses", "Use yourself or share with anyone"],
    pay: 180,
    value: 200,
    validityMonths: 12,
    occasion: "Any occasion",
  },
  {
    kind: "gift",
    id: "birthday",
    name: "The Birthday Card",
    face: "rose",
    badge: "Save S$25",
    detailBadge: "Special gift offer",
    tagline: "Worth S$150 for any treatment",
    description: "A card for any treatment at any of the four houses, sent with your message or kept for yourself.",
    chips: ["Valid for 6 months", "Valid at 4 houses", "Use yourself or share with anyone"],
    pay: 125,
    value: 150,
    validityMonths: 6,
    occasion: "Birthdays and thanks",
  },
  {
    kind: "gift",
    id: "wedding-party",
    name: "For the Wedding Party",
    face: "ivory",
    badge: "Save S$50",
    detailBadge: "Special gift offer",
    tagline: "Worth S$500 at any house, bridal at Ivory House included",
    description: "A card for any treatment at any of the four houses, sent with your message or kept for yourself.",
    chips: ["Valid for 12 months", "Valid at 4 houses", "Use yourself or share with anyone"],
    pay: 450,
    value: 500,
    validityMonths: 12,
    occasion: "Weddings and milestones",
  },
];

export const OFFER_BY_ID = new Map<string, Offer>([
  ...MEMBERSHIPS.map((offer) => [offer.id, offer] as const),
  ...PACKAGES.map((offer) => [offer.id, offer] as const),
  ...GIFT_CARDS.map((offer) => [offer.id, offer] as const),
]);

export function membershipValueLabel(offer: Membership) {
  return offer.type === "credit" ? "Total value" : "Discount budget";
}
