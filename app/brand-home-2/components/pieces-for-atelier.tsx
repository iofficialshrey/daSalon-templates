import { atelierBySlug, type AtelierSlug } from "../data/ateliers";
import { GIFT_CARDS, MEMBERSHIPS, packageFor, type Piece } from "../data/pieces";
import { OfferCard } from "./privileges";
import list from "./privileges.module.css";
import styles from "./pieces-for-atelier.module.css";
import ui from "./ui.module.css";

/**
 * Offers on an atelier page: the package sold here, then the memberships and
 * gift cards honoured at all four. Every card opens the same demonstration
 * checkout. A server shell; the triggers and purchased marks are the only
 * client islands.
 */
export function PiecesForAtelier({ slug }: { slug: AtelierSlug }) {
  const atelier = atelierBySlug(slug);
  const pkg = packageFor(slug);
  const offers: Piece[] = [...(pkg ? [pkg] : []), ...MEMBERSHIPS, ...GIFT_CARDS];
  return (
    <section id="pieces" data-tone="nude" aria-labelledby="pieces-title" className={`${ui.nude} ${ui.section} ${styles.pieces}`}>
      <div className={ui.container}>
        <div className={styles.head}>
          <h2 id="pieces-title" className={ui.h2s}>
            Membership and gifts
          </h2>
          <p className={styles.lead}>
            {pkg
              ? `The package sold at ${atelier?.name ?? "this atelier"}, and the memberships and gift cards honoured at all four ateliers. A demonstration: no payment is taken.`
              : "The memberships and gift cards honoured at all four ateliers. A demonstration: no payment is taken."}
          </p>
        </div>
        <ul className={list.list}>
          {offers.map((piece) => (
            <OfferCard key={piece.id} piece={piece} />
          ))}
        </ul>
      </div>
    </section>
  );
}
