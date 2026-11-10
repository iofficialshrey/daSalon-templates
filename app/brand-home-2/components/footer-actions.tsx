"use client";

import { usePathname } from "next/navigation";
import { scrollToTop } from "@/lib/page/jump";
import layout from "../layout.module.css";
import { isAtelierPath, SectionLink } from "./header-links";
import { ArrowUp } from "./icons";

const LINKS = [
  { id: "ritual", label: "The ritual" },
  { id: "ateliers", label: "Ateliers" },
  { id: "services", label: "Services" },
  { id: "membership", label: "Membership" },
  { id: "packages", label: "Packages" },
  { id: "gift-cards", label: "Gift cards" },
] as const;

type FooterNavProps = {
  titleClassName?: string;
  listClassName?: string;
  linkClassName?: string;
};

/** The footer's page links: in-page jumps at home, /brand-home-2#… links on atelier pages. */
export function FooterNav({ titleClassName, listClassName, linkClassName }: FooterNavProps) {
  const atelierPage = isAtelierPath(usePathname());
  return (
    <nav aria-labelledby="footer-links-title">
      <h2 id="footer-links-title" className={titleClassName}>
        {atelierPage ? "Atelier" : "On this page"}
      </h2>
      <ul className={listClassName}>
        {LINKS.map((item) => (
          <li key={item.id}>
            <SectionLink id={item.id} className={linkClassName}>
              {item.label}
            </SectionLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/** Back to top: an instant jump (the film snaps to frame 0), then focus on the skip link. */
export function BackToTop({ className, labelClassName }: { className?: string; labelClassName?: string }) {
  return (
    <button
      type="button"
      className={className}
      onClick={() => {
        scrollToTop();
        document.querySelector<HTMLElement>(`.${CSS.escape(layout.skip)}`)?.focus({ preventScroll: true });
      }}
    >
      <span className={labelClassName}>Back to top</span>
      <ArrowUp />
    </button>
  );
}
