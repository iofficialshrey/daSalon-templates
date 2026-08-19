import type { Metadata } from "next";
import "./serein-embed.css";

export const metadata: Metadata = {
  title: "Serein House — The Luxury of Feeling Restored",
  description: "A luminous urban spa Brand Home with restorative rituals, immersive entry, venues, membership and booking.",
};

export default function BrandHomeThreeLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
