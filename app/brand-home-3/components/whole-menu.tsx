"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import layout from "../layout.module.css";
import { placeBySlug } from "../data/places";
import { BookButton } from "./book-button";
import { Minus, Plus } from "./icons";
import { usePlaceEntry } from "./live";
import { setMenuOpen, useMenuState } from "./menu-store";
import { useSerein } from "./provider";
import ui from "./ui.module.css";
import styles from "./rituals.module.css";

/*
 * "05 · The whole menu": a full-width disclosure under the ritual browser with
 * every live service at the chosen place. Collapsed by default; the place cards
 * open it at their place through menu-store.showMenu(slug), then jump here and
 * focus the header button.
 *
 * Only the header, the empty panel frame and the status line ship with the page.
 * The panel body (whole-menu-panel.tsx: place tabs, live services, the fetching
 * and warming) loads with next/dynamic on the first open, however it opens
 * (setMenuOpen or showMenu), and is warmed on intent on the header. Until its
 * code arrives the panel shows skeleton rows and the status line says so; if
 * the code can't be fetched, the panel says so and offers to try again.
 */

const loadPanel = () => import("./whole-menu-panel");
const WholeMenuPanel = dynamic(loadPanel, { ssr: false, loading: MenuSkeleton });

type Chunk = "idle" | "loading" | "ready" | "error";

let chunk: Chunk = "idle";
const chunkListeners = new Set<() => void>();

function setChunk(next: Chunk) {
  chunk = next;
  chunkListeners.forEach((listener) => listener());
}

function subscribeChunk(listener: () => void) {
  chunkListeners.add(listener);
  return () => chunkListeners.delete(listener);
}

/** Fetches the panel's code once; after a failure, the next call tries again. */
function ensurePanel() {
  if (chunk === "loading" || chunk === "ready") return;
  setChunk("loading");
  loadPanel().then(
    () => setChunk("ready"),
    () => setChunk("error"),
  );
}

const SKELETON_ROWS = ["a", "b", "c", "d", "e", "f"] as const;

/** Placeholder rows, while the panel's code or the place's menu loads (the status line speaks for them). */
export function MenuSkeleton() {
  return (
    <ul className={styles.skeletons} aria-hidden="true">
      {SKELETON_ROWS.map((key) => (
        <li key={key} className={styles.skeletonRow}>
          <span className={`${ui.skeleton} ${styles.skelName}`} />
          <span className={`${ui.skeleton} ${styles.skelMeta}`} />
        </li>
      ))}
    </ul>
  );
}

export function WholeMenu() {
  const { currentPlace } = useSerein();
  const { menuOpen: open, menuPlace } = useMenuState();
  const slug = menuPlace ?? currentPlace;
  const place = placeBySlug(slug);
  const { status } = usePlaceEntry(slug);
  const code = useSyncExternalStore(subscribeChunk, () => chunk, () => "idle" as const);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Once opened, the body stays mounted, so closing animates and a reopen is instant.
  const [opened, setOpened] = useState(open);
  if (open && !opened) setOpened(true);

  useEffect(() => {
    if (open) ensurePanel();
  }, [open]);

  const failed = open && code === "error";
  const loading = open && !failed && (code !== "ready" || status === "loading");
  // Said only after the guest opens the menu or changes place, never on load.
  const announcement = failed
    ? `We couldn't load the menu at ${place.name} just now.`
    : loading
      ? `Loading the menu at ${place.name}…`
      : "";

  let body;
  if (code === "ready" && opened) body = <WholeMenuPanel open={open} slug={slug} />;
  else if (code === "error")
    body = (
      <div className={styles.state}>
        <p className={ui.body}>{`We couldn't load the menu at ${place.name} just now.`}</p>
        <div className={styles.stateActions}>
          <button
            type="button"
            className={ui.text}
            onClick={() => {
              // This button goes as the retry starts: focus waits on the menu's header.
              buttonRef.current?.focus();
              ensurePanel();
            }}
          >
            Try again
          </button>
          <BookButton slug={slug} className={`${ui.btn} ${ui.sm} ${ui.secondary}`}>
            {`Book at ${place.name}`}
          </BookButton>
        </div>
      </div>
    );
  else body = <MenuSkeleton />;

  return (
    <div id="menu" className={`${styles.menu} ${layout.reveal}`}>
      <h3 id="menu-title">
        <button
          ref={buttonRef}
          type="button"
          className={`${styles.rowButton} ${styles.menuButton}`}
          data-jump-focus=""
          aria-expanded={open}
          aria-controls="menu-panel"
          onClick={() => setMenuOpen(!open)}
          onPointerEnter={ensurePanel}
          onFocus={ensurePanel}
          onTouchStart={ensurePanel}
        >
          <span className={`${ui.label} ${ui.num} ${styles.numeral}`} aria-hidden="true">
            05
          </span>
          <span className={styles.rowText}>
            <span className={`${ui.displayM} ${styles.name}`}>The whole menu</span>
            <span className={`${ui.ui} ${ui.muted} ${styles.menuMeta}`}>Every service, from each place&apos;s live diary</span>
          </span>
          {open ? <Minus className={styles.icon} /> : <Plus className={styles.icon} />}
        </button>
      </h3>

      <div
        id="menu-panel"
        role="region"
        aria-labelledby="menu-title"
        aria-busy={open && code !== "ready" && !failed ? true : undefined}
        className={styles.panel}
        data-open={open ? "" : undefined}
        inert={!open}
      >
        <div className={styles.clip}>
          <div className={styles.menuBody}>{body}</div>
        </div>
      </div>

      <p className={ui.srOnly} role="status">
        {announcement}
      </p>
    </div>
  );
}
