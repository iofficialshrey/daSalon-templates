import Image from "next/image";
import { formatPrice } from "@/lib/dasalon/locale";
import { atelierBySlug } from "../data/ateliers";
import type { GiftCard, Piece } from "../data/pieces";
import styles from "./card-face.module.css";

export type CardPersonal = { name: string; message: string; from: string };

type Tone = "ivory" | "noir" | "champagne" | "scene";

/** Each offer's tone: memberships by tier, gift cards by occasion; packages carry their atelier's photograph. */
const TONE: Record<string, Tone> = {
  everyday: "ivory",
  "house-member": "champagne",
  circle: "noir",
  "open-card": "noir",
  "small-gesture": "ivory",
  "bridal-card": "champagne",
};

const KIND: Record<Piece["kind"], string> = {
  membership: "Membership",
  package: "Package",
  gift: "Gift card",
};

/** The big figure and its unit: "S$800 credit", "15% off", "6 sessions", "S$300". */
function figureOf(piece: Piece): [string, string] {
  if (piece.kind === "membership") return [piece.figure, piece.figureUnit];
  if (piece.kind === "gift") return [formatPrice(piece.value), ""];
  const redemption = piece.redemption;
  if (redemption.type === "sessions") return [String(redemption.count), "sessions"];
  if (redemption.type === "time") return [String(redemption.cells * redemption.cellMinutes), "minutes"];
  return [formatPrice(piece.value), "to spend"];
}

/** First 80 characters of the message: the card shows two lines of it. */
const MESSAGE_PREVIEW = 80;

/**
 * The Atelier card, for every offer: a tone, a hairline frame inside the edge
 * (the hero's glass panes, in miniature), the wordmark, and the offer's
 * figure. Type is sized in container units with a floor, so it never clips.
 * Decorative: the surrounding UI names the offer.
 */
export function PieceFace({
  piece,
  personal = null,
  sizes = "(min-width: 760px) 420px, 82vw",
  className,
}: {
  piece: Piece;
  /** Gift preview: "For {name}", the message and "From {from}" replace the name. */
  personal?: CardPersonal | null;
  sizes?: string;
  className?: string;
}) {
  const atelier = piece.kind === "package" ? atelierBySlug(piece.atelier) : undefined;
  const tone: Tone = atelier ? "scene" : TONE[piece.id] ?? "ivory";
  const [figure, unit] = figureOf(piece);
  const name = personal?.name.trim() ?? "";
  const message = personal?.message.trim().slice(0, MESSAGE_PREVIEW) ?? "";
  const from = personal?.from.trim() ?? "";
  const classes = [styles.card, styles[tone], personal ? styles.personal : "", className ?? ""];

  return (
    <div className={classes.filter(Boolean).join(" ")} aria-hidden="true">
      {atelier ? (
        <Image src={atelier.photo} alt="" sizes={sizes} quality={60} className={styles.photo} style={{ objectPosition: atelier.focus }} />
      ) : null}
      <span className={styles.frame} />
      <div className={styles.top}>
        <span className={styles.wordmark}>Atelier</span>
        <span className={styles.kind}>{atelier ? atelier.trade : KIND[piece.kind]}</span>
      </div>
      <div className={styles.bottom}>
        {personal ? (
          <div className={styles.lines}>
            <p className={styles.for}>For {name || "—"}</p>
            {message ? <p className={styles.message}>{message}</p> : null}
            {from ? <p className={styles.from}>From {from}</p> : null}
          </div>
        ) : null}
        <p className={styles.figureLine}>
          <span className={styles.figure}>{figure}</span>
          {unit ? <span className={styles.unit}>{unit}</span> : null}
        </p>
        {personal ? null : <p className={styles.name}>{piece.name}</p>}
      </div>
    </div>
  );
}

/** Gift cards, as before: the face with an optional personal message. */
export function CardFace({
  card,
  personal = null,
  className,
}: {
  card: GiftCard;
  sizes?: string;
  personal?: CardPersonal | null;
  edge?: boolean;
  loading?: "lazy" | "eager";
  className?: string;
}) {
  return <PieceFace piece={card} personal={personal} className={className} />;
}

/** A small swatch of an offer's card (picker rows, atelier pages): tone and frame, no type. */
export function GiftThumb({ card, className }: { card: Piece; className?: string; sizes?: string }) {
  const atelier = card.kind === "package" ? atelierBySlug(card.atelier) : undefined;
  const tone: Tone = atelier ? "scene" : TONE[card.id] ?? "ivory";
  return (
    <span className={`${styles.thumb} ${styles[tone]} ${className ?? ""}`} aria-hidden="true">
      {atelier ? <Image src={atelier.photo} alt="" sizes="120px" quality={60} className={styles.photo} /> : null}
      <span className={styles.frame} />
    </span>
  );
}
