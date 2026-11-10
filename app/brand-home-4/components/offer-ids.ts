/*
 * Shared names between the commerce islands and the lazily loaded offer
 * spread. Purchases live in the provider's in-memory set for this tab only.
 */

/** The id the offer spread marks when a gift card of this design and value is bought. */
export function giftPurchaseId(design: string, value: number) {
  return `gift:${design}:${value}`;
}

/** The gift configurator's Design fieldset: "Choose another card" returns focus to its checked radio. */
export const GIFT_DESIGN_GROUP = "p4-gift-design";
