import { formatDuration, formatPrice } from "@/lib/dasalon/locale";
import { PACKAGES, includeText, saving, savePercent, type PackageOffer } from "../data/offers";
import { placeBySlug } from "../data/places";
import layout from "../layout.module.css";
import { ArtPicture } from "./art-picture";
import styles from "./commerce.module.css";
import { OfferButton, PurchaseBadge } from "./offer-button";
import ui from "./ui.module.css";

/** "Hot Stone Massage · 1 hr 15 min · S$140 × 3"; a TIME package reads as one line of rounds and a price range. */
function includeLines(offer: PackageOffer): string[] {
  if (offer.redemption !== "TIME" || !offer.time) return offer.includes.map(includeText);
  const prices = offer.includes.map((line) => line.price);
  // Word joiners keep "S$45–S$60" on one line.
  const range = `${formatPrice(Math.min(...prices))}\u2060–\u2060${formatPrice(Math.max(...prices))}`;
  return [`Jacuzzi, sauna or steam · ${formatDuration(offer.time.round)} rounds · ${range}`];
}

/** "Worth S$420", or "Worth S$270–S$360" when the value depends on the mix. */
function worthLine(offer: PackageOffer) {
  return `Worth ${formatPrice(offer.value)}${offer.valueMax ? `\u2060–\u2060${formatPrice(offer.valueMax)}` : ""}`;
}

/** "Save S$60 · 14%", or "Save at least S$30 · 11%". Computed, never typed. */
function saveLine(offer: PackageOffer) {
  const amount = saving(offer);
  if (amount == null) return null;
  return `Save ${offer.valueIsMinimum ? "at least " : ""}${formatPrice(amount)} · ${savePercent(offer)}%`;
}

/**
 * "Three ways to return." Three packages priced from Serenity Spa House's live
 * menu of 13 Oct 2026; each opens the offer sheet. Demonstration only.
 */
export function Packages() {
  return (
    <section id="packages" className={`${layout.section} ${layout.frame}`} data-tone="paper-soft" aria-labelledby="packages-title">
      <div className={`${layout.head} ${layout.reveal}`}>
        <div className={layout.headMain}>
          <p className={ui.label}>Rituals, gathered</p>
          <h2 id="packages-title" className={ui.displayL}>
            <span className={ui.line}>Three ways to</span> <span className={ui.line}><em>return.</em></span>
          </h2>
        </div>
        <p className={layout.headNote}>
          Priced from today&apos;s menu at Serenity Spa House. Book each visit when your body asks for it.
        </p>
      </div>

      <ul className={styles.packages}>
        {PACKAGES.map((offer) => {
          const place = placeBySlug(offer.place);
          const titleId = `package-${offer.id}-title`;
          const save = saveLine(offer);
          return (
            <li key={offer.id} className={layout.reveal}>
              <article className={styles.pkg} aria-labelledby={titleId}>
                <div className={styles.pkgArt}>
                  <ArtPicture art={offer.art} className={styles.fill} imgClassName={styles.fillImg} />
                  {/* Bought this visit: "Yours · demonstration" replaces the chip (CSS hides the next sibling). */}
                  <span className={styles.artTag}>
                    <PurchaseBadge id={offer.id} kind="package" className={styles.yours} />
                    <span className={`${ui.chip} ${styles.offerChip}`}>{offer.chip}</span>
                  </span>
                </div>

                <div className={styles.pkgBody}>
                  <p className={ui.label}>
                    {place.name} · {place.area}
                  </p>
                  <h3 id={titleId} className={ui.h3}>
                    {offer.name}
                  </h3>
                  <p className={ui.body}>{offer.line}</p>
                  <ul className={`${ui.ui} ${styles.includes}`} aria-label="Includes">
                    {includeLines(offer).map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>

                  <div className={styles.figures}>
                    <p className={`${ui.small} ${ui.muted}`}>{worthLine(offer)}</p>
                    <p className={styles.pay}>
                      <span className={ui.small}>You pay</span> <span className={ui.figure}>{formatPrice(offer.pay)}</span>
                    </p>
                    {save ? <p className={`${ui.label} ${ui.num} ${styles.save}`}>{save}</p> : null}
                    <p className={`${ui.small} ${ui.muted}`}>{offer.months} months from purchase</p>
                  </div>

                  <OfferButton
                    request={{ kind: "package", id: offer.id }}
                    label="See the package"
                    srSuffix={`: ${offer.name}`}
                    className={`${ui.primary} ${styles.pkgAction}`}
                    check={{ place: offer.place, includes: offer.includes }}
                  />
                </div>
              </article>
            </li>
          );
        })}
      </ul>

      <p className={`${ui.small} ${ui.muted} ${styles.footnote}`}>
        A demonstration. Buy shows a sample confirmation; no payment is taken and nothing is stored. Priced from live menus on 13 Oct
        2026.
      </p>
    </section>
  );
}
