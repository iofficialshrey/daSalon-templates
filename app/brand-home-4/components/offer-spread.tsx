"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { demoReference, formatCents, formatLongCalendarDate, sgtStamp, validUntil } from "@/lib/dasalon/demo";
import { formatPrice } from "@/lib/dasalon/locale";
import { chapterById } from "../data/chapters";
import {
  GIFT_MONTHS,
  giftDesignById,
  giftPay,
  giftValue,
  membershipById,
  saving,
  savePercent,
  setById,
  type GiftDesign,
  type Membership,
  type SetOffer,
} from "../data/offers";
import { STUDIOS, studioBySlug } from "../data/studios";
import { ArrowRight, Close, Minus, Plus } from "./icons";
import { Layer } from "./layer";
import { GIFT_DESIGN_GROUP, giftPurchaseId } from "./offer-ids";
import { OfferStage, type StageObject } from "./offer-stage";
import styles from "./offer-spread.module.css";
import { usePaloma, type BookingRequest, type OfferRequest } from "./provider";
import ui from "./ui.module.css";

/*
 * The offer spread: a full-viewport two-page spread for a membership, a set or
 * a gift card. Details → Buy → processing (two 600ms phases) → a DEMO stamp
 * and receipt. A demonstration only: no card fields, no network, no storage,
 * no logging. Personalisation lives in this component's state and goes with it.
 */

type Row = { label: string; value: ReactNode };

type Offer = {
  object: StageObject;
  /** Marked in the provider's in-memory set once bought. */
  purchaseId: string;
  name: string;
  tagline: string;
  description: string | null;
  /** "03 · The Circle · Membership" */
  barLabel: string;
  pay: number;
  /** Under the footer price: "S$420 wallet credit". */
  priceNote: string;
  months: number;
  rows: Row[];
  how: readonly string[];
  issuing: string;
};

type View = "details" | "processing" | "done";

type Receipt = { reference: string; issued: string; until: string; to: string };

