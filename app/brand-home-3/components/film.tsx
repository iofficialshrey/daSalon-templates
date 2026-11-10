"use client";

import { useEffect, useRef, useState } from "react";
import { liteSnapshot, useLite } from "@/lib/page/lite";
import { FILM_SOURCES } from "../data/film";
import { BookButton } from "./book-button";
import { startFilmEngine, type FilmEngine } from "./film-engine";
import { ArrivalStatus, BeatACopy, FilmPoster, StaticArrival, StaticDoor } from "./film-static";
import { ArrowDown } from "./icons";
import styles from "./film.module.css";
import ui from "./ui.module.css";

/*
 * Section 1: the entrance film (spec §5). Walnut doors open onto a candle-lit
 * room as the visitor scrolls; copy sits only where the room is already dark.
 * The server always renders this scrub markup (useLite is false during SSR and
 * hydration) with zero film bytes: the <picture> is the poster and the <video>
 * has no src until the engine fetches the encode at idle. Lite visitors, and a
 * film that fails while the visitor is still at the top, get the still layout.
 */

/** Without JS: every word visible over a 72% shade, the posters kept, the scrub parts hidden. */
const NOSCRIPT_CSS = [
  `.${styles.film}{height:auto}`,
  `.${styles.film} .${styles.stage}{position:relative;height:auto;min-height:100svh;overflow:visible;contain:none;display:grid;align-content:end;gap:48px;padding:calc(var(--sr-header) + 48px) var(--sr-margin) 64px}`,
  `.${styles.film} .${styles.stage}::before{content:"";position:absolute;inset:0;background:rgb(36 25 19 / 72%);z-index:1}`,
  `.${styles.film} :is(.${styles.beatA},.${styles.beatB},.${styles.beatC}){position:relative;inset:auto;opacity:1;transform:none;z-index:3;left:auto;right:auto;top:auto;bottom:auto;margin:0;text-align:left;width:auto;max-width:none;white-space:normal}`,
  `.${styles.film} :is(.${styles.shadeTop},.${styles.shadeBase},.${styles.vignette},.${styles.shadeRail},.${styles.shadeA},.${styles.shadeB},.${styles.shadeC},.${styles.linen},.${styles.grain},.${styles.rail},.${styles.cue},.${styles.skip},video){display:none}`,
].join("");

export function Film() {
  const lite = useLite();
  const [failed, setFailed] = useState(false);
  const isStatic = lite || failed;

  const rootRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // liteSnapshot() as well: the hydration pass still renders the scrub markup for a lite visitor.
    if (isStatic || liteSnapshot()) return;
    const root = rootRef.current;
    const stage = stageRef.current;
    const video = videoRef.current;
    if (!root || !stage || !video) return;
    let engine: FilmEngine | null = null;
    try {
      engine = startFilmEngine({
        root,
        stage,
        video,
        onFail: (atTop) => {
          if (atTop) setFailed(true);
        },
      });
    } catch {
      // The film is an enhancement: without the engine the doors stay closed under beat A.
      engine = null;
    }
    return () => engine?.destroy();
  }, [isStatic]);

  // One node in both layouts, so an IntersectionObserver on #film-end never loses its target.
  const end = <div key="end" id="film-end" className={isStatic ? styles.endStatic : styles.end} aria-hidden="true" />;

  return (
    <section
      ref={rootRef}
      id="film"
      className={isStatic ? styles.static : styles.film}
      data-tone={isStatic ? undefined : "film"}
      data-scrub-film=""
      data-film={isStatic ? "static" : "poster"}
      data-film-landscape={FILM_SOURCES.landscape}
      data-film-portrait={FILM_SOURCES.portrait}
      data-film-safe={FILM_SOURCES.safe}
      aria-label="Enter Serein House"
      aria-describedby={isStatic ? undefined : "film-desc"}
    >
      {isStatic
        ? [<StaticDoor key="door" />, end, <StaticArrival key="arrival" />]
        : [
            <p key="desc" id="film-desc" className={ui.srOnly}>
              Entrance film: a pair of walnut doors opens onto a candle-lit treatment room, and the view moves slowly towards the
              bed. Illustrative film, generated with AI.
            </p>,
            <div key="stage" ref={stageRef} className={styles.stage} data-part="stage">
              <div className={styles.media} aria-hidden="true">
                <FilmPoster frame="first" eager part="poster-first" />
                <FilmPoster frame="last" part="poster-last" hidden className={styles.posterLast} />
                <video
                  ref={videoRef}
                  className={styles.video}
                  data-part="video"
                  muted
                  playsInline
                  preload="auto"
                  disablePictureInPicture
                  disableRemotePlayback
                  tabIndex={-1}
                  aria-hidden="true"
                />
              </div>
              <div className={styles.grain} aria-hidden="true" />
              <div className={styles.shadeTop} aria-hidden="true" />
              <div className={styles.shadeBase} aria-hidden="true" />
              <div className={styles.vignette} aria-hidden="true" />
              <div className={styles.shadeRail} data-part="shade-rail" aria-hidden="true" />
              <div className={styles.shadeA} data-part="shade-a" aria-hidden="true" />
              <div className={styles.shadeB} data-part="shade-b" aria-hidden="true" />
              <div className={styles.shadeC} data-part="shade-c" aria-hidden="true" />
              <div className={styles.linen} data-part="linen" aria-hidden="true" />

              <div className={`${styles.beat} ${styles.beatA}`} data-part="a">
                <BeatACopy />
              </div>

              <div className={`${styles.beat} ${styles.beatB}`} data-part="b">
                <p className={`${ui.label} ${styles.labelB}`}>Breathe out</p>
                <p className={`${ui.displayM} ${styles.lineB}`}>
                  Leave the pace <br className={styles.brNarrow} />
                  of the day <em>behind.</em>
                </p>
              </div>

              <div className={`${styles.beat} ${styles.beatC}`} data-part="c" inert>
                <p className={ui.label}>You have arrived</p>
                <h2 id="film-arrival-title" className={`${ui.displayArrival} ${styles.titleC}`}>
                  <span className={ui.line}>The luxury of</span> <span className={ui.line}><em>feeling restored.</em></span>
                </h2>
                <div className={styles.actions}>
                  <BookButton autoPlaceSuffix className={`${ui.btn} ${ui.onDark}`}>
                    Book a ritual
                  </BookButton>
                  <a className={ui.text} href="#rituals" data-jump="">
                    See the rituals <ArrowDown />
                  </a>
                </div>
                <ArrivalStatus onDark className={`${styles.status} ${styles.statusC}`} />
              </div>

              <div className={styles.rail} data-part="rail" data-loading="" aria-hidden="true">
                <span className={ui.label}>Enter</span>
                <span className={styles.track}>
                  <span className={styles.fill} data-part="rail-fill" />
                </span>
                <span className={`${ui.label} ${ui.num} ${styles.count}`} data-part="rail-count">
                  00
                </span>
              </div>

              <div className={styles.cue} data-part="cue" aria-hidden="true">
                <i /> <span className={ui.label}>Scroll gently to enter</span>
              </div>

              <a className={styles.skip} data-part="skip" href="#serein" data-jump="">
                Skip the entrance <ArrowDown />
              </a>
            </div>,
            <noscript key="noscript">
              <style>{NOSCRIPT_CSS}</style>
            </noscript>,
            end,
          ]}
    </section>
  );
}
