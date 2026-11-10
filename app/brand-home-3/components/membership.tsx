import { MEMBERSHIPS } from "../data/offers";
import layout from "../layout.module.css";
import { ArtPicture } from "./art-picture";
import styles from "./commerce.module.css";
import { OfferButton, PurchaseBadge } from "./offer-button";
import ui from "./ui.module.css";

/**
 * "A rhythm of restoration." One honest membership story in three tiers, each
 * opening the offer sheet. From 1100px the sky panel bleeds from the viewport's
 * left edge and holds still while the copy scrolls past it. Demonstration only.
 */
export function Membership() {
  return (
    <section id="membership" className={styles.membership} data-tone="blush" aria-labelledby="membership-title">
      <div className={styles.memberArt}>
        <ArtPicture art="membership-panel" className={styles.fill} imgClassName={styles.fillImg} />
        <span className={`${ui.chip} ${styles.artChip}`}>Three ways to belong · all four places</span>
      </div>

      <div className={styles.memberCopy}>
        <div className={`${styles.memberHead} ${layout.reveal}`}>
          <p className={ui.label}>Serein, regularly</p>
          <h2 id="membership-title" className={ui.displayL}>
            <span className={ui.line}>A rhythm of</span> <span className={ui.line}><em>restoration.</em></span>
          </h2>
          <p className={ui.lead}>
            Membership turns rest from an occasional rescue into a quiet, dependable practice: a balance to draw on at any of the
            four places, or a plan that softens every short visit.
          </p>
        </div>

        <ul className={`${styles.tiers} ${layout.reveal}`}>
          {MEMBERSHIPS.map((membership) => (
            <li key={membership.id} className={styles.tier}>
              <span className={`${ui.label} ${ui.num} ${styles.tierNumber}`}>{membership.number}</span>
              <div className={styles.tierBody}>
                <h3 className={ui.titleS}>{membership.name}</h3>
                <p className={`${ui.small} ${ui.muted}`}>{membership.typeLine}</p>
                <p className={ui.ui}>{membership.figureLine}</p>
                {/* Bought this visit: "Yours · demonstration" replaces the offer badge (CSS hides the next sibling). */}
                <p className={styles.badges}>
                  <PurchaseBadge id={membership.id} kind="membership" className={styles.yours} />
                  <span className={`${ui.badge} ${styles.offerBadge}`}>{membership.badge}</span>
                </p>
              </div>
              <OfferButton
                variant="text"
                request={{ kind: "membership", id: membership.id }}
                label="See details"
                srSuffix={`: ${membership.name}`}
                className={styles.tierAction}
              />
            </li>
          ))}
        </ul>

        <p className={`${ui.small} ${ui.muted} ${styles.footnote}`}>
          A demonstration. Buy shows a sample confirmation; no payment is taken and nothing is stored.
        </p>
      </div>
    </section>
  );
}
