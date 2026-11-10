"use client";

import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from "react";
import { formatPrice, isValidNationalNumber, SINGAPORE } from "@/lib/dasalon/locale";
import type { HouseSlug } from "../data/houses";
import { OFFER_BY_ID, type GiftCard } from "../data/offers";
import { formatCents } from "@/lib/dasalon/demo";
import { CardFace } from "./card-face";
import { Check, Info } from "./icons";
import { Layer } from "./layer";
import {
  CheckoutView,
  DemoBadge,
  DetailList,
  FooterSummary,
  HouseRadios,
  InfoChips,
  OrderSummary,
  PriceBlock,
  SuccessMark,
  focusLayerTitle,
  makeReceipt,
  useCheckout,
  useFlowViews,
  type Receipt,
} from "./offer-flow";
import { useMaison } from "./provider";
import styles from "./flows.module.css";
import ui from "./ui.module.css";

/*
 * Demonstration gift-card checkout: details (G0) → gift details (B1) → review
 * (B2) → simulated checkout (B3) → success (B4). The recipient's name, mobile
 * and email live only in this component's state: nothing is sent, stored or
 * logged, and everything is discarded when the layer closes.
 */

type GiftView = "details" | "form" | "review" | "checkout" | "success";
type Mode = "gift" | "self";
type Field = "recipientName" | "recipientMobile" | "recipientEmail" | "message" | "cardName" | "note";
type Values = Record<Field, string>;
type Errors = Partial<Record<Field, string>>;

const EMPTY_VALUES: Values = {
  recipientName: "",
  recipientMobile: "",
  recipientEmail: "",
  message: "",
  cardName: "",
  note: "",
};

/** Required fields per mode, in on-screen order (the first invalid one takes focus). */
const FIELDS: Record<Mode, readonly Field[]> = {
  gift: ["recipientName", "recipientMobile", "recipientEmail", "message"],
  self: ["cardName"],
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MESSAGE_MIN = 10;
const TEXT_MAX = 200;

function fieldError(field: Field, values: Values): string | null {
  switch (field) {
    case "recipientName":
      return values.recipientName.trim().length >= 2 ? null : "Enter the recipient’s name.";
    case "recipientMobile":
      return isValidNationalNumber(SINGAPORE.phoneCode, values.recipientMobile)
        ? null
        : "Enter an 8-digit Singapore number, e.g. 9123 4567.";
    case "recipientEmail":
      return EMAIL.test(values.recipientEmail.trim()) ? null : "Enter a valid email address.";
    case "message": {
      const left = MESSAGE_MIN - values.message.trim().length;
      return left > 0 ? `Write at least ${MESSAGE_MIN} characters (${left} to go).` : null;
    }
    case "cardName":
      return values.cardName.trim().length >= 2 ? null : "Enter the name for the card.";
    default:
      return null;
  }
}

function validate(mode: Mode, values: Values): Errors {
  const errors: Errors = {};
  for (const field of FIELDS[mode]) {
    const message = fieldError(field, values);
    if (message) errors[field] = message;
  }
  return errors;
}

/** "91234567" → "9123 4567" */
function formatMobile(digits: string) {
  return digits.length > 4 ? `${digits.slice(0, 4)} ${digits.slice(4)}` : digits;
}

/** Keeps the 8 national digits; a pasted "+65 9123 4567" loses its country code. */
function mobileDigits(raw: string) {
  let digits = raw.replace(/\D/g, "");
  if (digits.length === 10 && digits.startsWith("65")) digits = digits.slice(2);
  return digits.slice(0, 8);
}

function FormField({
  id,
  label,
  help,
  error,
  children,
}: {
  id: string;
  label: string;
  help?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className={ui.field}>
      <label htmlFor={id} className={ui.fieldLabel}>
        {label}
      </label>
      {children}
      {help ? (
        <p id={`${id}-help`} className={ui.fieldHelp}>
          {help}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} className={ui.fieldError}>
          <Info size={16} />
          {error}
        </p>
      ) : null}
    </div>
  );
}

const STEP_CLASS = {
  done: styles.stepDone,
  current: styles.stepCurrent,
  next: styles.stepNext,
} as const;

