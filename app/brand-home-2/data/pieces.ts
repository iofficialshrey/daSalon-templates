import type { AtelierSlug } from "./ateliers";

/*
 * Demonstration pieces. They mirror daSalon's real offer structures (credit
 * wallet and discount plan memberships; session, value and time packages; gift
 * cards with an issue price and a face value). Package values use the live menu
 * prices of 12 Oct 2026. Nothing here is sold: no payment, no storage, no network.
 */

export type DetailRow = { label: string; value: string };

type PieceBase = {
  id: string;
  name: string;
  tagline: string;
  description: string;
  chips: [string, string, string];
  /** What the guest pays, in S$. */
  pay: number;
  validityMonths: number;
  details: DetailRow[];
};

export type Membership = PieceBase & {
  kind: "membership";
  type: "credit" | "discount";
  /** "Credit wallet · 6 months" (rendered uppercase on the tag). */
  typeLine: string;
  badge: string;
  /** Credit wallets: the wallet credit. Discount plans: the discount budget. */
  value: number;
  discountPercent: number | null;
  minSpend: number | null;
  /** Big value on the tag: "S$220" or "15%". */
  figure: string;
  /** Unit under the figure: "credit" or "off". */
  figureUnit: string;
  /** "All four ateliers · Any service" */
  meta: string;
};

export type Redemption =
  | { type: "sessions"; count: number; caption: string }
  | { type: "value"; cells: number; cellValue: number; caption: string }
  | { type: "time"; cells: number; cellMinutes: number; caption: string };

export type Package = PieceBase & {
  kind: "package";
  /** Line-sheet style number, "P-01". */
  style: string;
  atelier: AtelierSlug;
  redemption: Redemption;
  /** "Sessions", "Value" or "Time". */
  redemptionLabel: string;
  includes: string;
  /** Package value at today's live prices. */
  value: number;
  /** "S$20 per session", when it helps. */
  perUnit: string | null;
  /** Live service whose name starts a "Book your first session" booking at the Time step. */
  firstService: string | null;
};

export type GiftCard = PieceBase & {
  kind: "gift";
  value: number;
  occasion: string;
  /** The card's tone. */
  band: "noir" | "chalk" | "champagne";
};

export type Piece = Membership | Package | GiftCard;

export const MEMBERSHIPS: readonly Membership[] = [
  {
    kind: "membership",
    id: "everyday",
    name: "Everyday Atelier",
    type: "credit",
    typeLine: "Credit wallet · 6 months",
    badge: "S$40 extra",
    tagline: "S$220 to spend at any atelier.",
    description: "A first wallet for regular cuts, facials and massages, drawn down at whichever atelier you book.",
    chips: ["6 months", "All four ateliers", "Any service"],
    pay: 180,
    value: 220,
    discountPercent: null,
    minSpend: null,
    figure: "S$220",
    figureUnit: "credit",
    meta: "All four ateliers · Any service",
    validityMonths: 6,
    details: [
      { label: "Type", value: "Credit wallet" },
      { label: "Wallet credit", value: "S$220" },
      { label: "You pay", value: "S$180" },
      { label: "Validity", value: "6 months from purchase" },
      { label: "Use at", value: "All four ateliers, any service" },
      { label: "Online purchase", value: "Available" },
      { label: "At the desk", value: "Available" },
    ],
  },
  {
    kind: "membership",
    id: "circle",
    name: "The Atelier Circle",
    type: "credit",
    typeLine: "Credit wallet · 12 months",
    badge: "Most credit",
    tagline: "S$800 for the whole year.",
    description: "The fullest wallet, for guests who move between ateliers: a cut at Clementi, a facial at Changi, a massage after.",
    chips: ["12 months", "All four ateliers", "Any service"],
    pay: 600,
    value: 800,
    discountPercent: null,
    minSpend: null,
    figure: "S$800",
    figureUnit: "credit",
    meta: "All four ateliers · Any service",
    validityMonths: 12,
    details: [
      { label: "Type", value: "Credit wallet" },
      { label: "Wallet credit", value: "S$800" },
      { label: "You pay", value: "S$600" },
      { label: "Validity", value: "12 months from purchase" },
      { label: "Use at", value: "All four ateliers, any service" },
      { label: "Online purchase", value: "Available" },
      { label: "At the desk", value: "Available" },
    ],
  },
  {
    kind: "membership",
    id: "house-member",
    name: "House Member",
    type: "discount",
    typeLine: "Discount plan · 6 months",
    badge: "15% off",
    tagline: "15% off every visit from S$40.",
    description: "For frequent, smaller visits: 15% off each eligible service until the plan has saved you S$240 or six months pass.",
    chips: ["6 months", "All four ateliers", "Min spend S$40"],
    pay: 90,
    value: 240,
    discountPercent: 15,
    minSpend: 40,
    figure: "15%",
    figureUnit: "off",
    meta: "Up to S$240 off · All four ateliers",
    validityMonths: 6,
    details: [
      { label: "Type", value: "Discount plan" },
      { label: "Discount", value: "15% on all services" },
      { label: "Minimum spend", value: "S$40 per visit" },
      { label: "Discount budget", value: "S$240" },
      { label: "Validity", value: "6 months from purchase" },
      { label: "Use at", value: "All four ateliers" },
      { label: "Online purchase", value: "Available" },
      { label: "At the desk", value: "Available" },
    ],
  },
];

