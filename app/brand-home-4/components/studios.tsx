import { STUDIOS, type Studio } from "../data/studios";
import { BookButton } from "./book-button";
import { ChapterHead, Ghost } from "./chapter-head";
import { ArrowRight, ArrowUpRight } from "./icons";
import { RunningFoot } from "./running-foot";
import { goodToKnow } from "./studio-format";
import {
  SeeFullMenu,
  StudioExtraRows,
  StudioFacts,
  StudioFile,
  StudioFileToggle,
  StudioQuickRows,
  StudioStatus,
  StudiosWatch,
} from "./studio-live";
import s from "./studios.module.css";
import ui from "./ui.module.css";

/**
 * 07 — Studios: the masthead-table directory. Every row is server HTML (name,
 * address, hours) and unfolds in place into a gatefold studio file; the live
 * status, facts, quick-book rows and the file toggle are small islands.
 */
export function Studios() {
  return (
    <section
      id="studios"
      data-chapter="07"
      data-tone="porcelain"
      aria-labelledby="studios-title"
      className={`${ui.chapter} ${ui.frame}`}
    >
      <Ghost id="studios" />
      <ChapterHead
        id="studios"
        title="Find your Paloma."
        aside={
          <p>
            Four studios, three neighbourhoods: two under one roof at 463 Clementi Road, one on Airport Boulevard in
            Changi, one at Sentosa Gateway.
          </p>
        }
      />
      <ol className={s.directory}>
        {STUDIOS.map((studio) => (
          <StudioRow key={studio.slug} studio={studio} />
        ))}
        <StudioExtraRows />
      </ol>
      <StudiosWatch />
      <RunningFoot id="studios" />
    </section>
  );
}

function StudioRow({ studio }: { studio: Studio }) {
  const id = `studio-${studio.slug}`;
  const nameId = `${id}-name`;
  const menuId = `${id}-menu`;
  const good = goodToKnow(studio);
  return (
    <li id={id} className={s.row}>
      <div className={s.rowGrid}>
        <p className={`${ui.label} ${s.rowMeta}`}>
          <span className={`${ui.num} ${s.rowNo}`}>{studio.no}</span>
          <span className={s.rowSep}> · </span>
          <span>{`${studio.area} · ${studio.trade}`}</span>
        </p>
        <div className={s.rowName}>
          <h3 id={nameId} className={`${ui.displayM} ${s.name}`} tabIndex={-1} data-jump-focus="">
            {studio.name}
          </h3>
          <p className={`${ui.small} ${s.specialty}`}>{studio.specialty}</p>
        </div>
        <div className={s.rowWhere}>
          <p className={s.address}>{studio.address}</p>
          <p className={`${ui.small} ${s.hours}`}>{studio.hoursLabel}</p>
        </div>
        <div className={s.rowLive}>
          <StudioStatus slug={studio.slug} />
          <StudioFacts slug={studio.slug} className={s.facts} />
        </div>
        <div className={s.rowActions}>
          <BookButton
            slug={studio.slug}
            className={`${ui.btn} ${ui.btnPrimary} ${s.rowBook}`}
            aria-label={`Book at ${studio.name}`}
          >
            Book
            <ArrowRight />
          </BookButton>
          <StudioFileToggle slug={studio.slug} name={studio.name} className={s.toggle} />
        </div>
      </div>

      <StudioFile slug={studio.slug} labelledBy={nameId}>
        <div className={s.fileInner}>
          <div className={s.fileHead}>
            <p className={ui.label}>Studio file</p>
            <p className={`${ui.num} ${s.fileNo}`}>{`No. ${studio.no}`}</p>
          </div>

          <dl className={s.fileFacts}>
            <div className={s.fileGroup}>
              <dt className={`${ui.label} ${s.term}`}>Address</dt>
              <dd className={s.addressValue}>
                <span>{studio.address}</span>
                <a href={studio.directionsUrl} className={ui.textBtn} target="_blank" rel="noopener noreferrer">
                  <span>
                    Directions<span className={ui.srOnly}> (opens Google Maps in a new tab)</span>
                  </span>
                  <ArrowUpRight />
                </a>
              </dd>
            </div>
            <div className={`${s.fileGroup} ${s.fileHours}`}>
              <dt className={`${ui.label} ${s.term}`}>Hours</dt>
              <dd>{studio.hoursLabel}</dd>
            </div>
            <div className={`${s.fileGroup} ${s.fileToday}`}>
              <dt className={`${ui.label} ${s.term}`}>Today</dt>
              <dd>
                <StudioStatus slug={studio.slug} fallback="Dates shown when you book" />
              </dd>
            </div>
            {good.length ? (
              <div className={`${s.fileGroup} ${s.fileGood}`}>
                <dt className={`${ui.label} ${s.term}`}>Good to know</dt>
                {good.map((line) => (
                  <dd key={line}>{line}</dd>
                ))}
              </div>
            ) : null}
          </dl>

          <div className={s.fileMenu}>
            <p id={menuId} className={ui.label}>From the live menu</p>
            <StudioQuickRows slug={studio.slug} labelledBy={menuId} />
            <div className={s.fileActions}>
              <BookButton slug={studio.slug} className={`${ui.btn} ${ui.btnPrimary} ${s.fileBook}`}>
                {`Book at ${studio.short}`}
                <ArrowRight />
              </BookButton>
              <SeeFullMenu slug={studio.slug} name={studio.name} className={ui.textBtn} />
            </div>
          </div>

          {studio.amenities.length ? (
            <dl className={s.fileAmenities}>
              <div className={s.fileGroup}>
                <dt className={`${ui.label} ${s.term}`}>At the studio</dt>
                <dd>{studio.amenities.join(" · ")}</dd>
              </div>
            </dl>
          ) : null}
        </div>
      </StudioFile>
    </li>
  );
}
