import type { ReactNode } from "react";
import { chapterById, type ChapterId } from "../data/chapters";
import ui from "./ui.module.css";

type ChapterHeadProps = {
  id: ChapterId;
  /** The display H2; gets id `${id}-title` for the section's aria-labelledby. */
  title?: ReactNode;
  /** The kicker itself is the H2 (no display title): one heading, read once, with a visible focus ring after a jump. */
  kickerIsTitle?: boolean;
  aside?: ReactNode;
  className?: string;
  titleClassName?: string;
};

/**
 * The one chapter head: a 1px rule, the kicker "02 — The edit" in columns 1–2,
 * the display H2 in columns 3–9 and the aside in columns 10–12 (stacked below
 * 1100px). Reveals move the inner pieces only, never the section box.
 */
export function ChapterHead({ id, title, kickerIsTitle = false, aside, className, titleClassName }: ChapterHeadProps) {
  const chapter = chapterById(id);
  const kicker = (
    <>
      <span className={ui.kickerNo}>{chapter.no}</span> — {chapter.label}
    </>
  );
  return (
    <div className={`${ui.head} ${className ?? ""}`}>
      {kickerIsTitle ? (
        <h2 id={`${id}-title`} className={`${ui.label} ${ui.kicker} ${ui.slide}`} tabIndex={-1} data-jump-focus="">
          {kicker}
        </h2>
      ) : (
        <>
          <p className={`${ui.label} ${ui.kicker} ${ui.slide}`}>{kicker}</p>
          <h2 id={`${id}-title`} className={`${ui.displayL} ${ui.headTitle} ${ui.rise} ${titleClassName ?? ""}`} tabIndex={-1} data-jump-focus="">
            {title}
          </h2>
        </>
      )}
      {aside ? <div className={`${ui.headAside} ${ui.rise}`}>{aside}</div> : null}
    </div>
  );
}

/** The faint chapter numeral in the frame's top-right corner. */
export function Ghost({ id }: { id: ChapterId }) {
  return (
    <span className={`${ui.ghost} ${ui.ghostIn}`} aria-hidden="true">
      {chapterById(id).no}
    </span>
  );
}
