"use client";

import { useEffect, useId, useRef, useState, type CSSProperties, type MouseEvent } from "react";
import type { HouseSlug } from "../data/houses";
import { jumpTo } from "@/lib/page/jump";
import { BookButton, TopButton } from "./actions";
import { ArrowRight, Menu as MenuIcon } from "./icons";
import { Layer } from "./layer";
import { useMaison } from "./provider";
import styles from "./header.module.css";
import ui from "./ui.module.css";

type Tone = "film" | "solid";

type MenuAction = { kind: "jump"; id: string } | { kind: "house"; slug: HouseSlug } | { kind: "book" };

/** Desktop navigation. Membership covers the whole privileges section; Gift cards wins inside it. */
const NAV = [
  { id: "houses", label: "Houses" },
  { id: "menu", label: "Services" },
  { id: "privileges", label: "Membership" },
  { id: "gift-cards", label: "Gift cards" },
  { id: "visit", label: "Visit" },
] as const;

const MENU_LINKS = [
  { id: "houses", label: "The houses" },
  { id: "menu", label: "Services" },
  { id: "privileges", label: "Membership" },
  { id: "packages", label: "Packages" },
  { id: "gift-cards", label: "Gift cards" },
  { id: "visit", label: "Before you visit" },
] as const;

const DESKTOP = "(min-width: 1100px)";

/**
 * Bottom root margin for sentinel observers. Stretching the observed area far below the
 * viewport means "not intersecting" can only mean "above the line", so an instant jump
 * from the film's first frame straight past its end still reports a change.
 */
export const FAR_BELOW = "1000%";

/**
 * Calls attach with each element that has one of these ids, now or as soon as it appears,
 * and again whenever it is replaced (the film swaps its tree when it falls back to static
 * mode). Returns a function that stops watching and detaches everything.
 */
export function watchElements(ids: readonly string[], attach: (element: HTMLElement) => () => void) {
  const attached = new Map<string, { element: HTMLElement; detach: () => void }>();
  const sync = () => {
    for (const id of ids) {
      const element = document.getElementById(id);
      const known = attached.get(id);
      if ((known?.element ?? null) === element) continue;
      known?.detach();
      attached.delete(id);
      if (element) attached.set(id, { element, detach: attach(element) });
    }
  };
  sync();
  const mutations = new MutationObserver(sync);
  mutations.observe(document.body, { childList: true, subtree: true });
  return () => {
    mutations.disconnect();
    attached.forEach((item) => item.detach());
    attached.clear();
  };
}

/** A plain primary click; modified clicks keep the browser's own link behaviour. */
function isPlainClick(event: MouseEvent) {
  return event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;
}

function stagger(index: number) {
  return { "--i": index } as CSSProperties;
}

