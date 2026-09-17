/**
 * Serein House commerce catalogue, rendered by the shared BrandCommerce component
 * beneath the embedded Brand Home.
 *
 * Amounts are Singapore dollars and are derived from the house ritual menu
 * (Ground S$136, Float S$118, Illuminate S$98, Unwind S$152) so package worth
 * always reconciles with the listed rituals. Nothing here is a live purchase.
 */

import type {
  BrandCommerceCopy,
  GiftOffer,
  MembershipOffer,
  PackageOffer,
} from "../components/brand-commerce/types";

export const sereinMemberships: MembershipOffer[] = [
  {
    id: "serein-house-member",
    name: "House Member",
    validityLabel: "Valid for 6 months",
    savePercent: 10,
    description: "House credit for the rituals you return to most, redeemable at any Serein address.",
    details: [
      "House credit usable across every ritual on the menu",
      "Balance follows you between houses",
      "Best suited to one visit a month",
      "Unused credit expires with the membership window",
    ],
    pay: 180,
    credit: 200,
    tone: "sage",
  },
  {
    id: "serein-restore-circle",
    name: "Restore Circle",
    validityLabel: "Valid for 12 months",
    savePercent: 15,
    description: "A year of quiet with priority release windows and the fuller house balance.",
    details: [
      "Priority booking windows ahead of general release",
      "Larger balance for long-form therapy and sleep rituals",
      "Preferred therapist requests when available",
      "One shared member record across every house",
    ],
    pay: 380,
    credit: 450,
    tone: "clay",
  },
  {
    id: "serein-weekly-quiet",
    name: "Weekly Quiet",
    validityLabel: "Valid for 3 months",
    savePercent: 8,
    description: "A lighter balance for shorter, more frequent resets.",
    details: [
      "Sized for facials, soaks and shorter rituals",
      "A season-length commitment rather than a year",
      "Redeemable at any participating house",
      "Keeps a balance ready between appointments",
    ],
    pay: 138,
    credit: 150,
    tone: "celadon",
  },
];

export const sereinPackages: PackageOffer[] = [
  {
    id: "serein-three-grounds",
    name: "Three Grounds",
    savePercent: 17,
    sessionsLabel: "3 sessions included",
    validityLabel: "Valid for 120 days",
    inclusions: ["Ground therapy, first visit", "Ground therapy, second visit", "Ground therapy, third visit"],
    description: "Three long-form Ground sessions, spaced the way the body actually recovers.",
    details: [
      "Three 90-minute Ground therapies",
      "Space the visits across 120 days",
      "Each session is booked independently",
      "Pressure notes carry between visits",
    ],
    pay: 340,
    worth: 408,
    tone: "sage",
  },
  {
    id: "serein-float-illuminate",
    name: "Float & Illuminate",
    savePercent: 12,
    sessionsLabel: "2 sessions included",
    validityLabel: "Valid for 90 days",
    inclusions: ["Float mineral ritual", "Illuminate renewal facial", "Home-ritual consult"],
    description: "A mineral soak followed by a sculpting facial — noise out, light back in.",
    details: [
      "One Float ritual and one Illuminate facial",
      "Home-ritual consult for the weeks between",
      "Book the two visits in either order",
      "Valid for 90 days from purchase",
    ],
    pay: 190,
    worth: 216,
    tone: "clay",
  },
  {
    id: "serein-sleep-season",
    name: "The Sleep Season",
    savePercent: 14,
    sessionsLabel: "3 sessions included",
    validityLabel: "Valid for 6 months",
    inclusions: ["Unwind sleep ceremony ×3", "Steam and cocoon ritual", "Sleep-ritual guidance"],
    description: "A season of Unwind ceremonies for people whose nights need the most work.",
    details: [
      "Three 105-minute Unwind ceremonies",
      "Steam and warm cocoon ritual each visit",
      "Guidance for the hours after you leave",
      "Valid for six months from purchase",
    ],
    pay: 390,
    worth: 456,
    tone: "celadon",
  },
];

export const sereinGifts: GiftOffer[] = [
  {
    id: "serein-open-gift",
    name: "The Open Gift",
    validityLabel: "No expiry",
    savePercent: null,
    description: "An open balance that waits until they are ready to put the week down.",
    details: [
      "Open value with no expiry date",
      "Recipient chooses the ritual and the hour",
      "Valid across every Serein House address",
      "Ideal when the gift should wait for them",
    ],
    pay: 150,
    value: 150,
    tone: "celadon",
  },
  {
    id: "serein-one-ritual",
    name: "One Ritual",
    validityLabel: "Valid for 1 year",
    savePercent: 10,
    description: "Enough for one full-body Ground therapy, start to finish.",
    details: [
      "Sized for a 90-minute Ground therapy",
      "Valid for twelve months from purchase",
      "Can be redeemed against any ritual of equal value",
      "Redeemable at any participating house",
    ],
    pay: 122,
    value: 136,
    tone: "sage",
  },
  {
    id: "serein-full-afternoon",
    name: "A Full Afternoon",
    validityLabel: "Valid for 1 year",
    savePercent: 12,
    description: "A soak and a facial in one afternoon — the longer version of a gift.",
    details: [
      "Sized for two rituals in a single visit",
      "Valid for twelve months from purchase",
      "Can be split across two appointments",
      "Redeemable at any participating house",
    ],
    pay: 240,
    value: 272,
    tone: "clay",
  },
];

export const sereinCommerceCopy: BrandCommerceCopy = {
  membershipsEyebrow: "Membership",
  membershipsTitle: "Belong to the house.",
  membershipsCopy:
    "Swipe through Serein House memberships — house credit, validity and what you actually pay. Membership is not purchasable in this preview.",
  packagesEyebrow: "Packages",
  packagesTitle: "Rituals, gathered.",
  packagesCopy:
    "See the sessions included, how long they last, what they are worth and what you pay.",
  giftsEyebrow: "Gift cards",
  giftsTitle: "Give someone quiet.",
  giftsCopy:
    "Swipe through Serein House gift cards — each one sized like a card you would keep in your wallet. Checkout is not connected in this preview.",
  membershipSwipeHint: "Swipe to browse memberships",
  giftSwipeHint: "Swipe to browse gift cards",
};
