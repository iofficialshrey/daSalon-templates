import { formatPrice } from "@/lib/dasalon/locale";
import { GIFTS, type GiftCard } from "../data/gifts";
import layout from "../layout.module.css";
import { CardFace } from "./card-face";
import { CarouselControls } from "./carousel-controls";
import styles from "./commerce.module.css";
import { GiftCovers } from "./gift-covers";
import { GiftReceiptLink } from "./gifts-live";
import { DevPriceCheck, OfferButton, PurchaseBadge } from "./offer-button";
import ui from "./ui.module.css";

/*
 * "Give someone quiet." Three gift cards, each opening the offer sheet. Server
 * HTML, with small client parts for what follows live state: the "Covers …"
 * line checks itself against Serenity Spa House's live menu (gift-covers.tsx),
 * and a bought card gains a badge (PurchaseBadge) and a "See your receipt" link
 * (gifts-live.tsx). Demonstration only.
 */

/** "You pay S$230 · S$250 to spend", or "A S$100 card" when nothing is saved. */
function figureLine(gift: GiftCard) {
  return gift.pay < gift.value
    ? `You pay ${formatPrice(gift.pay)} · ${formatPrice(gift.value)} to spend`
    : `A ${formatPrice(gift.value)} card`;
}

function GiftItem({ gift }: { gift: GiftCard }) {
  const titleId = `gift-${gift.id}-title`;

  return (
    <li className={styles.gift}>
      <article className={styles.giftCard} aria-labelledby={titleId}>
        <CardFace art={gift.art} name={gift.name} value={formatPrice(gift.value)} />
        <div className={styles.giftBody}>
          <p className={`${ui.small} ${ui.muted}`}>{gift.occasion}</p>
          <h3 id={titleId} className={ui.h3}>
            {gift.name}
          </h3>
          <GiftCovers gift={gift} className={ui.bodyS} />
          <p className={ui.ui}>{figureLine(gift)}</p>
          <PurchaseBadge id={gift.id} kind="gift" className={styles.giftBadge} />
          <div className={styles.giftActions}>
            <OfferButton
              request={{ kind: "gift", id: gift.id }}
              label="Give this card"
              srSuffix={`: ${gift.name}`}
              className={ui.primary}
            />
            <GiftReceiptLink id={gift.id} name={gift.name} />
          </div>
        </div>
      </article>
      <DevPriceCheck place={gift.covers.place} names={gift.covers.services} />
    </li>
  );
}

export function Gifts() {
  return (
    <section id="gifts" className={`${layout.section} ${layout.frame}`} data-tone="mist" aria-labelledby="gifts-title">
      <div className={`${layout.head} ${layout.reveal}`}>
        <div className={layout.headMain}>
          <p className={ui.label}>Gift cards</p>
          <h2 id="gifts-title" className={ui.displayL}>
            <span className={ui.line}>Give someone</span> <span className={ui.line}><em>quiet.</em></span>
          </h2>
        </div>
        <p className={layout.headNote}>
          An hour of quiet, two warm hours or a whole day, at all four places for twelve months.
        </p>
      </div>

      {/* The reveal sits on the group: a view() timeline inside the horizontal phone track would never run. */}
      <div className={`${styles.giftGroup} ${layout.reveal}`} role="group" aria-label="Gift cards">
        <ul id="gifts-track" className={styles.gifts}>
          {GIFTS.map((gift) => (
            <GiftItem key={gift.id} gift={gift} />
          ))}
        </ul>
        <div className={styles.giftControls}>
          <CarouselControls trackId="gifts-track" count={GIFTS.length} prevLabel="Previous card" nextLabel="Next card" itemNoun="Gift card" />
        </div>
      </div>

      <p className={`${ui.small} ${ui.muted} ${styles.footnote}`}>
        A demonstration. In the live product a gift card is sent by email or SMS; here nothing is sent, charged or stored.
      </p>
    </section>
  );
}