export function Header() {
  const { houses, layerOpen, bookingOpen, openBooking, openHouse, prefetchBooking, prefetchHouseSheet } = useMaison();
  const headerRef = useRef<HTMLElement>(null);
  const pending = useRef<MenuAction | null>(null);
  const [tone, setTone] = useState<Tone>("film");
  const [active, setActive] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const housesTitleId = useId();

  // Tone: film while the hero is under the header, solid once #film-end passes beneath it.
  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;
    let sentinel: HTMLElement | null = null;
    let observer: IntersectionObserver | null = null;
    let line = -1;

    const observe = () => {
      observer?.disconnect();
      observer = null;
      if (!sentinel) return;
      line = Math.round(header.getBoundingClientRect().height);
      observer = new IntersectionObserver(
        (entries) => {
          const entry = entries[entries.length - 1];
          if (entry) setTone(entry.isIntersecting ? "film" : "solid");
        },
        { rootMargin: `-${line}px 0px ${FAR_BELOW} 0px` },
      );
      observer.observe(sentinel);
    };

    // The header is 60, 68 or 76px tall (plus the safe area); re-observe when that changes.
    const resize = new ResizeObserver(() => {
      if (Math.round(header.getBoundingClientRect().height) !== line) observe();
    });
    resize.observe(header);

    const stop = watchElements(["film-end"], (element) => {
      sentinel = element;
      observe();
      return () => {
        sentinel = null;
        observe();
      };
    });

    // No film on the page: an ivory header keeps the wordmark and nav legible.
    const fallback = window.requestAnimationFrame(() => {
      if (!sentinel) setTone("solid");
    });

    return () => {
      window.cancelAnimationFrame(fallback);
      stop();
      resize.disconnect();
      observer?.disconnect();
    };
  }, []);

  // Active section: one observer over the linked sections, reading a thin band at 40–45% of the viewport.
  useEffect(() => {
    const inBand = new Set<string>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) inBand.add(entry.target.id);
          else inBand.delete(entry.target.id);
        }
        setActive(inBand.has("gift-cards") ? "gift-cards" : NAV.find((item) => inBand.has(item.id))?.id ?? null);
      },
      { rootMargin: "-40% 0px -55% 0px" },
    );
    const stop = watchElements(
      NAV.map((item) => item.id),
      (section) => {
        observer.observe(section);
        return () => {
          observer.unobserve(section);
          inBand.delete(section.id);
        };
      },
    );
    return () => {
      stop();
      observer.disconnect();
    };
  }, []);

  // The menu belongs to phones and tablets; widening the window to desktop closes it.
  useEffect(() => {
    if (!menuOpen) return;
    const query = window.matchMedia(DESKTOP);
    const onChange = () => {
      if (query.matches) setMenuOpen(false);
    };
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, [menuOpen]);

  // A menu choice runs once the menu has fully closed and the page is interactive again,
  // so the jump's heading focus is not undone by the menu returning focus to its toggle.
  useEffect(() => {
    if (menuOpen || layerOpen || !pending.current) return;
    const frame = window.requestAnimationFrame(() => {
      const action = pending.current;
      pending.current = null;
      if (!action) return;
      if (action.kind === "jump") jumpTo(action.id);
      else if (action.kind === "house") openHouse(action.slug);
      else openBooking();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [menuOpen, layerOpen, openBooking, openHouse]);

  const closeThen = (action: MenuAction) => {
    pending.current = action;
    setMenuOpen(false);
  };

  const film = tone === "film";

  return (
    <>
      <header
        ref={headerRef}
        className={`${styles.header} ${film ? ui.onDark : ""}`}
        data-tone={tone}
        inert={layerOpen || bookingOpen}
      >
        <div className={styles.bar}>
          <TopButton className={styles.wordmark} aria-label="Maison Élan, back to top">
            Maison Élan
          </TopButton>

          <nav aria-label="Main" className={styles.nav}>
            <ul className={styles.navList}>
              {NAV.map((item) => (
                <li key={item.id}>
                  <a
                    href={`#${item.id}`}
                    className={styles.navLink}
                    aria-current={active === item.id ? "true" : undefined}
                    onClick={(event) => {
                      if (!isPlainClick(event)) return;
                      event.preventDefault();
                      jumpTo(item.id);
                    }}
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className={styles.actions}>
            <BookButton className={`${ui.btn} ${ui.sm} ${film ? ui.primaryOnDark : ui.primary} ${styles.book}`}>
              Book a visit
            </BookButton>
            <BookButton className={`${ui.btn} ${ui.textBtn} ${styles.phoneBook}`} aria-label="Book a visit">
              <span className={ui.underline}>Book</span>
            </BookButton>
            <button
              type="button"
              className={styles.menuToggle}
              aria-label="Open menu"
              aria-expanded={menuOpen}
              aria-controls="mx-menu"
              onClick={() => setMenuOpen(true)}
            >
              <span className={styles.menuText}>Menu</span>
              <MenuIcon size={20} />
            </button>
          </div>
        </div>
      </header>

      <Layer
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        variant="menu"
        title="Menu"
        hideTitle
        className={styles.menuPanel}
      >
        <div id="mx-menu" className={`${styles.menu} ${ui.onDark}`}>
          <p className={styles.menuMark}>Maison Élan</p>

          <nav aria-label="Sections">
            <ul className={styles.menuList}>
              {MENU_LINKS.map((item, index) => (
                <li key={item.id} className={styles.menuItem} style={stagger(index)}>
                  <a
                    href={`#${item.id}`}
                    className={styles.menuLink}
                    onClick={(event) => {
                      if (!isPlainClick(event)) return;
                      event.preventDefault();
                      closeThen({ kind: "jump", id: item.id });
                    }}
                  >
                    <span>{item.label}</span>
                    <ArrowRight size={20} />
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className={`${styles.menuItem} ${styles.menuBook}`} style={stagger(MENU_LINKS.length)}>
            <button
              type="button"
              className={`${ui.btn} ${ui.lg} ${ui.primaryOnDark} ${ui.block}`}
              data-book=""
              onClick={() => closeThen({ kind: "book" })}
              onPointerEnter={prefetchBooking}
              onFocus={prefetchBooking}
              onTouchStart={prefetchBooking}
            >
              Book a visit
            </button>
          </div>

          <section
            className={styles.menuItem}
            style={stagger(MENU_LINKS.length + 1)}
            aria-labelledby={housesTitleId}
          >
            <h3 id={housesTitleId} className={`${ui.label} ${ui.labelOnDark} ${styles.menuHousesTitle}`}>
              Our houses
            </h3>
            <ul className={styles.menuHouses}>
              {houses.map((house) => (
                <li key={house.slug}>
                  <button
                    type="button"
                    className={styles.menuHouse}
                    onClick={() => closeThen({ kind: "house", slug: house.slug })}
                    onPointerEnter={prefetchHouseSheet}
                    onFocus={prefetchHouseSheet}
                    onTouchStart={prefetchHouseSheet}
                  >
                    <span className={styles.menuHouseName}>{house.name}</span>
                    <span className={styles.menuHouseMeta}>
                      {house.specialty} · {house.area}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </section>

          <p className={`${styles.menuItem} ${styles.powered}`} style={stagger(MENU_LINKS.length + 2)}>
            Powered by da Salon
          </p>
        </div>
      </Layer>
    </>
  );
}
