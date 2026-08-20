import type { Metadata } from "next";
import "../brand-home-1/brand-home.css";
import "../brand-home-1/scroll-lab.css";

export const metadata: Metadata = {
  title: "Maison Élan — Private Hair Atelier",
  description:
    "A scroll-driven private hair atelier with cinematic arrival, services, memberships, loyalty, gift cards and online booking.",
};

export default function BrandHomeOneScrollLabLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
