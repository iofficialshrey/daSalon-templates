import { formatPrice } from "@/lib/dasalon/locale";
import { GIFT_CARDS, MEMBERSHIPS, PACKAGES, type Piece } from "../data/pieces";
import { PieceFace } from "./card-face";
import { ArrowRight } from "./icons";
import { FaceOpen, PrivilegeTabs, type PrivilegeTab } from "./privilege-tabs";
import { PieceButton, PurchasedBadge } from "./wardrobe-client";
import styles from "./privileges.module.css";
import ui from "./ui.module.css";

type Block = PrivilegeTab & { offers: readonly Piece[] };

const BLOCKS: readonly Block[] = [
  {
    id: "membership",
    label: "Membership",
    text: "Wallet credit or a standing discount, bought at any atelier and honoured at all four.",
    offers: MEMBERSHIPS,
  },
  {
    id: "packages",
    label: "Packages",
    text: "The visits you repeat, bought once at a better rate and booked as you go at the atelier named on the card.",
    offers: PACKAGES,
  },
  {
    id: "gift-cards",
    label: "Gift cards",
    text: "An hour for someone else, sent with your message or kept for yourself. Honoured at all four ateliers.",
    offers: GIFT_CARDS,
  },
];

const TABS: readonly PrivilegeTab[] = BLOCKS.map(({ id, label, text }) => ({ id, label, text }));

/** "S$600, worth S$800" or, for a discount plan, "S$90, up to S$240 off". */
function priceWords(piece: Piece) {
  const pay = formatPrice(piece.pay);
  if (piece.kind === "membership" && piece.type === "discount") return [pay, `up to ${formatPrice(piece.value)} off`];
  return [pay, `worth ${formatPrice(piece.value)}`];
}

/** One offer: its card (which opens it too), name, line, price and View details. */
export function OfferCard({ piece }: { piece: Piece }) {
  const nameId = `offer-${piece.id}`;
  const [pay, worth] = priceWords(piece);
  return (
    <li className={styles.item}>
      <article className={styles.offer} aria-labelledby={nameId}>
        <FaceOpen pieceId={piece.id} className={styles.face}>
          <PieceFace piece={piece} sizes="(min-width: 1100px) 30vw, (min-width: 760px) 46vw, 82vw" />
        </FaceOpen>
        <div className={styles.info}>
          <h3 id={nameId} className={styles.name}>
            {piece.name}
          </h3>
          <p className={styles.tagline}>{piece.tagline}</p>
          <p className={`${styles.price} ${ui.num}`}>
            <span className={styles.pay}>{pay}</span>
            <span className={styles.worth}>{worth}</span>
          </p>
          <div className={styles.actions}>
            <PieceButton pieceId={piece.id} className={`${ui.btn} ${ui.textBtn}`} label={`View details, ${piece.name}`}>
              <span className={ui.underline}>View details</span>
              <ArrowRight />
            </PieceButton>
            <PurchasedBadge pieceId={piece.id} className={`${ui.badge} ${styles.purchased}`} />
          </div>
        </div>
      </article>
    </li>
  );
}

/** Section 6: membership, packages and gift cards, as three quiet tabs and one demonstration checkout. */
export function Privileges() {
  return (
    <section id="privileges" data-tone="paper" aria-labelledby="privileges-title" className={`${ui.section} ${ui.paper} ${styles.root}`}>
      <div className={ui.container}>
        <div className={ui.head}>
          <h2 id="privileges-title" className={`${ui.h2} ${ui.rise}`} tabIndex={-1} data-jump-focus="">
            Belong to the <em className={ui.italic}>inner circle.</em>
          </h2>
          <p className={`${ui.headLead} ${ui.lead} ${ui.rise} ${ui.rise2}`}>
            For the guests who return: credit and quiet savings, packages for the visits you repeat, and gift cards
            for someone else&apos;s hour.
          </p>
        </div>

        <PrivilegeTabs tabs={TABS}>
          {BLOCKS.map((block) => (
            <ul key={block.id} className={styles.list}>
              {block.offers.map((piece) => (
                <OfferCard key={piece.id} piece={piece} />
              ))}
            </ul>
          ))}
        </PrivilegeTabs>

        <p className={styles.note}>
          Memberships, packages and gift cards on this page are a demonstration. No payment is taken.
        </p>
      </div>
    </section>
  );
}
