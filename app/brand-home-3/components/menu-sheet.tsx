"use client";

import type { MouseEvent } from "react";
import { MENU_LINKS } from "../data/nav";
import { PLACES, placeBySlug, subLine } from "../data/places";
import layout from "../layout.module.css";
import { BookButton } from "./book-button";
import { Close } from "./icons";
import { Layer } from "./layer";
import { StatusLine } from "./live";
import { Orb } from "./orb";
import { useSerein } from "./provider";
import header from "./header.module.css";
import styles from "./menu-sheet.module.css";
import ui from "./ui.module.css";

/** What a link in the sheet does once the sheet has closed (the header runs it). */
export type MenuAction = { kind: "jump"; id: string } | { kind: "top" };

type MenuSheetProps = {
  open: boolean;
  /** The menu button: focus returns here on close, and after a booking opened from the sheet. */
  returnTo: HTMLElement | null;
  onClose: () => void;
  onExited: () => void;
  /** Close the sheet, then jump (on the next frame, once the page is interactive). */
  onNavigate: (action: MenuAction) => void;
};

function isPlainClick(event: MouseEvent) {
  return event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;
}

/**
 * The menu sheet (#sr-menu, spec §4.0): a full-viewport paper layer below 1100px. Its top row
 * repeats the header's grid, so Close sits where the menu button was. Links close the sheet and
 * then jump; every Book closes the sheet first, and focus comes back to the menu button after
 * booking (the provider hands a Book pressed inside a layer that layer's opener).
 */
export default function MenuSheet({ open, returnTo, onClose, onExited, onNavigate }: MenuSheetProps) {
  const { currentPlace } = useSerein();
  const place = placeBySlug(currentPlace);

  return (
    <Layer
      open={open}
      onClose={onClose}
      onExited={onExited}
      variant="menu"
      id="sr-menu"
      labelledBy="sr-menu-title"
      returnTo={returnTo}
    >
      <div className={styles.sheet}>
        <h2 id="sr-menu-title" className={ui.srOnly}>
          Menu
        </h2>

        <div className={styles.top}>
          <a
            href="#top"
            className={header.mark}
            aria-label="Serein House, back to the top"
            onClick={(event) => {
              if (!isPlainClick(event)) return;
              event.preventDefault();
              onNavigate({ kind: "top" });
            }}
          >
            <span className={header.symbol} aria-hidden="true">
              S
            </span>
            <span className={`${ui.serif} ${header.wordmark}`} aria-hidden="true">
              Serein <em>House</em>
            </span>
          </a>
          <button
            type="button"
            className={`${ui.iconBtn} ${styles.close}`}
            aria-label="Close menu"
            onClick={onClose}
            data-layer-focus=""
          >
            <Close />
          </button>
        </div>

        <div className={`${layout.frame} ${styles.body}`}>
          <div className={styles.explore}>
            <p className={ui.label}>Explore Serein</p>
            <nav aria-label="Menu">
              <ul className={styles.links}>
                {MENU_LINKS.map(([id, label]) => (
                  <li key={id}>
                    <a
                      href={`#${id}`}
                      className={styles.link}
                      onClick={(event) => {
                        if (!isPlainClick(event)) return;
                        event.preventDefault();
                        onNavigate({ kind: "jump", id });
                      }}
                    >
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          <div className={styles.book}>
            <BookButton autoPlaceSuffix onBeforeOpen={onClose} className={`${ui.btn} ${ui.lg} ${ui.primary} ${ui.block}`}>
              Book a ritual
            </BookButton>

            <p className={`${ui.label} ${styles.placesLabel}`}>Book at a place</p>
            <ul className={styles.places}>
              {PLACES.map((item) => (
                <li key={item.slug}>
                  <BookButton slug={item.slug} srPrefix="Book at " onBeforeOpen={onClose} className={styles.place}>
                    <span className={styles.placeText}>
                      <span className={`${ui.serif} ${styles.placeName}`}>{item.name}</span>{" "}
                      <span className={`${ui.small} ${ui.muted}`}>{subLine(item)}</span>
                    </span>
                  </BookButton>
                </li>
              ))}
            </ul>

            <div className={styles.now}>
              <StatusLine slug={currentPlace} withName />
              <p className={`${ui.small} ${ui.muted}`}>{place.address}</p>
            </div>
          </div>

          <Orb variant="still" className={styles.orb} />
        </div>
      </div>
    </Layer>
  );
}
