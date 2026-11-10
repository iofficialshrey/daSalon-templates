"use client";

import {
  useCallback,
  useEffect,
  useEffectEvent,
  useId,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import { formatPrice } from "@/lib/dasalon/locale";
import type { HouseSlug } from "../data/houses";
import { OFFER_BY_ID, type Membership, type Package } from "../data/offers";
import { demoReference, formatCents, formatLongCalendarDate, sgtStamp, validUntil } from "@/lib/dasalon/demo";
import { CardFace } from "./card-face";
import { Check, Info } from "./icons";
import { Layer } from "./layer";
import { useMaison, type LiveHouse } from "./provider";
import styles from "./flows.module.css";
import ui from "./ui.module.css";

/*
 * Demonstration checkout for memberships and packages (A1 → A4). Everything
 * lives in component state: no network, no storage, no logging. The shared
 * pieces below are also used by gift-flow.tsx.
 */

/* ---------- Shared flow pieces ---------- */

export function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export type Receipt = { reference: string; stamp: string; validUntil: string };

export function makeReceipt(validityMonths: number): Receipt {
  return {
    reference: demoReference(),
    stamp: sgtStamp(),
    validUntil: formatLongCalendarDate(validUntil(validityMonths)),
  };
}

/** Moves focus to the layer's own title (the h2 in the layer header). */
export function focusLayerTitle(body: HTMLElement | null) {
  body?.closest('[role="dialog"]')?.querySelector<HTMLElement>("[data-layer-focus]")?.focus({ preventScroll: true });
}

/**
 * Steps between a flow's views. The outgoing view fades for 120ms, the incoming
 * one rises in, the body returns to the top and focus moves to the new view.
 */
export function useFlowViews<V extends string>(initial: V, bodyRef: RefObject<HTMLDivElement | null>) {
  const [view, setView] = useState<V>(initial);
  const [pending, setPending] = useState<V | null>(null);
  const focusRef = useRef<(() => void) | null>(null);
  const mounted = useRef(false);

  const go = useCallback((next: V, focus?: () => void) => {
    focusRef.current = focus ?? null;
    if (prefersReducedMotion()) {
      setPending(null);
      setView(next);
    } else {
      setPending(next);
    }
  }, []);

  useEffect(() => {
    if (pending === null) return;
    const timer = window.setTimeout(() => {
      setView(pending);
      setPending(null);
    }, 120);
    return () => window.clearTimeout(timer);
  }, [pending]);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    if (bodyRef.current) bodyRef.current.scrollTop = 0;
    const focus = focusRef.current;
    focusRef.current = null;
    focus?.();
  }, [view, bodyRef]);

  return { view, pending, go };
}

/**
 * The simulated secure checkout: 1,600ms in two halves (2 × 600ms under reduced
 * motion), then `onDone`. Runs only while `active`.
 */
export function useCheckout(active: boolean, onDone: () => void) {
  const [phase, setPhase] = useState<0 | 1>(0);
  const done = useEffectEvent(onDone);

  useEffect(() => {
    if (!active) return;
    const step = prefersReducedMotion() ? 600 : 800;
    const half = window.setTimeout(() => setPhase(1), step);
    const end = window.setTimeout(() => done(), step * 2);
    return () => {
      window.clearTimeout(half);
      window.clearTimeout(end);
    };
  }, [active]);

  const reset = useCallback(() => setPhase(0), []);
  return { phase, reset };
}

export function DemoBadge() {
  return <span className={ui.demoBadge}>Demo</span>;
}

export function CheckoutView({ phase }: { phase: 0 | 1 }) {
  return (
    <div className={styles.checkout}>
      <div className={styles.progress} aria-hidden="true" />
      <p className={styles.checkoutStatus} aria-live="polite">
        {phase === 0 ? "Redirecting to secure checkout…" : "Confirming payment…"}
      </p>
      <p className={styles.checkoutHold}>Please stay on this page while we confirm your payment.</p>
      <p className={styles.checkoutDemo}>Demo: no card details are collected.</p>
    </div>
  );
}

export function SuccessMark() {
  return (
    <span className={styles.mark} aria-hidden="true">
      <Check size={28} strokeWidth={1.5} />
    </span>
  );
}

