export function formatSgd(amount: number) {
  return `S$${new Intl.NumberFormat("en-SG", { maximumFractionDigits: 0 }).format(amount)}`;
}

export function discountBadge(savePercent: number | null | undefined) {
  if (savePercent == null || savePercent <= 0) return null;
  return `${savePercent}% off`;
}
