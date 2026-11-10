import type { Metadata } from "next";
import { Newsreader } from "next/font/google";
import { Footer } from "./components/footer";
import { Header } from "./components/header";
import { LiveAnnouncer } from "./components/live";
import { InertScope, SereinProvider } from "./components/provider";
import { SkipLink } from "./components/skip-link";
import styles from "./layout.module.css";

/** Display and body serif: variable wght + opsz, so 17px body and 150px display each get their optical size. */
const display = Newsreader({
  subsets: ["latin"],
  style: ["normal"],
  axes: ["opsz"],
  display: "swap",
  variable: "--sr-font-display",
  adjustFontFallback: true,
  fallback: ["Iowan Old Style", "Palatino Linotype", "Georgia", "serif"],
});

/** Real italic for the accents; preloaded because "yourself." sits in the first-view h1. */
const displayItalic = Newsreader({
  subsets: ["latin"],
  style: ["italic"],
  axes: ["opsz"],
  display: "swap",
  preload: true,
  variable: "--sr-font-display-italic",
  fallback: ["Georgia", "serif"],
});

export const metadata: Metadata = {
  // Unchanged: tests/rendered-html.test.mjs asserts it.
  title: "Serein House — The Luxury of Feeling Restored",
  description:
    "Serein House: massage, steam and slow body rituals in Clementi, with sister places for skin, grooming and bridal care across Singapore. Live booking powered by da Salon.",
};

/**
 * Serein House. The provider owns the live catalogue, the place binding, the
 * booking window, the offer sheet, layers and the toast. Manrope comes from the
 * root layout (--font-manrope, 200–800); Newsreader is loaded here.
 */
export default function BrandHomeThreeLayout({ children }: LayoutProps<"/brand-home-3">) {
  return (
    <div className={`${styles.root} ${display.variable} ${displayItalic.variable}`} lang="en-SG" id="top">
      <SereinProvider>
        <InertScope>
          <SkipLink />
          <Header />
        </InertScope>
        {children}
        <InertScope>
          <Footer />
        </InertScope>
        <LiveAnnouncer />
      </SereinProvider>
    </div>
  );
}
