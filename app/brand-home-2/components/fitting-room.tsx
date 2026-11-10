"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { demoReference, formatCents, formatLongCalendarDate, sgtStamp, validUntil } from "@/lib/dasalon/demo";
import { formatPrice, SINGAPORE } from "@/lib/dasalon/locale";
import { useClock } from "@/lib/page/use-clock";
import { atelierBySlug, atelierHref } from "../data/ateliers";
import { pieceById, savingOf, type Membership, type Package, type Piece } from "../data/pieces";
import { PieceFace, type CardPersonal } from "./card-face";
import styles from "./fitting-room.module.css";
import { EMPTY_DRAFT, GiftForm, type GiftDraft } from "./gift-form";
import { ArrowRight, Close } from "./icons";
import { Layer } from "./layer";
import { useAtelier } from "./provider";
import ui from "./ui.module.css";
import { RedemptionChips } from "./wardrobe-chips";

/*
 * The checkout: one overlay for every offer. Detail → Buy → a round DEMO
 * stamp, in place. A demonstration only: no payment fields, no network calls,
 * no storage, no logging. Everything typed lives in this component's state and
 * is discarded when it closes; the provider keeps only the "purchased" ids.
 */

type Phase = "detail" | "busy" | "done";

type Receipt = {
  reference: string;
  /** "Mon, 12 Oct 2026, 3:42 pm SGT" */
  stamp: string;
  /** "12 Apr 2027" */
  until: string;
  /** "12 Oct 2026", set on the stamp. */
  stampDate: string;
  draft: GiftDraft;
};

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";
const WRAP_MS = 600;
const WRAP_MS_REDUCED = 300;

const STAMP_DATE = new Intl.DateTimeFormat(SINGAPORE.locale, {
  timeZone: SINGAPORE.timeZone,
  day: "numeric",
  month: "short",
  year: "numeric",
});

/* ---------- Copy ---------- */

const membershipType = (piece: Membership) => (piece.type === "credit" ? "Credit wallet" : "Discount plan");

function typeLineOf(piece: Piece) {
  if (piece.kind === "membership") return `Membership · ${membershipType(piece)}`;
  if (piece.kind === "package") return `Package · ${piece.redemptionLabel}`;
  return `Gift card · ${piece.occasion}`;
}

type StripCell = { label: string; value: string; accent?: boolean };

function stripOf(piece: Piece): StripCell[] {
  const pay = { label: "You pay", value: formatPrice(piece.pay) };
  const saving = savingOf(piece);
  if (piece.kind === "membership" && piece.type === "discount") {
    return [
      pay,
      { label: "Discount budget", value: formatPrice(piece.value) },
      { label: "Discount", value: `${piece.discountPercent ?? 0}%`, accent: true },
    ];
  }
  const worth = piece.kind === "membership" ? "Wallet credit" : piece.kind === "package" ? "Package value" : "Card value";
  return [pay, { label: worth, value: formatPrice(piece.value) }, { label: "You save", value: formatPrice(saving ?? 0), accent: true }];
}

/** "Your Small Gesture card": the card's name without its leading article. */
const bareName = (name: string) => name.replace(/^The\s+/, "");

function purchasedCopy(piece: Piece, until: string, draft: GiftDraft) {
  if (piece.kind === "membership") {
    if (piece.type === "discount") {
      return {
        title: `${piece.name} is active.`,
        body: `${piece.discountPercent ?? 0}% comes off every eligible service from ${formatPrice(piece.minSpend ?? 0)}, at any atelier, until the plan has saved you ${formatPrice(piece.value)} or ${until} arrives.`,
      };
    }
    if (piece.validityMonths >= 12) {
      return {
        title: `${piece.name} is yours.`,
        body: `${formatPrice(piece.value)} in wallet credit for the year, ready at all four ateliers until ${until}. In the live product it is applied when a booking is confirmed.`,
      };
    }
    return {
      title: `${piece.name} is yours.`,
      body: `${formatPrice(piece.value)} in wallet credit, ready at all four ateliers until ${until}. In the live product it sits in the guest's account and is applied when a booking is confirmed.`,
    };
  }

  if (piece.kind === "package") {
    const atelier = atelierBySlug(piece.atelier)?.name ?? "the atelier";
    if (piece.redemption.type === "sessions") {
      return {
        title: `${piece.name}, added.`,
        body: `Book each session at ${atelier} as usual; one session is used each time you confirm.`,
      };
    }
    if (piece.redemption.type === "value") {
      const what = piece.id === "skin-account" ? " on skin treatments" : "";
      return {
        title: `${piece.name} is open.`,
        body: `${formatPrice(piece.value)} to spend${what} at ${atelier} until ${until}, drawn down as you book.`,
      };
    }
    const minutes = piece.redemption.cells * piece.redemption.cellMinutes;
    return {
      title: `${piece.name}, added.`,
      body: `${minutes} minutes of massage at ${atelier}, in one visit or several, until ${until}.`,
    };
  }

  if (draft.mode === "gift") {
    return {
      title: `Wrapped for ${draft.recipient.trim()}.`,
      body: `Your ${bareName(piece.name)} card, worth ${formatPrice(piece.value)}, is ready to send. In the live product it reaches them by email and SMS with your message.`,
    };
  }
  return {
    title: `Your ${bareName(piece.name)} card is ready.`,
    body: `${formatPrice(piece.value)} to spend at any atelier until ${until}.`,
  };
}

