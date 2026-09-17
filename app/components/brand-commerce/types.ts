export type OfferKind = "membership" | "package" | "gift";

export type CommerceTheme =
  | "maison"
  | "atelier"
  | "paloma"
  | "oru"
  | "neroli"
  | "studio07"
  | "serein";

export type MembershipOffer = {
  id: string;
  name: string;
  validityLabel: string;
  savePercent: number | null;
  description: string;
  details: string[];
  pay: number;
  credit: number;
  tone: string;
};

export type PackageOffer = {
  id: string;
  name: string;
  savePercent: number | null;
  sessionsLabel: string;
  validityLabel: string;
  inclusions: readonly string[];
  description: string;
  details: string[];
  pay: number;
  worth: number;
  tone: string;
};

export type GiftOffer = {
  id: string;
  name: string;
  validityLabel: string;
  savePercent: number | null;
  description: string;
  details: string[];
  pay: number;
  value: number;
  tone: string;
};

export type OfferDetail = {
  kind: OfferKind;
  id: string;
  name: string;
  tone: string;
  badge: string | null;
  validityLabel: string;
  description: string;
  details: string[];
  pay: number;
  secondaryLabel: string;
  secondaryValue: number;
  sessionsLabel?: string;
  inclusions?: readonly string[];
};

export type BrandCommerceCopy = {
  membershipsEyebrow: string;
  membershipsTitle: string;
  membershipsCopy: string;
  packagesEyebrow: string;
  packagesTitle: string;
  packagesCopy: string;
  giftsEyebrow: string;
  giftsTitle: string;
  giftsCopy: string;
  membershipSwipeHint?: string;
  giftSwipeHint?: string;
};
