"use client";

import { useEffect, useRef } from "react";
import { chapterById, NAV } from "../data/chapters";
import { BookButton } from "./book-button";
import { useActiveChapter, usePastCover } from "./chapter-store";
import { ArrowRight, ContentsIcon } from "./icons";
import { usePaloma } from "./provider";
import styles from "./header.module.css";
import ui from "./ui.module.css";

/** Desktop Primary nav: in-page jumps, the current chapter marked as the location. */
export function HeaderNav() {
  const active = useActiveChapter();
  return (
    <nav aria-label="Primary" className={styles.nav}>
      <ul className={styles.navList}>
        {NAV.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              data-jump=""
              className={styles.navLink}
              aria-current={active === item.id ? "location" : undefined}
            >
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/**
 * Contents (with the current chapter's numeral on phones) and the masthead
 * Book. Book names the chosen studio on its second line; on phones it stays
 * hidden while the cover's Book circle is on screen.
 */
export function HeaderActions() {
  const { openContents, prefetchContents, contentsOpen, currentStudio, studioBySlug } = usePaloma();
  const chapter = chapterById(useActiveChapter());
  const pastCover = usePastCover();
  const studio = studioBySlug(currentStudio);
  // The accessible name equals the visible text on tablet and desktop, and starts with "Book" on phones.
  const bookName = studio ? `Book the look at ${studio.short}` : "Book the look";

  return (
    <div className={styles.actions} data-past-cover={pastCover ? "true" : "false"}>
      <button
        type="button"
        className={styles.contents}
        aria-haspopup="dialog"
        aria-expanded={contentsOpen}
        aria-controls="p4-contents"
        onClick={(event) => openContents({ returnTo: event.currentTarget })}
        onPointerEnter={prefetchContents}
        onFocus={prefetchContents}
        onTouchStart={prefetchContents}
      >
        {/* One inline run, so the spaces in the name are real text: "07 Contents, now reading Studios". */}
        <span>
          <span className={styles.contentsNo}>{chapter.no}</span> Contents
          <span className={ui.srOnly}>, now reading {chapter.label}</span>
        </span>
        <ContentsIcon className={styles.contentsIcon} />
      </button>

      <BookButton className={styles.book} studioLine lineClassName={styles.bookAt} aria-label={bookName}>
        <span className={styles.bookLine}>
          Book<span className={styles.bookTail}> the look</span>
        </span>
        <ArrowRight className={styles.bookArrow} />
      </BookButton>
    </div>
  );
}

/**
 * The 3px reading-progress bar. A scroll timeline drives it in CSS; where that
 * is unsupported, one passive scroll listener writes transform on this element
 * only, with the scroll range cached and refreshed when <main> resizes.
 */
export function ReadingProgress() {
  const barRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const bar = barRef.current;
    if (!bar || CSS.supports("animation-timeline: scroll()")) return;
    let range = 1;
    let frame = 0;
    const measure = () => {
      range = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    };
    const paint = () => {
      frame = 0;
      const progress = Math.min(1, Math.max(0, window.scrollY / range));
      bar.style.transform = `scaleX(${progress.toFixed(4)})`;
    };
    const request = () => {
      if (!frame) frame = window.requestAnimationFrame(paint);
    };
    const remeasure = () => {
      measure();
      request();
    };
    measure();
    paint();
    const main = document.getElementById("main");
    const observer = new ResizeObserver(remeasure);
    if (main) observer.observe(main);
    window.addEventListener("scroll", request, { passive: true });
    window.addEventListener("resize", remeasure, { passive: true });
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", request);
      window.removeEventListener("resize", remeasure);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return <span ref={barRef} className={styles.progress} aria-hidden="true" />;
}
