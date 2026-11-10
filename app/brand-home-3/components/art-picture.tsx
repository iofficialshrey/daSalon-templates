import { ART_READY, artSet, srcSet, type ArtKey } from "../data/art";
import ui from "./ui.module.css";

type ArtPictureProps = {
  art: ArtKey;
  /** Rendered width hint; defaults to the slot's own `sizes` (§9.5). */
  sizes?: string;
  /** On the <picture> (or on the fallback box). */
  className?: string;
  /** On the <img> (or on the fallback box). */
  imgClassName?: string;
  loading?: "lazy" | "eager";
  /** object-position; defaults to the crop's focus. */
  focus?: string;
};

/**
 * Pre-sized art as AVIF with a WebP fallback (never next/image, which would
 * re-encode). Until the approved exports land (ART_READY), the same box renders
 * flat in the map's t = .5 colour: the designed placeholder, with no layout shift
 * when the art arrives. Always decorative (alt="", aria-hidden).
 */
export function ArtPicture({ art, sizes, className, imgClassName, loading = "lazy", focus }: ArtPictureProps) {
  const set = artSet(art);

  if (!ART_READY) {
    return (
      <span
        className={`${ui.artFallback} ${className ?? ""} ${imgClassName ?? ""}`}
        style={{ background: set.fallback, aspectRatio: `${set.width} / ${set.height}` }}
        aria-hidden="true"
      />
    );
  }

  const largest = set.files[set.files.length - 1];
  const attr = sizes ?? set.sizes;
  return (
    <picture className={className}>
      <source type="image/avif" srcSet={srcSet(set, "avif")} sizes={attr} />
      <source type="image/webp" srcSet={srcSet(set, "webp")} sizes={attr} />
      <img
        className={imgClassName}
        src={`${largest.base}.webp`}
        width={set.width}
        height={set.height}
        alt=""
        loading={loading}
        decoding="async"
        style={{ objectPosition: focus ?? set.focus }}
      />
    </picture>
  );
}
