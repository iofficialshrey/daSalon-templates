import type { CSSProperties } from "react";
import { srcSet, type ArtSet } from "../data/art";

type ArtPictureProps = {
  art: ArtSet;
  /** Rendered width hint, e.g. "(min-width: 1100px) 532px, 100vw". */
  sizes: string;
  alt?: string;
  className?: string;
  imgClassName?: string;
  loading?: "lazy" | "eager";
  style?: CSSProperties;
};

/**
 * Pre-sized art as AVIF with a WebP fallback. The <img> carries the intrinsic
 * ratio so nothing shifts; CSS decides the rendered size.
 */
export function ArtPicture({ art, sizes, alt = "", className, imgClassName, loading = "lazy", style }: ArtPictureProps) {
  const webp = srcSet(art, "webp");
  const fallback = art.files[art.files.length - 1];
  return (
    <picture className={className} style={style}>
      <source type="image/avif" srcSet={srcSet(art, "avif")} sizes={sizes} />
      <source type="image/webp" srcSet={webp} sizes={sizes} />
      <img
        className={imgClassName}
        src={`${fallback.base}.webp`}
        srcSet={webp}
        sizes={sizes}
        width={art.width}
        height={art.height}
        alt={alt}
        loading={loading}
        decoding="async"
      />
    </picture>
  );
}
