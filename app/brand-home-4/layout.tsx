import type { Metadata } from "next";
import "./brand-home.css";

export const metadata: Metadata = {
  title: "Paloma — Hair, Form and Colour",
  description: "An editorial multi-location salon concept with services, packages, membership, loyalty, gifts and booking.",
};

export default function BrandHomeFourLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
