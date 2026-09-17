"use client";

import { useEffect, useRef, useState } from "react";
import { discountBadge, formatSgd } from "./format";
import type {
  BrandCommerceCopy,
  CommerceTheme,
  GiftOffer,
  MembershipOffer,
  OfferDetail,
  OfferKind,
  PackageOffer,
} from "./types";
import "./brand-commerce.css";

type PlasticItem = {
  id: string;
  name: string;
  tone: string;
  validityLabel: string;
  savePercent: number | null;
};

function Arrow({ direction = "right" }: { direction?: "left" | "right" }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <g transform={direction === "left" ? "rotate(180 12 12)" : undefined}>
        <path d="M5 12h13M14 7l5 5-5 5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  );
}

function CommerceIntro({
  eyebrow,
  title,
  copy,
}: {
  eyebrow: string;
  title: string;
  copy: string;
}) {
  return (
    <header className="bc-commerce-intro">
      <span>{eyebrow}</span>
      <h2>{title}</h2>
      <p>{copy}</p>
    </header>
  );
}

function offerKindLabel(kind: OfferKind) {
  if (kind === "membership") return "Membership";
  if (kind === "package") return "Package";
  return "Gift card";
}

function PlasticCardDeck<T extends PlasticItem>({
  items,
  kindLabel,
  valueLabel,
  getValue,
  ariaLabel,
  swipeHint,
  brandName,
  brandMark,
  onViewDetails,
}: {
  items: readonly T[];
  kindLabel: string;
  valueLabel: string;
  getValue: (item: T) => number;
  ariaLabel: string;
  swipeHint: string;
  brandName: string;
  brandMark: string;
  onViewDetails: (item: T, badge: string | null) => void;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  function getCards() {
    const track = trackRef.current;
    if (!track) return [] as HTMLElement[];
    return [...track.querySelectorAll<HTMLElement>("[data-plastic-slide]")];
  }

  function nearestIndex() {
    const track = trackRef.current;
    if (!track) return 0;
    const cards = getCards();
    if (!cards.length) return 0;
    const trackRect = track.getBoundingClientRect();
    const mid = trackRect.left + trackRect.width / 2;
    let nearest = 0;
    let best = Number.POSITIVE_INFINITY;
    cards.forEach((card, index) => {
      const rect = card.getBoundingClientRect();
      const center = rect.left + rect.width / 2;
      const distance = Math.abs(center - mid);
      if (distance < best) {
        best = distance;
        nearest = index;
      }
    });
    return nearest;
  }

  function scrollToIndex(index: number, behavior: ScrollBehavior = "smooth") {
    const track = trackRef.current;
    if (!track) return;
    const next = Math.max(0, Math.min(items.length - 1, index));
    const card = getCards()[next];
    if (!card) return;
    setActiveIndex(next);
    const trackRect = track.getBoundingClientRect();
    const cardRect = card.getBoundingClientRect();
    const delta =
      cardRect.left + cardRect.width / 2 - (trackRect.left + trackRect.width / 2);
    track.scrollBy({ left: delta, behavior });
  }

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const boot = requestAnimationFrame(() => {
      scrollToIndex(0, "auto");
    });

    let frame = 0;
    function syncIndex() {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        setActiveIndex(nearestIndex());
      });
    }

    function recenterActive() {
      scrollToIndex(nearestIndex(), "auto");
    }

    track.addEventListener("scroll", syncIndex, { passive: true });
    window.addEventListener("resize", recenterActive);

    return () => {
      cancelAnimationFrame(boot);
      cancelAnimationFrame(frame);
      track.removeEventListener("scroll", syncIndex);
      window.removeEventListener("resize", recenterActive);
    };
    // Mount/length only — carousel centering helpers close over latest DOM.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.length]);

  return (
    <div className="bc-card-deck">
      {/* A scrollable carousel is focusable so keyboard users can arrow through it. */}
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
      <div
        className="bc-card-track"
        ref={trackRef}
        // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
        tabIndex={0}
        role="region"
        aria-roledescription="carousel"
        aria-label={ariaLabel}
        onKeyDown={(event) => {
          if (event.key === "ArrowRight") {
            event.preventDefault();
            scrollToIndex(Math.min(items.length - 1, activeIndex + 1));
          }
          if (event.key === "ArrowLeft") {
            event.preventDefault();
            scrollToIndex(Math.max(0, activeIndex - 1));
          }
        }}
      >
        {items.map((item, index) => {
          const badge = discountBadge(item.savePercent);
          const value = getValue(item);
          return (
            <article
              key={item.id}
              data-plastic-slide
              className={`bc-plastic-card bc-face-${item.tone}${activeIndex === index ? " is-active" : ""}`}
              aria-label={`${item.name}, ${formatSgd(value)} ${valueLabel.toLowerCase()}`}
              aria-current={activeIndex === index ? "true" : undefined}
            >
              <div className="bc-plastic-shine" aria-hidden="true" />
              <div className="bc-plastic-top">
                <span className="bc-plastic-brand">{brandName}</span>
                {badge ? <span className="bc-plastic-badge">{badge}</span> : null}
              </div>
              <div className="bc-plastic-mid">
                <p className="bc-plastic-kind">{kindLabel}</p>
                <h3>{item.name}</h3>
                <p className="bc-plastic-validity">{item.validityLabel}</p>
              </div>
              <div className="bc-plastic-bottom">
                <div>
                  <span>{valueLabel}</span>
                  <strong>{formatSgd(value)}</strong>
                </div>
                <button
                  type="button"
                  className="bc-plastic-action"
                  onClick={() => onViewDetails(item, badge)}
                >
                  View details
                </button>
              </div>
              <span className="bc-plastic-mark" aria-hidden="true">{brandMark}</span>
            </article>
          );
        })}
      </div>

      <div className="bc-card-deck-controls">
        <button
          type="button"
          className="bc-card-nav"
          aria-label={`Previous ${kindLabel.toLowerCase()}`}
          disabled={activeIndex === 0}
          onClick={() => scrollToIndex(Math.max(0, activeIndex - 1))}
        >
          <Arrow direction="left" />
        </button>
        <div className="bc-card-dots" role="tablist" aria-label={`${ariaLabel} slides`}>
          {items.map((item, index) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={activeIndex === index}
              aria-label={`Show ${item.name}`}
              className={activeIndex === index ? "is-active" : ""}
              onClick={() => scrollToIndex(index)}
            />
          ))}
        </div>
        <button
          type="button"
          className="bc-card-nav bc-card-nav-next"
          aria-label={`Next ${kindLabel.toLowerCase()}`}
          disabled={activeIndex === items.length - 1}
          onClick={() => scrollToIndex(Math.min(items.length - 1, activeIndex + 1))}
        >
          <Arrow />
        </button>
      </div>
      <p className="bc-card-swipe-hint">{swipeHint}</p>
    </div>
  );
}

