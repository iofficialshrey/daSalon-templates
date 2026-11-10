"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { formatPrice } from "@/lib/dasalon/locale";
import { fetchVenue, useVenueEntry } from "@/lib/dasalon/venue-cache";
import { useLite } from "@/lib/page/lite";
import { giftThumb } from "../data/art";
import {
  coversLine,
  DEFAULT_GIFT,
  GIFT_DESIGNS,
  GIFT_VALUES,
  giftDesignById,
  giftPay,
  giftValue,
  saving,
  type GiftDesign,
} from "../data/offers";
import { ArtPicture } from "./art-picture";
import { CardFace, cardCaption } from "./card-face";
import styles from "./gifts.module.css";
import { ArrowRight, Check } from "./icons";
import { GIFT_DESIGN_GROUP, giftPurchaseId } from "./offer-ids";
import { usePaloma } from "./provider";
import ui from "./ui.module.css";

type DesignId = GiftDesign["id"];

const CARD_SIZES = "(min-width: 1100px) 31vw, (min-width: 760px) 400px, 84vw";
const REDUCED = "(prefers-reduced-motion: reduce)";

/**
 * The gift issue's island: the card preview on the wash panel, the server
 * head passed through, then two native radio groups (Design, Value), the
 * computed summary, the live-validated "covers" line and "Personalise and buy".
 */
