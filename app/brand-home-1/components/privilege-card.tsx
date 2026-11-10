"use client";

import { useEffect, useId, useRef, useState, type PointerEvent, type ReactNode } from "react";
import { formatPrice } from "@/lib/dasalon/locale";
import { HOUSE_BY_SLUG } from "../data/houses";
import { membershipValueLabel, type Offer, type Package } from "../data/offers";
import { CardFace } from "./card-face";
import { ChevronLeft, ChevronRight } from "./icons";
import { useMaison } from "./provider";
import styles from "./privileges.module.css";
import ui from "./ui.module.css";

const REDEMPTION_WORD: Record<Package["redemption"], string> = {
  COUNT: "Sessions",
  MONEY: "Value",
  TIME: "Time",
};

/** "membership", "package" or "gift card", for accessible names. */
function kindWord(offer: Offer) {
  if (offer.kind === "membership") return "membership";
  if (offer.kind === "package") return "package";
  return "gift card";
}

function valueLabel(offer: Offer) {
  if (offer.kind === "membership") return membershipValueLabel(offer);
  if (offer.kind === "package") return "Package value";
  return "Face value";
}

/** "Credit wallet · 6 months · All 4 houses" */
function metaLine(offer: Offer) {
  const months = `${offer.validityMonths} months`;
  if (offer.kind === "membership") {
    return `${offer.type === "credit" ? "Credit wallet" : "Discount plan"} · ${months} · All 4 houses`;
  }
  if (offer.kind === "package") {
    return `${REDEMPTION_WORD[offer.redemption]} · ${months} · ${HOUSE_BY_SLUG.get(offer.house)?.name ?? ""}`;
  }
  return `Gift card · ${months} · All 4 houses`;
}

const TILT_VARS = ["--mx-rx", "--mx-ry", "--mx-px", "--mx-py"] as const;

