import type { ArtKey } from "../data/art";
import { ArtPicture } from "./art-picture";
import styles from "./card-face.module.css";
import ui from "./ui.module.css";

type CardFaceProps = {
  art: ArtKey;
  name: string;
  /** Already formatted: "S$250", "20% off". */
  value: string;
  kicker?: string;
  /** "For Mei Ling": the gift sheet's live preview. */
  forLine?: string;
  /** Flips to true while a purchase processes: the three rings breathe once. */
  breathing?: boolean;
  className?: string;
  /** Rendered width hint for the art; defaults to the slot's own `sizes`. */
  sizes?: string;
  loading?: "lazy" | "eager";
};

/**
 * A 1.586:1 card face (memberships and gift cards): the recoloured sky full
 * bleed, three hairline rings top-right, and a solid paper-soft label block
 * bottom-left, so no text ever sits on the art. Type is sized in container
 * units with a 12px floor. Decorative (aria-hidden): the same facts are always
 * repeated in real text beside it.
 */
export function CardFace({
  art,
  name,
  value,
  kicker = "Serein House",
  forLine,
  breathing = false,
  className,
  sizes,
  loading,
}: CardFaceProps) {
  return (
    <div className={`${styles.face} ${className ?? ""}`} data-breathing={breathing ? "" : undefined} aria-hidden="true">
      <ArtPicture art={art} sizes={sizes} loading={loading} className={styles.art} imgClassName={styles.artImg} />
      <span className={styles.rings}>
        <i />
        <i />
        <i />
      </span>
      <span className={styles.plate}>
        <span className={styles.top}>
          <span className={styles.mark}>S</span>
          <span className={`${ui.label} ${styles.kicker}`}>{kicker}</span>
        </span>
        <span className={styles.name}>{name}</span>
        <span className={`${ui.num} ${styles.value}`}>{value}</span>
        {forLine ? <span className={`${ui.small} ${styles.for}`}>{forLine}</span> : null}
      </span>
    </div>
  );
}
