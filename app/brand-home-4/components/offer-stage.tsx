import type { GiftDesign, Membership, SetOffer } from "../data/offers";
import { CardFace } from "./card-face";
import { LedgerBand, LedgerPage } from "./offer-ledger";
import { SetFigure, WeddingArt } from "./offer-set";
import styles from "./offer-spread.module.css";
import ui from "./ui.module.css";

export type StageObject =
  | { kind: "membership"; membership: Membership }
  | { kind: "set"; set: SetOffer; studioName: string }
  | { kind: "gift"; design: GiftDesign; value: number; to: string };

/**
 * The spread's object stage, in the offer's tone (cobalt for the Circle, the
 * set's own tone, wash for gifts). It reuses the objects from the page: the
 * ledger page, the set's figure block with its art, and a live card face.
 * Decorative: the details column says everything it shows.
 */
export function OfferStage({ object }: { object: StageObject }) {
  if (object.kind === "membership") {
    return (
      <div className={styles.stage} data-tone="cobalt" aria-hidden="true">
        <LedgerPage
          membership={object.membership}
          rows={false}
          stage
          nameAs="p"
          band={<LedgerBand membership={object.membership} sizes="(min-width: 1100px) 440px, (min-width: 760px) 396px, 288px" loading="eager" />}
        />
      </div>
    );
  }

  if (object.kind === "set") {
    const { set } = object;
    const outline = set.tone === "outline";
    return (
      <div className={`${styles.stage} ${outline ? styles.stageOutline : ""}`} data-tone={outline ? undefined : set.tone} aria-hidden="true">
        <div className={styles.setPoster}>
          {set.art ? <WeddingArt sizes="480px" className={styles.setArt} imgClassName={styles.setArtImg} /> : null}
          <p className={ui.label}>{set.tag}</p>
          <SetFigure set={set} className={styles.setFigure} />
          <p className={`${ui.h3} ${styles.setName}`}>{set.name}</p>
          <p className={`${ui.label} ${styles.setStudio}`}>{object.studioName}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.stage} data-tone="wash" aria-hidden="true">
      <div className={styles.giftCard}>
        <CardFace
          design={object.design}
          value={object.value}
          to={object.to}
          sizes="(min-width: 1100px) 520px, (min-width: 760px) 368px, 266px"
          loading="eager"
          decorative
        />
      </div>
    </div>
  );
}