const PACKAGE_COMMON = (redemption: string, atelier: string, includes: string): DetailRow[] => [
  { label: "Type", value: "Package" },
  { label: "Redemption", value: redemption },
  { label: "Validity", value: "3 months from purchase" },
  { label: "Included services", value: includes },
  { label: "Used at", value: `${atelier} only` },
  { label: "Online purchase", value: "Available" },
  { label: "At the desk", value: "Available" },
];

export const PACKAGES: readonly Package[] = [
  {
    kind: "package",
    id: "six-beard-styles",
    style: "P-01",
    name: "Six Beard Styles",
    atelier: "the-grooming-room",
    redemption: { type: "sessions", count: 6, caption: "6 sessions" },
    redemptionLabel: "Sessions",
    includes: "Beard Styling · 45 min · S$25 × 6",
    tagline: "Six beard styles, S$20 each.",
    description: "Six Beard Styling appointments at The Clementi Atelier, booked whenever the shape needs keeping.",
    chips: ["3 months", "6 sessions", "Book as you go"],
    pay: 120,
    value: 150,
    perUnit: "S$20 per session",
    firstService: "Beard Styling",
    validityMonths: 3,
    details: PACKAGE_COMMON("6 sessions", "The Clementi Atelier", "Beard Styling · 45 min"),
  },
  {
    kind: "package",
    id: "skin-account",
    style: "P-02",
    name: "The Skin Account",
    atelier: "lumiere-aesthetics",
    redemption: { type: "value", cells: 6, cellValue: 100, caption: "6 × S$100" },
    redemptionLabel: "Value",
    includes: "Any Facial or Skin Care treatment, including HydraFacial (S$180)",
    tagline: "S$600 of skin treatments for S$500.",
    description: "A balance for the treatments your specialist recommends, from a HydraFacial to a facial series, spaced across three months.",
    chips: ["3 months", "S$600 to spend", "Adults only"],
    pay: 500,
    value: 600,
    perUnit: null,
    firstService: null,
    validityMonths: 3,
    details: PACKAGE_COMMON("S$600 of treatments", "The Changi Studio", "Any Facial or Skin Care treatment"),
  },
  {
    kind: "package",
    id: "sunday-reset",
    style: "P-03",
    name: "The Sunday Reset",
    atelier: "serenity-spa-house",
    redemption: { type: "time", cells: 3, cellMinutes: 60, caption: "3 × 60 min" },
    redemptionLabel: "Time",
    includes: "180 minutes of Swedish, Aromatherapy or Hot Stone Massage",
    tagline: "180 minutes of massage, in one long afternoon or several.",
    description: "Three hours of massage at The Garden Spa, taken in one long afternoon or split across quieter ones.",
    chips: ["3 months", "180 minutes", "One visit or several"],
    pay: 270,
    value: 330,
    perUnit: null,
    firstService: null,
    validityMonths: 3,
    details: PACKAGE_COMMON("180 minutes", "The Garden Spa", "Swedish, Aromatherapy or Hot Stone Massage"),
  },
];

const GIFT_DETAILS = (value: string, pay: string, months: number): DetailRow[] => [
  { label: "Type", value: "Gift card" },
  { label: "Card value", value },
  { label: "You pay", value: pay },
  { label: "Validity", value: `${months} months from purchase` },
  { label: "Redeemable at", value: "All four ateliers" },
  { label: "Delivery", value: "In the live product, by email and SMS with your message" },
];

export const GIFT_CARDS: readonly GiftCard[] = [
  {
    kind: "gift",
    id: "open-card",
    name: "The Open Card",
    occasion: "For anyone, for anything",
    tagline: "S$300 for any service at any atelier.",
    description: "An open card for whoever it is for: a cut, a facial, a massage or the whole afternoon.",
    chips: ["Valid 12 months", "All four ateliers", "Keep it or give it"],
    pay: 270,
    value: 300,
    validityMonths: 12,
    band: "noir",
    details: GIFT_DETAILS("S$300", "S$270", 12),
  },
  {
    kind: "gift",
    id: "small-gesture",
    name: "The Small Gesture",
    occasion: "Thanks and birthdays",
    tagline: "Covers a Swedish Massage at The Garden Spa.",
    description: "A smaller card for thanks and birthdays, enough for an hour's massage or a cut and a manicure.",
    chips: ["Valid 6 months", "All four ateliers", "Keep it or give it"],
    pay: 90,
    value: 100,
    validityMonths: 6,
    band: "chalk",
    details: GIFT_DETAILS("S$100", "S$90", 6),
  },
  {
    kind: "gift",
    id: "bridal-card",
    name: "The Bridal Card",
    occasion: "Weddings and engagements",
    tagline: "Covers Bridal Makeup at The Sentosa Suite, with S$150 to spare.",
    description: "For the engaged: bridal make-up on the day, with enough left for nails or the groom's grooming.",
    chips: ["Valid 12 months", "All four ateliers", "Keep it or give it"],
    pay: 550,
    value: 600,
    validityMonths: 12,
    band: "champagne",
    details: GIFT_DETAILS("S$600", "S$550", 12),
  },
];

const ALL: readonly Piece[] = [...MEMBERSHIPS, ...PACKAGES, ...GIFT_CARDS];

export function pieceById(id: string): Piece | undefined {
  return ALL.find((piece) => piece.id === id);
}

export function packageFor(slug: AtelierSlug): Package | undefined {
  return PACKAGES.find((item) => item.atelier === slug);
}

/** "You save" in S$; null for a discount plan, whose value is a discount budget, not a saving. */
export function savingOf(piece: Piece): number | null {
  if (piece.kind === "membership" && piece.type === "discount") return null;
  return Math.max(0, piece.value - piece.pay);
}