function OfferDetailsModal({
  offer,
  onClose,
}: {
  offer: OfferDetail;
  onClose: () => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  return (
    <div className="bc-offer-modal" role="presentation" onClick={onClose}>
      {/* Swallows scrim clicks so only the backdrop closes; Escape covers the keyboard. */}
      {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions */}
      <div
        className="bc-offer-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="bc-offer-dialog-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className={`bc-offer-dialog-hero bc-face-${offer.tone}`}>
          <div className="bc-offer-dialog-hero-top">
            <span className="bc-offer-dialog-kind">{offerKindLabel(offer.kind)}</span>
            <button
              ref={closeRef}
              type="button"
              className="bc-offer-dialog-close"
              aria-label="Close details"
              onClick={onClose}
            >
              ×
            </button>
          </div>
          {offer.badge ? <span className="bc-offer-badge">{offer.badge}</span> : null}
          <h2 id="bc-offer-dialog-title">{offer.name}</h2>
        </header>

        <div className="bc-offer-dialog-body">
          <p className="bc-offer-validity">
            {offer.sessionsLabel ? (
              <>
                {offer.sessionsLabel}
                <span aria-hidden="true"> · </span>
              </>
            ) : null}
            {offer.validityLabel}
          </p>
          <p className="bc-commerce-desc">{offer.description}</p>

          {offer.inclusions && offer.inclusions.length > 0 ? (
            <div className="bc-offer-dialog-block">
              <h3>Included</h3>
              <ul className="bc-offer-inclusions">
                {offer.inclusions.map((entry) => (
                  <li key={entry}>{entry}</li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="bc-offer-dialog-block">
            <h3>Details</h3>
            <ul className="bc-offer-dialog-details">
              {offer.details.map((entry) => (
                <li key={entry}>{entry}</li>
              ))}
            </ul>
          </div>

          <div className="bc-offer-finance">
            <div>
              <span>You pay</span>
              <strong className="is-pay">{formatSgd(offer.pay)}</strong>
            </div>
            <div>
              <span>{offer.secondaryLabel}</span>
              <strong>{formatSgd(offer.secondaryValue)}</strong>
            </div>
          </div>

          <button type="button" className="bc-offer-buy" disabled aria-disabled="true">
            Buy now
          </button>
          <p className="bc-offer-dialog-note">Purchase is not available in this preview.</p>
        </div>
      </div>
    </div>
  );
}

export type BrandCommerceProps = {
  theme: CommerceTheme;
  brandName: string;
  brandMark?: string;
  memberships: readonly MembershipOffer[];
  packages: readonly PackageOffer[];
  gifts: readonly GiftOffer[];
  copy: BrandCommerceCopy;
  idPrefix?: string;
};

export function BrandCommerce({
  theme,
  brandName,
  brandMark,
  memberships,
  packages,
  gifts,
  copy,
  idPrefix = "",
}: BrandCommerceProps) {
  const [activeOffer, setActiveOffer] = useState<OfferDetail | null>(null);
  const mark = brandMark || brandName.charAt(0);

  return (
    <div className="bc-root" data-theme={theme}>
      {memberships.length > 0 ? (
        <section className="bc-commerce bc-card-section" id={`${idPrefix}memberships`}>
          <CommerceIntro
            eyebrow={copy.membershipsEyebrow}
            title={copy.membershipsTitle}
            copy={copy.membershipsCopy}
          />
          <div className="bc-commerce-shell">
            <PlasticCardDeck
              items={memberships}
              kindLabel="Membership"
              valueLabel="Wallet credit"
              getValue={(item) => item.credit}
              ariaLabel="Memberships"
              swipeHint={copy.membershipSwipeHint || "Swipe to browse memberships"}
              brandName={brandName}
              brandMark={mark}
              onViewDetails={(item, badge) => {
                setActiveOffer({
                  kind: "membership",
                  id: item.id,
                  name: item.name,
                  tone: item.tone,
                  badge,
                  validityLabel: item.validityLabel,
                  description: item.description,
                  details: [...item.details],
                  pay: item.pay,
                  secondaryLabel: "Wallet credit",
                  secondaryValue: item.credit,
                });
              }}
            />
          </div>
        </section>
      ) : null}

      {packages.length > 0 ? (
        <section className="bc-commerce bc-commerce-alt" id={`${idPrefix}packages`}>
          <CommerceIntro
            eyebrow={copy.packagesEyebrow}
            title={copy.packagesTitle}
            copy={copy.packagesCopy}
          />
          <div className="bc-commerce-shell">
            <div className="bc-commerce-rail">
              {packages.map((item) => {
                const badge = discountBadge(item.savePercent);
                return (
                  <article key={item.id} className="bc-offer-card">
                    <header className={`bc-offer-header bc-face-${item.tone}`}>
                      {badge ? <span className="bc-offer-badge">{badge}</span> : null}
                      <h3>{item.name}</h3>
                    </header>
                    <div className="bc-offer-body">
                      <p className="bc-offer-validity">
                        {item.sessionsLabel}
                        <span aria-hidden="true"> · </span>
                        {item.validityLabel}
                      </p>
                      <ul className="bc-offer-inclusions">
                        {item.inclusions.map((entry) => (
                          <li key={entry}>{entry}</li>
                        ))}
                      </ul>
                      <p className="bc-commerce-desc">{item.description}</p>
                      <div className="bc-offer-foot">
                        <div className="bc-offer-finance">
                          <div>
                            <span>You pay</span>
                            <strong className="is-pay">{formatSgd(item.pay)}</strong>
                          </div>
                          <div>
                            <span>Worth</span>
                            <strong>{formatSgd(item.worth)}</strong>
                          </div>
                        </div>
                        <button
                          type="button"
                          className="bc-offer-buy"
                          onClick={() => setActiveOffer({
                            kind: "package",
                            id: item.id,
                            name: item.name,
                            tone: item.tone,
                            badge,
                            validityLabel: item.validityLabel,
                            description: item.description,
                            details: [...item.details],
                            pay: item.pay,
                            secondaryLabel: "Worth",
                            secondaryValue: item.worth,
                            sessionsLabel: item.sessionsLabel,
                            inclusions: item.inclusions,
                          })}
                        >
                          View details
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>
      ) : null}

      {gifts.length > 0 ? (
        <section className="bc-commerce bc-card-section" id={`${idPrefix}gift-cards`}>
          <CommerceIntro
            eyebrow={copy.giftsEyebrow}
            title={copy.giftsTitle}
            copy={copy.giftsCopy}
          />
          <div className="bc-commerce-shell">
            <PlasticCardDeck
              items={gifts}
              kindLabel="Gift card"
              valueLabel="Gift value"
              getValue={(item) => item.value}
              ariaLabel="Gift cards"
              swipeHint={copy.giftSwipeHint || "Swipe to browse gift cards"}
              brandName={brandName}
              brandMark={mark}
              onViewDetails={(item, badge) => {
                setActiveOffer({
                  kind: "gift",
                  id: item.id,
                  name: item.name,
                  tone: item.tone,
                  badge,
                  validityLabel: item.validityLabel,
                  description: item.description,
                  details: [...item.details],
                  pay: item.pay,
                  secondaryLabel: "Gift value",
                  secondaryValue: item.value,
                });
              }}
            />
          </div>
        </section>
      ) : null}

      {activeOffer ? (
        <OfferDetailsModal offer={activeOffer} onClose={() => setActiveOffer(null)} />
      ) : null}
    </div>
  );
}

export default BrandCommerce;
