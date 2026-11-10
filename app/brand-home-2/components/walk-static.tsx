"use client";

import type { MouseEvent } from "react";
import { jumpTo } from "@/lib/page/jump";
import { AFTER_WALK_ID, BEATS, FILM_SOURCES, WALK_COPY, stillSrc } from "../data/walk";
import { ArrowDown } from "./icons";
import { DoorBand } from "./walk-doors";
import { Caption, FinalActions } from "./walk-look";
import ui from "./ui.module.css";
import styles from "./walk-static.module.css";

const STILLS = [1, 2, 3, 4] as const;

/*
 * Static mode (reduced motion, Save-Data, 2G, very low memory, or a film that
 * failed at the top of the page): a calm noir spread with zero video bytes.
 * The closed doors as a band, then four stills from the film with their lines.
 */
export function StaticWalk() {
  const skip = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    jumpTo(AFTER_WALK_ID);
  };

  return (
    <section
      id="walk"
      data-tone="noir"
      data-scrub-film=""
      data-mode="static"
      aria-labelledby="walk-title"
      data-film-landscape={FILM_SOURCES.landscape}
      data-film-portrait={FILM_SOURCES.portrait}
      data-film-safe={FILM_SOURCES.portraitSafe}
      className={`${styles.walk} ${ui.noir}`}
    >
      <DoorBand />
      <div className={`${ui.container} ${styles.body}`}>
        <div className={ui.head}>
          <h2 id="walk-title" className={ui.h2}>
            {WALK_COPY.staticTitle}
          </h2>
          <div className={ui.headAction}>
            <a href={`#${AFTER_WALK_ID}`} className={`${ui.btn} ${ui.textBtn}`} onClick={skip}>
              <span className={ui.underline}>{WALK_COPY.staticSkip}</span>
              <ArrowDown />
            </a>
          </div>
        </div>
        <ol className={styles.stills}>
          {BEATS.map((beat, index) => {
            const still = STILLS[index] ?? 1;
            const last = index === BEATS.length - 1;
            return (
              <li key={beat.id} className={styles.still}>
                <picture className={styles.picture}>
                  <source type="image/avif" srcSet={stillSrc(still, "avif")} />
                  <img
                    src={stillSrc(still, "webp")}
                    width={600}
                    height={800}
                    alt={WALK_COPY.stillAlts[index] ?? ""}
                    loading="lazy"
                    decoding="async"
                  />
                </picture>
                <Caption beat={beat} className={styles.line}>
                  {last ? <FinalActions block /> : null}
                </Caption>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
