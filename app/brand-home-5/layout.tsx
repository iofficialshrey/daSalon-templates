import type { Metadata } from "next";
import "./brand-home.css";

export const metadata: Metadata = {
  title: "Oru Spa | Quiet Begins Here",
  description:
    "A contemporary spa Brand Home with scroll-led storytelling, treatments, membership, locations, and booking.",
};

export default function BrandHomeFiveLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
