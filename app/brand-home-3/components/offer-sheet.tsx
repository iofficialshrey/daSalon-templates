"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { demoReference, formatCents, formatLongCalendarDate, sgtStamp, validUntil } from "@/lib/dasalon/demo";
import { formatPrice } from "@/lib/dasalon/locale";
import { useClock } from "@/lib/page/use-clock";
import { GIFT_DELIVERY, GIFT_DESCRIPTION, giftById, type GiftCard, type GiftDraft } from "../data/gifts";
import {
  extraCredit,
  includeText,
  membershipById,
  packageById,
  saving,
  savePercent,
  type Membership,
  type OfferRequest,
  type PackageOffer,
  type Receipt,
} from "../data/offers";
import { placeBySlug } from "../data/places";
import { ArtPicture } from "./art-picture";
import { BookButton } from "./book-button";
import { CardFace } from "./card-face";
import { useCoversText } from "./gift-covers";
import { EMPTY_DRAFT, GiftForm } from "./gift-form";
import { ArrowUpRight, Close, Ring } from "./icons";
import { Layer } from "./layer";
import { useSerein } from "./provider";
import styles from "./offer-sheet.module.css";
import ui from "./ui.module.css";

/*
 * The offer sheet (spec §7.3): a square sheet rising from the bottom edge for a
 * membership, a package or a gift card. Details → Buy → two quiet processing
 * phases → a demonstration receipt laid out as a slow-hours timeline.
 * A demonstration only: no card fields, no network, no storage, no logging. The
 * purchase lives in the provider's memory; a reload clears it.
 */

type Item =
  | { kind: "membership"; offer: Membership }
  | { kind: "package"; offer: PackageOffer }
  | { kind: "gift"; offer: GiftCard };

type View = "details" | "processing" | "done";
type Row = { term: string; value: ReactNode; pay?: boolean };

const PHASE_MS = 600;
const PHASE_REDUCED_MS = 150;
const ALL_PLACES =
  "All four places: Serenity Spa House and The Grooming Room (Clementi), Lumiere Aesthetics (Changi), Bride & Groom (Sentosa)";

function resolve(request: OfferRequest): Item | null {
  if (request.kind === "membership") {
    const offer = membershipById(request.id);
    return offer ? { kind: "membership", offer } : null;
  }
  if (request.kind === "package") {
    const offer = packageById(request.id);
    return offer ? { kind: "package", offer } : null;
  }
  const offer = giftById(request.id);
  return offer ? { kind: "gift", offer } : null;
}

/* ---------- Copy, computed from data/offers.ts and data/gifts.ts (never typed figures) ---------- */

function kindLabel(item: Item) {
  if (item.kind === "membership") return item.offer.kind === "credit" ? "Membership · credit" : "Membership · plan";
  if (item.kind === "package") return `Package · ${placeBySlug(item.offer.place).name}`;
  return "Gift card";
}

function leadOf(item: Item) {
  if (item.kind === "membership") return item.offer.tagline;
  if (item.kind === "package") return item.offer.line;
  return item.offer.occasion;
}

/** Weekly Quiet pays for itself once 20% of your visits covers the plan: S$60 ÷ 0.20 = S$300. */
function breakEven(membership: Membership) {
  return Math.round((membership.pay * 100) / (membership.discountPercent ?? 100));
}

function packageWorth(offer: PackageOffer) {
  return `${formatPrice(offer.value)}${offer.valueMax ? `\u2060–\u2060${formatPrice(offer.valueMax)}` : ""}`;
}

