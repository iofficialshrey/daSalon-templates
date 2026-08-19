import type { Metadata } from "next";
import "./brand-home.css";

export const metadata: Metadata = {
  title: "Maison Élan — Private Hair Atelier",
  description:
    "A luxury multi-venue salon storefront Brand Home with services, memberships, loyalty, gift cards and online booking.",
};

export default function BrandHomeOneLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