export type PriceItem = { label: string; value: string };

/** "You pay" | value | saving, on a limestone block. The third item is bronze. */
export function PriceBlock({ items }: { items: readonly [PriceItem, PriceItem, PriceItem] }) {
  return (
    <dl className={styles.priceBlock}>
      {items.map((item, index) => (
        <div key={item.label} className={index === 0 ? styles.priceLead : index === 2 ? styles.priceSave : undefined}>
          <dt>{item.label}</dt>
          <dd className={ui.num}>{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function InfoChips({ chips }: { chips: readonly string[] }) {
  return (
    <ul className={styles.chips}>
      {chips.map((chip) => (
        <li key={chip}>{chip}</li>
      ))}
    </ul>
  );
}

export type DetailRow = { label: string; value: ReactNode };

export function DetailList({ rows }: { rows: readonly DetailRow[] }) {
  return (
    <dl className={styles.details}>
      {rows.map((row) => (
        <div key={row.label} className={styles.detailRow}>
          <dt>{row.label}</dt>
          <dd>{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export type SummaryRow = { key: string; label: ReactNode; value: number | string; total?: boolean };

/** Order summary rows: money in S$0.00 (strings pass through), the total row set larger. */
export function OrderSummary({ rows, after }: { rows: readonly SummaryRow[]; after?: Record<string, ReactNode> }) {
  return (
    <dl className={styles.summary}>
      {rows.map((row) => (
        <div key={row.key} className={`${styles.summaryRow} ${row.total ? styles.summaryTotal : ""}`}>
          <dt>{row.label}</dt>
          <dd className={ui.num}>{typeof row.value === "number" ? formatCents(row.value) : row.value}</dd>
          {after?.[row.key] ?? null}
        </div>
      ))}
    </dl>
  );
}

/** "Where to buy" / "Issuing house": native radios as cards. */
export function HouseRadios({
  name,
  legend,
  help,
  houses,
  value,
  onChange,
  onlyHouse = null,
  error = null,
  fieldsetRef,
}: {
  name: string;
  legend: string;
  help: string;
  houses: readonly LiveHouse[];
  value: HouseSlug | null;
  onChange: (slug: HouseSlug) => void;
  /** Packages: the one house that sells it; the others are disabled. */
  onlyHouse?: HouseSlug | null;
  error?: string | null;
  fieldsetRef?: RefObject<HTMLFieldSetElement | null>;
}) {
  const id = useId();
  const legendId = `${id}-legend`;
  const helpId = `${id}-help`;
  const errorId = `${id}-error`;
  return (
    <fieldset
      ref={fieldsetRef}
      className={`${ui.radioCards} ${styles.houseField}`}
      role="radiogroup"
      aria-labelledby={legendId}
      aria-describedby={error ? `${helpId} ${errorId}` : helpId}
      aria-invalid={error ? true : undefined}
      tabIndex={-1}
    >
      <legend id={legendId} className={styles.legend}>
        {legend}
      </legend>
      <p id={helpId} className={ui.fieldHelp}>
        {help}
      </p>
      {houses.map((house) => {
        const disabled = onlyHouse !== null && house.slug !== onlyHouse;
        return (
          <label key={house.slug} className={ui.radioCard}>
            <input
              type="radio"
              name={name}
              value={house.slug}
              checked={value === house.slug}
              disabled={disabled}
              onChange={() => onChange(house.slug)}
            />
            <span className={ui.radioName}>{house.name}</span>
            <span className={ui.radioMeta}>{house.address}</span>
            {disabled ? <span className={styles.radioNote}>Not sold at this house</span> : null}
          </label>
        );
      })}
      {error ? (
        <p id={errorId} className={ui.fieldError}>
          <Info size={16} />
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}

/** Left side of a layer footer: "S$200 · Résident", with an optional small line. */
export function FooterSummary({ price, name, note }: { price: string; name: string; note?: string }) {
  return (
    <div className={styles.footerSummary}>
      <p className={`${styles.footerPrice} ${ui.num}`}>
        {price} · {name}
      </p>
      {note ? <p className={styles.footerNote}>{note}</p> : null}
    </div>
  );
}

/** Scrolls a layer body so `target` sits near the top, without moving the page behind. */
export function scrollWithin(body: HTMLElement | null, target: HTMLElement | null) {
  if (!body || !target) return;
  const offset = target.getBoundingClientRect().top - body.getBoundingClientRect().top - 24;
  body.scrollBy({ top: offset, behavior: prefersReducedMotion() ? "auto" : "smooth" });
}

/* ---------- Offer flow ---------- */

type OfferView = "details" | "purchase" | "checkout" | "success";
type BuyableOffer = Membership | Package;

const REDEMPTION_WORD: Record<Package["redemption"], string> = {
  COUNT: "Sessions",
  MONEY: "Value",
  TIME: "Time",
};

const DETAIL_TAIL: readonly DetailRow[] = [
  { label: "Online purchase", value: "Available" },
  { label: "Walk-in", value: "Available" },
];

function typeLabel(offer: BuyableOffer) {
  if (offer.kind === "package") return "Package";
  return offer.type === "credit" ? "Credit wallet" : "Discount plan";
}

function headerTitle(offer: BuyableOffer) {
  if (offer.kind === "package") return `Package · ${REDEMPTION_WORD[offer.redemption]}`;
  return `Membership · ${typeLabel(offer)}`;
}

function priceItems(offer: BuyableOffer): [PriceItem, PriceItem, PriceItem] {
  const pay = { label: "You pay", value: formatPrice(offer.pay) };
  if (offer.kind === "membership" && offer.type === "discount") {
    return [
      pay,
      { label: "Discount budget", value: formatPrice(offer.value) },
      { label: "Discount", value: `${offer.discountPercent ?? 0}%` },
    ];
  }
  return [
    pay,
    { label: offer.kind === "package" ? "Package value" : "Total value", value: formatPrice(offer.value) },
    { label: "You save", value: formatPrice(offer.value - offer.pay) },
  ];
}

function detailRows(offer: BuyableOffer): DetailRow[] {
  const validity = { label: "Validity", value: `${offer.validityMonths} months from purchase` };
  const eligible = { label: "Eligible services", value: "All services at all four houses" };
  if (offer.kind === "package") {
    return [
      { label: "Type", value: "Package" },
      { label: "Redemption", value: offer.redemptionLabel },
      validity,
      {
        label: "Included services",
        value: (
          <ul className={styles.includes}>
            {offer.includes.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        ),
      },
      ...DETAIL_TAIL,
    ];
  }
  if (offer.type === "discount") {
    return [
      { label: "Type", value: "Discount plan" },
      { label: "Discount", value: `${offer.discountPercent ?? 0}% off all services` },
      { label: "Minimum spend", value: `${formatPrice(offer.minSpend ?? 0)} per visit` },
      { label: "Discount budget", value: formatPrice(offer.value) },
      validity,
      eligible,
      ...DETAIL_TAIL,
    ];
  }
  return [
    { label: "Type", value: "Credit wallet" },
    { label: "Wallet credit", value: formatPrice(offer.value) },
    validity,
    eligible,
    ...DETAIL_TAIL,
  ];
}

function successBody(offer: BuyableOffer, houseName: string, until: string) {
  if (offer.kind === "package") {
    return `Your ${offer.name} package is ready at ${houseName}. Book each session as usual; the package is applied when you confirm.`;
  }
  if (offer.type === "discount") {
    return `Your ${offer.name} plan is active at ${houseName}. ${offer.discountPercent ?? 0}% comes off each eligible service when you confirm a booking, until ${until}.`;
  }
  return `Your ${offer.name} membership is ready at ${houseName}. ${formatPrice(offer.value)} in wallet credit can be applied when you confirm a booking at any of the four houses.`;
}

function bookLabel(offer: BuyableOffer) {
  if (offer.kind === "package") return "Book your first session";
  return offer.type === "credit" ? "Book with your credit" : "Book a visit";
}

export default function OfferFlow({
  offerId,
  initialHouse,
  onClose,
}: {
  offerId: string;
  initialHouse: HouseSlug | null;
  onClose: () => void;
}) {
  const offer = OFFER_BY_ID.get(offerId);
  const buyable = offer && offer.kind !== "gift" ? offer : null;

  useEffect(() => {
    if (!buyable) onClose();
  }, [buyable, onClose]);

  if (!buyable) return null;
  return <OfferFlowLayer offer={buyable} initialHouse={initialHouse} onClose={onClose} />;
}

function OfferFlowLayer({
  offer,
  initialHouse,
  onClose,
}: {
  offer: BuyableOffer;
  initialHouse: HouseSlug | null;
  onClose: () => void;
}) {
  const { houses, houseBySlug, openBooking } = useMaison();
  const bodyRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const fieldsetRef = useRef<HTMLFieldSetElement>(null);
  const uid = useId();
  const feeId = `${uid}-fee`;
  const { view, pending, go } = useFlowViews<OfferView>("details", bodyRef);
  const [house, setHouse] = useState<HouseSlug | null>(offer.kind === "package" ? offer.house : initialHouse);
  const [houseError, setHouseError] = useState(false);
  const [feeOpen, setFeeOpen] = useState(false);
  const [receipt, setReceipt] = useState<Receipt | null>(null);

  const focusHeading = () => headingRef.current?.focus({ preventScroll: true });
  const focusTitle = () => focusLayerTitle(bodyRef.current);

  const checkout = useCheckout(view === "checkout", () => {
    setReceipt(makeReceipt(offer.validityMonths));
    go("success", focusHeading);
  });

  const busy = pending !== null;
  const checkingOut = view === "checkout" || pending === "checkout";
  const price = formatPrice(offer.pay);
  const houseName = houseBySlug(house)?.name ?? "";
  const itemLine = `${offer.name} · ${typeLabel(offer)}`;

  const onBuy = () => {
    if (busy) return;
    if (!house) {
      setHouseError(true);
      const fieldset = fieldsetRef.current;
      scrollWithin(bodyRef.current, fieldset);
      // Focus once the error is rendered, so it is announced with the group.
      window.requestAnimationFrame(() => fieldset?.focus({ preventScroll: true }));
      return;
    }
    go("purchase", focusTitle);
  };

  const onPay = () => {
    if (busy) return;
    checkout.reset();
    go("checkout", focusTitle);
  };

  const onBook = () => {
    onClose();
    openBooking({ house });
  };

  let title: string;
  let content: ReactNode;
  let footer: ReactNode = null;

  if (view === "details") {
    title = headerTitle(offer);
    content = (
      <div className={styles.stack}>
        <div className={styles.faceWrap}>
          <CardFace offer={offer} />
        </div>
        <div className={styles.intro}>
          <span className={ui.badge}>{offer.detailBadge}</span>
          <h2 ref={headingRef} tabIndex={-1} className={styles.title}>
            {offer.name}
          </h2>
          <p className={styles.tagline}>{offer.tagline}</p>
        </div>
        <PriceBlock items={priceItems(offer)} />
        <InfoChips chips={offer.chips} />
        <p className={styles.description}>{offer.description}</p>
        <section className={styles.group} aria-labelledby={`${uid}-details`}>
          <h3 id={`${uid}-details`} className={styles.subhead}>
            Details
          </h3>
          <DetailList rows={detailRows(offer)} />
        </section>
        <HouseRadios
          name={`${uid}-house`}
          legend="Where to buy"
          help={
            offer.kind === "package"
              ? `This package is sold and used at ${houseBySlug(offer.house)?.name ?? ""}.`
              : "Choose a house to buy or redeem this membership."
          }
          houses={houses}
          value={house}
          onChange={(slug) => {
            setHouse(slug);
            setHouseError(false);
          }}
          onlyHouse={offer.kind === "package" ? offer.house : null}
          error={houseError ? "Select a house to continue." : null}
          fieldsetRef={fieldsetRef}
        />
      </div>
    );
    footer = (
      <div className={styles.footerBar}>
        <FooterSummary price={price} name={offer.name} note="Demonstration checkout. No payment is taken." />
        <button type="button" className={`${ui.btn} ${ui.primary} ${ui.lg} ${styles.footerBtn}`} onClick={onBuy}>
          {house ? `Buy · ${price}` : "Choose a house"}
        </button>
      </div>
    );
  } else if (view === "purchase") {
    title = "Complete purchase";
    content = (
      <div className={styles.stack}>
        <p className={ui.srOnly}>Review fees and complete payment for this offer.</p>
        <div>
          <p className={styles.purchasing}>Purchasing at {houseName}</p>
          <p className={styles.purchasingMeta}>{itemLine}</p>
        </div>
        <OrderSummary
          rows={[
            { key: "item", label: `${offer.name} ${offer.kind === "package" ? "package" : "membership"}`, value: offer.pay },
            {
              key: "fee",
              label: (
                <span className={styles.feeLabel}>
                  Transaction fee
                  <button
                    type="button"
                    className={styles.infoBtn}
                    aria-expanded={feeOpen}
                    aria-controls={feeId}
                    aria-label="About the transaction fee"
                    onClick={() => setFeeOpen((open) => !open)}
                  >
                    <Info size={20} />
                  </button>
                </span>
              ),
              value: 0,
            },
            { key: "total", label: "Total", value: offer.pay, total: true },
          ]}
          after={{
            fee: (
              <dd id={feeId} className={styles.feeNote} hidden={!feeOpen}>
                Inclusive of tax, processing fee and payment gateway fee.
              </dd>
            ),
          }}
        />
        <p className={styles.notice}>
          This is a demonstration. In the live product the guest signs in with a WhatsApp code and pays on a secure
          hosted checkout page; no card details are ever entered on this site.
        </p>
      </div>
    );
    footer = (
      <div className={`${styles.footerBar} ${styles.footerEnd}`}>
        <button
          type="button"
          className={`${ui.btn} ${ui.secondary} ${ui.lg} ${styles.footerBtn}`}
          onClick={() => {
            if (!busy) go("details", focusHeading);
          }}
        >
          Cancel
        </button>
        <button type="button" className={`${ui.btn} ${ui.primary} ${ui.lg} ${styles.footerBtn} ${styles.footerMain}`} onClick={onPay}>
          Pay {formatCents(offer.pay)}
        </button>
      </div>
    );
  } else if (view === "checkout") {
    title = "Secure checkout";
    content = <CheckoutView phase={checkout.phase} />;
  } else {
    title = headerTitle(offer);
    content = (
      <div className={`${styles.stack} ${styles.success}`}>
        <SuccessMark />
        <div className={styles.intro}>
          <p className={ui.label}>Demo · Payment successful</p>
          <h2 ref={headingRef} tabIndex={-1} className={styles.title}>
            Payment successful
          </h2>
        </div>
        <p className={styles.description}>{successBody(offer, houseName, receipt?.validUntil ?? "")}</p>
        <DetailList
          rows={[
            { label: "Item", value: itemLine },
            { label: "House", value: houseName },
            { label: "Total paid", value: <span className={ui.num}>{formatCents(offer.pay)}</span> },
            { label: "Valid until", value: <span className={ui.num}>{receipt?.validUntil}</span> },
            { label: "Reference", value: <span className={ui.num}>{receipt?.reference}</span> },
            { label: "Date", value: <span className={ui.num}>{receipt?.stamp}</span> },
          ]}
        />
        <p className={styles.smallNote}>
          {offer.kind === "package"
            ? "Demonstration only: no payment was taken and nothing was issued. In the live product this package appears under Packages."
            : "Demonstration only: no payment was taken and nothing was issued. In the live product this membership appears in the guest’s account under Memberships."}
        </p>
      </div>
    );
    footer = (
      <div className={`${styles.footerBar} ${styles.footerEnd}`}>
        <button type="button" className={`${ui.btn} ${ui.secondary} ${ui.lg} ${styles.footerBtn}`} onClick={onClose}>
          Done
        </button>
        <button type="button" className={`${ui.btn} ${ui.primary} ${ui.lg} ${styles.footerBtn} ${styles.footerMain}`} onClick={onBook}>
          {bookLabel(offer)}
        </button>
      </div>
    );
  }

  return (
    <Layer
      open
      onClose={onClose}
      variant="dialog"
      title={title}
      headerExtra={<DemoBadge />}
      footer={footer}
      closeOnEsc={!checkingOut}
      className={styles.panel}
      bodyRef={bodyRef}
    >
      <div className={styles.flow}>
        <div key={view} className={`${styles.view} ${busy ? styles.leaving : ""}`}>
          {content}
        </div>
      </div>
    </Layer>
  );
}