/** Mouse only, and never with reduced motion: the face leans toward the pointer and its sheen follows. */
function tilt(event: PointerEvent<HTMLDivElement>) {
  if (event.pointerType !== "mouse" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const target = event.currentTarget;
  const box = target.getBoundingClientRect();
  const x = Math.min(1, Math.max(0, (event.clientX - box.left) / box.width));
  const y = Math.min(1, Math.max(0, (event.clientY - box.top) / box.height));
  target.style.setProperty("--mx-rx", `${((0.5 - y) * 9).toFixed(2)}deg`);
  target.style.setProperty("--mx-ry", `${((x - 0.5) * 12).toFixed(2)}deg`);
  target.style.setProperty("--mx-px", `${(x * 100).toFixed(1)}%`);
  target.style.setProperty("--mx-py", `${(y * 100).toFixed(1)}%`);
}

function untilt(event: PointerEvent<HTMLDivElement>) {
  for (const name of TILT_VARS) event.currentTarget.style.removeProperty(name);
}

/**
 * One card for memberships, packages and gift cards. The face is art only; the
 * button below it carries the action, and a click on the face does the same.
 */
export function PrivilegeCard({ offer }: { offer: Offer }) {
  const { openOffer, openGift, prefetchFlows } = useMaison();
  const nameId = useId();

  const open = () => {
    if (offer.kind === "gift") openGift(offer.id);
    else openOffer(offer.id);
  };

  return (
    <article className={styles.card} aria-labelledby={nameId}>
      {/* Pointer convenience only: keyboard and screen-reader users reach the same action through the button. */}
      <div
        className={styles.faceHit}
        aria-hidden="true"
        onClick={open}
        onPointerEnter={prefetchFlows}
        onPointerMove={tilt}
        onPointerLeave={untilt}
        onTouchStart={prefetchFlows}
      >
        <CardFace offer={offer} />
      </div>
      <div className={styles.info}>
        <span className={`${ui.badge} ${ui.badgeOnDark}`}>{offer.badge}</span>
        <h4 id={nameId} className={`${ui.h4} ${styles.name}`}>
          {offer.name}
        </h4>
        <p className={styles.tagline}>{offer.tagline}</p>
        <dl className={styles.price}>
          <div>
            <dt className={styles.priceLabel}>You pay</dt>
            <dd className={`${styles.pay} ${ui.num}`}>{formatPrice(offer.pay)}</dd>
          </div>
          <div className={styles.priceEnd}>
            <dt className={styles.priceLabel}>{valueLabel(offer)}</dt>
            <dd className={`${styles.worth} ${ui.num}`}>{formatPrice(offer.value)}</dd>
          </div>
        </dl>
        {offer.kind === "package" && offer.perSession ? (
          <p className={`${styles.perSession} ${ui.num}`}>{formatPrice(offer.perSession)} per session</p>
        ) : null}
        <p className={`${styles.meta} ${ui.num}`}>{metaLine(offer)}</p>
        <div className={styles.cta}>
          <button
            type="button"
            className={`${ui.btn} ${ui.secondaryOnDark} ${ui.block}`}
            aria-label={`View details, ${offer.name} ${kindWord(offer)}`}
            onClick={open}
            onPointerEnter={prefetchFlows}
            onFocus={prefetchFlows}
            onTouchStart={prefetchFlows}
          >
            View details
          </button>
        </div>
      </div>
    </article>
  );
}

type RailPosition = { index: number; atStart: boolean; atEnd: boolean };

/**
 * Three cards: a grid on desktop, a native scroll-snap rail on tablet and phone
 * with a "1 / 3" counter and previous/next buttons that move one card.
 */
export function PrivilegeRail({
  labelledBy,
  itemLabel,
  total,
  children,
}: {
  /** Id of the sub-block heading that names the list. */
  labelledBy: string;
  /** Singular noun for the controls, e.g. "membership". */
  itemLabel: string;
  total: number;
  /** The <li> items. */
  children: ReactNode;
}) {
  const listRef = useRef<HTMLUListElement>(null);
  const listId = useId();
  const [position, setPosition] = useState<RailPosition>({ index: 0, atStart: true, atEnd: total <= 1 });

  useEffect(() => {
    const list = listRef.current;
    if (!list || typeof IntersectionObserver === "undefined") return;
    const items = Array.from(list.children);
    const visible = new Set<number>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const index = items.indexOf(entry.target);
          if (index < 0) continue;
          if (entry.isIntersecting && entry.intersectionRatio >= 0.6) visible.add(index);
          else visible.delete(index);
        }
        // Mid-swipe nothing may be 60% visible; keep the last reading.
        if (!visible.size) return;
        const first = Math.min(...visible);
        const last = Math.max(...visible);
        const atEnd = last === items.length - 1;
        setPosition({ index: atEnd ? last : first, atStart: first === 0, atEnd });
      },
      { root: list, threshold: 0.6 },
    );
    items.forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, []);

  const move = (direction: 1 | -1) => {
    const list = listRef.current;
    const item = list?.firstElementChild;
    if (!list || !(item instanceof HTMLElement)) return;
    const gap = parseFloat(getComputedStyle(list).columnGap) || 0;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    list.scrollBy({ left: direction * (item.offsetWidth + gap), behavior: reduce ? "auto" : "smooth" });
  };

  return (
    <>
      <ul ref={listRef} id={listId} className={`${ui.rail} ${styles.rail}`} aria-labelledby={labelledBy}>
        {children}
      </ul>
      <div className={`${ui.railControls} ${styles.controls}`}>
        <span className={`${ui.railCount} ${ui.num}`}>
          <span className={ui.srOnly}>Showing {itemLabel} </span>
          {position.index + 1} / {total}
        </span>
        <button
          type="button"
          className={`${ui.iconBtn} ${styles.railBtn}`}
          aria-label={`Previous ${itemLabel}`}
          aria-controls={listId}
          aria-disabled={position.atStart}
          onClick={() => {
            if (!position.atStart) move(-1);
          }}
        >
          <ChevronLeft size={20} />
        </button>
        <button
          type="button"
          className={`${ui.iconBtn} ${styles.railBtn}`}
          aria-label={`Next ${itemLabel}`}
          aria-controls={listId}
          aria-disabled={position.atEnd}
          onClick={() => {
            if (!position.atEnd) move(1);
          }}
        >
          <ChevronRight size={20} />
        </button>
      </div>
    </>
  );
}
