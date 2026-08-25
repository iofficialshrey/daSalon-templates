import type { Metadata } from "next";
import "./brand-home.css";

export const metadata: Metadata = {
  title: "Néroli House | Water, Warmth, Return",
  description:
    "A scroll-led spa Brand Home with treatments, day rituals, membership, gifting, locations, and live booking.",
};

export default function BrandHomeSixLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
