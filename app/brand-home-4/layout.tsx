import type { Metadata } from "next";
import { Footer } from "./components/footer";
import { Header } from "./components/header";
import { InertScope, PalomaProvider } from "./components/provider";
import { Rail } from "./components/rail";
import { SkipLinks } from "./components/skip-links";
import styles from "./layout.module.css";

export const metadata: Metadata = {
  title: "Paloma — Hair, Form and Colour",
  description:
    "Hair, grooming, skin, spa and bridal across four Singapore studios, with live menus in S$, booking in Singapore time, memberships, seasonal sets and gift cards.",
};

/**
 * Paloma, Issue 04. The provider owns the live catalog, the studio binding, the
 * booking window, offer spreads, the Contents sheet and the global motion state.
 * Manrope comes from the root layout (--font-manrope, weights 200–800).
 */
export default function BrandHomeFourLayout({ children }: LayoutProps<"/brand-home-4">) {
  return (
    <div className={styles.root} lang="en-SG" id="top">
      <PalomaProvider>
        <InertScope>
          <SkipLinks />
          <Header />
        </InertScope>
        {children}
        <InertScope>
          <Footer />
        </InertScope>
        <InertScope>
          <Rail />
        </InertScope>
      </PalomaProvider>
    </div>
  );
}
