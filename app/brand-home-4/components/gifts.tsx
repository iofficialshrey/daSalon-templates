import { chapterById } from "../data/chapters";
import { ChapterHead, Ghost } from "./chapter-head";
import { GiftConfigurator } from "./gift-configurator";
import styles from "./gifts.module.css";
import { RunningFoot } from "./running-foot";
import ui from "./ui.module.css";

/**
 * 05 — The gift issue. A wash panel holding the card (made like a cover)
 * beside the configurator; the head sits in the right half on desktop. The
 * head is server HTML handed through the island, so it renders in place.
 */
export function Gifts() {
  return (
    <section
      id="gifts"
      className={`${ui.frame} ${ui.chapter} ${styles.section}`}
      aria-labelledby="gifts-title"
      data-chapter={chapterById("gifts").no}
      data-tone="porcelain"
    >
      <Ghost id="gifts" />
      <GiftConfigurator
        head={
          <ChapterHead
            id="gifts"
            className={styles.head}
            title="Give them the change."
            aside={
              <p>
                A Paloma gift card, made like a cover: choose the design and the value. It’s good for any service at all four
                studios for 12 months.
              </p>
            }
          />
        }
      />
      <RunningFoot id="gifts" />
    </section>
  );
}
