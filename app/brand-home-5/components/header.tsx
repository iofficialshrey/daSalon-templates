"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";
import { jumpTo } from "@/lib/page/jump";
import { ArrowRight, Close, Mark, MenuIcon } from "./icons";
import { useOru } from "./provider";
import styles from "./header.module.css";
import ui from "./ui.module.css";

const NAV = [
  { id: "treatments", label: "Treatments" },
  { id: "house", label: "The house" },
  { id: "rooms", label: "Rooms" },
  { id: "membership", label: "Membership" },
] as const;

/** Sections whose background is dark, so the header switches to light ink over them. */
const DARK = "[data-tone='dark']";

/**
 * Fixed header: wordmark, four sections, Book. Clear over the hero photograph,
 * a porcelain bar once the page has moved, and light ink over the aubergine bands.
 */
export function Header() {
  const { openBooking, warmBooking } = useOru();
  const [moved, setMoved] = useState(false);
  const [dark, setDark] = useState(false);
  const [current, setCurrent] = useState<string | null>(null);

  useEffect(() => {
    const read = () => {
      setMoved(window.scrollY > 24);
      const line = 40;
      // The hero is sticky beneath the sheet, so the band on top is the last one that crosses the line.
      const under = Array.from(document.querySelectorAll<HTMLElement>("[data-tone]")).filter((band) => {
        const rect = band.getBoundingClientRect();
        return rect.top <= line && rect.bottom > line;
      }).pop();
      setDark(Boolean(under?.matches(DARK)));
      const middle = window.innerHeight * 0.4;
      let active: string | null = null;
      for (const item of NAV) {
        const target = document.getElementById(item.id);
        if (target && target.getBoundingClientRect().top <= middle) active = item.id;
      }
      setCurrent(active);
    };
    read();
    window.addEventListener("scroll", read, { passive: true });
    window.addEventListener("resize", read);
    return () => {
      window.removeEventListener("scroll", read);
      window.removeEventListener("resize", read);
    };
  }, []);

  const menuRef = useRef<HTMLDialogElement>(null);

  const go = (id: string) => (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
    event.preventDefault();
    menuRef.current?.close();
    jumpTo(id);
  };

  return (
    <header className={styles.header} data-moved={moved ? "" : undefined} data-dark={dark ? "" : undefined}>
      <div className={styles.bar}>
        <a
          href="#top"
          className={styles.brand}
          aria-label="Oru Spa, back to the top"
          onClick={(event) => {
            event.preventDefault();
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        >
          <Mark />
          <span>oru</span>
        </a>
        <nav className={styles.nav} aria-label="Sections">
          {NAV.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className={styles.navLink}
              aria-current={current === item.id ? "true" : undefined}
              onClick={go(item.id)}
            >
              {item.label}
            </a>
          ))}
        </nav>
        <button
          type="button"
          className={`${ui.btn} ${ui.sm} ${styles.book}`}
          onClick={() => openBooking()}
          onPointerEnter={warmBooking}
          onFocus={warmBooking}
        >
          Book
          <ArrowRight size={16} />
        </button>
        <button type="button" className={styles.menuButton} aria-label="Menu" aria-haspopup="dialog" onClick={() => menuRef.current?.showModal()}>
          <MenuIcon size={22} />
        </button>
      </div>

      {/* Phones and small tablets: the sections in a full-screen sheet. */}
      <dialog ref={menuRef} className={styles.menu} aria-label="Menu" data-lenis-prevent="">
        <div className={styles.menuTop}>
          <span className={styles.brand}>
            <Mark />
            <span>oru</span>
          </span>
          <button type="button" className={styles.menuClose} aria-label="Close the menu" onClick={() => menuRef.current?.close()}>
            <Close size={22} />
          </button>
        </div>
        <nav className={styles.menuNav} aria-label="Sections">
          {NAV.map((item) => (
            <a key={item.id} href={`#${item.id}`} className={styles.menuLink} onClick={go(item.id)}>
              {item.label}
            </a>
          ))}
        </nav>
        <button
          type="button"
          className={`${ui.btn} ${styles.menuBook}`}
          onClick={() => {
            menuRef.current?.close();
            openBooking();
          }}
        >
          Book a treatment
          <ArrowRight />
        </button>
      </dialog>
    </header>
  );
}
