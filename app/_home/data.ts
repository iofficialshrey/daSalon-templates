/*
 * The Brand Home collection as the landing page shows it. Names, links, images,
 * alt text and the "· Live" lines are the ones the collection has always used
 * (tests/rendered-html.test.mjs checks several of them).
 */

export type BrandHome = {
  number: string;
  href: string;
  name: string;
  /** The card link's accessible name. */
  label: string;
  tagline: string;
  kind: string;
  /** Card media; Serein House plays its entrance-film loop instead. */
  image: { src: string; alt: string; position?: string } | null;
  /** The still shown in the hero preview window (decorative there). */
  still: string;
  stillPosition?: string;
};

export const BRAND_HOMES: readonly BrandHome[] = [
  {
    number: "01",
    href: "/brand-home-1",
    name: "Maison Élan",
    label: "Open the Maison Élan Brand Home",
    tagline: "Four houses of care",
    kind: "Hospitality storefront · Live",
    image: { src: "/brand-home-1/scroll-film/maison-film-1280x720-first.v3.jpg", alt: "The open walnut doors of the fictional Maison Élan house" },
    still: "/brand-home-1/scroll-film/maison-film-1280x720-first.v3.jpg",
  },
  {
    number: "02",
    href: "/brand-home-2",
    name: "Atelier",
    label: "Open the Atelier Brand Home",
    tagline: "Beauty, made personal",
    kind: "Private beauty house · Live",
    image: { src: "/brand-home-2/art/cover-1200x675.v1.jpg", alt: "Atelier: a woman in a black wrap dress steps out of a dark timber doorway." },
    still: "/brand-home-2/art/cover-1200x675.v1.jpg",
  },
  {
    number: "03",
    href: "/brand-home-3",
    name: "Serein House",
    label: "Open the Serein House spa Brand Home",
    tagline: "A luminous urban spa",
    kind: "Immersive spa · Live",
    image: null,
    still: "/brand-home-3/film/serein-film-1280x720-last.v1.jpg",
  },
  {
    number: "04",
    href: "/brand-home-4",
    name: "Paloma",
    label: "Open the Paloma Brand Home",
    tagline: "Form follows feeling",
    kind: "Fashion-issue storefront · Live",
    image: { src: "/brand-home-4/film/paloma-film-1280x720-last.v2.jpg", alt: "Paloma's cover: a model with long dark hair faces the camera", position: "70% 40%" },
    still: "/brand-home-4/film/paloma-film-1280x720-last.v2.jpg",
    stillPosition: "70% 40%",
  },
  {
    number: "05",
    href: "/brand-home-5",
    name: "Oru Spa",
    label: "Open the Oru spa Brand Home",
    tagline: "A slower rhythm",
    kind: "Editorial urban spa · Live",
    image: { src: "/brand-home-5/oru-hero.png", alt: "The lavender-tiled thermal bath at Oru Spa" },
    still: "/brand-home-5/oru-hero.png",
  },
  {
    number: "06",
    href: "/brand-home-6",
    name: "Néroli House",
    label: "Open the Néroli House spa Brand Home",
    tagline: "Water, warmth, return",
    kind: "Scroll-led spa · Live",
    image: { src: "/brand-home-6/neroli-arrival.png", alt: "The luminous mineral-water interior of Néroli House" },
    still: "/brand-home-6/neroli-arrival.png",
  },
  {
    number: "07",
    href: "/brand-home-7",
    name: "STUDIO / 07",
    label: "Open the STUDIO / 07 salon Brand Home",
    tagline: "Look like you mean it",
    kind: "Cinematic salon · Live",
    image: { src: "/brand-home-7/hero-desktop.jpg", alt: "Cinematic editorial portrait for STUDIO / 07", position: "50% 30%" },
    still: "/brand-home-7/hero-desktop.jpg",
    stillPosition: "50% 30%",
  },
];

/** What every Brand Home ships with, in the landing page's own words. */
export const INCLUDED = [
  {
    icon: "calendar",
    title: "Live booking",
    body: "Real services, prices and open times from the daSalon Partner API, booked in a few taps.",
  },
  {
    icon: "gift",
    title: "Memberships and gifts",
    body: "Memberships, packages and gift cards designed into each storefront, not bolted on.",
  },
  {
    icon: "phone",
    title: "Mobile first",
    body: "Built for the phone your guests book from, then scaled up to every screen.",
  },
  {
    icon: "sparkle",
    title: "Your brand, end to end",
    body: "Type, colour, motion and tone of voice made for you. Nothing generic, nothing shared.",
  },
] as const;

export type IncludedIcon = (typeof INCLUDED)[number]["icon"];
