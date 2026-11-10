"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type MouseEvent, type ReactNode } from "react";
import { jumpTo, scrollToTop } from "@/lib/page/jump";
import layout from "../layout.module.css";
import { BookButton } from "./book-button";
import { Menu } from "./icons";
import { StatusLine } from "./live";
import type { MenuAction } from "./menu-sheet";
import { useSerein } from "./provider";
import styles from "./header.module.css";
import ui from "./ui.module.css";

/* The menu sheet loads on the first menu tap and is warmed on intent (pointer, focus, touch). */
const loadMenuSheet = () => import("./menu-sheet");
const MenuSheet = dynamic(loadMenuSheet, { ssr: false });

function prefetchMenu() {
  void loadMenuSheet().catch(() => undefined);
}

/* ---------- Film or solid: the #film-end sentinel against the header's bottom edge ---------- */

const FILM_END = "film-end";
const DESKTOP = "(min-width: 1100px)";

/**
 * Reports `true` once #film-end has reached the header's bottom edge (the film is no longer under
 * it). The observer's root runs from that edge to far below the viewport, so the sentinel
 * "intersects" until it passes under the header: an anchor jump in either direction is always a
 * crossing, never a skipped one (a sentinel below the viewport and one above the header would
 * otherwise both read as "not intersecting", and IO reports only changes). The
 * position is also read once on start (deep links, reloads). The film swaps its markup after
 * hydration (lite) or on failure, so a replaced sentinel is picked up again.
 */
function watchFilmEnd(report: (solid: boolean) => void) {
  let sentinel: HTMLElement | null = null;
  let observer: IntersectionObserver | null = null;
  let line = -1;

  const headerBottom = () => document.querySelector<HTMLElement>("header[data-solid]")?.offsetHeight ?? 0;

  const sync = () => {
    const next = document.getElementById(FILM_END);
    const nextLine = headerBottom();
    if (observer && next === sentinel && nextLine === line) return;
    observer?.disconnect();
    observer = null;
    sentinel = next;
    line = nextLine;
    // No film on the page: there is nothing to be transparent over.
    if (!sentinel) {
      report(true);
      return;
    }
    // The edge sits 1px below the header: a jump to the section right after the film puts the
    // sentinel exactly on the header's bottom edge (and IO counts edge contact as intersecting).
    const edge = line + 1;
    report(sentinel.getBoundingClientRect().top < edge);
    observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[entries.length - 1];
        if (entry) report(!entry.isIntersecting && entry.boundingClientRect.top < edge);
      },
      { rootMargin: `-${edge}px 0px 1000% 0px`, threshold: 0 },
    );
    observer.observe(sentinel);
  };

  sync();

  const mutations = new MutationObserver(() => {
    if (document.getElementById(FILM_END) !== sentinel) sync();
  });
  const main = document.getElementById("main");
  if (main) mutations.observe(main, { childList: true, subtree: true });

  // The header is 64 / 68 / 76px tall by breakpoint: rebuild the root margin when it changes.
  window.addEventListener("resize", sync);

  return () => {
    window.removeEventListener("resize", sync);
    mutations.disconnect();
    observer?.disconnect();
  };
}

let solidNow = false;
let stopWatching: (() => void) | null = null;
const solidListeners = new Set<() => void>();

function setSolid(next: boolean) {
  if (next === solidNow) return;
  solidNow = next;
  solidListeners.forEach((listener) => listener());
}

function subscribeSolid(listener: () => void) {
  solidListeners.add(listener);
  stopWatching ??= watchFilmEnd(setSolid);
  return () => {
    solidListeners.delete(listener);
    if (solidListeners.size || !stopWatching) return;
    stopWatching();
    stopWatching = null;
  };
}

/** False on the server and during hydration (the film is always first), then the sentinel's answer. */
function useHeaderSolid() {
  return useSyncExternalStore(
    subscribeSolid,
    () => solidNow,
    () => false,
  );
}

/**
 * The <header> itself: transparent with paper-soft text over the film (and the film's double focus
 * ring), solid paper-soft with ink text after it. Only colours change; nothing moves.
 */
export function HeaderBar({ children }: { children: ReactNode }) {
  const solid = useHeaderSolid();
  return (
    <header className={`${styles.header} ${solid ? "" : layout.filmFocus}`} data-solid={solid ? "true" : "false"}>
      {children}
    </header>
  );
}

type MenuState = { open: boolean; returnTo: HTMLElement | null };

/**
 * Book (every width; its name always includes the current place) and, below 1100px, the menu
 * button that opens the menu sheet. A link chosen in the sheet runs only after the sheet has
 * closed and the page is interactive again, so its focus move is not undone by the sheet's own
 * focus return.
 */
export function HeaderActions() {
  const solid = useHeaderSolid();
  const { layerOpen } = useSerein();
  const [menu, setMenu] = useState<MenuState | null>(null);
  const pending = useRef<MenuAction | null>(null);
  const menuOpen = menu?.open ?? false;

  const closeMenu = useCallback(() => {
    setMenu((current) => (current?.open ? { ...current, open: false } : current));
  }, []);

  // The exit animation finished: unmount, unless the guest reopened it meanwhile.
  const menuExited = useCallback(() => {
    setMenu((current) => (current && !current.open ? null : current));
  }, []);

  const navigate = useCallback((action: MenuAction) => {
    pending.current = action;
    closeMenu();
  }, [closeMenu]);

  const openMenu = (event: MouseEvent<HTMLButtonElement>) => {
    // Captured now: Safari does not focus clicked buttons, and focus returns here on close.
    const button = event.currentTarget;
    void loadMenuSheet().then(
      () => setMenu({ open: true, returnTo: button }),
      () => undefined,
    );
  };

  // Run the chosen link on the frame after the sheet has gone and the page is no longer inert.
  useEffect(() => {
    if (menuOpen || layerOpen || !pending.current) return;
    const frame = window.requestAnimationFrame(() => {
      const action = pending.current;
      pending.current = null;
      if (action?.kind === "jump") jumpTo(action.id);
      else if (action?.kind === "top") scrollToTop();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [menuOpen, layerOpen]);

  // The menu belongs below 1100px; widening the window to desktop closes it.
  useEffect(() => {
    if (!menuOpen) return;
    const query = window.matchMedia(DESKTOP);
    const onChange = () => {
      if (query.matches) closeMenu();
    };
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, [menuOpen, closeMenu]);

  return (
    <div className={styles.actions}>
      <BookButton autoPlaceSuffix className={`${ui.btn} ${ui.sm} ${solid ? ui.primary : ui.outlineOnDark} ${styles.book}`}>
        Book<span className={ui.srOnlyPhone}> a ritual</span>
      </BookButton>
      <button
        type="button"
        className={`${ui.iconBtn} ${styles.menuButton}`}
        aria-label="Open menu"
        aria-expanded={menuOpen}
        aria-controls="sr-menu"
        onClick={openMenu}
        onPointerEnter={prefetchMenu}
        onFocus={prefetchMenu}
        onTouchStart={prefetchMenu}
      >
        <Menu />
      </button>
      {menu ? (
        <MenuSheet
          open={menu.open}
          returnTo={menu.returnTo}
          onClose={closeMenu}
          onExited={menuExited}
          onNavigate={navigate}
        />
      ) : null}
    </div>
  );
}

/** The current place's live status (the footer's "Your hour"); follows the guest's latest choice. */
export function CurrentPlaceStatus({ onDark = false, className }: { onDark?: boolean; className?: string }) {
  const { currentPlace } = useSerein();
  return <StatusLine slug={currentPlace} withName onDark={onDark} className={className} />;
}