export function GiftConfigurator({ head }: { head: ReactNode }) {
  const { openOffer, prefetchOffer, purchased, studioBySlug } = usePaloma();
  const lite = useLite();
  const uid = useId();
  const [design, setDesign] = useState<DesignId>(DEFAULT_GIFT.design);
  const [value, setValue] = useState(DEFAULT_GIFT.value);
  const [warm, setWarm] = useState<ReadonlySet<DesignId>>(() => new Set([DEFAULT_GIFT.design]));
  const [rolled, setRolled] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const stackRef = useRef<HTMLDivElement>(null);

  const current = giftDesignById(design) ?? GIFT_DESIGNS[0];
  const item = giftValue(value) ?? GIFT_VALUES[0];
  const pay = giftPay(value);
  const saved = saving(item) ?? 0;
  const coversStudio = studioBySlug(item.covers.studio);
  const coversVenue = coversStudio?.venueId ?? null;
  const entry = useVenueEntry(coversVenue);
  // Shown only when that studio's cached live menu confirms every service fits the card.
  const covers = coversLine(value, entry.data?.services);
  const bought = purchased.has(giftPurchaseId(design, value));

  // The covers line needs its studio's menu: fetch it as the chapter nears (lite visitors skip the prefetch).
  useEffect(() => {
    const panel = panelRef.current;
    if (lite || !coversVenue || !panel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((record) => record.isIntersecting)) return;
        observer.disconnect();
        void fetchVenue(coversVenue);
      },
      { rootMargin: "100% 0px" },
    );
    observer.observe(panel);
    return () => observer.disconnect();
  }, [coversVenue, lite]);

  const warmUp = (id: DesignId) => {
    setWarm((set) => (set.has(id) ? set : new Set(set).add(id)));
  };

  const chooseDesign = (id: DesignId) => {
    warmUp(id);
    setDesign(id);
    // The new face crossfades in (CSS); the card settles from −4° to −2°.
    if (!window.matchMedia(REDUCED).matches) {
      stackRef.current?.animate([{ transform: "rotate(-4deg)" }, { transform: "rotate(-2deg)" }], {
        duration: 420,
        easing: "cubic-bezier(0.2, 0.75, 0.2, 1)",
      });
    }
  };

  const chooseValue = (next: number) => {
    setRolled(true);
    setValue(next);
  };

  const sizes = lite ? "1px" : CARD_SIZES;
  const summary = `You pay ${formatPrice(pay)} · Card value ${formatPrice(value)}${saved > 0 ? ` · You save ${formatPrice(saved)}` : ""}`;

  return (
    <>
      <div ref={panelRef} className={styles.panel} data-tone="wash">
        <figure className={styles.preview}>
          <div ref={stackRef} className={styles.stack}>
            {GIFT_DESIGNS.filter((option) => warm.has(option.id)).map((option) => (
              <CardFace
                key={option.id}
                design={option}
                value={value}
                sizes={sizes}
                roll={rolled}
                decorative
                className={`${styles.face} ${option.id === design ? styles.faceOn : ""}`}
              />
            ))}
          </div>
          <figcaption className={styles.caption}>
            <span className={ui.label} aria-hidden="true">
              {current.name}
            </span>
            <span className={ui.srOnly}>{cardCaption(current, value)}</span>
          </figcaption>
        </figure>
      </div>

      {head}

      <div className={styles.config}>
        <fieldset id={GIFT_DESIGN_GROUP} className={styles.group}>
          <legend className={`${ui.label} ${styles.legend}`}>Design</legend>
          <div className={styles.designs}>
            {GIFT_DESIGNS.map((option) => {
              const id = `${uid}-design-${option.id}`;
              return (
                <div key={option.id} className={styles.option}>
                  <input
                    id={id}
                    className={`${ui.srOnly} ${styles.designInput}`}
                    type="radio"
                    name={`${uid}-design`}
                    value={option.id}
                    checked={design === option.id}
                    onChange={() => chooseDesign(option.id)}
                    onFocus={() => warmUp(option.id)}
                  />
                  <label htmlFor={id} className={styles.designLabel} onPointerEnter={() => warmUp(option.id)}>
                    <span className={`${styles.swatch} ${styles[option.ground]}`} aria-hidden="true">
                      <ArtPicture art={giftThumb(option.art)} sizes="96px" className={styles.swatchPicture} imgClassName={styles.swatchImg} />
                    </span>
                    <span className={styles.designText}>
                      <span className={styles.designName}>{option.name}</span>
                      <span className={styles.designLine}>
                        <span className={ui.srOnly}>, </span>
                        {option.coverLine}
                      </span>
                    </span>
                    <span className={styles.check} aria-hidden="true">
                      <Check />
                    </span>
                  </label>
                </div>
              );
            })}
          </div>
        </fieldset>

        <fieldset className={`${styles.group} ${styles.valueGroup}`}>
          <legend className={`${ui.label} ${styles.legend}`}>Value</legend>
          <div className={styles.values}>
            {GIFT_VALUES.map((option) => {
              const id = `${uid}-value-${option.value}`;
              return (
                <div key={option.value} className={styles.cell}>
                  <input
                    id={id}
                    className={`${ui.srOnly} ${styles.valueInput}`}
                    type="radio"
                    name={`${uid}-value`}
                    value={option.value}
                    checked={value === option.value}
                    onChange={() => chooseValue(option.value)}
                  />
                  <label htmlFor={id} className={styles.valueLabel}>
                    <span className={styles.valueFigure}>{formatPrice(option.value)}</span>
                    <span className={styles.valuePay}>
                      <span className={ui.srOnly}>, </span>
                      Pay {formatPrice(option.pay)}
                    </span>
                  </label>
                </div>
              );
            })}
          </div>
        </fieldset>

        <p className={styles.summary}>
          <span>{summary}</span>
          {bought ? <span className={`${ui.badge} ${ui.badgeBought}`}>Bought · Demo</span> : null}
        </p>
        <p className={styles.covers}>{covers ?? ""}</p>

        <button
          type="button"
          className={`${ui.btn} ${ui.btnLg} ${ui.btnPrimary} ${ui.lifted} ${styles.buy}`}
          onClick={(event) => openOffer({ kind: "gift", design, value }, { returnTo: event.currentTarget })}
          onPointerEnter={prefetchOffer}
          onFocus={prefetchOffer}
          onTouchStart={prefetchOffer}
        >
          <span>Personalise and buy · {formatPrice(pay)}</span>
          <ArrowRight />
        </button>
        <p className={`${ui.small} ${styles.note}`}>
          In the live product the card is sent by email or SMS with your message. This demonstration sends nothing.
        </p>
      </div>
    </>
  );
}
