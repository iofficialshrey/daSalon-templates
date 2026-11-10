import { chapterById } from "../data/chapters";
import { ChapterHead, Ghost } from "./chapter-head";
import { CirclePicker } from "./circle-picker";
import styles from "./circle.module.css";
import { RunningFoot } from "./running-foot";
import ui from "./ui.module.css";

/**
 * 03 — The Circle. A cobalt chapter: the tier picker on the left, Paloma's
 * tilted porcelain member ledger on the right. The shell and head are server
 * HTML; the picker and the ledger body are one small island.
 */
export function Circle() {
  return (
    <section
      id="circle"
      className={`${ui.frame} ${ui.chapter}`}
      aria-labelledby="circle-title"
      data-chapter={chapterById("circle").no}
      data-tone="cobalt"
    >
      <Ghost id="circle" />
      <ChapterHead
        id="circle"
        title="Keep your place."
        aside={
          <p className={styles.aside}>
            Pay once, then spend wallet credit — or take a standing discount — at all four studios. Memberships here are a
            demonstration: nothing is charged.
          </p>
        }
      />
      <CirclePicker />
      <RunningFoot id="circle" />
    </section>
  );
}
