"use client";

import { coversLine, type GiftCard } from "../data/gifts";
import { DEFAULT_PLACE } from "../data/places";
import { usePlaceEntry } from "./live";

/*
 * A gift card's "Covers …" line (spec §4.9), shared by the gifts section and the
 * offer sheet. Its own small client module, so neither ships the other's code.
 */

/**
 * The static text until the live menu answers (the 13 Oct menu matches), then
 * only while every named service is still on it and the sum fits the card.
 * Null for no gift (the offer sheet calls it for every kind).
 */
export function useCoversText(gift: GiftCard | null): string | null {
  const { data, status } = usePlaceEntry(gift?.covers.place ?? DEFAULT_PLACE);
  if (!gift) return null;
  if (status === "ready" || status === "empty") return coversLine(gift, data?.services);
  return gift.covers.text;
}

/** The line itself, server-rendered with the static text; nothing once the live menu disagrees. */
export function GiftCovers({ gift, className }: { gift: GiftCard; className?: string }) {
  const covers = useCoversText(gift);
  return covers ? <p className={className}>{covers}</p> : null;
}
