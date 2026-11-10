import { formatPrice } from "@/lib/dasalon/locale";
import { chapterById, ISSUE, type ChapterId } from "../data/chapters";
import { FILM_COPY, FILM_SOURCES, PORTRAIT_QUERY, posterSrc, type PosterFrame, type PosterSize } from "../data/film";
import { GIFT_VALUES } from "../data/offers";
import { BookButton } from "./book-button";
import { CoverFilm, FilmReplay } from "./cover-film";
import { ArrowUpRight, Diamond } from "./icons";
import { MotionToggle } from "./motion-toggle";
import styles from "./cover.module.css";
import ui from "./ui.module.css";

/*
 * 00 — Cover. The poster <picture> is the first image in the page and the LCP:
 * the first frame for motion visitors (the film starts on it with no jump), the
 * last, front-facing frame for reduced motion. The film itself is created by the
 * cover-film island after load and idle; there is no <video> in this HTML.
 */

const REDUCED_QUERY = "(prefers-reduced-motion: reduce)";

const SIZES: Record<PosterSize, { width: number; height: number }> = {
  "1280x720": { width: 1280, height: 720 },
  "576x768": { width: 576, height: 768 },
};

/** Art direction in priority order: portrait + reduced, portrait, reduced, then the landscape first frame. */
const POSTER_SOURCES: ReadonlyArray<{ media?: string; size: PosterSize; frame: PosterFrame; jpg: boolean }> = [
  { media: `${PORTRAIT_QUERY} and ${REDUCED_QUERY}`, size: "576x768", frame: "last", jpg: true },
  { media: PORTRAIT_QUERY, size: "576x768", frame: "first", jpg: true },
  { media: REDUCED_QUERY, size: "1280x720", frame: "last", jpg: true },
  { size: "1280x720", frame: "first", jpg: false },
];

const LOWEST_GIFT = Math.min(...GIFT_VALUES.map((item) => item.value));

const COVER_LINES: ReadonlyArray<{ id: ChapterId; title: string; dek: string }> = [
  { id: "edit", title: "Choose your edit", dek: "Live menus from four studios" },
  { id: "gifts", title: "The gift issue", dek: `Gift cards from ${formatPrice(LOWEST_GIFT)}` },
  { id: "studios", title: "Find your Paloma", dek: "Clementi, Changi, Sentosa" },
];

function Poster() {
  return (
    <picture className={styles.poster}>
      {POSTER_SOURCES.map(({ media, size, frame, jpg }) => (
        <PosterSource key={`${size}-${frame}`} media={media} size={size} frame={frame} jpg={jpg} />
      ))}
      <img
        className={styles.posterImg}
        src={posterSrc("1280x720", "first", "jpg")}
        width={1280}
        height={720}
        alt={FILM_COPY.altFirst}
        fetchPriority="high"
        loading="eager"
        decoding="async"
        data-cover-poster=""
      />
    </picture>
  );
}

function PosterSource({ media, size, frame, jpg }: { media?: string; size: PosterSize; frame: PosterFrame; jpg: boolean }) {
  const { width, height } = SIZES[size];
  return (
    <>
      <source media={media} type="image/avif" srcSet={posterSrc(size, frame, "avif")} width={width} height={height} />
      <source media={media} type="image/webp" srcSet={posterSrc(size, frame, "webp")} width={width} height={height} />
      {jpg ? <source media={media} type="image/jpeg" srcSet={posterSrc(size, frame, "jpg")} width={width} height={height} /> : null}
    </>
  );
}

export function Cover() {
  return (
    <section id="cover" data-chapter="00" data-tone="ink" aria-labelledby="cover-title" className={`${ui.frame} ${styles.cover}`}>
      <figure className={styles.media} data-film-landscape={FILM_SOURCES.landscape} data-film-portrait={FILM_SOURCES.portrait}>
        <Poster />
        <CoverFilm />
        <figcaption className={ui.srOnly}>{FILM_COPY.caption}</figcaption>
      </figure>

      <div className={styles.grid} aria-hidden="true" />

      <p className={styles.issue}>
        {ISSUE.label} <Diamond className={styles.diamond} /> {ISSUE.edition}
      </p>

      <div className={styles.controls}>
        <FilmReplay />
        <MotionToggle className={styles.control} showLabel labelClassName={styles.controlLabel} />
      </div>

      <h1 id="cover-title" className={styles.title} tabIndex={-1} data-jump-focus="">
        <span className={styles.word}>Form</span>{" "}
        <span className={styles.word}>follows</span>{" "}
        <span className={`${styles.word} ${styles.wash}`}>feeling.</span>
      </h1>

      <p className={styles.deck}>
        Hair, grooming, skin, spa and bridal for people who would rather be recognised than repeated. Four Singapore
        studios, booked live.
      </p>

      <div className={styles.cta} data-cover-cta="">
        <BookButton className={styles.circle}>
          <span className={styles.circleText}>
            <span>Book</span> <span>the look</span>
          </span>
          <ArrowUpRight className={styles.circleArrow} />
        </BookButton>
      </div>

      <nav aria-label="In this issue" className={styles.lines}>
        <ul className={styles.linesList}>
          {COVER_LINES.map((line) => (
            <li key={line.id} className={styles.lineItem}>
              <a className={styles.line} href={`#${line.id}`} data-jump="">
                <span className={styles.lineHead}>
                  <span className={styles.lineNo}>{chapterById(line.id).no}</span>{" "}
                  <span className={styles.lineDot} aria-hidden="true">·</span>{" "}
                  <span className={styles.lineTitle}>{line.title}</span>
                </span>{" "}
                <span className={styles.lineDek}>{line.dek}</span>
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </section>
  );
}
