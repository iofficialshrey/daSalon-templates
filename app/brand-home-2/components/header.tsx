"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { scrollToTop } from "@/lib/page/jump";
import { BookButton } from "./book-button";
import { HOME, isAtelierPath, isPlainClick, SectionLink } from "./header-links";
import { lastInOrder, surfaceFor, watchElements, watchToneAt, type Surface } from "./header-observe";
import { MenuIcon } from "./icons";
import { MenuSheet } from "./menu-sheet";
import { useAtelier } from "./provider";
import styles from "./header.module.css";
import ui from "./ui.module.css";

/** Desktop navigation, in page order. The ritual appears from 1280px. */
const NAV = [
  { id: "ritual", label: "The ritual", wide: true },
  { id: "ateliers", label: "Ateliers" },
  { id: "services", label: "Services" },
  { id: "membership", label: "Membership" },
  { id: "gift-cards", label: "Gift cards" },
] as const;

const NAV_SELECTOR = NAV.map((item) => `#${item.id}`).join(", ");

type Seen<T> = { path: string; value: T };

/**
 * The header: the Atelier wordmark left, the sections centred, an underlined
 * Book right (desktop); Menu, wordmark, Book (tablet); wordmark and Menu
 * (phone). Its surface follows the band under its vertical centre; while
 * the film stage is pinned it steps aside (CSS on html[data-at-film]) unless
 * it holds keyboard focus.
 */
export function Header() {
  const pathname = usePathname();
  const atelierPage = isAtelierPath(pathname);
  const { menuOpen, setMenuOpen } = useAtelier();
  const headerRef = useRef<HTMLElement>(null);
  const [seenSurface, setSeenSurface] = useState<Seen<Surface> | null>(null);
  const [seenSection, setSeenSection] = useState<Seen<string | null> | null>(null);

  // A route change shows that page's default until its own bands report.
  const surface: Surface =
    seenSurface?.path === pathname ? seenSurface.value : atelierPage ? "light" : "cover";
  const active = !atelierPage && seenSection?.path === pathname ? seenSection.value : null;

  // Surface: one 1px line at the header's vertical centre over every band root.
  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;
    return watchToneAt(
      // offsetHeight ignores the slide-away transform, so the line never moves while hidden.
      () => header.offsetHeight / 2,
      (tone) => {
        const value = surfaceFor(tone);
        setSeenSurface((current) =>
          current?.path === pathname && current.value === value ? current : { path: pathname, value },
        );
      },
    );
  }, [pathname]);

  // Current section: a thin band at 40–45% of the viewport over the linked sections.
  useEffect(() => {
    if (atelierPage) return;
    const inBand = new Set<HTMLElement>();
    const report = () => {
      const value = lastInOrder(inBand)?.id ?? null;
      setSeenSection((current) =>
        current?.path === pathname && current.value === value ? current : { path: pathname, value },
      );
    };
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const element = entry.target as HTMLElement;
          if (entry.isIntersecting) inBand.add(element);
          else inBand.delete(element);
        }
        report();
      },
      { rootMargin: "-40% 0px -55% 0px" },
    );
    const stop = watchElements(NAV_SELECTOR, (section) => {
      observer.observe(section);
      return () => {
        observer.unobserve(section);
        inBand.delete(section);
      };
    });
    return () => {
      stop();
      observer.disconnect();
    };
  }, [atelierPage, pathname]);

  return (
    <>
      <header
        ref={headerRef}
        className={styles.header}
        data-surface={surface}
        data-settled={seenSurface?.path === pathname ? "" : undefined}
      >
        <div className={styles.bar}>
          <nav aria-label="Main" className={styles.nav}>
            <ul className={styles.navList}>
              {NAV.map((item) => (
                <li key={item.id} className={"wide" in item ? styles.navWide : undefined}>
                  <SectionLink
                    id={item.id}
                    className={styles.navLink}
                    aria-current={active === item.id ? "true" : undefined}
                  >
                    {item.label}
                  </SectionLink>
                </li>
              ))}
            </ul>
          </nav>

          <button
            type="button"
            className={styles.menuToggle}
            aria-label="Open menu"
            aria-expanded={menuOpen}
            aria-controls="at-menu"
            onClick={() => setMenuOpen(true)}
          >
            <MenuIcon size={20} />
            <span className={styles.menuText}>Menu</span>
          </button>

          {atelierPage ? (
            <Link href={HOME} className={styles.mark} aria-label="Atelier, back to the top">
              Atelier
            </Link>
          ) : (
            <a
              href="#top"
              className={styles.mark}
              aria-label="Atelier, back to the top"
              onClick={(event) => {
                if (!isPlainClick(event)) return;
                event.preventDefault();
                scrollToTop();
              }}
            >
              Atelier
            </a>
          )}

          <BookButton className={`${ui.btn} ${styles.book}`} aria-label="Book an appointment">
            <span className={styles.bookLong}>Book an appointment</span>
            <span className={styles.bookShort}>Book</span>
          </BookButton>
        </div>
      </header>
      <MenuSheet />
    </>
  );
}
