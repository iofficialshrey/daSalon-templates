"use client";

import type { ReactNode } from "react";
import { useAtelier } from "./provider";

/** Opens the checkout on a gift card (The Open Card by default); warms its chunk on intent. */
export function GiftButton({
  className,
  pieceId = "open-card",
  children,
}: {
  className?: string;
  pieceId?: string;
  children: ReactNode;
}) {
  const { openPiece, prefetchFittingRoom } = useAtelier();
  return (
    <button
      type="button"
      className={className}
      aria-haspopup="dialog"
      onClick={() => openPiece(pieceId)}
      onPointerEnter={prefetchFittingRoom}
      onFocus={prefetchFittingRoom}
      onTouchStart={prefetchFittingRoom}
    >
      {children}
    </button>
  );
}
