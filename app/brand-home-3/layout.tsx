import type { Metadata } from "next";
import { Newsreader } from "next/font/google";
import "./serein-embed.css";

/** The shared commerce catalogue reads its serif from this variable. */
const newsreader = Newsreader({
  subsets: ["latin"],
  variable: "--font-newsreader",
  display: "swap",
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Serein House — The Luxury of Feeling Restored",
  description: "A luminous urban spa Brand Home with restorative rituals, immersive entry, venues, membership and booking.",
};

export default function BrandHomeThreeLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <div className={newsreader.variable}>{children}</div>;
}
