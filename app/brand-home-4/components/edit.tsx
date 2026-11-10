import { ChapterHead, Ghost } from "./chapter-head";
import { EditLive } from "./edit-live";
import { RunningFoot } from "./running-foot";
import ui from "./ui.module.css";

/**
 * 02 — The edit. A wash chapter: the head and running foot are server HTML;
 * the studio switch, the live menu and the detail spread are one island whose
 * server pass is the default studio with a skeleton at final row heights.
 */
export function Edit() {
  return (
    <section
      id="edit"
      data-chapter="02"
      data-tone="wash"
      aria-labelledby="edit-title"
      className={`${ui.chapter} ${ui.frame}`}
    >
      <Ghost id="edit" />
      <ChapterHead
        id="edit"
        title="Choose your edit."
        aside={
          <p>
            Every service, duration and price here is read live from the studio’s own diary. Prices in S$, with GST
            shown wherever a studio adds it; times in Singapore time (SGT).
          </p>
        }
      />
      <EditLive />
      <RunningFoot id="edit" />
    </section>
  );
}