function Stepper({ current }: { current: 1 | 2 }) {
  const steps = [
    { n: 1, label: "Gift details" },
    { n: 2, label: "Review & pay" },
  ] as const;
  return (
    <ol className={styles.stepper} aria-label="Steps">
      {steps.map((step) => {
        const state = step.n < current ? "done" : step.n === current ? "current" : "next";
        return (
          <li
            key={step.n}
            className={`${styles.step} ${STEP_CLASS[state]}`}
            aria-current={state === "current" ? "step" : undefined}
          >
            <span className={styles.stepNum} aria-hidden="true">
              {state === "done" ? <Check size={14} strokeWidth={1.75} /> : step.n}
            </span>
            {step.label}
            {state === "done" ? <span className={ui.srOnly}> (completed)</span> : null}
          </li>
        );
      })}
    </ol>
  );
}

/** The live card: "To {name}", the message, the value and its validity, drawn on the card's own face. */
function GiftPreview({ offer, name, text }: { offer: GiftCard; name: string; text: string }) {
  const trimmed = text.trim();
  const excerpt = trimmed.length > 90 ? `${trimmed.slice(0, 90).trimEnd()}…` : trimmed;
  return (
    <div className={styles.preview}>
      <p className={ui.srOnly}>Card preview updates as you type</p>
      <CardFace offer={offer} size="preview">
        <div className={styles.previewMiddle}>
          <span className={styles.previewTo}>To {name.trim() || "—"}</span>
          {excerpt ? <span className={styles.previewMessage}>{excerpt}</span> : null}
        </div>
        <div className={styles.previewBottom}>
          <span className={styles.previewValue}>{formatPrice(offer.value)}</span>
          <span className={styles.previewValid}>Valid {offer.validityMonths} months</span>
        </div>
      </CardFace>
    </div>
  );
}

export default function GiftFlow({
  offerId,
  initialHouse,
  onClose,
}: {
  offerId: string;
  initialHouse: HouseSlug | null;
  onClose: () => void;
}) {
  const offer = OFFER_BY_ID.get(offerId);
  const gift = offer?.kind === "gift" ? offer : null;

  useEffect(() => {
    if (!gift) onClose();
  }, [gift, onClose]);

  if (!gift) return null;
  return <GiftFlowLayer offer={gift} initialHouse={initialHouse} onClose={onClose} />;
}

