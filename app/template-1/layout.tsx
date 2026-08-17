import type { Metadata } from "next";
import "./template.css";

export const metadata: Metadata = {
  title: "Maison Élan — Private Hair Atelier",
  description:
    "A luxury multi-venue salon storefront template with services, memberships, loyalty, gift cards and online booking.",
};

export default function TemplateOneLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