const PHASE_MS = 600;
const LIMIT = { to: 40, from: 40, message: 140 } as const;
const PRICED_ON = "13 Oct 2026";
const ALL_STUDIOS = STUDIOS.map((studio) => studio.name).join(", ");
const WORDS = ["Zero", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve"];

/* ---------- Offers: every figure computed from data/offers.ts ---------- */

function membershipOffer(membership: Membership): Offer {
  const chapter = chapterById("circle");
  const credit = membership.kind === "credit";
  const percent = membership.discountPercent ?? 0;
  const minSpend = formatPrice(membership.minSpend ?? 0);
  const extra = saving(membership);
  const rows: Row[] = [{ label: "Type", value: credit ? "Credit wallet" : "Discount plan" }];
  if (credit) {
    rows.push({ label: "Wallet credit", value: formatPrice(membership.credit ?? membership.pay) });
  } else {
    rows.push(
      { label: "Discount", value: `${percent}% off every eligible visit` },
      { label: "Minimum spend", value: `${minSpend} a visit` },
      { label: "Discount budget", value: `Up to ${formatPrice(membership.discountBudget ?? 0)} off` },
    );
  }
  rows.push({ label: "You pay", value: formatPrice(membership.pay) });
  if (extra !== null) rows.push({ label: "Saving", value: `${formatPrice(extra)} extra credit` });
  rows.push(
    { label: "Valid", value: `${membership.months} months from purchase` },
    { label: "Use at", value: `All four studios — ${ALL_STUDIOS}` },
    { label: "Buy", value: "Online, or at any studio desk" },
  );
  return {
    object: { kind: "membership", membership },
    purchaseId: membership.id,
    name: membership.name,
    tagline: membership.tagline,
    description: membership.description,
    barLabel: `${chapter.no} · ${chapter.label} · Membership`,
    pay: membership.pay,
    priceNote: credit ? `${formatPrice(membership.credit ?? membership.pay)} wallet credit` : `${percent}% off visits from ${minSpend}`,
    months: membership.months,
    rows,
    how: membership.howItWorks,
    issuing: "Issuing your membership…",
  };
}

function setOffer(set: SetOffer): Offer {
  const chapter = chapterById("sets");
  const studioName = studioBySlug(set.studio)?.name ?? "the studio";
  const saved = formatPrice(saving(set) ?? 0);
  const percent = savePercent(set);
  const worth = `${set.valueIsMinimum ? "At least " : ""}${formatPrice(set.value)} at menu prices on ${PRICED_ON}`;
  return {
    object: { kind: "set", set, studioName },
    purchaseId: set.id,
    name: set.name,
    tagline: set.line,
    description: null,
    barLabel: `${chapter.no} · Seasonal set · ${studioName}`,
    pay: set.pay,
    priceNote: `Worth ${set.valueIsMinimum ? "at least " : ""}${formatPrice(set.value)}`,
    months: set.months,
    rows: [
      { label: "Type", value: "Seasonal set (package)" },
      { label: "Redemption", value: set.redemptionLine },
      {
        label: "Included",
        value: (
          <ul className={styles.included}>
            {set.includes.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        ),
      },
      { label: "Used at", value: `${studioName} only` },
      { label: "Worth", value: worth },
      { label: "You pay", value: formatPrice(set.pay) },
      { label: "You save", value: set.valueIsMinimum ? `${saved} or more` : `${saved}${percent ? ` (${percent}%)` : ""}` },
      { label: "Valid", value: `${set.months} months from purchase` },
    ],
    how: [
      `Book each session when it suits you, within ${set.months} months.`,
      `Sessions are used at ${studioName} only.`,
      `Start with ${set.firstService} — Book your first session takes you straight to a time.`,
    ],
    issuing: "Issuing your set…",
  };
}

function giftOffer(design: GiftDesign, value: number): Offer {
  const chapter = chapterById("gifts");
  const pay = giftPay(value);
  const item = giftValue(value);
  const saved = item ? saving(item) ?? 0 : 0;
  const rows: Row[] = [
    { label: "Design", value: design.name },
    { label: "Card value", value: formatPrice(value) },
    { label: "You pay", value: formatPrice(pay) },
  ];
  if (saved > 0) rows.push({ label: "You save", value: formatPrice(saved) });
  rows.push(
    { label: "Valid", value: `${GIFT_MONTHS} months from purchase` },
    { label: "Redeemable", value: "All four studios, any service" },
    { label: "Delivery", value: "In the live product: by email or SMS, with your message" },
  );
  return {
    object: { kind: "gift", design, value, to: "" },
    purchaseId: giftPurchaseId(design.id, value),
    name: `${design.name} gift card`,
    tagline: `${design.coverLine}: ${formatPrice(value)} to spend on any service at all four studios.`,
    description: null,
    barLabel: `${chapter.no} · ${chapter.label} · Gift card`,
    pay,
    priceNote: `Card value ${formatPrice(value)}`,
    months: GIFT_MONTHS,
    rows,
    how: [
      "The recipient books any service at any of the four studios.",
      `The card is applied when they confirm; any balance stays on it for ${GIFT_MONTHS} months.`,
      "In the live product it arrives by email or SMS with your message.",
    ],
    issuing: "Issuing your gift card…",
  };
}

function resolveOffer(request: OfferRequest): Offer | null {
  if (request.kind === "membership") {
    const membership = membershipById(request.id);
    return membership ? membershipOffer(membership) : null;
  }
  if (request.kind === "set") {
    const set = setById(request.id);
    return set ? setOffer(set) : null;
  }
  const design = giftDesignById(request.design);
  return design && giftValue(request.value) ? giftOffer(design, request.value) : null;
}

/* ---------- Done view copy ---------- */

function doneCopy(offer: Offer, receipt: Receipt) {
  const { object } = offer;
  const until = receipt.until;
  if (object.kind === "membership") {
    const { membership } = object;
    const title = membership.id === "paloma-circle" ? "Welcome to the Circle." : `${membership.name} is active.`;
    if (membership.kind === "credit") {
      return {
        title,
        body: `${formatCents(membership.credit ?? membership.pay)} in wallet credit, ready at any of the four studios until ${until}.`,
      };
    }
    return {
      title,
      body: `${membership.discountPercent ?? 0}% comes off every eligible visit of ${formatPrice(membership.minSpend ?? 0)} or more until you’ve saved ${formatPrice(membership.discountBudget ?? 0)} or ${until} — whichever comes first.`,
    };
  }
  if (object.kind === "set") {
    const { set, studioName } = object;
    const count = Number(set.figure);
    const amount =
      set.redemption === "COUNT"
        ? `${WORDS[count] ?? set.figure} sessions`
        : set.redemption === "MONEY"
          ? `${formatCents(set.value)} to spend`
          : set.redemptionLine;
    const how = set.redemption === "TIME" ? "Book an hour at a time" : set.redemption === "COUNT" ? "Book each one as usual" : "Book as usual";
    return {
      title: `${set.name} is yours.`,
      body: `${amount} at ${studioName}, valid until ${until}. ${how}; the set is applied when you confirm.`,
    };
  }
  const { design, value } = object;
  const article = /^[aeiou]/i.test(design.name) ? "An" : "A";
  return {
    title: "Your gift card is ready.",
    body: `${article} ${design.name} card worth ${formatCents(value)}${receipt.to ? ` for ${receipt.to}` : ""}, valid at all four studios until ${until}. In the live product it’s sent by email or SMS with your message; this demonstration sends nothing.`,
  };
}

function receiptRows(offer: Offer, receipt: Receipt): Row[] {
  const { object } = offer;
  const rows: Row[] = [
    { label: "Reference", value: receipt.reference },
    { label: "Issued", value: receipt.issued },
    { label: "Paid", value: `${formatCents(offer.pay)} (demonstration — no payment taken)` },
  ];
  if (object.kind === "membership") {
    const { membership } = object;
    rows.push(
      membership.kind === "credit"
        ? { label: "Wallet credit", value: formatCents(membership.credit ?? membership.pay) }
        : {
            label: "Discount",
            value: `${membership.discountPercent ?? 0}% off visits from ${formatPrice(membership.minSpend ?? 0)}, up to ${formatPrice(membership.discountBudget ?? 0)}`,
          },
    );
  } else if (object.kind === "set") {
    rows.push({ label: "Package", value: `${object.set.name} · ${object.set.redemptionLine}` });
  } else {
    rows.push({ label: "Card value", value: formatCents(object.value) });
  }
  rows.push(
    { label: "Valid until", value: receipt.until },
    { label: "Use at", value: object.kind === "set" ? `${object.studioName} only` : "All four studios" },
  );
  return rows;
}

/* ---------- Pieces ---------- */

function Facts({ rows, className }: { rows: readonly Row[]; className?: string }) {
  return (
    <dl className={`${styles.facts} ${className ?? ""}`}>
      {rows.map((row) => (
        <div key={row.label} className={styles.fact}>
          <dt className={`${ui.label} ${styles.factLabel}`}>{row.label}</dt>
          <dd className={styles.factValue}>{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}

type FieldProps = {
  id: string;
  label: string;
  value: string;
  limit: number;
  error: string;
  onChange: (value: string) => void;
  multiline?: boolean;
  placeholder?: string;
};

function Field({ id, label, value, limit, error, onChange, multiline = false, placeholder }: FieldProps) {
  const over = value.length > limit;
  const counterId = `${id}-count`;
  const errorId = `${id}-error`;
  const describedBy = [multiline ? counterId : null, over ? errorId : null].filter(Boolean).join(" ") || undefined;
  const common = {
    id,
    value,
    placeholder,
    autoComplete: "off",
    // Nothing typed here leaves the tab: no browser spellcheck service, no autofill history.
    spellCheck: false,
    "aria-invalid": over || undefined,
    "aria-describedby": describedBy,
  } as const;
  return (
    <div className={ui.field}>
      <div className={styles.fieldTop}>
        <label htmlFor={id} className={ui.fieldLabel}>
          {label}
        </label>
        {multiline ? (
          <span id={counterId} className={ui.counter}>
            {value.length} / {limit}
          </span>
        ) : null}
      </div>
      {multiline ? (
        <textarea {...common} className={ui.textarea} rows={3} onChange={(event) => onChange(event.target.value)} />
      ) : (
        <input {...common} type="text" className={ui.input} onChange={(event) => onChange(event.target.value)} />
      )}
      {over ? (
        <p id={errorId} className={ui.fieldError}>
          {error}
        </p>
      ) : null}
    </div>
  );
}

/* ---------- The spread ---------- */

export default function OfferSpread({
  request,
  onClose,
  returnTo,
}: {
  request: OfferRequest;
  onClose: () => void;
  returnTo: HTMLElement | null;
}) {
  const offer = resolveOffer(request);
  const { markPurchased, openBooking, prefetchBooking } = usePaloma();
  const uid = useId();
  const [open, setOpen] = useState(true);
  const [view, setView] = useState<View>("details");
  const [phase, setPhase] = useState<0 | 1>(0);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [to, setTo] = useState("");
  const [from, setFrom] = useState("");
  const [message, setMessage] = useState("");
  // Open on tablet and desktop, collapsed on phones. This chunk only renders in the browser.
  const [personalOpen, setPersonalOpen] = useState(() => window.matchMedia("(min-width: 760px)").matches);
  const timers = useRef<number[]>([]);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const detailsRef = useRef<HTMLDivElement>(null);
  const focusAfterOpen = useRef<string | null>(null);
  const refocusDesign = useRef(false);
  const known = offer !== null;

  // An unknown offer has nothing to show: hand straight back to the provider.
  useEffect(() => {
    if (!known) onClose();
  }, [known, onClose]);

  // A purchase still processing when the spread goes away is abandoned, never completed.
  useEffect(() => {
    const pending = timers;
    return () => pending.current.forEach((timer) => window.clearTimeout(timer));
  }, []);

  // Done: start at the top, with focus on the new heading.
  useEffect(() => {
    if (view !== "done") return;
    scrollRef.current?.scrollTo({ top: 0 });
    detailsRef.current?.scrollTo({ top: 0 });
    titleRef.current?.focus({ preventScroll: true });
  }, [view]);

  // A too-long field inside the collapsed section: focus it once the section has opened.
  useEffect(() => {
    if (!personalOpen || !focusAfterOpen.current) return;
    document.getElementById(focusAfterOpen.current)?.focus();
    focusAfterOpen.current = null;
  }, [personalOpen]);

  if (!offer) return null;

  const { object } = offer;
  const isGift = object.kind === "gift";
  const titleId = `${uid}-title`;
  const bodyId = `${uid}-body`;
  const ids = { to: `${uid}-to`, from: `${uid}-from`, message: `${uid}-message` };
  const done = view === "done" && receipt !== null;
  const copy = done ? doneCopy(offer, receipt) : null;
  const stage: StageObject = object.kind === "gift" ? { ...object, to } : object;

  const clearTimers = () => {
    timers.current.forEach((timer) => window.clearTimeout(timer));
    timers.current = [];
  };

  // Close and Escape cancel a purchase in progress.
  const close = () => {
    clearTimers();
    setOpen(false);
  };

  // "Choose another card": once the spread has gone, focus the chosen design (after Layer's own focus return).
  const exited = () => {
    const design = refocusDesign.current
      ? document.getElementById(GIFT_DESIGN_GROUP)?.querySelector<HTMLInputElement>("input:checked")
      : null;
    onClose();
    if (design) window.requestAnimationFrame(() => design.focus());
  };

  const focusField = (id: string) => {
    if (personalOpen) {
      document.getElementById(id)?.focus();
    } else {
      focusAfterOpen.current = id;
      setPersonalOpen(true);
    }
  };

  const buy = () => {
    if (view !== "details") return;
    if (isGift) {
      const invalid =
        to.length > LIMIT.to ? ids.to : from.length > LIMIT.from ? ids.from : message.length > LIMIT.message ? ids.message : null;
      if (invalid) {
        focusField(invalid);
        return;
      }
    }
    // Everything on the receipt is computed now, in the handler, never during render.
    const now = new Date();
    setReceipt({
      reference: demoReference(),
      issued: sgtStamp(now),
      until: formatLongCalendarDate(validUntil(offer.months, now)),
      to: to.trim(),
    });
    setPhase(0);
    setView("processing");
    clearTimers();
    timers.current = [
      window.setTimeout(() => setPhase(1), PHASE_MS),
      window.setTimeout(() => {
        timers.current = [];
        setView("done");
        markPurchased(offer.purchaseId);
      }, PHASE_MS * 2),
    ];
  };

  const book = (next: BookingRequest) => {
    clearTimers();
    // The provider closes this spread and returns focus to its opener when booking closes.
    openBooking(next);
  };

  const chooseAnother = () => {
    refocusDesign.current = true;
    close();
  };

  const bookAction =
    object.kind === "set"
      ? { label: "Book your first session", request: { slug: object.set.studio, serviceName: object.set.firstService } }
      : { label: "Book an appointment", request: {} };

  return (
    <Layer open={open} onClose={close} onExited={exited} variant="spread" labelledBy={titleId} describedBy={bodyId} returnTo={returnTo}>
      <div className={styles.spread} data-kind={object.kind} data-view={view}>
        <div className={styles.bar}>
          <p className={`${ui.label} ${styles.barLabel}`}>{offer.barLabel}</p>
          <span className={`${ui.badge} ${ui.badgeDemo}`}>Demo</span>
          <button type="button" className={styles.close} onClick={close}>
            <Close size={20} />
            <span className={ui.srOnly}>Close</span>
          </button>
        </div>

        <div ref={scrollRef} className={styles.scroll}>
          <OfferStage object={stage} />

          {/* Focusable so the facts below the fold can be scrolled from the keyboard (its own scroller from 1100px, .scroll below). */}
          {/* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- a scrollable region must be reachable by keyboard (WCAG 2.1.1) */}
          <div ref={detailsRef} className={styles.details} tabIndex={0} role="region" aria-labelledby={titleId}>
            <div className={styles.content}>
              {done && copy ? (
                <div key="done" className={styles.doneHead}>
                  <div className={styles.stampRow}>
                    <span className={styles.stamp} aria-hidden="true">
                      Demo
                    </span>
                    <span className={`${ui.badge} ${ui.badgeDemo}`}>Demo</span>
                  </div>
                  <h2 id={titleId} ref={titleRef} tabIndex={-1} data-layer-focus="" className={styles.title}>
                    {copy.title}
                  </h2>
                  <p id={bodyId} className={styles.body}>
                    {copy.body}
                  </p>
                </div>
              ) : (
                <div key="details">
                  <h2 id={titleId} ref={titleRef} tabIndex={-1} data-layer-focus="" className={styles.title}>
                    {offer.name}
                  </h2>
                  <p id={bodyId} className={styles.tagline}>
                    {offer.tagline}
                  </p>
                </div>
              )}

              {/* One live region for the whole flow, so each phase is announced. */}
              <div role="status" className={view === "processing" ? styles.processing : ui.srOnly}>
                {view === "processing" ? (
                  <>
                    <p className={styles.phase}>{phase === 0 ? "Confirming…" : offer.issuing}</p>
                    <span className={styles.progress} aria-hidden="true" />
                    <p className={ui.small}>Demo: no card details are collected and nothing is charged.</p>
                  </>
                ) : null}
              </div>

              {view === "details" ? (
                <>
                  {offer.description ? <p className={styles.description}>{offer.description}</p> : null}
                  <Facts rows={offer.rows} />
                  <div className={styles.how}>
                    <h3 className={ui.label}>How it works</h3>
                    <ol className={styles.steps}>
                      {offer.how.map((point) => (
                        <li key={point} className={styles.step}>
                          {point}
                        </li>
                      ))}
                    </ol>
                  </div>
                  {isGift ? (
                    <details
                      className={styles.personal}
                      open={personalOpen}
                      onToggle={(event) => setPersonalOpen(event.currentTarget.open)}
                    >
                      <summary className={styles.personalSummary}>
                        <span>Add a name and a message (optional)</span>
                        {personalOpen ? <Minus size={18} /> : <Plus size={18} />}
                      </summary>
                      <div className={styles.fields}>
                        <Field id={ids.to} label="To" value={to} limit={LIMIT.to} error="Keep the name to 40 characters." onChange={setTo} />
                        <Field
                          id={ids.from}
                          label="From"
                          value={from}
                          limit={LIMIT.from}
                          error="Keep the name to 40 characters."
                          onChange={setFrom}
                        />
                        <Field
                          id={ids.message}
                          label="Message"
                          value={message}
                          limit={LIMIT.message}
                          error="Keep the message to 140 characters."
                          onChange={setMessage}
                          multiline
                          placeholder="The afternoon at Serenity is on me."
                        />
                        <p className={ui.small}>All optional: the card shows the name as you type.</p>
                      </div>
                    </details>
                  ) : null}
                  <p className={styles.note}>
                    Demonstration: Buy simulates the purchase. No payment is taken, nothing is sent and nothing is stored.
                  </p>
                </>
              ) : null}

              {done ? (
                <>
                  <Facts rows={receiptRows(offer, receipt)} className={styles.receipt} />
                  <p className={styles.note}>
                    In the live product your receipt arrives by email and SMS. This demonstration sends and stores nothing.
                  </p>
                </>
              ) : null}
            </div>
          </div>
        </div>

        <div className={styles.footer}>
          {done ? (
            <div className={styles.actions}>
              {isGift ? (
                <>
                  <button type="button" className={`${ui.btn} ${ui.btnLg} ${ui.btnPrimary} ${styles.action}`} onClick={close}>
                    Done
                  </button>
                  <button type="button" className={`${ui.btn} ${ui.btnLg} ${ui.btnLine} ${styles.action}`} onClick={chooseAnother}>
                    Choose another card
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    className={`${ui.btn} ${ui.btnLg} ${ui.btnPrimary} ${styles.action}`}
                    onClick={() => book(bookAction.request)}
                    onPointerEnter={prefetchBooking}
                    onFocus={prefetchBooking}
                    onTouchStart={prefetchBooking}
                  >
                    <span>{bookAction.label}</span>
                    <ArrowRight />
                  </button>
                  <button type="button" className={`${ui.btn} ${ui.btnLg} ${ui.btnLine} ${styles.action}`} onClick={close}>
                    Done
                  </button>
                </>
              )}
            </div>
          ) : (
            <>
              <div className={styles.sum}>
                <p className={styles.sumPrice}>{formatPrice(offer.pay)}</p>
                <p className={styles.sumNote}>{offer.priceNote}</p>
              </div>
              <button
                type="button"
                className={`${ui.btn} ${ui.btnLg} ${ui.btnPrimary} ${ui.lifted} ${styles.buy}`}
                onClick={buy}
                aria-disabled={view !== "details" || undefined}
              >
                <span>Buy · {formatPrice(offer.pay)}</span>
                <ArrowRight />
              </button>
            </>
          )}
        </div>
      </div>
    </Layer>
  );
}