function GiftFlowLayer({
  offer,
  initialHouse,
  onClose,
}: {
  offer: GiftCard;
  initialHouse: HouseSlug | null;
  onClose: () => void;
}) {
  const { houses, houseBySlug, openBooking } = useMaison();
  const uid = useId();
  const formId = `${uid}-form`;
  const fieldId = (field: Field) => `${uid}-${field}`;
  const bodyRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const houseFieldsetRef = useRef<HTMLFieldSetElement>(null);
  const { view, pending, go } = useFlowViews<GiftView>("details", bodyRef);
  const [mode, setMode] = useState<Mode>("gift");
  const [values, setValues] = useState<Values>(EMPTY_VALUES);
  const [house, setHouse] = useState<HouseSlug>(initialHouse ?? "the-grooming-room");
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [receipt, setReceipt] = useState<Receipt | null>(null);

  const focusHeading = () => headingRef.current?.focus({ preventScroll: true });
  const focusTitle = () => focusLayerTitle(bodyRef.current);
  const focusField = (field: Field | "house") => {
    if (field === "house") {
      houseFieldsetRef.current?.querySelector<HTMLInputElement>("input:checked")?.focus();
      return;
    }
    document.getElementById(fieldId(field))?.focus();
  };

  const checkout = useCheckout(view === "checkout", () => {
    setReceipt(makeReceipt(offer.validityMonths));
    go("success", focusHeading);
  });

  const busy = pending !== null;
  const checkingOut = view === "checkout" || pending === "checkout";
  const isGift = mode === "gift";
  const houseName = houseBySlug(house)?.name ?? "";
  const price = formatPrice(offer.pay);
  const saving = offer.value - offer.pay;
  const errorCount = FIELDS[mode].filter((field) => errors[field]).length;
  const previewName = isGift ? values.recipientName : values.cardName;
  const previewText = isGift ? values.message : values.note;

  const showError = (field: Field, message: string | null) => {
    setErrors((current) => {
      const next = { ...current };
      if (message) next[field] = message;
      else delete next[field];
      return next;
    });
  };

  // Errors appear on Continue, are re-checked on blur, and clear as soon as the field is fixed.
  const setField = (field: Field, value: string) => {
    const next = { ...values, [field]: value };
    setValues(next);
    if (errors[field]) showError(field, fieldError(field, next));
  };

  const fieldProps = (field: Field, extra: { help?: boolean; counter?: boolean } = {}) => {
    const id = fieldId(field);
    const describedBy = [
      extra.help ? `${id}-help` : null,
      extra.counter ? `${id}-count` : null,
      errors[field] ? `${id}-error` : null,
    ].filter(Boolean);
    return {
      id,
      onBlur: () => {
        if (submitted) showError(field, fieldError(field, values));
      },
      "aria-invalid": errors[field] ? true : undefined,
      "aria-describedby": describedBy.length ? describedBy.join(" ") : undefined,
    };
  };

  const onContinue = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy) return;
    const found = validate(mode, values);
    const invalid = FIELDS[mode].filter((field) => found[field]);
    setSubmitted(true);
    setErrors(found);
    if (invalid.length) {
      // Focus once the errors are rendered, so the field is announced with its message.
      window.requestAnimationFrame(() => focusField(invalid[0]));
      return;
    }
    go("review", focusHeading);
  };

  const onPay = () => {
    if (busy) return;
    checkout.reset();
    go("checkout", focusTitle);
  };

  const onSendAnother = () => {
    if (busy) return;
    setValues(EMPTY_VALUES);
    setErrors({});
    setSubmitted(false);
    setReceipt(null);
    go("form", focusHeading);
  };

  const onBook = () => {
    onClose();
    openBooking({ house });
  };

  const footerBtn = `${ui.btn} ${ui.lg} ${styles.footerBtn}`;

  let title: string;
  let content: ReactNode;
  let footer: ReactNode = null;

  if (view === "details") {
    title = `Gift card · ${offer.name}`;
    content = (
      <div className={styles.detailSplit}>
        <div className={styles.detailFace}>
          <CardFace offer={offer} />
        </div>
        <div className={styles.stack}>
          <div className={styles.intro}>
            <span className={ui.badge}>{offer.detailBadge}</span>
            <h2 ref={headingRef} tabIndex={-1} className={styles.title}>
              {offer.name}
            </h2>
            <p className={styles.tagline}>{offer.tagline}</p>
            <p className={styles.occasion}>{offer.occasion}</p>
          </div>
          <PriceBlock
            items={[
              { label: "You pay", value: price },
              { label: "Face value", value: formatPrice(offer.value) },
              { label: "You save", value: formatPrice(saving) },
            ]}
          />
          <InfoChips chips={offer.chips} />
          <p className={styles.description}>{offer.description}</p>
          <section className={styles.group} aria-labelledby={`${uid}-details`}>
            <h3 id={`${uid}-details`} className={styles.subhead}>
              Details
            </h3>
            <DetailList
              rows={[
                { label: "Type", value: "Gift card" },
                { label: "Face value", value: formatPrice(offer.value) },
                { label: "Validity", value: `${offer.validityMonths} months from purchase` },
                { label: "Redeemable at", value: "All four houses" },
                { label: "Delivery", value: "By email and SMS, with your message" },
                { label: "Online purchase", value: "Available" },
              ]}
            />
          </section>
        </div>
      </div>
    );
    footer = (
      <div className={styles.footerBar}>
        <FooterSummary price={price} name={offer.name} />
        <button
          type="button"
          className={`${footerBtn} ${ui.primary} ${styles.footerMain}`}
          onClick={() => {
            if (!busy) go("form", focusHeading);
          }}
        >
          Buy gift card · {price}
        </button>
      </div>
    );
  } else if (view === "form") {
    title = "Buy gift card";
    content = (
      <>
        <Stepper current={1} />
        <div className={styles.split}>
          <div className={styles.aside}>
            <div className={styles.asidePreview}>
              <GiftPreview offer={offer} name={previewName} text={previewText} />
            </div>
            <section className={styles.asideOrder} aria-labelledby={`${uid}-order`}>
              <h3 id={`${uid}-order`} className={styles.subhead}>
                Order preview
              </h3>
              <OrderSummary
                rows={[
                  { key: "house", label: "Issuing house", value: houseName },
                  { key: "redemption", label: "Redemption", value: "All 4 houses" },
                  { key: "value", label: "Card value", value: offer.value },
                  { key: "saving", label: "Discount savings", value: -saving },
                  { key: "fees", label: "Fees", value: 0 },
                  { key: "total", label: "Total", value: offer.pay, total: true },
                ]}
              />
            </section>
          </div>
          <div className={styles.main}>
            <div className={styles.intro}>
              <h2 ref={headingRef} tabIndex={-1} className={styles.viewTitle}>
                Gift details
              </h2>
              <p className={styles.lede}>Choose whether this gift card is for yourself or someone special.</p>
            </div>
            {submitted && errorCount > 0 ? (
              <p role="alert" className={styles.errorSummary}>
                <Info size={16} />
                Please check {errorCount} {errorCount === 1 ? "field" : "fields"}.
              </p>
            ) : null}
            <form id={formId} noValidate onSubmit={onContinue} className={styles.form}>
              <fieldset className={styles.plainFieldset}>
                <legend className={styles.fieldLegend}>Who is this card for?</legend>
                <div className={styles.segmented}>
                  <label className={styles.segment}>
                    <input
                      type="radio"
                      name={`${uid}-mode`}
                      value="self"
                      checked={mode === "self"}
                      onChange={() => setMode("self")}
                    />
                    For myself
                  </label>
                  <label className={styles.segment}>
                    <input
                      type="radio"
                      name={`${uid}-mode`}
                      value="gift"
                      checked={mode === "gift"}
                      onChange={() => setMode("gift")}
                    />
                    As a gift
                  </label>
                </div>
              </fieldset>

              <div className={styles.blockHead}>
                <h3 className={styles.subhead}>{isGift ? "Recipient information" : "Card information"}</h3>
                <span className={ui.badge}>{isGift ? "Gift delivery" : "For self"}</span>
              </div>

              {isGift ? (
                <>
                  <FormField id={fieldId("recipientName")} label="Recipient’s name" error={errors.recipientName}>
                    <input
                      {...fieldProps("recipientName")}
                      className={ui.input}
                      type="text"
                      value={values.recipientName}
                      onChange={(event) => setField("recipientName", event.target.value)}
                      placeholder="e.g. Mei Ling Tan"
                      maxLength={60}
                      autoComplete="off"
                      required
                    />
                  </FormField>
                  <FormField
                    id={fieldId("recipientMobile")}
                    label="Recipient’s mobile"
                    help="8-digit Singapore number"
                    error={errors.recipientMobile}
                  >
                    <div className={ui.phone}>
                      <span className={`${ui.phonePrefix} ${ui.num}`}>{SINGAPORE.phoneCode}</span>
                      <input
                        {...fieldProps("recipientMobile", { help: true })}
                        className={`${ui.input} ${ui.num}`}
                        type="tel"
                        inputMode="numeric"
                        value={formatMobile(values.recipientMobile)}
                        onChange={(event) => setField("recipientMobile", mobileDigits(event.target.value))}
                        placeholder="9123 4567"
                        maxLength={16}
                        autoComplete="off"
                        required
                      />
                    </div>
                  </FormField>
                  <FormField id={fieldId("recipientEmail")} label="Recipient’s email" error={errors.recipientEmail}>
                    <input
                      {...fieldProps("recipientEmail")}
                      className={ui.input}
                      type="email"
                      inputMode="email"
                      value={values.recipientEmail}
                      onChange={(event) => setField("recipientEmail", event.target.value)}
                      placeholder="recipient@example.com"
                      autoComplete="off"
                      autoCapitalize="none"
                      spellCheck={false}
                      required
                    />
                  </FormField>
                  <FormField id={fieldId("message")} label="Personal message" error={errors.message}>
                    <div className={styles.textareaWrap}>
                      <textarea
                        {...fieldProps("message", { counter: true })}
                        className={`${ui.input} ${ui.textarea} ${styles.textarea}`}
                        value={values.message}
                        onChange={(event) => setField("message", event.target.value)}
                        placeholder="Happy birthday, Wen. An afternoon at Walnut House is on me. Rachel"
                        maxLength={TEXT_MAX}
                        required
                      />
                      <span id={`${fieldId("message")}-count`} className={`${styles.counter} ${ui.num}`}>
                        {values.message.length} / {TEXT_MAX}
                      </span>
                    </div>
                  </FormField>
                </>
              ) : (
                <>
                  <FormField id={fieldId("cardName")} label="Name on card" error={errors.cardName}>
                    <input
                      {...fieldProps("cardName")}
                      className={ui.input}
                      type="text"
                      value={values.cardName}
                      onChange={(event) => setField("cardName", event.target.value)}
                      placeholder="Name to appear on card"
                      maxLength={60}
                      autoComplete="name"
                      required
                    />
                  </FormField>
                  <FormField id={fieldId("note")} label="Personal note (optional)">
                    <div className={styles.textareaWrap}>
                      <textarea
                        {...fieldProps("note", { counter: true })}
                        className={`${ui.input} ${ui.textarea} ${styles.textarea}`}
                        value={values.note}
                        onChange={(event) => setField("note", event.target.value)}
                        maxLength={TEXT_MAX}
                      />
                      <span id={`${fieldId("note")}-count`} className={`${styles.counter} ${ui.num}`}>
                        {values.note.length} / {TEXT_MAX}
                      </span>
                    </div>
                  </FormField>
                </>
              )}

              <HouseRadios
                name={`${uid}-house`}
                legend="Issuing house"
                help="Valid at all 4 houses. Choose where you’re buying from."
                houses={houses}
                value={house}
                onChange={setHouse}
                fieldsetRef={houseFieldsetRef}
              />
            </form>
          </div>
        </div>
      </>
    );
    footer = (
      <div className={`${styles.footerBar} ${styles.footerEnd}`}>
        <button type="button" className={`${footerBtn} ${ui.secondary}`} onClick={onClose}>
          Cancel
        </button>
        <button type="submit" form={formId} className={`${footerBtn} ${ui.primary} ${styles.footerMain}`}>
          Continue to review
        </button>
      </div>
    );
  } else if (view === "review") {
    title = "Buy gift card";
    const rows: { field: Field | "house"; label: string; value: ReactNode }[] = isGift
      ? [
          { field: "recipientName", label: "Recipient’s name", value: values.recipientName.trim() },
          {
            field: "recipientMobile",
            label: "Recipient’s mobile",
            value: (
              <span className={ui.num}>
                {SINGAPORE.phoneCode} {formatMobile(values.recipientMobile)}
              </span>
            ),
          },
          { field: "recipientEmail", label: "Recipient’s email", value: values.recipientEmail.trim() },
          { field: "message", label: "Personal message", value: `“${values.message.trim()}”` },
          { field: "house", label: "Issuing house", value: houseName },
        ]
      : [
          { field: "cardName", label: "Name on card", value: values.cardName.trim() },
          { field: "note", label: "Personal note", value: values.note.trim() ? `“${values.note.trim()}”` : "None" },
          { field: "house", label: "Issuing house", value: houseName },
        ];
    content = (
      <>
        <Stepper current={2} />
        <div className={styles.split}>
          <div className={styles.aside}>
            <div className={`${styles.asidePreview} ${styles.previewSmall}`}>
              <GiftPreview offer={offer} name={previewName} text={previewText} />
            </div>
          </div>
          <div className={styles.main}>
            <div className={styles.intro}>
              <h2 ref={headingRef} tabIndex={-1} className={styles.viewTitle}>
                Review your gift card
              </h2>
              <p className={styles.lede}>Check the details, then complete the demo payment.</p>
            </div>
            <section className={styles.group} aria-labelledby={`${uid}-holder`}>
              <h3 id={`${uid}-holder`} className={styles.subhead}>
                {isGift ? "Gift delivery" : "Card holder"}
              </h3>
              <dl className={styles.review}>
                {rows.map((row) => (
                  <div key={row.field} className={styles.reviewRow}>
                    <dt>{row.label}</dt>
                    <dd className={styles.reviewValue}>{row.value}</dd>
                    <dd className={styles.reviewEdit}>
                      <button
                        type="button"
                        className={`${ui.btn} ${ui.textBtn}`}
                        aria-label={`Edit ${row.label.toLowerCase()}`}
                        onClick={() => {
                          if (!busy) go("form", () => focusField(row.field));
                        }}
                      >
                        <span className={ui.underline}>Edit</span>
                      </button>
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
            <section className={styles.group} aria-labelledby={`${uid}-payment`}>
              <h3 id={`${uid}-payment`} className={styles.subhead}>
                Payment breakdown
              </h3>
              <OrderSummary
                rows={[
                  { key: "value", label: "Card value", value: offer.value },
                  { key: "saving", label: "Discount savings", value: -saving },
                  { key: "fee", label: "Transaction & gateway fee (incl. tax)", value: 0 },
                  { key: "total", label: "Total payable", value: offer.pay, total: true },
                ]}
              />
            </section>
            <p className={styles.trust}>Demonstration checkout. No payment is taken and no card details are collected.</p>
          </div>
        </div>
      </>
    );
    footer = (
      <div className={`${styles.footerBar} ${styles.footerEnd}`}>
        <button
          type="button"
          className={`${footerBtn} ${ui.secondary}`}
          onClick={() => {
            if (!busy) go("form", focusHeading);
          }}
        >
          Previous
        </button>
        <button type="button" className={`${footerBtn} ${ui.primary} ${styles.footerMain}`} onClick={onPay}>
          Pay {formatCents(offer.pay)}
        </button>
      </div>
    );
  } else if (view === "checkout") {
    title = "Secure checkout";
    content = (
      <div className={styles.narrow}>
        <CheckoutView phase={checkout.phase} />
      </div>
    );
  } else {
    title = "Buy gift card";
    content = (
      <div className={`${styles.stack} ${styles.success} ${styles.narrow}`}>
        <SuccessMark />
        <div className={styles.intro}>
          <p className={ui.label}>Demo · Payment successful</p>
          <h2 ref={headingRef} tabIndex={-1} className={styles.title}>
            Gift card purchased
          </h2>
        </div>
        <p className={styles.description}>
          {isGift
            ? `Your ${offer.name} for ${values.recipientName.trim()} has been confirmed at ${houseName}.`
            : `Your ${formatPrice(offer.value)} ${offer.name} has been confirmed at ${houseName}.`}
        </p>
        <DetailList
          rows={[
            { label: "Issuing house", value: houseName },
            { label: "Redemption", value: "All 4 houses" },
            { label: "Card value", value: <span className={ui.num}>{formatCents(offer.value)}</span> },
            { label: "Total paid", value: <span className={ui.num}>{formatCents(offer.pay)}</span> },
            { label: "Valid until", value: <span className={ui.num}>{receipt?.validUntil}</span> },
            { label: "Reference", value: <span className={ui.num}>{receipt?.reference}</span> },
            { label: "Date", value: <span className={ui.num}>{receipt?.stamp}</span> },
          ]}
        />
        <p className={styles.smallNote}>
          {isGift
            ? "Demonstration only: nothing was charged or sent. In the live product the card is delivered to the recipient by email and SMS, with your message."
            : "Demonstration only: nothing was charged. In the live product the card appears in the guest’s account under Gift cards."}
        </p>
      </div>
    );
    footer = isGift ? (
      <div className={`${styles.footerBar} ${styles.footerEnd}`}>
        <button type="button" className={`${footerBtn} ${ui.secondary}`} onClick={onSendAnother}>
          Send another card
        </button>
        <button type="button" className={`${footerBtn} ${ui.primary} ${styles.footerMain}`} onClick={onClose}>
          Done
        </button>
      </div>
    ) : (
      <div className={`${styles.footerBar} ${styles.footerEnd}`}>
        <button type="button" className={`${footerBtn} ${ui.secondary}`} onClick={onClose}>
          Done
        </button>
        <button type="button" className={`${footerBtn} ${ui.primary} ${styles.footerMain}`} onClick={onBook}>
          Book a visit
        </button>
      </div>
    );
  }

  return (
    <Layer
      open
      onClose={onClose}
      variant="dialog"
      wide
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
