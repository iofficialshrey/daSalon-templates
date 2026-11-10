"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, type CSSProperties } from "react";
import { jumpTo, scrollToTop } from "@/lib/page/jump";
import { atelierHref, type AtelierSlug } from "../data/ateliers";
import { IntentLink, isAtelierPath, isPlainClick, SectionLink } from "./header-links";
import { ArrowRight, Close } from "./icons";
import { Layer } from "./layer";
import { useAtelier } from "./provider";
import styles from "./menu-sheet.module.css";
import ui from "./ui.module.css";

const PAGE_LINKS = [
  { id: "walk", label: "Step inside" },
  { id: "ritual", label: "The ritual" },
  { id: "ateliers", label: "Ateliers" },
  { id: "services", label: "Services" },
  { id: "membership", label: "Membership" },
  { id: "gift-cards", label: "Gift cards" },
] as const;

type Pending = { kind: "jump"; id: string } | { kind: "top" } | { kind: "book"; slug: AtelierSlug | null };

const DESKTOP = "(min-width: 1100px)";

function row(index: number) {
  return { "--i": index } as CSSProperties;
}

/**
 * The tablet and phone menu (#at-menu): a bordeaux sheet that drops from the
 * top, booking first. Every choice closes the sheet, lets focus return to the
 * toggle, and only then jumps or opens booking, so the next focus move is not
 * undone by the sheet's own focus return.
 */
export function MenuSheet() {
  const { ateliers, menuOpen, setMenuOpen, layerOpen, openBooking, prefetchBooking, setCurrentAtelier } = useAtelier();
  const pathname = usePathname();
  const atelierPage = isAtelierPath(pathname);
  const pending = useRef<Pending | null>(null);
  const titleId = useId();
  const bookId = useId();
  const pagesId = useId();
  const ateliersId = useId();

  // The menu belongs to phones and tablets; widening the window to desktop closes it.
  useEffect(() => {
    if (!menuOpen) return;
    const query = window.matchMedia(DESKTOP);
    const onChange = () => {
      if (query.matches) setMenuOpen(false);
    };
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, [menuOpen, setMenuOpen]);

  // Run the chosen action on the frame after the sheet has closed and the page is interactive again.
  useEffect(() => {
    if (menuOpen || layerOpen || !pending.current) return;
    const frame = window.requestAnimationFrame(() => {
      const action = pending.current;
      pending.current = null;
      if (!action) return;
      if (action.kind === "jump") jumpTo(action.id);
      else if (action.kind === "top") scrollToTop();
      else openBooking(action.slug ? { slug: action.slug } : {});
    });
    return () => window.cancelAnimationFrame(frame);
  }, [menuOpen, layerOpen, openBooking]);

  const closeThen = (action: Pending) => {
    pending.current = action;
    setMenuOpen(false);
  };

  const close = () => setMenuOpen(false);

  return (
    <Layer
      open={menuOpen}
      onClose={close}
      variant="menu"
      labelledBy={titleId}
      id="at-menu"
      className={styles.panel}
    >
      <div className={`${ui.bordeaux} ${styles.sheet}`}>
        <h2 id={titleId} className={ui.srOnly}>
          Menu
        </h2>

        <div className={styles.top}>
          <p className={styles.mark} aria-hidden="true">
            Atelier
          </p>
          <button type="button" className={styles.close} aria-label="Close menu" onClick={close} data-layer-focus="">
            <Close size={20} />
          </button>
        </div>

        <div className={styles.body}>
          <div role="group" aria-labelledby={bookId} className={styles.group}>
            <p id={bookId} className={`${ui.label} ${styles.row}`} style={row(0)}>
              Book at an atelier
            </p>
            <ul className={styles.tiles}>
              {ateliers.map((atelier, index) => (
                <li key={atelier.slug} className={styles.row} style={row(index + 1)}>
                  <button
                    type="button"
                    className={styles.tile}
                    data-book=""
                    aria-label={`${atelier.trade}, book at ${atelier.name}`}
                    onClick={() => {
                      setCurrentAtelier(atelier.slug);
                      closeThen({ kind: "book", slug: atelier.slug });
                    }}
                    onPointerEnter={prefetchBooking}
                    onFocus={prefetchBooking}
                    onTouchStart={prefetchBooking}
                  >
                    <span className={styles.thumb} aria-hidden="true">
                      <Image src={atelier.photo} alt="" sizes="44px" quality={60} className={styles.thumbImg} />
                    </span>
                    <span className={styles.tileText}>
                      <span className={styles.tileLabel}>{atelier.trade}</span>
                      <span className={styles.tileName}>{atelier.name}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
            <div className={styles.row} style={row(5)}>
              <button
                type="button"
                className={`${ui.btn} ${ui.textBtn} ${styles.anywhere}`}
                data-book=""
                onClick={() => {
                  // Without choosing: the default venue, so forget the remembered atelier.
                  setCurrentAtelier(null);
                  closeThen({ kind: "book", slug: null });
                }}
                onPointerEnter={prefetchBooking}
                onFocus={prefetchBooking}
                onTouchStart={prefetchBooking}
              >
                <span className={ui.underline}>Or book without choosing</span>
                <ArrowRight />
              </button>
            </div>
          </div>

          <nav aria-labelledby={pagesId} className={`${styles.group} ${styles.pages} ${styles.row}`} style={row(6)}>
            <p id={pagesId} className={ui.label}>
              {atelierPage ? "Atelier" : "On this page"}
            </p>
            <ul className={styles.pageGrid}>
              {PAGE_LINKS.map((item) => (
                <li key={item.id}>
                  <SectionLink
                    id={item.id}
                    className={styles.pageLink}
                    onJump={(id) => closeThen({ kind: "jump", id })}
                    onNavigate={close}
                  >
                    {item.label}
                  </SectionLink>
                </li>
              ))}
              <li>
                <a
                  href="#top"
                  className={styles.pageLink}
                  onClick={(event) => {
                    if (!isPlainClick(event)) return;
                    event.preventDefault();
                    closeThen({ kind: "top" });
                  }}
                >
                  Back to top
                </a>
              </li>
            </ul>
          </nav>

          <nav aria-labelledby={ateliersId} className={`${styles.group} ${styles.atelierPages} ${styles.row}`} style={row(7)}>
            <p id={ateliersId} className={ui.label}>
              Atelier pages
            </p>
            <ul className={styles.atelierList}>
              {ateliers.map((atelier) => {
                const href = atelierHref(atelier.slug);
                return (
                  <li key={atelier.slug}>
                    <IntentLink
                      href={href}
                      className={styles.atelierLink}
                      aria-current={pathname === href ? "page" : undefined}
                      onClick={close}
                    >
                      <span>{atelier.name}</span>
                      <ArrowRight />
                    </IntentLink>
                  </li>
                );
              })}
            </ul>
          </nav>

          <p className={`${styles.powered} ${styles.row}`} style={row(8)}>
            Powered by da Salon
          </p>
        </div>
      </div>
    </Layer>
  );
}