function equation(item: Item): { rows: Row[]; formula: string } {
  if (item.kind === "membership") {
    const m = item.offer;
    if (m.kind === "credit") {
      return {
        rows: [
          { term: "You pay", value: formatPrice(m.pay), pay: true },
          { term: "You get", value: `${formatPrice(m.credit ?? 0)} to spend` },
          { term: "Extra credit", value: formatPrice(extraCredit(m) ?? 0) },
        ],
        formula: `${m.months} months, at all four places.`,
      };
    }
    return {
      rows: [
        { term: "You pay", value: formatPrice(m.pay), pay: true },
        { term: "Discount", value: `${m.discountPercent}% off visits from ${formatPrice(m.minSpend ?? 0)}` },
        { term: "Saves you up to", value: formatPrice(m.discountBudget ?? 0) },
      ],
      formula: `Pays for itself after ${formatPrice(breakEven(m))} of visits.`,
    };
  }
  if (item.kind === "package") {
    const p = item.offer;
    return {
      rows: [
        { term: "Worth", value: packageWorth(p) },
        { term: "You pay", value: formatPrice(p.pay), pay: true },
        { term: "You save", value: `${p.valueIsMinimum ? "at least " : ""}${formatPrice(saving(p) ?? 0)} (${savePercent(p) ?? 0}%)` },
      ],
      formula: p.equation,
    };
  }
  const g = item.offer;
  const saved = saving(g);
  const rows: Row[] = [
    { term: "Card value", value: formatPrice(g.value) },
    { term: "You pay", value: formatPrice(g.pay), pay: true },
  ];
  if (saved != null) rows.push({ term: "You save", value: `${formatPrice(saved)} (${savePercent(g)}%)` });
  return { rows, formula: "Valid for twelve months at all four places." };
}

function placesLine(item: Item) {
  if (item.kind !== "package") return ALL_PLACES;
  const place = placeBySlug(item.offer.place);
  return `${place.name}, ${place.address}`;
}

function bookingLine(item: Item) {
  if (item.kind === "membership") {
    return item.offer.kind === "credit"
      ? "Book as usual; your balance is used when you pay, after each visit."
      : `Book as usual; ${item.offer.discountPercent}% comes off when you pay.`;
  }
  if (item.kind === "package") {
    return item.offer.redemption === "TIME"
      ? "Book a Jacuzzi, Sauna or Steam session, 30 minutes at a time."
      : "Book each session when you're ready.";
  }
  return null;
}

/** "A Quiet Hour card", "An After Rain card", "The Open Door card". */
function cardPhrase(name: string) {
  if (/^(a|an|the) /i.test(name)) return `${name} card`;
  return `${/^[aeiou]/i.test(name) ? "An" : "A"} ${name} card`;
}

/** The gift's addressee: the recipient as a gift, the name on the card for yourself. */
function addressee(draft: GiftDraft | null) {
  if (!draft) return "";
  return (draft.mode === "gift" ? draft.recipient : draft.self).trim();
}

function receiptCopy(item: Item, receipt: Receipt) {
  const { until } = receipt;
  if (item.kind === "membership") {
    const m = item.offer;
    if (m.id === "weekly-quiet") {
      return {
        title: "Weekly Quiet is active.",
        body: `${m.discountPercent}% comes off every visit of ${formatPrice(m.minSpend ?? 0)} or more until you've saved ${formatPrice(m.discountBudget ?? 0)} or until ${until}, whichever comes first.`,
      };
    }
    return {
      title: m.id === "restored-year" ? "Welcome to the Restored Year." : "Your rhythm begins.",
      body: `${formatCents(m.credit ?? 0)} in wallet credit, ready at any of the four places until ${until}.`,
    };
  }
  if (item.kind === "package") {
    const p = item.offer;
    return {
      title: `${p.name} ${p.id === "water-hours" ? "are" : "is"} yours.`,
      body: `${p.receiptLine} at ${placeBySlug(p.place).name}, valid until ${until}.`,
    };
  }
  const g = item.offer;
  const to = receipt.draft?.mode === "gift" ? receipt.draft.recipient.trim() : "";
  return {
    title: "Your gift is ready.",
    body: `${cardPhrase(g.name)} worth ${formatCents(g.value)}${to ? `, for ${to}` : ""}, valid at all four places until ${until}. In the live product it is sent by email or SMS with your message; this demonstration sends nothing.`,
  };
}

