import { formatPrice } from "@/lib/dasalon/locale";
import { artFor } from "../data/art";
import { ISSUE } from "../data/chapters";
import { GIFT_MONTHS, type GiftDesign } from "../data/offers";
import { ArtPicture } from "./art-picture";
import styles from "./card-face.module.css";
import ui from "./ui.module.css";

type CardFaceProps = {
  design: GiftDesign;
  value: number;
  /** The recipient's name: the cover-line plate then reads "For {to}". */
  to?: string;
  /** Rendered width hint for the art, e.g. "(min-width: 1100px) 520px, 266px". */
  sizes: string;
  loading?: "lazy" | "eager";
  className?: string;
  /** Only the aria-hidden face, without its figure and caption (a face stacked behind the visible one). */
  decorative?: boolean;
  /** Roll the value in when it mounts (after the guest picks another value). */
  roll?: boolean;
};

/** "Open Edition gift card, S$150, valid 12 months at all four studios" */
export function cardCaption(design: GiftDesign, value: number, to?: string) {
  const name = to?.trim();
  return `${design.name} gift card, ${formatPrice(value)}, valid ${GIFT_MONTHS} months at all four studios${name ? `, for ${name}` : ""}`;
}

/**
 * The gift card, made like a cover at a real card ratio (1.586:1): the plate
 * edge to edge, solid ground-colour plates for PALOMA and "No. 04 · Gift", and
 * a hard-edged bottom band (34%) with the cover line, the value and the terms.
 * Text never sits on the art. Type is sized in container units with a 12px
 * floor. Without its art file the card is a flat typographic face.
 */
export function CardFace({ design, value, to, sizes, loading = "lazy", className, decorative = false, roll = false }: CardFaceProps) {
  const name = to?.trim() ?? "";
  const face = (
    <div className={`${styles.card} ${styles[design.ground]} ${decorative ? className ?? "" : ""}`} aria-hidden="true">
      <ArtPicture art={artFor(design.art)} sizes={sizes} loading={loading} className={styles.art} imgClassName={styles.artImg} />
      <span className={`${styles.plate} ${styles.wordmark}`}>Paloma</span>
      <span className={`${styles.plate} ${styles.issue}`}>No. {ISSUE.number} · Gift</span>
      <div className={styles.band}>
        <div className={styles.lead}>
          <span className={styles.coverLine}>{name ? `For ${name}` : design.coverLine}</span>
          <span key={value} className={`${styles.value} ${roll ? styles.roll : ""}`}>
            {formatPrice(value)}
          </span>
        </div>
        <div className={styles.terms}>
          <span className={styles.kind}>Gift card</span>
          <span className={styles.validity}>Valid {GIFT_MONTHS} months · All four studios</span>
        </div>
      </div>
    </div>
  );

  if (decorative) return face;

  return (
    <figure className={`${styles.figure} ${className ?? ""}`}>
      {face}
      <figcaption className={ui.srOnly}>{cardCaption(design, value, to)}</figcaption>
    </figure>
  );
}
