import type { AnimationEventHandler, ReactNode } from "react";
import { formatPrice } from "@/lib/dasalon/locale";
import { artFor } from "../data/art";
import { saving, type Membership } from "../data/offers";
import { ArtPicture } from "./art-picture";
import styles from "./circle.module.css";
import ui from "./ui.module.css";

/*
 * The member ledger: Paloma's porcelain "studio ledger" page. The Circle's
 * picker and the membership spread's stage both build it from these pieces.
 * Every figure is computed from data/offers.ts, never typed.
 */

/** "S$420" with "wallet credit, for S$360", or "15%" with "off every visit from S$40, up to S$240". */
export function ledgerFigure(membership: Membership) {
  if (membership.kind === "credit") {
    return { figure: formatPrice(membership.credit ?? membership.pay), caption: `wallet credit, for ${formatPrice(membership.pay)}` };
  }
  return {
    figure: `${membership.discountPercent ?? 0}%`,
    caption: `off every visit from ${formatPrice(membership.minSpend ?? 0)}, up to ${formatPrice(membership.discountBudget ?? 0)}`,
  };
}

/** "S$60 extra credit" or "15% off": never a percentage that could disagree with the numbers. */
export function savingBadge(membership: Membership) {
  const extra = saving(membership);
  return extra === null ? `${membership.discountPercent ?? 0}% off` : `${formatPrice(extra)} extra credit`;
}

type LedgerRow = { label: string; value: string; accent?: boolean };

export function ledgerRows(membership: Membership): LedgerRow[] {
  const valid = `${membership.months} months from purchase`;
  if (membership.kind === "credit") {
    return [
      { label: "You pay", value: formatPrice(membership.pay) },
      { label: "Wallet credit", value: formatPrice(membership.credit ?? membership.pay) },
      { label: "Extra credit", value: formatPrice(saving(membership) ?? 0), accent: true },
      { label: "Valid", value: valid },
      { label: "Use at", value: "All four studios, any service" },
    ];
  }
  return [
    { label: "You pay", value: formatPrice(membership.pay) },
    { label: "Discount", value: `${membership.discountPercent ?? 0}% off every eligible visit` },
    { label: "Minimum spend", value: `${formatPrice(membership.minSpend ?? 0)} a visit` },
    { label: "Discount budget", value: `Up to ${formatPrice(membership.discountBudget ?? 0)} off` },
    { label: "Valid", value: valid },
    { label: "Use at", value: "All four studios" },
  ];
}

export function LedgerFigure({
  membership,
  className,
  hidden = false,
  onAnimationEnd,
}: {
  membership: Membership;
  className?: string;
  /** The outgoing figure of a roll: a duplicate, so hidden from assistive tech. */
  hidden?: boolean;
  onAnimationEnd?: AnimationEventHandler<HTMLParagraphElement>;
}) {
  const { figure, caption } = ledgerFigure(membership);
  return (
    <p className={`${styles.figureBlock} ${className ?? ""}`} aria-hidden={hidden || undefined} onAnimationEnd={onAnimationEnd}>
      <span className={`${ui.figure} ${styles.figure}`}>{figure}</span>
      <span className={styles.caption}>{caption}</span>
    </p>
  );
}

/** One tier's 3:1 cyanotype band. Several may be stacked; only `on` is visible. */
export function LedgerBand({
  membership,
  sizes,
  on = true,
  loading = "lazy",
}: {
  membership: Membership;
  sizes: string;
  on?: boolean;
  loading?: "lazy" | "eager";
}) {
  return (
    <ArtPicture
      art={artFor(membership.art)}
      sizes={sizes}
      loading={loading}
      className={`${styles.bandPicture} ${on ? styles.bandOn : ""}`}
      imgClassName={styles.bandImg}
    />
  );
}

type LedgerPageProps = {
  membership: Membership;
  /** The 3:1 band's pictures (the box keeps its ratio and a wash ground without them). */
  band: ReactNode;
  /** Replaces the static figure (the picker rolls it). */
  figure?: ReactNode;
  rows?: boolean;
  /** The spread's stage: no hover lift, compact when the stage is short. */
  stage?: boolean;
  /** The tier name is an h3 in the chapter, plain text on the (aria-hidden) stage. */
  nameAs?: "h3" | "p";
  className?: string;
  children?: ReactNode;
};

export function LedgerPage({ membership, band, figure, rows = true, stage = false, nameAs: Name = "h3", className, children }: LedgerPageProps) {
  return (
    <div className={`${styles.ledger} ${stage ? styles.ledgerStage : styles.ledgerLive} ${className ?? ""}`} data-tone="porcelain">
      <div className={styles.band}>{band}</div>
      <div className={styles.ledgerHead}>
        <p className={ui.label}>Member ledger</p>
        <span className={`${ui.badge} ${ui.badgeDemo}`}>Demo</span>
      </div>
      <div className={styles.tierRow}>
        <Name className={`${ui.h3} ${styles.ledgerName}`}>{membership.name}</Name>
        <span className={`${ui.badge} ${ui.badgeSaving} ${styles.saving}`}>{savingBadge(membership)}</span>
      </div>
      {figure ?? <LedgerFigure membership={membership} />}
      {rows ? (
        <dl className={styles.rows}>
          {ledgerRows(membership).map((row) => (
            <div key={row.label} className={styles.row}>
              <dt className={`${ui.label} ${styles.rowLabel}`}>{row.label}</dt>
              <dd className={`${styles.rowValue} ${row.accent ? styles.rowAccent : ""}`}>{row.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
      {children}
    </div>
  );
}
