import type { Metadata } from "next";
import { Newsreader } from "next/font/google";
import { BookTag } from "./components/book-tag";
import { Footer } from "./components/footer";
import { Header } from "./components/header";
import { AtelierProvider, InertScope } from "./components/provider";
import { SkipLink } from "./components/skip-link";
import { SmoothScroll } from "./components/smooth-scroll";
import styles from "./layout.module.css";

/**
 * Newsreader carries the display and reading type (its optical sizes keep the
 * large headlines fine and the small text sturdy); Manrope, from the root
 * layout, carries labels and controls.
 */
const serif = Newsreader({
  subsets: ["latin"],
  style: ["normal", "italic"],
  axes: ["opsz"],
  display: "swap",
  variable: "--at-font-serif",
  fallback: ["Iowan Old Style", "Baskerville", "Georgia", "serif"],
  adjustFontFallback: true,
});

export const metadata: Metadata = {
  title: "Atelier — Beauty, Made Personal in Singapore",
  description:
    "A private beauty house in Singapore: hair, spa, skin and bridal care across four ateliers, with live menus and online booking.",
};

/**
 * The provider, header, footer, floating Book tag and booking host live here,
 * so the chosen atelier and the venue cache survive home ↔ atelier navigation.
 */
export default function BrandHomeTwoLayout({ children }: LayoutProps<"/brand-home-2">) {
  return (
    <div className={`${styles.root} ${serif.variable}`} id="top">
      <AtelierProvider>
        <InertScope>
          <SkipLink />
          <Header />
        </InertScope>
        {children}
        <InertScope>
          <Footer />
        </InertScope>
        <InertScope>
          <BookTag />
        </InertScope>
        <SmoothScroll />
      </AtelierProvider>
    </div>
  );
}
