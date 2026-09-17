/**
 * STUDIO / 07 editorial configuration.
 * Operational booking data comes from da Salon; this module holds brand copy and media paths only.
 */

import type {
  BrandCommerceCopy,
  GiftOffer,
  MembershipOffer,
  PackageOffer,
} from "../components/brand-commerce/types";

export const studioIdentity = {
  brand: "STUDIO / 07",
  shortName: "Studio 07",
  tagline: "Hair. Beauty. Presence.",
  demoNotice: "Fictional demonstration Brand Home. Membership, gift, and loyalty previews are illustrative demo content — not live purchases.",
} as const;

export const assets = {
  /** Approved hero still (user-supplied). Square 1024² — model sits right; left negative space for type. */
  heroStill: "/brand-home-7/hero-desktop.jpg",
  /** No hero film yet — hold still until Higgsfield clip arrives. */
  heroFilm: null as string | null,
  /** Editorial portrait — menu / people chapter support (not a treatment photo). */
  peoplePortrait: "/brand-home-7/menu-side.jpg",
  /** Craft photograph for ivory people chapter. */
  craftPhoto: "/brand-home-7/service-01.jpg",
  /** Soft hair finish editorial (story / soft services only when name-matched). */
  hairFinish: "/brand-home-7/service-04.jpg",
  /** Product-bowl still — not used as treatment photography. */
  ritualStill: "/brand-home-7/service-02.jpg",
  /** Portrait — story / people only. */
  storyPortrait: "/brand-home-7/service-03.jpg",
  venues: [
    "/brand-home-7/venue-01.jpg",
    "/brand-home-7/venue-02.jpg",
    "/brand-home-7/venue-03.jpg",
  ],
  temporaryMediaNote:
    "Hero still and craft/architecture plates are in use. Treatment photography is incomplete: massage, colour, facial, and nails use typographic panels until approved treatment images arrive. Venue photos are labelled illustrative unless keyed to a live venue ID.",
} as const;

export type MenuPreview =
  | { kind: "photo"; src: string; alt: string }
  | { kind: "composition"; composition: "membership" | "package" | "gift" | "loyalty" | "people"; label: string };

export type MenuChapter = {
  id: string;
  href: string;
  label: string;
  descriptor: string;
  captionTitle: string;
  captionLine: string;
  preview: MenuPreview;
};

/** Primary chapter index — each destination is unique. */
export const menuChapters: MenuChapter[] = [
  {
    id: "edit",
    href: "#services",
    label: "The Edit",
    descriptor: "Services",
    captionTitle: "THE EDIT",
    captionLine: "Find your next look.",
    preview: {
      kind: "photo",
      src: assets.craftPhoto,
      alt: "Precision hair craft in the studio",
    },
  },
  {
    id: "story",
    href: "#story",
    label: "Our Story",
    descriptor: "About the studio",
    captionTitle: "OUR STORY",
    captionLine: "Craft with consequence.",
    preview: {
      kind: "photo",
      src: assets.storyPortrait,
      alt: "Editorial studio presence",
    },
  },
  {
    id: "people",
    href: "#people",
    label: "The People",
    descriptor: "Our team",
    captionTitle: "THE PEOPLE",
    captionLine: "It starts with you.",
    // No verified staff photography yet — designed composition, not a model portrait as “team”.
    preview: {
      kind: "composition",
      composition: "people",
      label: "IT STARTS WITH YOU.",
    },
  },
  {
    id: "studios",
    href: "#venues",
    label: "Our Studios",
    descriptor: "Locations",
    captionTitle: "OUR STUDIOS",
    captionLine: "Find your studio.",
    preview: {
      kind: "photo",
      src: assets.venues[0],
      alt: "Studio architecture",
    },
  },
];

export type MenuSecondaryLink = {
  id: string;
  href: string;
  label: string;
  captionTitle: string;
  captionLine: string;
  preview: MenuPreview;
};

export const menuSecondary: MenuSecondaryLink[] = [
  {
    id: "memberships",
    href: "#memberships",
    label: "Memberships",
    captionTitle: "INNER CIRCLE",
    captionLine: "Illustrative membership preview.",
    preview: { kind: "composition", composition: "membership", label: "INNER CIRCLE" },
  },
  {
    id: "packages",
    href: "#packages",
    label: "Packages",
    captionTitle: "PACKAGES",
    captionLine: "Rituals, bundled.",
    preview: { kind: "composition", composition: "package", label: "RITUALS, BUNDLED." },
  },
  {
    id: "gifts",
    href: "#gift-cards",
    label: "Gift Cards",
    captionTitle: "GIFT CARD",
    captionLine: "Give a moment.",
    preview: { kind: "composition", composition: "gift", label: "GIFT CARD" },
  },
  {
    id: "loyalty",
    href: "#loyalty",
    label: "Loyalty",
    captionTitle: "EVERY VISIT",
    captionLine: "Recognition across visits.",
    preview: { kind: "composition", composition: "loyalty", label: "EVERY VISIT" },
  },
];