function receiptRows(item: Item, receipt: Receipt): Row[] {
  const rows: Row[] = [
    { term: "Reference", value: receipt.reference },
    { term: "Bought", value: receipt.stamp },
    { term: "Paid", value: `${formatCents(receipt.pay)} (demonstration, no payment taken)` },
  ];
  if (item.kind === "gift") {
    const draft = receipt.draft;
    const to = addressee(draft);
    if (to) rows.push({ term: "For", value: to });
    if (draft?.mode === "gift" && draft.from.trim()) rows.push({ term: "From", value: draft.from.trim() });
    if (draft?.mode === "gift" && draft.message.trim()) rows.push({ term: "Message", value: draft.message.trim() });
    rows.push({ term: "Card value", value: formatCents(item.offer.value) });
  } else if (item.kind === "membership") {
    const m = item.offer;
    rows.push(
      m.kind === "credit"
        ? { term: "Credit", value: `${formatCents(m.credit ?? 0)} in wallet credit` }
        : {
            term: "Plan",
            value: `${m.discountPercent}% off visits from ${formatPrice(m.minSpend ?? 0)} · saves you up to ${formatPrice(m.discountBudget ?? 0)}`,
          },
    );
  } else {
    rows.push({ term: "Includes", value: <IncludeList offer={item.offer} /> });
  }
  rows.push({ term: "Valid until", value: receipt.until }, { term: "Use at", value: placesLine(item) });
  return rows;
}

/** A trimmed copy of the draft for the receipt: only the chosen mode's fields. */
function finalDraft(draft: GiftDraft): GiftDraft {
  return draft.mode === "gift"
    ? { mode: "gift", recipient: draft.recipient.trim(), message: draft.message.trim(), from: draft.from.trim(), self: "" }
    : { mode: "self", recipient: "", message: "", from: "", self: draft.self.trim() };
}

/* ---------- Pieces ---------- */

function IncludeList({ offer }: { offer: PackageOffer }) {
  return (
    <ul className={styles.includes}>
      {offer.includes.map((line) => (
        <li key={line.service}>{includeText(line)}</li>
      ))}
    </ul>
  );
}

