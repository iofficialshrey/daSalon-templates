import { chapterById, ISSUE, nextChapter, type ChapterId } from "../data/chapters";
import { ArrowRight } from "./icons";
import styles from "./running-foot.module.css";
import ui from "./ui.module.css";

/** End-of-chapter folio: "Paloma · Issue 04 · 02 The edit" — "Next: 03 The Circle". */
export function RunningFoot({ id }: { id: ChapterId }) {
  const chapter = chapterById(id);
  const next = nextChapter(id);
  if (!next) return null;
  return (
    <div className={styles.foot}>
      <p className={`${ui.label} ${styles.folio}`}>
        Paloma · {ISSUE.label} · {chapter.no} {chapter.label}
      </p>
      <a className={`${ui.textBtn} ${styles.next}`} href={`#${next.id}`} data-jump="">
        Next: {next.no} {next.label}
        <ArrowRight />
      </a>
    </div>
  );
}