function receiptRows(piece: Piece, receipt: Receipt): [string, string][] {
  const item =
    piece.kind === "membership"
      ? `${piece.name} · ${membershipType(piece)}`
      : piece.kind === "package"
        ? `${piece.name} · Package`
        : `${piece.name} · Gift card`;
  const where = piece.kind === "package" ? atelierBySlug(piece.atelier)?.name ?? "The issuing atelier" : "All four ateliers";
  const value =
    piece.kind === "membership" && piece.type === "discount"
      ? `Discount ${piece.discountPercent ?? 0}%`
      : formatCents(piece.value);
  return [
    ["Item", item],
    ["Where", where],
    ["Paid", `${formatCents(piece.pay)} — demonstration, not charged`],
    ["Value", value],
    ["Valid until", receipt.until],
    ["Reference", receipt.reference],
    ["Date", receipt.stamp],
  ];
}

function previewOf(draft: GiftDraft): CardPersonal {
  return draft.mode === "gift"
    ? { name: draft.recipient, message: draft.message, from: draft.from }
    : { name: draft.self, message: "", from: "" };
}

/* ---------- Stage ---------- */

function Stamp({ date }: { date: string }) {
  return (
    <div className={styles.stamp}>
      <span className={styles.stampTop}>Purchased</span>
      <span className={styles.stampDemo}>Demo</span>
      <span className={styles.stampDate}>{date}</span>
    </div>
  );
}

function Stage({ piece, preview, stampDate }: { piece: Piece; preview: CardPersonal | null; stampDate: string | null }) {
  const tone = piece.kind === "membership" ? styles.stageNude : piece.kind === "package" ? styles.stageBlush : styles.stageNoir;
  return (
    <div className={`${styles.stage} ${tone}`} aria-hidden="true">
      <div className={styles.present}>
        <PieceFace
          piece={piece}
          personal={piece.kind === "gift" ? preview : null}
          sizes="(min-width: 760px) 440px, 280px"
          className={styles.stageCard}
        />
      </div>
      {stampDate ? <Stamp date={stampDate} /> : null}
    </div>
  );
}

/* ---------- Panel parts ---------- */

