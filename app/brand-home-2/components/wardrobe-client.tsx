"use client";

import type { ReactNode } from "react";
import { useAtelier } from "./provider";

/*
 * The two client islands the server-rendered rail, line sheet and atelier
 * pieces need: a trigger that opens the fitting room (warming its chunk on
 * intent) and the in-memory "Purchased · Demo" mark.
 */

type PieceButtonProps = {
  pieceId: string;
  className?: string;
  /** Accessible name when the visible text is not enough on its own. */
  label?: string;
  children: ReactNode;
};

export function PieceButton({ pieceId, className, label, children }: PieceButtonProps) {
  const { openPiece, prefetchFittingRoom } = useAtelier();
  return (
    <button
      type="button"
      className={className}
      aria-label={label}
      onClick={() => openPiece(pieceId)}
      onPointerEnter={prefetchFittingRoom}
      onFocus={prefetchFittingRoom}
      onTouchStart={prefetchFittingRoom}
    >
      {children}
    </button>
  );
}

/** Shown on the source piece after an in-session demonstration purchase, until reload. */
export function PurchasedBadge({ pieceId, className }: { pieceId: string; className?: string }) {
  const { purchased } = useAtelier();
  if (!purchased.has(pieceId)) return null;
  return <span className={className}>Purchased · Demo</span>;
}
