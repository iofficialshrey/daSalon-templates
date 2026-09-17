import type { Metadata } from "next";
import "./brand-home.css";
import "./scroll-lab.css";

export const metadata: Metadata = {
  title: "Maison Élan — Private Hair Atelier",
  description:
    "A scroll-driven private hair atelier with cinematic arrival, services, memberships, packages, gift cards and online booking.",
};

export default function BrandHomeOneLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