function PriceStrip({ cells }: { cells: StripCell[] }) {
  return (
    <dl className={styles.strip}>
      {cells.map((cell) => (
        <div key={cell.label} className={`${styles.stripCell} ${cell.accent ? styles.stripAccent : ""}`}>
          <dt>{cell.label}</dt>
          <dd>{cell.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function PackageExtras({ piece, onLeave }: { piece: Package; onLeave: () => void }) {
  const atelier = atelierBySlug(piece.atelier);
  return (
    <>
      <div className={styles.block}>
        <h3 className={styles.subhead}>Redemption</h3>
        <RedemptionChips redemption={piece.redemption} size="lg" srLabel={`Redeemed as ${piece.redemption.caption}`} />
      </div>
      {atelier ? (
        <div className={`${styles.block} ${styles.usedAt}`}>
          <span className={styles.usedSwatch} aria-hidden="true">
            <Image src={atelier.photo} alt="" sizes="48px" quality={60} className={styles.fillImg} />
          </span>
          <div className={styles.usedText}>
            <p className={styles.usedTitle}>Used at {atelier.name} only</p>
            <p className={styles.usedAddress}>{atelier.address}</p>
            <Link href={atelierHref(atelier.slug)} className={`${ui.btn} ${ui.textBtn}`} onClick={onLeave}>
              <span className={ui.underline}>View the atelier</span>
              <ArrowRight />
            </Link>
          </div>
        </div>
      ) : null}
      <div className={styles.block}>
        <h3 className={styles.subhead}>Included</h3>
        <ul className={styles.included}>
          <li>{piece.includes}</li>
        </ul>
      </div>
    </>
  );
}

/* ---------- The room ---------- */

export default function FittingRoom({ pieceId, onClose }: { pieceId: string; onClose: () => void }) {
  const piece = pieceById(pieceId);
  const { openBooking, prefetchBooking, markPurchased } = useAtelier();
  const now = useClock();
  const uid = useId();
  const [open, setOpen] = useState(true);
  const [phase, setPhase] = useState<Phase>("detail");
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [draft, setDraft] = useState<GiftDraft>(EMPTY_DRAFT);
  const [formKey, setFormKey] = useState(0);
  const timer = useRef(0);
  const focusTitle = useRef(false);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const roomRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // An unknown id has nothing to show: hand straight back to the provider.
  useEffect(() => {
    if (!piece) onClose();
  }, [piece, onClose]);

  // A purchase still wrapping when the room closes is abandoned, never completed.
  useEffect(() => {
    const pending = timer;
    return () => window.clearTimeout(pending.current);
  }, []);

  // After the state changes in place (purchased, or "Make another card"), start at the top with the new heading.
  useEffect(() => {
    if (!focusTitle.current) return;
    focusTitle.current = false;
    roomRef.current?.scrollTo({ top: 0 });
    scrollRef.current?.scrollTo({ top: 0 });
    titleRef.current?.focus({ preventScroll: true });
  }, [phase, formKey]);

  if (!piece) return null;

  const isGift = piece.kind === "gift";
  const titleId = `${uid}-title`;
  const bodyId = `${uid}-body`;
  const formId = `${uid}-form`;
  // The clock is read after mount only, so the date is never computed from render-time Date().
  const until = now ? formatLongCalendarDate(validUntil(piece.validityMonths, now)) : null;
  const done = phase === "done" && receipt !== null;
  const preview = isGift ? previewOf(done ? receipt.draft : draft) : null;

  const close = () => {
    window.clearTimeout(timer.current);
    timer.current = 0;
    setOpen(false);
  };

  const buy = () => {
    if (phase !== "detail") return;
    const at = new Date();
    setReceipt({
      reference: demoReference(),
      stamp: sgtStamp(at),
      until: formatLongCalendarDate(validUntil(piece.validityMonths, at)),
      stampDate: STAMP_DATE.format(at),
      draft,
    });
    setPhase("busy");
    const wait = window.matchMedia(REDUCED_MOTION).matches ? WRAP_MS_REDUCED : WRAP_MS;
    timer.current = window.setTimeout(() => {
      timer.current = 0;
      focusTitle.current = true;
      setPhase("done");
      markPurchased(piece.id);
    }, wait);
  };

  const makeAnother = () => {
    focusTitle.current = true;
    setDraft(EMPTY_DRAFT);
    setFormKey((key) => key + 1);
    setReceipt(null);
    setPhase("detail");
  };

  const bookButton = (label: string, onClick: () => void) => (
    <button
      type="button"
      className={`${ui.btn} ${ui.primary} ${ui.lg} ${styles.doneButton}`}
      onClick={onClick}
      onPointerEnter={prefetchBooking}
      onFocus={prefetchBooking}
      onTouchStart={prefetchBooking}
    >
      {label}
      <ArrowRight />
    </button>
  );

  const backButton = (
    <button type="button" className={`${ui.btn} ${ui.secondary} ${ui.lg} ${styles.doneButton}`} onClick={close}>
      Done
    </button>
  );

  let doneActions = null;
  if (done) {
    if (piece.kind === "membership") {
      doneActions = (
        <>
          {bookButton(piece.type === "credit" ? "Book with your credit" : "Book an appointment", () => openBooking())}
          {backButton}
        </>
      );
    } else if (piece.kind === "package") {
      doneActions = (
        <>
          {bookButton("Book your first session", () => openBooking({ slug: piece.atelier, serviceName: piece.firstService }))}
          {backButton}
        </>
      );
    } else if (receipt.draft.mode === "gift") {
      doneActions = (
        <>
          <button type="button" className={`${ui.btn} ${ui.primary} ${ui.lg} ${styles.doneButton}`} onClick={close}>
            Done
          </button>
          <button type="button" className={`${ui.btn} ${ui.secondary} ${ui.lg} ${styles.doneButton}`} onClick={makeAnother}>
            Make another card
          </button>
        </>
      );
    } else {
      doneActions = (
        <>
          {bookButton("Book an appointment", () => openBooking())}
          {backButton}
        </>
      );
    }
  }

  const copy = done ? purchasedCopy(piece, receipt.until, receipt.draft) : null;

  return (
    <Layer open={open} onClose={close} onExited={onClose} variant="fitting" labelledBy={titleId} describedBy={bodyId}>
      <div ref={roomRef} className={styles.room} data-kind={piece.kind}>
        <Stage piece={piece} preview={preview} stampDate={done ? receipt.stampDate : null} />

        <div className={`${ui.chalk} ${styles.side}`}>
          <div className={styles.bar}>
            <p className={styles.barLabel}>{piece.kind === "gift" ? "Gift card" : piece.kind === "package" ? "Package" : "Membership"}</p>
            <span className={styles.demo}>Demo</span>
            <button type="button" className={`${ui.iconBtn} ${styles.close}`} onClick={close} aria-label="Close">
              <Close size={20} />
            </button>
          </div>

          <div ref={scrollRef} className={styles.scroll}>
            <div className={styles.content}>
              {done && copy ? (
                <>
                  <p className={styles.typeLine}>Demonstration · Purchase complete</p>
                  <h2 id={titleId} ref={titleRef} tabIndex={-1} data-layer-focus="" className={`${ui.h2s} ${styles.title}`}>
                    {copy.title}
                  </h2>
                  <p id={bodyId} className={styles.tagline}>{copy.body}</p>
                  <dl className={styles.receipt}>
                    {receiptRows(piece, receipt).map(([label, value]) => (
                      <div key={label} className={styles.receiptRow}>
                        <dt>{label}</dt>
                        <dd>{value}</dd>
                      </div>
                    ))}
                  </dl>
                  <p className={styles.note}>
                    Demonstration only: no payment was taken, nothing was sent and nothing has been saved.
                  </p>
                </>
              ) : (
                <>
                  <p className={styles.typeLine}>{typeLineOf(piece)}</p>
                  <h2 id={titleId} ref={titleRef} tabIndex={-1} data-layer-focus="" className={`${ui.h2s} ${styles.title}`}>
                    {piece.name}
                  </h2>
                  <p id={bodyId} className={styles.tagline}>{piece.tagline}</p>
                  <PriceStrip cells={stripOf(piece)} />
                  {piece.kind === "package" && piece.perUnit ? <p className={styles.perUnit}>{piece.perUnit}</p> : null}
                  {piece.kind === "package" ? <PackageExtras piece={piece} onLeave={close} /> : null}
                  {isGift ? (
                    <GiftForm key={formKey} id={formId} draft={draft} onChange={setDraft} onValid={buy} busy={phase !== "detail"} />
                  ) : null}
                  <div className={styles.block}>
                    <ul className={styles.chips} aria-label="At a glance">
                      {piece.chips.map((chip) => (
                        <li key={chip}>{chip}</li>
                      ))}
                    </ul>
                  </div>
                  <p className={styles.description}>{piece.description}</p>
                  <div className={styles.block}>
                    <h3 className={styles.subhead}>Details</h3>
                    <dl className={styles.details}>
                      {piece.details.map((row) => (
                        <div key={row.label} className={styles.detailRow}>
                          <dt>{row.label}</dt>
                          <dd>{row.value}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                  {until ? <p className={styles.validLine}>If bought today, valid until {until}.</p> : null}
                  <p className={styles.note}>Demonstration: no payment is taken and nothing is saved.</p>
                </>
              )}
            </div>
          </div>

          {done ? (
            <div className={`${styles.footer} ${styles.footerDone}`}>{doneActions}</div>
          ) : (
            <div className={styles.footer}>
              <div className={styles.sum}>
                <p className={styles.sumLine}>
                  {formatPrice(piece.pay)} · {piece.name}
                </p>
                <p className={styles.sumNote}>Demonstration checkout</p>
              </div>
              <button
                type={isGift ? "submit" : "button"}
                form={isGift ? formId : undefined}
                onClick={isGift ? undefined : buy}
                className={`${ui.btn} ${ui.primary} ${ui.lg} ${styles.buy}`}
                aria-busy={phase === "busy" || undefined}
              >
                {phase === "busy" ? "Wrapping…" : `Buy · ${formatPrice(piece.pay)}`}
              </button>
            </div>
          )}
        </div>

        <p className={ui.srOnly} role="status">
          {done ? `Purchase complete — demonstration. Reference ${receipt.reference}.` : ""}
        </p>
      </div>
    </Layer>
  );
}