/** The mini slow-hours timeline: a hairline at x = 6px with pool dots. */
function Timeline({ rows }: { rows: readonly Row[] }) {
  return (
    <dl className={styles.timeline}>
      {rows.map((row) => (
        <div key={row.term} className={styles.moment}>
          <dt className={ui.label}>{row.term}</dt>
          <dd className={`${ui.ui} ${styles.momentValue}`}>{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function Equation({ item }: { item: Item }) {
  const { rows, formula } = equation(item);
  return (
    <div className={styles.equationBlock}>
      <dl className={styles.equation}>
        {rows.map((row) => (
          <div key={row.term} className={styles.equationRow}>
            <dt className={`${ui.small} ${ui.muted}`}>{row.term}</dt>
            <dd className={row.pay ? ui.figure : `${ui.ui} ${ui.num} ${styles.equationValue}`}>{row.value}</dd>
          </div>
        ))}
      </dl>
      <p className={`${ui.small} ${ui.muted}`}>{formula}</p>
    </div>
  );
}

/** "How it works", and for Weekly Quiet the worked figures: Treatment · Usual · With Weekly Quiet. */
function HowItWorks({ membership }: { membership: Membership }) {
  const { howItWorks, examples: worked } = membership;
  return (
    <div className={styles.section}>
      <h3 className={ui.label}>How it works</h3>
      <ol className={styles.steps}>
        {howItWorks.map((step, index) => (
          <li key={step} className={ui.bodyS}>
            <span className={`${ui.label} ${ui.num} ${styles.stepNumber}`} aria-hidden="true">
              {String(index + 1).padStart(2, "0")}
            </span>
            {step}
          </li>
        ))}
      </ol>
      {worked ? (
        <table className={`${ui.ui} ${ui.num} ${styles.worked}`}>
          <caption className={ui.label}>For example</caption>
          <thead>
            <tr>
              <th scope="col">Treatment</th>
              <th scope="col">Usual</th>
              <th scope="col">With Weekly Quiet</th>
            </tr>
          </thead>
          <tbody>
            {worked.map((row) => (
              <tr key={row.service}>
                <th scope="row">{row.service}</th>
                <td>{formatPrice(row.usual)}</td>
                <td>{formatPrice(row.pay)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
    </div>
  );
}

/* ---------- The sheet ---------- */

export default function OfferSheet({
  request,
  onClose,
  returnTo,
}: {
  request: OfferRequest;
  onClose: () => void;
  returnTo: HTMLElement | null;
}) {
  const item = resolve(request);
  const { purchases, receipts, recordPurchase, layerHost } = useSerein();
  const clock = useClock();
  const uid = useId();
  const [open, setOpen] = useState(true);
  // "See your receipt" opens straight on the done view, from memory.
  const [receipt, setReceipt] = useState<Receipt | null>(() =>
    request.view === "receipt" ? receipts.get(request.id) ?? null : null,
  );
  const [view, setView] = useState<View>(() =>
    request.view === "receipt" && receipts.has(request.id) ? "done" : "details",
  );
  const [phase, setPhase] = useState<0 | 1>(0);
  const [draft, setDraft] = useState<GiftDraft>(EMPTY_DRAFT);
  const [announcement, setAnnouncement] = useState("");
  const timers = useRef<number[]>([]);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const headRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);
  const buyRef = useRef<HTMLButtonElement>(null);
  const refocus = useRef(false);
  const known = item !== null;
  const gift = item?.kind === "gift" ? item.offer : null;
  const covers = useCoversText(gift);

  // An unknown offer has nothing to show: hand straight back to the provider.
  useEffect(() => {
    if (!known) onClose();
  }, [known, onClose]);

  // A purchase still processing when the sheet goes away is abandoned, never completed.
  useEffect(() => {
    const pending = timers;
    return () => pending.current.forEach((timer) => window.clearTimeout(timer));
  }, []);

  // The sticky head and footer cover the scroller's edges, and the footer grows (the "bought" note,
  // the safe area). The panel's scroll-padding follows their heights, so a focused field never
  // scrolls in underneath either bar (WCAG 2.4.11; offer-sheet.module.css).
  useEffect(() => {
    const head = headRef.current;
    const footer = footerRef.current;
    // The panel (Layer's dialog) is the scroller.
    const panel = footer?.closest<HTMLElement>("[role='dialog']");
    if (!head || !footer || !panel) return;
    const measure = () => {
      panel.style.setProperty("--sheet-head", `${head.offsetHeight}px`);
      panel.style.setProperty("--sheet-foot", `${footer.offsetHeight}px`);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(head);
    observer.observe(footer);
    return () => observer.disconnect();
  }, [layerHost]);

  // A new view (the receipt, or back to details): start at the top, with focus on its heading.
  useEffect(() => {
    if (!refocus.current || view === "processing") return;
    refocus.current = false;
    const title = titleRef.current;
    title?.closest<HTMLElement>("[role='dialog']")?.scrollTo({ top: 0 });
    title?.focus({ preventScroll: true });
  }, [view]);

  if (!item) return null;

  const { offer } = item;
  const titleId = `${uid}-title`;
  const formId = `${uid}-gift`;
  const busy = view === "processing";
  const done = view === "done" && receipt !== null;
  const months = offer.months;
  const bought = purchases.get(offer.id) ?? 0;
  const copy = done ? receiptCopy(item, receipt) : null;
  const accent = item.kind === "membership" ? styles.membership : item.kind === "package" ? styles.package : styles.gift;

  const clearTimers = () => {
    timers.current.forEach((timer) => window.clearTimeout(timer));
    timers.current = [];
  };

  // Close, Escape and (when idle) the backdrop. Mid-processing, nothing is bought and nothing is recorded.
  const close = () => {
    clearTimers();
    setOpen(false);
  };

  const buy = () => {
    if (view !== "details") return;
    // Everything on the receipt is computed here, in the handler, never during render.
    const at = new Date();
    const next: Receipt = {
      reference: demoReference(),
      stamp: sgtStamp(at),
      until: formatLongCalendarDate(validUntil(months, at)),
      pay: offer.pay,
      draft: item.kind === "gift" ? finalDraft(draft) : null,
    };
    const step = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? PHASE_REDUCED_MS : PHASE_MS;
    // Enter in a gift field submits; the body goes inert next, so hand focus to Buy, which keeps it (§7.3).
    if (bodyRef.current?.contains(document.activeElement)) buyRef.current?.focus({ preventScroll: true });
    clearTimers();
    setPhase(0);
    setView("processing");
    setAnnouncement("Holding your place…");
    timers.current = [
      window.setTimeout(() => {
        setPhase(1);
        setAnnouncement("Writing your card…");
      }, step),
      window.setTimeout(() => {
        timers.current = [];
        recordPurchase(offer.id, next);
        setReceipt(next);
        refocus.current = true;
        setView("done");
        setAnnouncement(`Purchase complete, demonstration. Reference ${next.reference}.`);
      }, step * 2),
    ];
  };

  const makeAnother = () => {
    setDraft(EMPTY_DRAFT);
    setAnnouncement("");
    refocus.current = true;
    setView("details");
  };

  const valid = clock
    ? `If bought today, until ${formatLongCalendarDate(validUntil(months, clock))}`
    : `${months} months from purchase`;
  const booking = bookingLine(item);
  const facts: Row[] = [
    { term: "Valid", value: valid },
    { term: "Use at", value: placesLine(item) },
    ...(booking ? [{ term: "Booking", value: booking }] : []),
    ...(item.kind === "gift" ? [{ term: "Delivery", value: GIFT_DELIVERY }] : []),
  ];

  const art = (() => {
    if (item.kind === "package") {
      return <ArtPicture art={item.offer.art} className={styles.band} imgClassName={styles.bandImg} />;
    }
    if (item.kind === "membership") {
      const m = item.offer;
      return (
        <CardFace
          art={m.art}
          name={m.name}
          value={m.credit != null ? formatPrice(m.credit) : `${m.discountPercent}% off`}
          breathing={busy}
          className={styles.face}
        />
      );
    }
    const to = addressee(draft);
    return (
      <CardFace
        art={item.offer.art}
        name={item.offer.name}
        value={formatPrice(item.offer.value)}
        forLine={to ? (draft.mode === "gift" ? `For ${to}` : to) : undefined}
        breathing={busy}
        className={styles.face}
      />
    );
  })();

  const doneActions = (() => {
    const doneButton = (
      <button type="button" className={`${ui.btn} ${ui.lg} ${ui.secondary} ${styles.action}`} onClick={close}>
        Done
      </button>
    );
    const primary = `${ui.btn} ${ui.lg} ${ui.primary} ${styles.action}`;
    if (item.kind === "gift") {
      return (
        <>
          <button type="button" className={primary} onClick={close}>
            Done
          </button>
          <button type="button" className={`${ui.text} ${styles.another}`} onClick={makeAnother}>
            Make another card
          </button>
        </>
      );
    }
    if (item.kind === "package") {
      const place = placeBySlug(item.offer.place);
      return (
        <>
          <BookButton
            slug={item.offer.place}
            serviceName={item.offer.firstService}
            srSuffix={`: ${item.offer.firstService} at ${place.name}`}
            className={primary}
            onBeforeOpen={clearTimers}
          >
            Book your first session
          </BookButton>
          {doneButton}
        </>
      );
    }
    return (
      <>
        <BookButton autoPlaceSuffix className={primary} onBeforeOpen={clearTimers}>
          {item.offer.kind === "credit" ? "Book a ritual" : "Book a short ritual"}
        </BookButton>
        {doneButton}
      </>
    );
  })();

  return (
    <Layer
      open={open}
      onClose={close}
      onExited={onClose}
      variant="sheet"
      labelledBy={titleId}
      returnTo={returnTo}
      className={`${styles.sheet} ${accent}`}
      closeOnBackdrop={!busy}
    >
      <div ref={headRef} className={styles.head}>
        <p className={ui.label}>{kindLabel(item)}</p>
        <button type="button" className={ui.iconBtn} aria-label="Close" onClick={close}>
          <Close />
        </button>
      </div>

      {/* One polite region for the whole flow: each processing phase, then the reference. */}
      <p className={ui.srOnly} role="status">
        {announcement}
      </p>

      {done && copy ? (
        <div key="done" className={styles.body}>
          <span className={styles.ripple} aria-hidden="true">
            <span className={styles.rippleMark}>S</span>
            <i />
            <i />
            <i />
          </span>
          <div className={styles.titleBlock}>
            <p className={ui.label}>Demonstration receipt</p>
            <h2 id={titleId} ref={titleRef} tabIndex={-1} data-layer-focus="" className={ui.displayM}>
              {copy.title}
            </h2>
            <p className={ui.body}>{copy.body}</p>
          </div>
          <Timeline rows={receiptRows(item, receipt)} />
          <p className={`${ui.small} ${ui.muted}`}>
            Demonstration only: no payment was taken, nothing was sent and nothing has been saved.
          </p>
        </div>
      ) : (
        <div key="details" ref={bodyRef} className={styles.body} inert={busy}>
          {art}
          <div className={styles.titleBlock}>
            <h2 id={titleId} ref={titleRef} tabIndex={-1} data-layer-focus="" className={ui.displayM}>
              {offer.name}
            </h2>
            <p className={ui.lead}>{leadOf(item)}</p>
            {item.kind === "membership" ? <p className={`${ui.bodyS} ${ui.muted}`}>{item.offer.description}</p> : null}
          </div>

          <Equation item={item} />

          {item.kind === "membership" ? <HowItWorks membership={item.offer} /> : null}

          {item.kind === "package" ? (
            <div className={styles.section}>
              <h3 className={ui.label}>What&apos;s included</h3>
              <div className={ui.ui}>
                <IncludeList offer={item.offer} />
              </div>
              {item.offer.time ? (
                <p className={ui.small}>Any mix, 30 minutes at a time, up to three hours.</p>
              ) : null}
              <p className={ui.small}>{item.offer.perUnit}</p>
              {item.offer.note ? <p className={`${ui.small} ${ui.muted}`}>{item.offer.note}</p> : null}
            </div>
          ) : null}

          {gift ? (
            <div className={styles.section}>
              <p className={ui.bodyS}>{GIFT_DESCRIPTION}</p>
              {covers ? <p className={ui.small}>{covers}</p> : null}
              <GiftForm formId={formId} draft={draft} onChange={setDraft} onSubmit={buy} />
            </div>
          ) : null}

          <Timeline rows={facts} />
        </div>
      )}

      <div ref={footerRef} className={styles.footer}>
        {done ? (
          <div className={styles.actions}>{doneActions}</div>
        ) : (
          <>
            {bought > 0 ? (
              <p className={`${ui.small} ${ui.muted}`}>
                You bought this a moment ago (demonstration). Buying again makes another sample receipt.
              </p>
            ) : null}
            <div className={styles.checkout}>
              <div className={styles.sum}>
                <p className={ui.figure}>{formatPrice(offer.pay)}</p>
                <p className={`${ui.small} ${ui.muted}`}>{offer.name} · demonstration checkout</p>
              </div>
              <div className={styles.buyColumn}>
                <button
                  ref={buyRef}
                  type={gift ? "submit" : "button"}
                  form={gift ? formId : undefined}
                  className={`${ui.btn} ${ui.lg} ${ui.primary} ${styles.buy}`}
                  aria-busy={busy || undefined}
                  data-waiting={busy ? "" : undefined}
                  onClick={gift ? undefined : buy}
                >
                  <span>{busy ? (phase === 0 ? "Holding your place…" : "Writing your card…") : `Buy · ${formatPrice(offer.pay)}`}</span>
                  <ArrowUpRight className={ui.iconIdle} />
                  <Ring className={ui.iconBusy} />
                </button>
                <p className={`${ui.small} ${ui.muted}`}>No payment is taken. Nothing is stored.</p>
              </div>
            </div>
          </>
        )}
      </div>
    </Layer>
  );
}
