"use client";

import { chapterById, CHAPTERS } from "../data/chapters";
import { useActiveChapter, usePastCover } from "./chapter-store";
import styles from "./rail.module.css";

/**
 * The issue rail (from 1200px, hover and fine pointer, 640px tall): "Ch." and
 * the current number over ten 56×44 links. Each link's name is "02 The edit";
 * the label doubles as the tooltip. Hidden while the cover is on screen.
 */
export function Rail() {
  const active = useActiveChapter();
  const pastCover = usePastCover();
  const shown = pastCover && active !== "cover";

  return (
    <nav aria-label="Issue contents" className={styles.rail} data-shown={shown ? "true" : "false"}>
      <p className={styles.cell} aria-hidden="true">
        <span className={styles.ch}>Ch.</span>
        <span className={styles.now}>{chapterById(active).no}</span>
      </p>
      <ol>
        {CHAPTERS.map((chapter) => (
          <li key={chapter.id}>
            <a
              href={`#${chapter.id}`}
              data-jump=""
              className={styles.link}
              aria-current={chapter.id === active ? "location" : undefined}
            >
              <span className={styles.tick} aria-hidden="true" />
              <span className={styles.no}>{chapter.no}</span>
              <span className={styles.tip}> {chapter.label}</span>
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
