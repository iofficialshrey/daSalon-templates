import type { Metadata } from "next";
import "./brand-home.css";

export const metadata: Metadata = {
  title: "Atelier — Beauty, Made Personal",
  description:
    "An immersive multi-venue beauty storefront with services, offers, membership, loyalty, gift cards and online booking.",
};

export default function BrandHomeTwoLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
