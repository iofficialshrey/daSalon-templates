import Image from "next/image";
import { formatPrice } from "@/lib/dasalon/locale";
import linenPhoto from "../assets/house-clinic.jpg";
import poolPhoto from "../assets/house-salon.jpg";
import springPhoto from "../assets/house-spring.jpg";
import type { Gift, Membership, Offer, Ritual } from "../data/offers";
import { Mark } from "./icons";
import styles from "./offer-face.module.css";

/*
 * One face per kind, each from the water:
 * - a membership is a card of frosted glass, its name etched into it;
 * - a ritual is a column of water, one layer per stop, as deep as its minutes;
 * - a gift card is a postcard from the house, with a round stamp for its value.
 * Decorative: the card and the window that hold a face carry the words.
 */

const GIFT_PHOTOS = {
  spring: springPhoto,
  pool: poolPhoto,
  linen: linenPhoto,
} as const;

function MembershipFace({ offer }: { offer: Membership }) {
  return (
    <span className={styles.face} aria-hidden="true">
      <span className={styles.glass}>
        <span className={styles.glassSheen} />
        <span className={styles.glassTop}>
          <Mark size={26} />
          <span>{offer.term}</span>
        </span>
        <span className={styles.glassName}>{offer.name}</span>
        <span className={styles.glassCredit}>
          <b>{formatPrice(offer.credit)}</b>
          <small>treatment credit</small>
        </span>
      </span>
    </span>
  );
}

const LAYERS = ["#dce8e5", "#b9d2ca", "#86b9b5"] as const;

function RitualFace({ offer }: { offer: Ritual }) {
  const total = offer.stops.reduce((sum, stop) => sum + stop.minutes, 0);
  return (
    <span className={styles.face} aria-hidden="true">
      <span className={styles.column}>
        <span className={styles.columnHead}>
          <span className={styles.columnName}>{offer.name}</span>
          <span className={styles.columnTime}>{total} min</span>
        </span>
        <span className={styles.layers}>
          {offer.stops.map((stop, index) => (
            <span
              key={stop.name}
              className={styles.layer}
              style={{
                flexGrow: stop.minutes,
                background: LAYERS[index % LAYERS.length],
              }}
            >
              <span>{stop.name}</span>
              <small>{stop.minutes} min</small>
            </span>
          ))}
        </span>
      </span>
    </span>
  );
}

function GiftFace({ offer }: { offer: Gift }) {
  return (
    <span className={styles.face} aria-hidden="true">
      <span className={styles.postcard}>
        <span className={styles.postPhoto}>
          <Image
            src={GIFT_PHOTOS[offer.photo]}
            alt=""
            fill
            sizes="(min-width: 900px) 14vw, 40vw"
            quality={60}
            className={styles.postImg}
          />
        </span>
        <span className={styles.postBack}>
          <span className={styles.stamp}>
            <b>{formatPrice(offer.value)}</b>
          </span>
          <span className={styles.postName}>{offer.name}</span>
          <span className={styles.postLines}>
            <i />
            <i />
            <i />
          </span>
          <span className={styles.postFrom}>Néroli House</span>
        </span>
      </span>
    </span>
  );
}

export function OfferFace({ offer }: { offer: Offer }) {
  if (offer.kind === "membership") return <MembershipFace offer={offer} />;
  if (offer.kind === "ritual") return <RitualFace offer={offer} />;
  return <GiftFace offer={offer} />;
}
