import { formatPrice } from "@/lib/dasalon/locale";
import type { GiftCard, Journey, Membership, Offer } from "../data/offers";
import { Mark } from "./icons";
import styles from "./offer-face.module.css";

/*
 * One face per kind, each a shape from the house:
 * - a membership is a key to the house, cut as an arch like its doorways;
 * - a journey is an itinerary: its length, then its stops in order;
 * - a gift card is a card in its envelope, lifted out on hover.
 * Decorative: the card and the window that hold a face carry the words.
 */

function MembershipFace({ offer }: { offer: Membership }) {
  return (
    <span className={styles.face} aria-hidden="true">
      <span className={`${styles.key} ${styles[offer.tone]}`}>
        <span className={styles.rings}>
          <i />
          <i />
        </span>
        <Mark size={30} className={styles.mark} />
        <span className={styles.keyName}>{offer.name}</span>
        <span className={styles.keyTerm}>{offer.term}</span>
        <span className={styles.keyCredit}>
          <b>{formatPrice(offer.credit)}</b>
          <small>treatment credit</small>
        </span>
      </span>
    </span>
  );
}

function JourneyFace({ offer }: { offer: Journey }) {
  return (
    <span className={styles.face} aria-hidden="true">
      <span className={`${styles.route} ${styles[offer.tone]}`}>
        <span className={styles.routeName}>{offer.name}</span>
        <span className={styles.length}>
          <b>{offer.minutes}</b>
          <small>minutes</small>
        </span>
        <span className={styles.stops}>
          {offer.stops.map((stop) => (
            <span key={stop} className={styles.stop}>
              {stop}
            </span>
          ))}
        </span>
      </span>
    </span>
  );
}

function GiftFace({ offer }: { offer: GiftCard }) {
  return (
    <span className={styles.face} aria-hidden="true">
      <span className={`${styles.gift} ${styles[offer.tone]}`}>
        <span className={styles.slip}>
          <Mark size={24} className={styles.slipMark} />
          <b>{formatPrice(offer.value)}</b>
          <small>Oru gift card</small>
        </span>
        <span className={styles.envelope}>
          <span className={styles.flap} />
          <span className={styles.to}>{offer.name}</span>
        </span>
      </span>
    </span>
  );
}

export function OfferFace({ offer }: { offer: Offer }) {
  if (offer.kind === "membership") return <MembershipFace offer={offer} />;
  if (offer.kind === "journey") return <JourneyFace offer={offer} />;
  return <GiftFace offer={offer} />;
}