/** @deprecated Prefer menuChapters + menuSecondary — kept only if referenced elsewhere. */
export const navLinks = menuChapters.map((chapter) => ({
  href: chapter.href,
  label: chapter.label,
  preview: chapter.preview,
}));


/**
 * Commerce catalogue rendered by the shared BrandCommerce component.
 * Amounts are Singapore dollars. Nothing here is a live purchase — the studio
 * runs booking through da Salon, and every offer dialog closes on a disabled Buy now.
 * Face tones stay in the dark studio range: ivory, champagne, ink, ember.
 */
export const studioMemberships: MembershipOffer[] = [
  {
    id: "studio07-essential",
    name: "ESSENTIAL",
    validityLabel: "Valid for 6 months",
    savePercent: 10,
    description: "Studio credit for cuts and finishes, with earlier appointment windows on working dates.",
    details: [
      "Wallet credit for cuts, finishes and weekday colour",
      "Earlier appointment windows on working dates",
      "Seasonal lookbook and edit notes",
      "Unused credit expires with the membership window",
    ],
    pay: 180,
    credit: 200,
    tone: "ivory",
  },
  {
    id: "studio07-signature",
    name: "SIGNATURE",
    validityLabel: "Valid for 12 months",
    savePercent: 15,
    description: "Preferred stylist requests, extended finishing time and a fuller balance for colour.",
    details: [
      "Preferred stylist request when available",
      "Extended finishing and consultation time",
      "Two guest passes each season",
      "Priority waitlist for high-demand hours",
    ],
    pay: 340,
    credit: 400,
    tone: "champagne",
  },
  {
    id: "studio07-private",
    name: "PRIVATE",
    validityLabel: "Valid for 12 months",
    savePercent: 20,
    description: "After-hours access, private suite scheduling and the largest balance the studio holds.",
    details: [
      "Private suite scheduling where the venue offers it",
      "After-hours slots when the venue supports them",
      "Travel-ready finishing kit on request",
      "Direct studio concierge for itinerary days",
    ],
    pay: 760,
    credit: 950,
    tone: "ink",
  },
];

export const studioPackages: PackageOffer[] = [
  {
    id: "studio07-three-cut-season",
    name: "THE THREE-CUT SEASON",
    savePercent: 18,
    sessionsLabel: "3 sessions included",
    validityLabel: "Valid for 120 days",
    inclusions: ["Cut and finish, first visit", "Cut and finish, second visit", "Cut and finish, third visit"],
    description: "Keep the shape exact across a season of returns.",
    details: [
      "Three cut-and-finish visits with any available artist",
      "Space the sessions across 120 days",
      "Each session is booked independently",
      "Shape notes carry between visits",
    ],
    pay: 210,
    worth: 255,
    tone: "ink",
  },
  {
    id: "studio07-colour-held",
    name: "COLOUR, HELD",
    savePercent: 16,
    sessionsLabel: "2 sessions included",
    validityLabel: "Valid for 6 months",
    inclusions: ["Full colour service", "Gloss and tone refresh", "Home-care consult"],
    description: "Colour laid down once, then kept luminous with a mid-season gloss.",
    details: [
      "One full colour service plus a gloss refresh",
      "Home-care consult for the weeks between",
      "Refresh timed to your regrowth, not a fixed date",
      "Valid for six months from purchase",
    ],
    pay: 320,
    worth: 380,
    tone: "ember",
  },
  {
    id: "studio07-entrance-prep",
    name: "ENTRANCE PREP",
    savePercent: 13,
    sessionsLabel: "2 sessions included",
    validityLabel: "Valid for 90 days",
    inclusions: ["Pre-event consultation", "Cut or colour refresh", "Event-day finish"],
    description: "Two visits paced for the week of the room you need to enter.",
    details: [
      "Consultation and refresh ahead of the date",
      "Event-day finish held in the diary",
      "Works for a cut, a colour refresh or both",
      "Book both visits inside 90 days",
    ],
    pay: 165,
    worth: 190,
    tone: "champagne",
  },
];

export const studioGifts: GiftOffer[] = [
  {
    id: "studio07-open-card",
    name: "THE OPEN CARD",
    validityLabel: "No expiry",
    savePercent: null,
    description: "An open balance, ready whenever they decide to sit down.",
    details: [
      "Open value with no expiry date",
      "Recipient chooses the service and the hour",
      "Redeemable at any STUDIO / 07 address",
      "Ideal when the gift should wait for them",
    ],
    pay: 150,
    value: 150,
    tone: "champagne",
  },
  {
    id: "studio07-make-an-entrance",
    name: "MAKE AN ENTRANCE",
    validityLabel: "Valid for 1 year",
    savePercent: 10,
    description: "Enough for a cut and finish before the night that matters.",
    details: [
      "Sized for a cut and signature finish",
      "Valid for twelve months from purchase",
      "Redeemable at any STUDIO / 07 address",
      "Balance can be topped up at the studio",
    ],
    pay: 180,
    value: 200,
    tone: "ivory",
  },
  {
    id: "studio07-full-edit",
    name: "THE FULL EDIT",
    validityLabel: "Valid for 1 year",
    savePercent: 11,
    description: "Colour, cut and finish — the whole edit, given at once.",
    details: [
      "Sized for colour, cut and finish together",
      "Valid for twelve months from purchase",
      "Can be split across more than one visit",
      "Redeemable at any STUDIO / 07 address",
    ],
    pay: 320,
    value: 360,
    tone: "ember",
  },
];

