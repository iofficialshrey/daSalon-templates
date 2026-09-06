/**
 * STUDIO / 07 editorial configuration.
 * Operational booking data comes from da Salon; this module holds brand copy and media paths only.
 */

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
  menuSide: "/brand-home-7/menu-side.jpg",
  services: [
    "/brand-home-7/service-01.jpg",
    "/brand-home-7/service-02.jpg",
    "/brand-home-7/service-03.jpg",
    "/brand-home-7/service-04.jpg",
  ],
  venues: [
    "/brand-home-7/venue-01.jpg",
    "/brand-home-7/venue-02.jpg",
    "/brand-home-7/venue-03.jpg",
  ],
  temporaryMediaNote:
    "Hero still is approved. Service, venue, and menu side imagery are temporary development substitutes pending final Higgsfield assets. No hero film yet.",
} as const;

export const navLinks = [
  { href: "#services", label: "The Edit", image: assets.services[0] },
  { href: "#story", label: "The Studio", image: assets.services[1] },
  { href: "#book", label: "Make Time", image: assets.heroStill },
  { href: "#memberships", label: "Inner Circle", image: assets.services[2] },
  { href: "#gifts", label: "Gifts", image: assets.services[3] },
  { href: "#venues", label: "Studios", image: assets.venues[0] },
  { href: "#loyalty", label: "Loyalty", image: assets.venues[1] },
] as const;

export const memberships = [
  {
    id: "essential",
    label: "Essential",
    price: "Demo · illustrative",
    summary: "Priority booking windows and seasonal edit access.",
    benefits: [
      "Earlier appointment windows on working dates",
      "Seasonal lookbook and edit notes",
      "Guest accompaniment once per quarter",
    ],
  },
  {
    id: "signature",
    label: "Signature",
    price: "Demo · illustrative",
    summary: "Dedicated stylist matching and extended finishing time.",
    benefits: [
      "Preferred stylist request when available",
      "Extended finishing and consultation time",
      "Two guest passes each season",
      "Priority waitlist for high-demand hours",
    ],
  },
  {
    id: "private",
    label: "Private",
    price: "Demo · illustrative",
    summary: "After-hours access and private suite scheduling.",
    benefits: [
      "Private suite scheduling where offered",
      "After-hours slots when the venue supports them",
      "Travel-ready finishing kit on request",
      "Direct studio concierge for itinerary days",
    ],
  },
] as const;

export const giftAmounts = ["₹3,000", "₹5,000", "₹8,000", "₹12,000"] as const;

export const venueDirectory = [
  {
    city: "Mumbai",
    place: "Bandra West",
    hours: "Tue–Sun · 10:00–20:00",
    note: "Demonstration location identity — confirm against live venue records before production.",
    image: assets.venues[0],
  },
  {
    city: "Delhi",
    place: "Lodhi Colony",
    hours: "Tue–Sun · 10:00–20:00",
    note: "Demonstration location identity — confirm against live venue records before production.",
    image: assets.venues[1],
  },
  {
    city: "Bengaluru",
    place: "Indiranagar",
    hours: "Mon–Sat · 09:00–19:00",
    note: "Demonstration location identity — confirm against live venue records before production.",
    image: assets.venues[2],
  },
] as const;

export const storyBeats = [
  {
    number: "01",
    title: "Presence first",
    copy: "Cut, colour, and finish are composed for how you enter a room — not for a catalog pose.",
  },
  {
    number: "02",
    title: "Quiet precision",
    copy: "The studio keeps the noise low and the craft exact. Every visit is paced, never rushed.",
  },
  {
    number: "03",
    title: "Return ready",
    copy: "You leave with a look that holds through the week and a clear path back when you need it.",
  },
] as const;

export const introStorageKey = "studio-07-intro-seen";
