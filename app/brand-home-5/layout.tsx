import type { Metadata } from "next";
import "./brand-home.css";

export const metadata: Metadata = {
  title: "Oru Spa | The Art of Exhale",
  description:
    "Oru Spa is an expressive urban spa for touch, water, warmth, and a slower rhythm, with treatments, journeys, membership, gifting, and booking.",
};

export default function BrandHomeFiveLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
