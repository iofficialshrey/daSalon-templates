"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { formatPrice } from "@/lib/dasalon/locale";
import { JUMP_EVENT, jumpTo } from "@/lib/page/jump";
import { GIFT_CARDS, JOURNEYS, MEMBERSHIPS, type Offer } from "../data/offers";
import { ArrowRight, Check } from "./icons";
import { OfferFace } from "./offer-face";
import { useOru } from "./provider";
import styles from "./offers.module.css";
import ui from "./ui.module.css";

const TABS = [
  { id: "membership", label: "Membership", line: "Credit for your treatments, and the bath whenever you visit.", offers: MEMBERSHIPS },
  { id: "journeys", label: "Journeys", line: "Half a day, arranged in the right order.", offers: JOURNEYS },
  { id: "gift-cards", label: "Gift cards", line: "Give them somewhere to put everything down.", offers: GIFT_CARDS },
] as const;

type TabId = (typeof TABS)[number]["id"];

function isTab(value: string): value is TabId {
  return TABS.some((tab) => tab.id === value);
}

function priceLine(offer: Offer) {
  if (offer.kind === "membership") return `${formatPrice(offer.credit)} of credit`;
  if (offer.kind === "journey") return `Worth ${formatPrice(offer.worth)}`;
  return offer.months ? "Valid for 12 months" : "No expiry";
}

function OfferCard({ offer }: { offer: Offer }) {
  const { openOffer, warmOffer, purchased } = useOru();
  const bought = purchased.has(offer.id);
  return (
    <li className={styles.item}>
      <button
        type="button"
        className={styles.card}
        data-offer-card=""
        onClick={() => openOffer(offer.id)}
        onPointerEnter={warmOffer}
        onFocus={warmOffer}
      >
        <OfferFace offer={offer} />
        <span className={styles.text}>
          <span className={ui.srOnly}>{offer.name}.</span>
          <span className={styles.line}>{offer.line}</span>
          <span className={styles.foot}>
            <span className={styles.pay}>{formatPrice(offer.pay)}</span>
            <span className={styles.worth}>{priceLine(offer)}</span>
            {bought ? (
              <span className={styles.bought}>
                <Check size={14} />
                Bought
              </span>
            ) : (
              <span className={styles.go}>
                <ArrowRight size={16} />
              </span>
            )}
          </span>
        </span>
      </button>
    </li>
  );
}

/**
 * Membership, journeys and gift cards in one band: three tabs, three cards
 * each. #membership, #journeys and #gift-cards all land here on the right tab.
 */
export function Offers() {
  const uid = useId();
  const [tab, setTab] = useState<TabId>("membership");
  const sectionRef = useRef<HTMLElement>(null);
  const tabRefs = useRef(new Map<TabId, HTMLButtonElement>());

  // A link to a tab that is not the section's own id selects it, then lands on the section.
  useEffect(() => {
    const fromHash = (scroll: boolean) => {
      const hash = window.location.hash.slice(1);
      if (!isTab(hash)) return;
      setTab(hash);
      if (scroll && hash !== "membership") jumpTo("membership", { focus: false });
    };
    fromHash(true);
    const onHash = () => fromHash(true);
    const onJump = () => fromHash(false);
    const section = sectionRef.current;
    window.addEventListener("hashchange", onHash);
    section?.addEventListener(JUMP_EVENT, onJump);
    return () => {
      window.removeEventListener("hashchange", onHash);
      section?.removeEventListener(JUMP_EVENT, onJump);
    };
  }, []);

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const index = TABS.findIndex((item) => item.id === tab);
    const next = event.key === "ArrowRight" ? index + 1
      : event.key === "ArrowLeft" ? index - 1
        : event.key === "Home" ? 0
          : event.key === "End" ? TABS.length - 1
            : -1;
    if (next === -1) return;
    event.preventDefault();
    const target = TABS[(next + TABS.length) % TABS.length].id;
    setTab(target);
    tabRefs.current.get(target)?.focus();
  };

  return (
    <section ref={sectionRef} id="membership" data-tone="light" aria-labelledby="offers-title" className={`${ui.section} ${ui.light} ${styles.offers}`}>
      <div className={ui.container}>
        <div className={styles.head}>
          <h2 id="offers-title" className={`${ui.h2} ${ui.rise}`} tabIndex={-1} data-jump-focus="">
            Come for the treatment. <em className={ui.accent}>Stay for the quiet.</em>
          </h2>
          <div className={`${styles.tabs} ${ui.rise} ${ui.rise2}`} role="tablist" aria-label="Memberships, journeys and gift cards">
            {TABS.map((item) => (
              <button
                key={item.id}
                ref={(node) => {
                  if (node) tabRefs.current.set(item.id, node);
                  else tabRefs.current.delete(item.id);
                }}
                type="button"
                role="tab"
                id={`${uid}-tab-${item.id}`}
                aria-controls={`${uid}-panel-${item.id}`}
                aria-selected={tab === item.id}
                tabIndex={tab === item.id ? 0 : -1}
                className={styles.tab}
                onClick={() => setTab(item.id)}
                onKeyDown={onKeyDown}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {TABS.map((item) => (
          <div
            key={item.id}
            role="tabpanel"
            id={`${uid}-panel-${item.id}`}
            aria-labelledby={`${uid}-tab-${item.id}`}
            hidden={tab !== item.id}
            className={styles.panel}
          >
            <p className={styles.panelLine}>{item.line}</p>
            <ul className={styles.list}>
              {item.offers.map((offer) => (
                <OfferCard key={offer.id} offer={offer} />
              ))}
            </ul>
          </div>
        ))}
        <p className={styles.note}>Prices in Singapore dollars. This page is a demonstration: nothing is charged.</p>
      </div>
    </section>
  );
}
