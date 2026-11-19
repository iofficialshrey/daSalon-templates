import type { Metadata } from "next";
import { Bodoni_Moda } from "next/font/google";
import { Header } from "./components/header";
import { Motion } from "./components/motion";
import { OruProvider, Page } from "./components/provider";
import styles from "./layout.module.css";

/**
 * Bodoni Moda carries the display type (its optical sizes keep the large
 * headlines fine and the smaller settings sturdy); Manrope, from the root
 * layout, carries everything else.
 */
const serif = Bodoni_Moda({
  subsets: ["latin"],
  style: ["normal", "italic"],
  axes: ["opsz"],
  display: "swap",
  variable: "--oru-font-serif",
  fallback: ["Didot", "Times New Roman", "serif"],
  adjustFontFallback: true,
});

export const metadata: Metadata = {
  title: "Oru Spa | The Art of Exhale",
  description:
    "Oru Spa is an urban spa in Singapore for touch, water, warmth and a slower rhythm: live treatment menus, memberships, journeys, gift cards and online booking.",
};

export default function BrandHomeFiveLayout({ children }: LayoutProps<"/brand-home-5">) {
  return (
    <div className={`${styles.root} ${serif.variable}`} id="top">
      <OruProvider>
        <Page>
          <a className={styles.skip} href="#treatments">
            Skip to treatments
          </a>
          <Header />
          {children}
        </Page>
        <Motion />
      </OruProvider>
    </div>
  );
}
