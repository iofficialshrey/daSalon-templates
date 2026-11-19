"use client";

import type { MouseEvent } from "react";
import { jumpTo } from "@/lib/page/jump";
import { ArrowRight, ArrowUp } from "./icons";
import { useNeroli } from "./provider";
import styles from "./closing.module.css";
import ui from "./ui.module.css";

const LINKS = [
  { id: "treatments", label: "Treatments" },
  { id: "day", label: "A day here" },
  { id: "houses", label: "Houses" },
  { id: "membership", label: "Membership" },
  { id: "rituals", label: "Rituals" },
  { id: "gift-cards", label: "Gift cards" },
] as const;

/** Tabs of the offers band have no element of their own: their links change the hash, and the band follows. */
const TAB_LINKS = new Set(["rituals", "gift-cards"]);

export function ClosingBook() {
  const { openBooking, warmBooking } = useNeroli();
  return (
    <button
      type="button"
      className={`${ui.btn} ${ui.primary} ${styles.book}`}
      onClick={() => openBooking()}
      onPointerEnter={warmBooking}
      onFocus={warmBooking}
    >
      Book a visit
      <ArrowRight />
    </button>
  );
}

export function FooterNav({ className, linkClassName }: { className?: string; linkClassName?: string }) {
  const go = (id: string) => (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
    event.preventDefault();
    if (TAB_LINKS.has(id)) {
      if (window.location.hash === `#${id}`) jumpTo("membership");
      else window.location.hash = id;
      return;
    }
    if (id === "membership" && window.location.hash) history.replaceState(null, "", window.location.pathname + window.location.search);
    jumpTo(id);
  };
  return (
    <nav aria-label="Footer" className={className}>
      {LINKS.map((link) => (
        <a key={link.id} href={`#${link.id}`} className={linkClassName} onClick={go(link.id)}>
          {link.label}
        </a>
      ))}
    </nav>
  );
}

export function ToTop({ className }: { className?: string }) {
  return (
    <button type="button" className={className} onClick={() => window.scrollTo({ top: 0, behavior: "instant" })}>
      Back to top
      <ArrowUp size={14} />
    </button>
  );
}
