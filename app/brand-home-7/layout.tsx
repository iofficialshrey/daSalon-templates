import type { Metadata } from "next";
import { Oswald } from "next/font/google";
import "./brand-home.css";

const oswald = Oswald({
  subsets: ["latin"],
  variable: "--font-studio-display",
  display: "swap",
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: "STUDIO / 07 — Look Like You Mean It",
  description:
    "A cinematic salon Brand Home for hair, beauty, and presence — with live da Salon appointment booking.",
};

export default function BrandHomeSevenLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <div className={oswald.variable}>{children}</div>;
}
