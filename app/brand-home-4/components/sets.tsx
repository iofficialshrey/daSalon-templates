import { formatPrice } from "@/lib/dasalon/locale";
import { chapterById } from "../data/chapters";
import { saving, SETS, type SetOffer } from "../data/offers";
import { studioBySlug } from "../data/studios";
import { ChapterHead, Ghost } from "./chapter-head";
import { BoughtBadge, OfferButton } from "./offer-button";
import { SetFigure, WeddingArt } from "./offer-set";
import { RunningFoot } from "./running-foot";
import styles from "./sets.module.css";
import ui from "./ui.module.css";

/*
 * 04 — Seasonal sets. The asymmetric 3/6/3 triptych: A cobalt, B ink with the
 * wide cyanotype, C outlined porcelain. Every figure comes from data/offers.ts.
 * In the DOM (and on phones and tablets) the wide card leads: B, A, C.
 */

const TONE: Record<SetOffer["tone"], "cobalt" | "ink" | "porcelain"> = {
  cobalt: "cobalt",
  ink: "ink",
  outline: "porcelain",
};

const BUTTON: Record<SetOffer["tone"], string> = {
  cobalt: ui.btnInverse,
  ink: ui.btnPrimary,
  outline: ui.btnInk,
};

const ORDER: readonly SetOffer["tone"][] = ["ink", "cobalt", "outline"];

/** Grid placement: A columns 1–3, B 4–9, C 10–12 on desktop. */
const SLOT: Record<SetOffer["tone"], string> = {
  cobalt: styles.slotA,
  ink: styles.slotB,
  outline: styles.slotC,
};

/** "Worth S$195 · Save S$30", or "Worth at least S$400 · Save S$60 or more". */
function worthLine(set: SetOffer) {
  const saved = formatPrice(saving(set) ?? 0);
  return set.valueIsMinimum
    ? `Worth at least ${formatPrice(set.value)} · Save ${saved} or more`
    : `Worth ${formatPrice(set.value)} · Save ${saved}`;
}

function SetCard({ set }: { set: SetOffer }) {
  const studio = studioBySlug(set.studio);
  const titleId = `set-${set.id}-title`;
  const more = set.includes.length - 1;
  return (
    <article className={`${styles.card} ${styles[set.tone]}`} data-tone={TONE[set.tone]} aria-labelledby={titleId}>
      {set.art ? (
        <WeddingArt
          band
          sizes="(min-width: 1100px) calc(50vw - 100px), calc(100vw - 64px)"
          className={styles.art}
          imgClassName={styles.artImg}
        />
      ) : null}
      <div className={styles.body}>
        <div className={styles.main}>
          <div className={styles.top}>
            <p className={ui.label}>{set.tag}</p>
            <span className={styles.badges}>
              <BoughtBadge id={set.id} />
              <span className={`${ui.badge} ${ui.badgeDemo}`}>Demo</span>
            </span>
          </div>
          <SetFigure set={set} />
          <h3 id={titleId} className={`${ui.h3} ${styles.name}`}>
            {set.name}
          </h3>
          {studio ? (
            <p className={`${ui.label} ${styles.studio}`}>
              {studio.name} · {studio.area}
            </p>
          ) : null}
          <p className={`${ui.bodyS} ${styles.line}`}>{set.line}</p>
        </div>
        <div className={styles.aside}>
          <ul className={styles.includes}>
            {set.includes.map((item) => (
              <li key={item} className={styles.include}>
                {item}
              </li>
            ))}
            {more > 0 ? <li className={`${styles.include} ${styles.more}`}>+ {more} more</li> : null}
          </ul>
          <div className={styles.price}>
            <p className={`${ui.price} ${ui.priceXl}`}>{formatPrice(set.pay)}</p>
            <p className={ui.small}>{worthLine(set)}</p>
            <p className={ui.small}>Valid {set.months} months</p>
          </div>
          <OfferButton
            request={{ kind: "set", id: set.id }}
            className={`${ui.btn} ${ui.block} ${BUTTON[set.tone]} ${styles.cta}`}
            srLabel={`: ${set.name}, ${formatPrice(set.pay)}`}
            check={process.env.NODE_ENV !== "production" ? { studio: set.studio, includes: set.includes } : undefined}
          >
            See the set
          </OfferButton>
        </div>
      </div>
    </article>
  );
}

export function Sets() {
  const cards = ORDER.map((tone) => SETS.find((set) => set.tone === tone)).filter((set): set is SetOffer => Boolean(set));
  return (
    <section
      id="sets"
      className={`${ui.frame} ${ui.chapter}`}
      aria-labelledby="sets-title"
      data-chapter={chapterById("sets").no}
      data-tone="porcelain"
    >
      <Ghost id="sets" />
      <ChapterHead
        id="sets"
        title="More than one good day."
        aside={
          <p>
            Three sets, each written for one studio and priced from its live menu: sessions to book, a value to spend, or minutes
            to take as you like.
          </p>
        }
      />
      <ul className={styles.triptych}>
        {cards.map((set) => (
          <li key={set.id} className={`${styles.slot} ${SLOT[set.tone]}`}>
            <SetCard set={set} />
          </li>
        ))}
      </ul>
      <p className={`${ui.small} ${styles.footnote}`}>
        A demonstration of daSalon packages — by sessions, value or time. Prices from each studio’s live menu on 13 Oct 2026.
        Nothing is charged.
      </p>
      <RunningFoot id="sets" />
    </section>
  );
}
