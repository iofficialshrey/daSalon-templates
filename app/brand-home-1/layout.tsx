import type { Metadata } from "next";
import { Cormorant_Garamond } from "next/font/google";

const display = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500"],
  style: ["normal"],
  display: "swap",
  variable: "--mx-font-display",
  fallback: ["Georgia", "Times New Roman", "serif"],
  adjustFontFallback: true,
});

/** Italic is used for two lines of the page only, so it is not preloaded. */
const displayItalic = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400"],
  style: ["italic"],
  display: "swap",
  preload: false,
  variable: "--mx-font-display-italic",
  fallback: ["Georgia", "serif"],
});

export const metadata: Metadata = {
  title: "Maison Élan — Four Houses of Care in Singapore",
  description:
    "Grooming, aesthetics, spa and bridal care across four Singapore houses, with live menus, online booking, memberships and gift cards.",
};

export default function BrandHomeOneLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <div className={`${display.variable} ${displayItalic.variable}`}>{children}</div>;
}
