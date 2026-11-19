"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { demoReference, formatCents, formatLongCalendarDate, sgtStamp, validUntil } from "@/lib/dasalon/demo";
import { formatPrice } from "@/lib/dasalon/locale";
import { KIND_LABEL, offerById, type Offer } from "../data/offers";
import { ArrowRight, Check, Close } from "./icons";
import { OfferFace } from "./offer-face";
import { useNeroli } from "./provider";
import styles from "./offer-dialog.module.css";
import ui from "./ui.module.css";

type Receipt = { reference: string; at: string; until: string | null; recipient: string };

function summary(offer: Offer): Array<[string, string]> {
  const validity = offer.months ? `${offer.months} months from purchase` : "No expiry";
  if (offer.kind === "membership") {
    return [["Treatment credit", formatPrice(offer.credit)], ["Valid for", validity], ["You pay", formatPrice(offer.pay)]];
  }
  if (offer.kind === "ritual") {
    const minutes = offer.stops.reduce((sum, stop) => sum + stop.minutes, 0);
    return [["Length", `${minutes} minutes`], ["Worth", formatPrice(offer.worth)], ["Valid for", validity], ["You pay", formatPrice(offer.pay)]];
  }
  return [["Card value", formatPrice(offer.value)], ["Valid for", validity], ["You pay", formatPrice(offer.pay)]];
}

/**
 * The checkout for a membership, ritual or gift card: details, Buy, then a
 * receipt in place. A demonstration only: no payment fields, no network calls
 * and nothing stored. Reloading the page forgets it.
 */
export default function OfferDialog({ offerId, onClose }: { offerId: string; onClose: () => void }) {
  const offer = offerById(offerId);
  const { markPurchased, openBooking } = useNeroli();
  const ref = useRef<HTMLDialogElement>(null);
  const doneRef = useRef<HTMLHeadingElement>(null);
  const uid = useId();
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [recipient, setRecipient] = useState("");

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (!dialog.open) dialog.showModal();
    // A click on the backdrop (the dialog element itself, outside the window) closes it.
    const onBackdrop = (event: MouseEvent) => {
      if (event.target === dialog) dialog.close();
    };
    dialog.addEventListener("click", onBackdrop);
    return () => dialog.removeEventListener("click", onBackdrop);
  }, []);

  useEffect(() => {
    if (receipt) doneRef.current?.focus();
  }, [receipt]);

  if (!offer) return null;

  const buy = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const now = new Date();
    setReceipt({
      reference: demoReference(),
      at: sgtStamp(now),
      until: offer.months ? formatLongCalendarDate(validUntil(offer.months, now)) : null,
      recipient: recipient.trim(),
    });
    markPurchased(offer.id);
  };

  const rows = summary(offer);

  return (
    <dialog
      ref={ref}
      className={styles.dialog}
      aria-labelledby={`${uid}-title`}
      data-lenis-prevent=""
      onClose={onClose}
    >
      <div className={styles.window}>
        <button type="button" className={styles.close} aria-label="Close" onClick={() => ref.current?.close()}>
          <Close />
        </button>

        <div className={styles.stage}>
          <div className={styles.faceWrap} data-done={receipt ? "" : undefined}>
            <OfferFace offer={offer} />
          </div>
        </div>

        {receipt ? (
          <div className={styles.body}>
            <span className={styles.tick} aria-hidden="true">
              <Check size={22} />
            </span>
            <h2 id={`${uid}-title`} ref={doneRef} tabIndex={-1} className={`${ui.h3} ${styles.title}`}>
              {offer.kind === "gift"
                ? receipt.recipient ? `Ready for ${receipt.recipient}.` : "Your gift card is ready."
                : `${offer.name} is yours.`}
            </h2>
            <p className={styles.line}>
              A demonstration purchase: no payment was taken, nothing was sent and nothing has been saved.
            </p>
            <dl className={styles.rows}>
              <div className={styles.rowItem}>
                <dt>Reference</dt>
                <dd>{receipt.reference}</dd>
              </div>
              <div className={styles.rowItem}>
                <dt>Bought</dt>
                <dd>{receipt.at}</dd>
              </div>
              <div className={styles.rowItem}>
                <dt>Valid until</dt>
                <dd>{receipt.until ?? "No expiry"}</dd>
              </div>
              <div className={styles.rowItem}>
                <dt>Paid</dt>
                <dd>{formatCents(offer.pay)}, not charged</dd>
              </div>
            </dl>
            <div className={styles.actions}>
              <button type="button" className={`${ui.btn} ${ui.primary}`} onClick={() => openBooking()}>
                Book a visit
                <ArrowRight />
              </button>
              <button type="button" className={`${ui.btn} ${ui.outline}`} onClick={() => ref.current?.close()}>
                Done
              </button>
            </div>
          </div>
        ) : (
          <form className={styles.body} onSubmit={buy}>
            <p className={styles.kind}>{KIND_LABEL[offer.kind]}</p>
            <h2 id={`${uid}-title`} className={`${ui.h3} ${styles.title}`}>
              {offer.name}
            </h2>
            <p className={styles.line}>{offer.line}</p>
            <ul className={styles.details}>
              {offer.details.map((detail) => (
                <li key={detail}>
                  <Check size={16} />
                  <span>{detail}</span>
                </li>
              ))}
            </ul>
            {offer.kind === "gift" ? (
              <label className={styles.fieldLabel}>
                <span>Who is it for? (optional)</span>
                <input
                  type="text"
                  className={styles.input}
                  value={recipient}
                  maxLength={40}
                  autoComplete="off"
                  placeholder="Their name"
                  onChange={(event) => setRecipient(event.target.value)}
                />
              </label>
            ) : null}
            <dl className={styles.rows}>
              {rows.map(([term, value]) => (
                <div key={term} className={styles.rowItem}>
                  <dt>{term}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
            <div className={styles.actions}>
              <button type="submit" className={`${ui.btn} ${ui.primary} ${ui.block}`}>
                Buy for {formatPrice(offer.pay)}
                <ArrowRight />
              </button>
            </div>
            <p className={styles.small}>Demonstration: no payment is taken and nothing is saved.</p>
          </form>
        )}
      </div>
    </dialog>
  );
}