export const studioCommerceCopy: BrandCommerceCopy = {
  membershipsEyebrow: "Circle",
  membershipsTitle: "THE INNER CIRCLE.",
  membershipsCopy:
    "Swipe the studio memberships — wallet credit, validity and what you actually pay. Illustrative preview: membership commerce is not connected.",
  packagesEyebrow: "Bundles",
  packagesTitle: "RITUALS, BUNDLED.",
  packagesCopy:
    "See the sessions included, how long they last, what they are worth and what you pay.",
  giftsEyebrow: "Gift",
  giftsTitle: "GIVE A MOMENT.",
  giftsCopy:
    "Swipe the gift cards — each one sized like a card you would keep in your wallet. Checkout is not connected in this preview.",
  membershipSwipeHint: "Swipe to browse memberships",
  giftSwipeHint: "Swipe to browse gift cards",
};

/**
 * Optional extras keyed by live Partner venue ID.
 * Leave empty until verified address/hours/photos exist for a venue.
 */
export type VenueExtra = {
  image?: string;
  imageKind: "verified" | "illustrative";
  address?: string;
  hours?: string;
  amenities?: string[];
  directionsUrl?: string | null;
};

export const venueExtrasById: Record<string, VenueExtra> = {
  // Example when verified:
  // "venue-uuid": { imageKind: "verified", image: "/brand-home-7/venue-01.jpg", address: "…", hours: "…", directionsUrl: "https://…" },
};

/** Fallback illustrative architecture plates (never claim as a specific live venue without an ID key). */
export const illustrativeVenuePlates = [
  { image: assets.venues[0], label: "Illustrative studio architecture" },
  { image: assets.venues[1], label: "Illustrative courtyard studio" },
  { image: assets.venues[2], label: "Illustrative salon interior" },
] as const;

export const peopleChapter = {
  eyebrow: "People",
  title: "THE PEOPLE BEHIND THE LOOK.",
  support: "IT STARTS WITH YOU.",
  copy: [
    "Every edit begins with a consultation — how you move through the week, the rooms you enter, the finish that holds.",
    "Craft follows personal style. We shape presence, not a catalog pose.",
  ],
  note: "Editorial craft story. Staff names and credentials appear here only when verified team data is supplied.",
} as const;

export const storyBeats = [
  {
    id: "presence",
    title: "Presence first",
    copy: "Cut, colour, and finish are composed for how you enter a room — not for a catalog pose.",
  },
  {
    id: "precision",
    title: "Quiet precision",
    copy: "The studio keeps the noise low and the craft exact. Every visit is paced, never rushed.",
  },
  {
    id: "return",
    title: "Return ready",
    copy: "You leave with a look that holds through the week and a clear path back when you need it.",
  },
] as const;

export const bookingDraftStorageKey = "studio-07-booking-draft";
export const introStorageKey = "studio-07-intro-seen";

/**
 * Exact cinematic trailer + hero copy for STUDIO / 07.
 * Do not rewrite these strings in JSX.
 */
export const trailer = {
  beats: [
    {
      id: "feeling",
      text: "YOU KNOW THAT FEELING.",
      treatment: "statement",
      lines: ["YOU KNOW THAT", "FEELING."],
    },
    {
      id: "yourself",
      text: "WHEN YOU LOOK LIKE YOURSELF.",
      treatment: "typewriter",
      lines: ["WHEN YOU LOOK", "LIKE YOURSELF."],
    },
    {
      id: "louder",
      text: "ONLY LOUDER.",
      treatment: "impact",
      lines: ["ONLY", "LOUDER."],
    },
  ],
  heroTitle: "MAKE AN ENTRANCE.",
  heroTitleLines: ["MAKE AN", "ENTRANCE."],
  heroDescription: "Your next look starts with you.",
  /** Timeline offsets in milliseconds from sequence start. */
  timing: {
    settleEnd: 500,
    feelingEnd: 2100,
    pauseEnd: 2800,
    yourselfEnd: 5200,
    louderEnd: 6500,
    apertureEnd: 7500,
    complete: 8400,
    typeCharMs: 62,
  },
} as const;

export type TrailerBeatId = (typeof trailer.beats)[number]["id"];
export type TrailerBeat = (typeof trailer.beats)[number];

export function getTrailerBeat(id: TrailerBeatId): TrailerBeat {
  const beat = trailer.beats.find((item) => item.id === id);
  if (!beat) throw new Error(`Unknown trailer beat: ${id}`);
  return beat;
}
