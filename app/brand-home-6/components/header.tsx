"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";
import { jumpTo } from "@/lib/page/jump";
import { ArrowRight, Close, Mark, MenuIcon } from "./icons";
import { useNeroli } from "./provider";
import styles from "./header.module.css";
import ui from "./ui.module.css";

const NAV = [
  { id: "treatments", label: "Treatments" },
  { id: "day", label: "A day here" },
  { id: "houses", label: "Houses" },
  { id: "membership", label: "Membership" },
] as const;

/**
 * Fixed header: wordmark, four sections, Book. Clear at the surface, a glass
 * bar once the page moves, light ink over the deep sections. Phones get a
 * menu sheet.
 */
export function Header() {
  const { openBooking, warmBooking } = useNeroli();
  const [moved, setMoved] = useState(false);
  const [dark, setDark] = useState(false);
  const [current, setCurrent] = useState<string | null>(null);
  const menuRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const read = () => {
      setMoved(window.scrollY > 24);
      const line = 36;
      const under = Array.from(document.querySelectorAll<HTMLElement>("[data-tone]"))
        .filter((band) => {
          const rect = band.getBoundingClientRect();
          return rect.top <= line && rect.bottom > line;
        })
        .pop();
      setDark(under?.dataset.tone === "dark");
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
          aria-label="Néroli House, back to the top"
          onClick={(event) => {
            event.preventDefault();
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        >
          <Mark />
          <span>Néroli</span>
        </a>
        <nav className={styles.nav} aria-label="Sections">
          {NAV.map((item) => (
            <a key={item.id} href={`#${item.id}`} className={styles.navLink} aria-current={current === item.id ? "true" : undefined} onClick={go(item.id)}>
              {item.label}
            </a>
          ))}
        </nav>
        <div className={styles.end}>
          <button
            type="button"
            className={`${ui.btn} ${ui.sm} ${styles.book}`}
            onClick={() => openBooking()}
            onPointerEnter={warmBooking}
            onFocus={warmBooking}
          >
            Book a visit
          </button>
          <button type="button" className={styles.menuButton} aria-label="Menu" aria-haspopup="dialog" onClick={() => menuRef.current?.showModal()}>
            <MenuIcon size={22} />
          </button>
        </div>
      </div>

      <dialog ref={menuRef} className={styles.menu} aria-label="Menu" data-lenis-prevent="">
        <div className={styles.menuTop}>
          <span className={styles.brand}>
            <Mark />
            <span>Néroli</span>
          </span>
          <button type="button" className={styles.menuButton} aria-label="Close the menu" onClick={() => menuRef.current?.close()}>
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
          Book a visit
          <ArrowRight />
        </button>
      </dialog>
    </header>
  );
}
