import { artFor, srcSet, WEDDING_BAND } from "../data/art";
import type { SetOffer } from "../data/offers";
import styles from "./sets.module.css";
import ui from "./ui.module.css";

/*
 * Pieces of a seasonal set shared by the triptych card and the set's spread
 * stage: the figure block ("6 sessions", "S$720 to spend", "240 minutes") and
 * The Wedding Week's cyanotype.
 */

export function SetFigure({ set, className }: { set: SetOffer; className?: string }) {
  return (
    <p className={`${styles.figureBlock} ${className ?? ""}`}>
      <span className={`${ui.figure} ${styles.figure}`}>{set.figure}</span>
      <span className={`${ui.label} ${styles.unit}`}>{set.unit}</span>
    </p>
  );
}

type WeddingArtProps = {
  /** Width hint for the 2:1 art at 760px and up. */
  sizes: string;
  /** Phones get the 3:1 band (the card); the stage keeps the 2:1 crop. */
  band?: boolean;
  className?: string;
  imgClassName?: string;
  loading?: "lazy" | "eager";
};

/** The Wedding Week (Desmarestia aculeata, Ink map): 2:1, or the 3:1 band on phones. */
export function WeddingArt({ sizes, band = false, className, imgClassName, loading = "lazy" }: WeddingArtProps) {
  const art = artFor("set-wedding-week");
  const fallback = art.files[art.files.length - 1];
  const phone = "(max-width: 759px)";
  return (
    <picture className={className}>
      {band ? (
        <>
          <source media={phone} type="image/avif" srcSet={srcSet(WEDDING_BAND, "avif")} sizes="calc(100vw - 40px)" />
          <source media={phone} type="image/webp" srcSet={srcSet(WEDDING_BAND, "webp")} sizes="calc(100vw - 40px)" />
        </>
      ) : null}
      <source type="image/avif" srcSet={srcSet(art, "avif")} sizes={sizes} />
      <source type="image/webp" srcSet={srcSet(art, "webp")} sizes={sizes} />
      <img
        className={imgClassName}
        src={`${fallback.base}.webp`}
        srcSet={srcSet(art, "webp")}
        sizes={sizes}
        width={art.width}
        height={art.height}
        alt=""
        loading={loading}
        decoding="async"
      />
    </picture>
  );
}
