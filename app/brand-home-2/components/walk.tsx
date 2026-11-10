"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type MouseEvent } from "react";
import { jumpTo } from "@/lib/page/jump";
import { AFTER_WALK_ID, BEATS, CHAPTERS, FILM_SOURCES, PORTRAIT_QUERY, WALK_COPY, posterSrc } from "../data/walk";
import { liteSnapshot, subscribeLite } from "../lib/film";
import { ArrowDown } from "./icons";
import { Doors } from "./walk-doors";
import { startWalkEngine, type WalkEngine } from "./walk-engine";
import { Caption, FinalActions } from "./walk-look";
import { StaticWalk } from "./walk-static";
import ui from "./ui.module.css";
import styles from "./walk.module.css";

/*
 * Section 2: the threshold. Two black fluted doors, as on the production
 * site, slide apart onto the film's own doors; the film then scrubs under
 * four quiet captions, and ends with one invitation. The server renders the
 * film markup (doors closed, frame 0); static mode replaces it after
 * hydration.
 */

const CAPTION_CLASS = [styles.beat1, styles.beat2, styles.beat3, styles.beat4] as const;
const SHADE_CLASS = [styles.shade1, styles.shade2, styles.shade3, styles.shade4] as const;

/** The true first or last frame of the encode in use: portrait 576×768 or landscape 1280×720. */
function Poster({ which }: { which: "first" | "last" }) {
  return (
    <picture className={styles.poster}>
      <source media={PORTRAIT_QUERY} type="image/avif" srcSet={posterSrc("576x768", which, "avif")} />
      <source media={PORTRAIT_QUERY} type="image/webp" srcSet={posterSrc("576x768", which, "webp")} />
      <source type="image/avif" srcSet={posterSrc("1280x720", which, "avif")} />
      <source type="image/webp" srcSet={posterSrc("1280x720", which, "webp")} />
      <img
        src={posterSrc("1280x720", which, "jpg")}
        width={1280}
        height={720}
        alt=""
        loading="eager"
        fetchPriority="low"
        decoding="async"
      />
    </picture>
  );
}

export function Walk() {
  const lite = useSyncExternalStore(subscribeLite, liteSnapshot, () => false);
  const [failed, setFailed] = useState(false);
  const [posterLast, setPosterLast] = useState(false);
  const isStatic = lite || failed;

  const rootRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const engineRef = useRef<WalkEngine | null>(null);

  useEffect(() => {
    if (isStatic) return;
    const root = rootRef.current;
    const stage = stageRef.current;
    const video = videoRef.current;
    if (!root || !stage || !video) return;
    let engine: WalkEngine | null = null;
    try {
      engine = startWalkEngine({
        root,
        stage,
        video,
        onFail: () => setFailed(true),
        onPoster: (which) => setPosterLast(which === "last"),
      });
    } catch {
      // The film is an enhancement: without its controller the doors stay closed over the poster.
      engine = null;
    }
    engineRef.current = engine;
    return () => {
      engineRef.current = null;
      engine?.destroy();
    };
  }, [isStatic]);

  if (isStatic) return <StaticWalk key="static" />;

  const skip = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    jumpTo(AFTER_WALK_ID);
    // Land past the last frame with the doors open, never scrubbing back through the film.
    engineRef.current?.snap();
  };

  return (
    <section
      key="film"
      ref={rootRef}
      id="walk"
      data-tone="noir"
      data-scrub-film=""
      data-mode="film"
      data-doors="closed"
      aria-labelledby="walk-title"
      data-film-landscape={FILM_SOURCES.landscape}
      data-film-portrait={FILM_SOURCES.portrait}
      data-film-safe={FILM_SOURCES.portraitSafe}
      className={`${styles.walk} ${ui.noir}`}
    >
      <h2 id="walk-title" className={ui.srOnly}>
        {WALK_COPY.srTitle}
      </h2>
      <p className={ui.srOnly}>{WALK_COPY.srDescription}</p>

      <div ref={stageRef} className={styles.stage}>
        <div className={styles.film} data-part="film" aria-hidden="true">
          <Poster key={posterLast ? "last" : "first"} which={posterLast ? "last" : "first"} />
          <video
            ref={videoRef}
            className={styles.video}
            muted
            playsInline
            preload="none"
            disablePictureInPicture
            disableRemotePlayback
            tabIndex={-1}
            aria-hidden="true"
          />
        </div>
        <div className={styles.dimmer} data-part="dimmer" aria-hidden="true" />
        <div className={styles.spill} data-part="spill" aria-hidden="true" />
        <div className={styles.shades} aria-hidden="true">
          <div className={styles.shadeBase} />
          {SHADE_CLASS.map((shade) => (
            <div key={shade} className={`${styles.beatShade} ${shade}`} data-part="look-shade" />
          ))}
        </div>

        <div className={styles.captions}>
          {BEATS.map((beat, index) => {
            const last = index === BEATS.length - 1;
            return (
              <div key={beat.id} className={`${styles.caption} ${CAPTION_CLASS[index]}`} data-part="caption" inert>
                <Caption beat={beat} heading={last ? "h2" : "h3"} large={last}>
                  {last ? <FinalActions /> : null}
                </Caption>
              </div>
            );
          })}
        </div>

        <div className={styles.rail} data-part="rail" data-skip="on">
          <div className={styles.progress} aria-hidden="true">
            {CHAPTERS.map((chapter) => (
              <span key={chapter.from} className={styles.track}>
                <span className={styles.fill} data-part="fill" />
              </span>
            ))}
          </div>
          <span className={styles.loading} aria-hidden="true">
            {WALK_COPY.loading}
          </span>
          <a
            href={`#${AFTER_WALK_ID}`}
            className={`${ui.btn} ${ui.textBtn} ${styles.skip}`}
            aria-label={WALK_COPY.skip}
            onClick={skip}
          >
            <span className={`${ui.underline} ${styles.skipFull}`}>{WALK_COPY.skip}</span>
            <span className={`${ui.underline} ${styles.skipShort}`}>{WALK_COPY.skipShort}</span>
            <ArrowDown />
          </a>
        </div>

        <Doors />
      </div>
    </section>
  );
}
