import type { Metadata } from "next";
import { Fraunces } from "next/font/google";
import { Drop } from "./components/drop";
import { Header } from "./components/header";
import { Motion } from "./components/motion";
import { NeroliProvider, Page } from "./components/provider";
import styles from "./layout.module.css";

/**
 * Fraunces with its soft axis turned up carries the display type: round,
 * liquid letterforms, with optical sizes for the large headlines. Manrope,
 * from the root layout, carries everything else.
 */
const serif = Fraunces({
  subsets: ["latin"],
  axes: ["SOFT", "opsz"],
  display: "swap",
  variable: "--nh-font-serif",
  fallback: ["Iowan Old Style", "Georgia", "serif"],
  adjustFontFallback: true,
});

export const metadata: Metadata = {
  title: "Néroli House | Water, Warmth, Return",
  description:
    "Néroli House is a mineral-water spa in Singapore: live treatment menus across four houses, rituals, memberships, gift cards and online booking.",
};

export default function BrandHomeSixLayout({ children }: LayoutProps<"/brand-home-6">) {
  return (
    <div className={`${styles.root} ${serif.variable}`} id="top">
      <NeroliProvider>
        <Page>
          <a className={styles.skip} href="#treatments">
            Skip to treatments
          </a>
          <Header />
          {children}
        </Page>
        <Drop />
        <Motion />
      </NeroliProvider>
    </div>
  );
}
