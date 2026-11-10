"use client";

import { useId, useState } from "react";
import { formatPrice } from "@/lib/dasalon/locale";
import { useLite } from "@/lib/page/lite";
import { MEMBERSHIPS, membershipById, type Membership } from "../data/offers";
import styles from "./circle.module.css";
import { ArrowRight } from "./icons";
import { LedgerBand, LedgerFigure, LedgerPage } from "./offer-ledger";
import { usePaloma } from "./provider";
import ui from "./ui.module.css";

type TierId = Membership["id"];

const DEFAULT_TIER: TierId = "paloma-circle";

/** 532px at 1440 (50vw − 160 on desktop), about half the tablet frame, the full ledger width on phones. */
const BAND_SIZES = "(min-width: 1100px) calc(50vw - 160px), (min-width: 760px) 52vw, calc(100vw - 40px)";

/**
 * The Circle's island: three native-radio tier rows and the live member
 * ledger beside them. Only the selected tier's band loads; a row's band warms
 * on hover or focus. "See the details" opens the membership spread.
 */
export function CirclePicker() {
  const { openOffer, prefetchOffer, purchased } = usePaloma();
  const lite = useLite();
  const uid = useId();
  const [selected, setSelected] = useState<TierId>(DEFAULT_TIER);
  const [warm, setWarm] = useState<ReadonlySet<TierId>>(() => new Set([DEFAULT_TIER]));
  // The figure rolls: the previous one leaves (160ms) before the new one arrives (240ms).
  const [roll, setRoll] = useState<{ from: TierId | null; key: number }>({ from: null, key: 0 });

  const membership = membershipById(selected) ?? MEMBERSHIPS[0];
  const previous = roll.from ? membershipById(roll.from) : undefined;
  const sizes = lite ? "1px" : BAND_SIZES;

  const warmUp = (id: TierId) => {
    setWarm((current) => (current.has(id) ? current : new Set(current).add(id)));
  };

  const choose = (id: TierId) => {
    if (id === selected) return;
    warmUp(id);
    setRoll((current) => ({ from: selected, key: current.key + 1 }));
    setSelected(id);
  };

  const rollKey = roll.key;
  const figure = (
    <div className={styles.figureRoll}>
      {previous ? (
        <LedgerFigure
          key={`out-${rollKey}`}
          membership={previous}
          className={styles.rollOut}
          hidden
          onAnimationEnd={() => setRoll((current) => (current.key === rollKey ? { ...current, from: null } : current))}
        />
      ) : null}
      <LedgerFigure key={`in-${rollKey}`} membership={membership} className={rollKey ? styles.rollIn : undefined} />
    </div>
  );

  return (
    <>
      {/* The column spans the ledger's row, so the sticky picker lets go where the ledger ends. */}
      <div className={styles.pickerCol}>
        <fieldset className={styles.picker}>
          <legend className={`${ui.label} ${styles.legend}`}>Choose a membership</legend>
          <div className={styles.tiers}>
            {MEMBERSHIPS.map((tier) => {
              const id = `${uid}-${tier.id}`;
              const bought = purchased.has(tier.id);
              return (
                <div key={tier.id} className={styles.tier}>
                  <input
                    id={id}
                    className={`${ui.srOnly} ${styles.tierInput}`}
                    type="radio"
                    name={`${uid}-tier`}
                    value={tier.id}
                    checked={selected === tier.id}
                    onChange={() => choose(tier.id)}
                    onFocus={() => warmUp(tier.id)}
                  />
                  <label htmlFor={id} className={styles.tierLabel} onPointerEnter={() => warmUp(tier.id)}>
                    <span className={styles.tierName}>{tier.name}</span>
                    <span className={styles.tierType}>
                      <span className={ui.srOnly}>, </span>
                      {tier.typeLine}
                      {bought ? <span className={`${ui.badge} ${ui.badgeBought} ${styles.bought}`}>Bought · Demo</span> : null}
                    </span>
                    <span className={styles.tierPrice}>
                      <span className={ui.srOnly}>, </span>
                      {formatPrice(tier.pay)}
                    </span>
                  </label>
                </div>
              );
            })}
          </div>
          <p className={`${ui.small} ${styles.pickerNote}`}>All three work at all four studios, on any service.</p>
        </fieldset>
      </div>

      <div className={styles.ledgerCol}>
        <LedgerPage
          membership={membership}
          figure={figure}
          band={MEMBERSHIPS.filter((tier) => warm.has(tier.id)).map((tier) => (
            <LedgerBand key={tier.id} membership={tier} sizes={sizes} on={tier.id === selected} />
          ))}
        >
          <button
            type="button"
            className={`${ui.btn} ${ui.btnInk} ${ui.block} ${styles.ledgerButton}`}
            onClick={(event) => openOffer({ kind: "membership", id: membership.id }, { returnTo: event.currentTarget })}
            onPointerEnter={prefetchOffer}
            onFocus={prefetchOffer}
            onTouchStart={prefetchOffer}
          >
            <span>
              See the details<span className={ui.srOnly}> of {membership.name}</span>
            </span>
            <ArrowRight />
          </button>
          <p className={`${ui.small} ${styles.ledgerNote}`}>Demonstration — nothing is charged.</p>
        </LedgerPage>
      </div>
    </>
  );
}
