"use client";

import { OfferButton } from "./offer-button";
import { useSerein } from "./provider";

/*
 * The gifts section's one purchase-aware client part: once a card has been
 * bought this visit it gains a "See your receipt" text button (the latest
 * receipt). Server render and hydration show nothing; the card stays buyable.
 */
export function GiftReceiptLink({ id, name }: { id: string; name: string }) {
  const { purchases } = useSerein();
  if (!(purchases.get(id) ?? 0)) return null;
  return (
    <OfferButton
      variant="text"
      request={{ kind: "gift", id, view: "receipt" }}
      label="See your receipt"
      srSuffix={`: ${name}`}
    />
  );
}
