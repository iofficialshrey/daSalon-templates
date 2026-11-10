"use client";

import { useEffect, useId, useRef, useState, type MouseEvent } from "react";
import { jumpTo } from "@/lib/page/jump";
import { CHAPTERS, ISSUE, type ChapterId } from "../data/chapters";
import type { StudioSlug } from "../data/studios";
import { useActiveChapter } from "./chapter-store";
import { ArrowRight, Close } from "./icons";
import { Layer } from "./layer";
import { MotionToggle } from "./motion-toggle";
import { usePaloma } from "./provider";
import styles from "./contents-sheet.module.css";
import ui from "./ui.module.css";

type Pending = { kind: "jump"; id: ChapterId } | { kind: "book"; slug: StudioSlug };

/** A plain primary click; modified clicks keep the browser's own link behaviour. */
function isPlainClick(event: MouseEvent) {
  return event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;
}

/**
 * Contents (#p4-contents): a full-viewport ink sheet that rises from the
 * bottom, with the ten chapters, the four studios to book at, and the global
 * motion toggle. Every choice closes the sheet first; once the page is
 * interactive again (and focus is back on the opener) the jump or the booking
 * window runs on the next frame, so it is not undone by the sheet's own focus
 * return.
 */
export default function ContentsSheet({ onClose, returnTo }: { onClose: () => void; returnTo: HTMLElement | null }) {
  const { studios, openBooking, prefetchBooking, layerOpen } = usePaloma();
  const active = useActiveChapter();
  const [open, setOpen] = useState(true);
  const pending = useRef<Pending | null>(null);
  const titleId = useId();
  const bookId = useId();

  // Not cancelled on cleanup: under reduced motion the sheet can unmount before this frame,
  // and the action must still run. The ref makes it run once.
  useEffect(() => {
    if (open || layerOpen || !pending.current) return;
    window.requestAnimationFrame(() => {
      const action = pending.current;
      pending.current = null;
      if (!action) return;
      if (action.kind === "jump") jumpTo(action.id);
      // Booking hands focus back to whatever opened the sheet.
      else openBooking({ slug: action.slug }, { returnTo: returnTo ?? undefined });
    });
  }, [open, layerOpen, openBooking, returnTo]);

  const close = () => setOpen(false);

  const closeThen = (action: Pending) => {
    pending.current = action;
    setOpen(false);
  };

  return (
    <Layer
      open={open}
      onClose={close}
      onExited={onClose}
      variant="contents"
      labelledBy={titleId}
      id="p4-contents"
      returnTo={returnTo}
    >
      <div className={styles.sheet} data-tone="ink">
        <div className={styles.top}>
          <div className={styles.titleGroup}>
            <h2 id={titleId} className={styles.title} tabIndex={-1} data-layer-focus="">
              Contents
            </h2>
            <p className={styles.issue}>{ISSUE.label}</p>
          </div>
          <button type="button" className={styles.close} onClick={close}>
            <Close className={styles.closeIcon} />
            <span className={ui.srOnly}>Close contents</span>
          </button>
        </div>

        <div className={`${ui.frame} ${styles.body}`}>
          <nav aria-label="Contents" className={styles.chapters}>
            <ol className={styles.list}>
              {CHAPTERS.map((chapter) => {
                const current = chapter.id === active;
                return (
                  <li key={chapter.id} className={styles.item}>
                    <a
                      href={`#${chapter.id}`}
                      className={styles.row}
                      aria-current={current ? "location" : undefined}
                      onClick={(event) => {
                        if (!isPlainClick(event)) return;
                        event.preventDefault();
                        closeThen({ kind: "jump", id: chapter.id });
                      }}
                    >
                      <span className={styles.no}>{chapter.no}</span>
                      <span className={styles.text}>
                        <span className={styles.name}>{chapter.label}</span>
                        <span className={styles.dek}>{chapter.dek}</span>
                      </span>
                      {current ? <span className={ui.srOnly}> (you are here)</span> : null}
                    </a>
                  </li>
                );
              })}
            </ol>
          </nav>

          <div role="group" aria-labelledby={bookId} className={styles.book}>
            <p id={bookId} className={styles.bookLabel}>
              Book at
            </p>
            <ul className={styles.studios}>
              {studios.map((studio) => (
                <li key={studio.slug} className={styles.studioItem}>
                  <button
                    type="button"
                    className={styles.studio}
                    data-book=""
                    onClick={() => closeThen({ kind: "book", slug: studio.slug })}
                    onPointerEnter={prefetchBooking}
                    onFocus={prefetchBooking}
                    onTouchStart={prefetchBooking}
                  >
                    <span className={styles.studioNo}>{studio.no}</span>
                    <span className={styles.studioName}>{studio.name}</span>
                    <span className={styles.studioArea}>{studio.area}</span>
                    <ArrowRight className={styles.studioArrow} />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className={styles.foot}>
          <MotionToggle className={styles.motion} />
          <p className={styles.note}>Prices in S$ · Singapore time (SGT)</p>
        </div>
      </div>
    </Layer>
  );
}
