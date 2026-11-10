import type { ReactNode } from "react";
import { formatPrice } from "@/lib/dasalon/locale";
import { HOUSE_BY_SLUG } from "../data/houses";
import type { Offer } from "../data/offers";
import face from "./face.module.css";

/** The type line on a card face, e.g. "Credit wallet" or "Gift card". */
export function faceTypeLabel(offer: Offer) {
  if (offer.kind === "membership") return offer.type === "credit" ? "Credit wallet" : "Discount plan";
  if (offer.kind === "gift") return "Gift card";
  return HOUSE_BY_SLUG.get(offer.house)?.name ?? "Package";
}

/** One line under the name, e.g. "S$300 wallet credit". */
export function faceValueLine(offer: Offer) {
  if (offer.kind === "membership") return offer.faceLine;
  if (offer.kind === "gift") return `${formatPrice(offer.value)} gift card`;
  return offer.tagline;
}

/**
 * The card art, in one format per kind of offer:
 * - memberships are member cards in pearl, champagne or onyx, the tier's numeral embossed;
 * - packages are tickets for prepaid visits, the stub cut from the namesake material of the
 *   house that honours them (bronze, travertine, walnut), with its number and name;
 * - gift cards are laid paper in the colour of the occasion, wrapped in a satin ribbon.
 * A sheen follows the pointer on the privilege cards. The face never holds controls.
 */
export function CardFace({
  offer,
  size = "card",
  children,
}: {
  offer: Offer;
  size?: "card" | "thumb" | "preview";
  /** Replaces the bottom block (used by the gift preview). */
  children?: ReactNode;
}) {
  const sizeClass = size === "thumb" ? face.thumb : size === "preview" ? face.preview : "";
  const house = offer.kind === "package" ? HOUSE_BY_SLUG.get(offer.house) : undefined;
  return (
    <div className={`${face.face} ${face[offer.kind]} ${face[offer.face]} ${sizeClass}`} aria-hidden="true">
      <div className={face.plate}>
        <span className={face.grain} />
        {offer.kind === "membership" ? <span className={face.numeral}>{offer.numeral}</span> : null}
        {offer.kind === "gift" ? (
          <span className={face.ribbon}>
            <span className={face.seal}>
              <span>MÉ</span>
            </span>
          </span>
        ) : null}
        {house ? (
          <span className={face.stub}>
            <span className={face.stubNo}>{house.number}</span>
            <span className={face.stubName}>{house.name}</span>
          </span>
        ) : null}
        <div className={face.top}>
          <span className={face.wordmark}>Maison Élan</span>
          {offer.kind === "membership" ? <span className={face.type}>{faceTypeLabel(offer)}</span> : null}
        </div>
        {offer.kind === "package" ? (
          <div className={face.figureBlock}>
            <span className={face.figure}>{offer.figure}</span>
            <span className={face.figureUnit}>{offer.figureUnit}</span>
          </div>
        ) : null}
        {children ?? (
          <div className={face.bottom}>
            <span className={face.name}>{offer.name}</span>
            {offer.kind !== "package" ? <span className={face.value}>{faceValueLine(offer)}</span> : null}
          </div>
        )}
        <span className={face.sheen} />
      </div>
    </div>
  );
}
