import type {
  BrandCommerceCopy,
  GiftOffer,
  MembershipOffer,
  PackageOffer,
} from "./types";

export type BrandCommerceData = {
  memberships: MembershipOffer[];
  packages: PackageOffer[];
  gifts: GiftOffer[];
  copy: BrandCommerceCopy;
};

export type DefaultOffersOptions = {
  /** Face tones, in order, for memberships / packages / gift cards. */
  tones?: readonly [string, string, string];
  /** Section eyebrow numbers, e.g. ["03", "04", "05"]. */
  eyebrowNumbers?: readonly [string, string, string];
};

/**
 * Starter commerce catalogue for a brand that has not authored its own yet.
 * Templates are expected to replace this with real offers.
 */
export function defaultOffersForBrand(
  brand: string,
  options: DefaultOffersOptions = {},
): BrandCommerceData {
  const [membershipTone, packageTone, giftTone] = options.tones ?? ["espresso", "champagne", "ink"];
  const [m, p, g] = options.eyebrowNumbers ?? ["03", "04", "05"];
  const slug = brand.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "brand";

  const memberships: MembershipOffer[] = [
    {
      id: `${slug}-house`,
      name: "House Member",
      validityLabel: "Valid for 6 months",
      savePercent: 10,
      description: `Studio credit for cuts, finishes and weekday colour across every ${brand} address.`,
      details: [
        `Wallet credit usable at every ${brand} studio`,
        "Ideal for cuts, finishes and weekday colour",
        "Balance follows you across cities",
        "Unused credit expires with the membership window",
      ],
      pay: 180,
      credit: 200,
      tone: membershipTone,
    },
    {
      id: `${slug}-private-circle`,
      name: "Private Circle",
      validityLabel: "Valid for 12 months",
      savePercent: 15,
      description: "Priority booking windows plus fuller credit for colour and care rituals.",
      details: [
        "Priority booking windows ahead of general release",
        "Higher wallet credit for colour and care rituals",
        "Preferred stylist requests when available",
        "One shared member record across every studio",
      ],
      pay: 320,
      credit: 380,
      tone: packageTone,
    },
    {
      id: `${slug}-everyday`,
      name: "Everyday",
      validityLabel: "Valid for 3 months",
      savePercent: 8,
      description: "A lighter wallet for guests who return often for blowouts and gloss.",
      details: [
        "A lighter wallet for frequent return visits",
        "Best for blowouts, gloss and quick finishes",
        "Redeemable at any participating studio",
        "Simple way to keep a balance ready between appointments",
      ],
      pay: 95,
      credit: 105,
      tone: giftTone,
    },
  ];

  const packages: PackageOffer[] = [
    {
      id: `${slug}-reset`,
      name: "Weekend Reset",
      savePercent: 12,
      sessionsLabel: "1 session included",
      validityLabel: "Valid for 90 days",
      inclusions: ["Scalp ritual", "Treatment", "Signature finish"],
      description: "A complete weekend reset in a single visit.",
      details: [
        "One complete reset visit in a single appointment",
        "Includes scalp ritual, treatment and signature finish",
        "Book any available artist within the validity window",
        "Designed as a weekend recovery ritual",
      ],
      pay: 88,
      worth: 100,
      tone: packageTone,
    },
    {
      id: `${slug}-polished-three`,
      name: "Polished Three",
      savePercent: 14,
      sessionsLabel: "3 sessions included",
      validityLabel: "Valid for 120 days",
      inclusions: ["Blowout session 1", "Blowout session 2", "Blowout session 3"],
      description: "Keep the cut sharp between full appointments.",
      details: [
        "Three signature blowout sessions",
        "Space visits across 120 days",
        "Keep shape and polish between full appointments",
        "Sessions can be booked independently",
      ],
      pay: 120,
      worth: 140,
      tone: membershipTone,
    },
    {
      id: `${slug}-colour-keeping`,
      name: "Colour Keeping",
      savePercent: 11,
      sessionsLabel: "2 sessions included",
      validityLabel: "Valid for 6 months",
      inclusions: ["Gloss service", "Repair treatment", "Home-ritual consult"],
      description: "Maintain luminous colour with guided at-home care.",
      details: [
        "Two visits focused on colour longevity",
        "Gloss service and repair treatment included",
        "Home-ritual consult for between-visit care",
        "Valid for six months from purchase",
      ],
      pay: 155,
      worth: 175,
      tone: giftTone,
    },
  ];

  const gifts: GiftOffer[] = [
    {
      id: `${slug}-new-season`,
      name: "New Season",
      validityLabel: "Valid for 1 year",
      savePercent: 10,
      description: "A new-season invitation for colour, cut or a quiet reset.",
      details: [
        "Redeemable for colour, cut or a quiet reset",
        "Valid for twelve months from purchase",
        `Can be used at any ${brand} studio`,
        "A considered gift for a new season",
      ],
      pay: 90,
      value: 100,
      tone: giftTone,
    },
    {
      id: `${slug}-open-gift`,
      name: "Open Gift",
      validityLabel: "No expiry",
      savePercent: null,
      description: "An open gift, ready whenever they choose to visit.",
      details: [
        "Open value with no expiry date",
        "Recipient chooses when and how to redeem",
        `Valid across every ${brand} studio`,
        "Ideal when you want the gift to wait for them",
      ],
      pay: 150,
      value: 150,
      tone: membershipTone,
    },
    {
      id: `${slug}-wellness-wrapped`,
      name: "Wellness Wrapped",
      validityLabel: "Valid for 1 year",
      savePercent: 8,
      description: "A softer gift for treatment-led rituals and finishes.",
      details: [
        "Suited to treatment-led rituals and finishes",
        "Valid for twelve months from purchase",
        "Redeemable at any participating studio",
        "A quieter gift for restorative care",
      ],
      pay: 120,
      value: 130,
      tone: packageTone,
    },
  ];

  const copy: BrandCommerceCopy = {
    membershipsEyebrow: `${m} / Memberships`,
    membershipsTitle: "Belong with a balance that follows you.",
    membershipsCopy: `Swipe through ${brand} memberships—wallet credit, validity and what you actually pay.`,
    packagesEyebrow: `${p} / Packages`,
    packagesTitle: "Bundled rituals, priced with intention.",
    packagesCopy: "See the sessions included, how long they last, what they are worth and what you pay.",
    giftsEyebrow: `${g} / Gift cards`,
    giftsTitle: "Give them time in the chair.",
    giftsCopy: `Swipe through ${brand} gift cards—each one sized like a card you would keep in your wallet.`,
    membershipSwipeHint: "Swipe to browse memberships",
    giftSwipeHint: "Swipe to browse gift cards",
  };

  return { memberships, packages, gifts, copy };
}
