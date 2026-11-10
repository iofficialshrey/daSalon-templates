"use client";

import Image from "next/image";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { formatDate, formatDuration, formatPrice, relativeDay } from "@/lib/dasalon/locale";
import type { PublicService } from "@/lib/dasalon/types";
import type { HouseSlug } from "../data/houses";
import { GIFT_CARDS, MEMBERSHIPS, PACKAGES, type Offer } from "../data/offers";
import { fetchVenue, useVenueEntry } from "@/lib/dasalon/venue-cache";
import { groupByCategory, menuFacts, venueStatus, type ServiceGroup } from "@/lib/dasalon/venue-status";
import { jumpTo } from "@/lib/page/jump";
import { categorySlug } from "@/lib/dasalon/slug";
import { CardFace } from "./card-face";
import { useClock } from "@/lib/page/use-clock";
import { statusToneClass } from "./houses-live";
import { ArrowRight, ArrowUpRight, ChevronRight, Share } from "./icons";
import { Layer } from "./layer";
import { useMaison } from "./provider";
import s from "./house-sheet.module.css";
import ui from "./ui.module.css";

/*
 * The house sheet: daSalon's own venue page (details, amenities, live menu,
 * offers, Book at venue) inside the brand shell. A right drawer on tablet and
 * desktop, full screen on phones. The provider owns ?house= and unmounts the
 * sheet when it closes.
 */

const MAX_CATEGORIES = 3;
const MAX_PER_CATEGORY = 3;
const MAX_ROWS = 6;
const TOAST_MS = 2400;

/** Up to three categories of up to three services, six rows at most. */
function pickRows(services: PublicService[]): ServiceGroup[] {
  let left = MAX_ROWS;
  const picked: ServiceGroup[] = [];
  for (const group of groupByCategory(services, categorySlug).slice(0, MAX_CATEGORIES)) {
    if (left <= 0) break;
    const rows = group.services.slice(0, Math.min(MAX_PER_CATEGORY, left));
    left -= rows.length;
    picked.push({ ...group, services: rows });
  }
  return picked;
}

function priceLabel(service: PublicService) {
  return `${formatPrice(service.price)}${service.taxLabel ? ` ${service.taxLabel}` : ""}`;
}

/** "S$200 · S$300 credit", "S$180 · 5 sessions", "S$180 · S$200 face value". */
function offerLine(offer: Offer) {
  const pay = formatPrice(offer.pay);
  if (offer.kind === "membership") {
    return offer.type === "credit"
      ? `${pay} · ${formatPrice(offer.value)} credit`
      : `${pay} · ${offer.discountPercent ?? 0}% off, up to ${formatPrice(offer.value)}`;
  }
  if (offer.kind === "gift") return `${pay} · ${formatPrice(offer.value)} face value`;
  if (offer.redemption === "COUNT") return `${pay} · ${offer.figure} sessions`;
  if (offer.redemption === "TIME") return `${pay} · ${offer.figure} minutes`;
  return `${pay} · ${formatPrice(offer.value)} to spend`;
}

function plural(count: number, one: string, many: string) {
  return `${count} ${count === 1 ? one : many}`;
}

export default function HouseSheet({ slug, onClose }: { slug: HouseSlug; onClose: () => void }) {
  const {
    houseBySlug,
    catalog,
    openBooking,
    prefetchBooking,
    openHouse,
    setCurrentHouse,
    openOffer,
    openGift,
    prefetchFlows,
  } = useMaison();
  const house = houseBySlug(slug);
  const venueId = house?.venueId ?? null;
  const entry = useVenueEntry(venueId);
  const now = useClock();
  const id = useId();
  const bodyRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const [copiedAt, setCopiedAt] = useState<number | null>(null);

  // Read the venue cache, fetching it when missing or older than five minutes.
  // The default venue arrives (and refreshes) with the shared catalog instead.
  const defaultVenueId = catalog.data?.selectedVenueId ?? null;
  useEffect(() => {
    if (venueId && venueId !== defaultVenueId) void fetchVenue(venueId);
  }, [venueId, defaultVenueId]);

  // On open and on the Clementi swap: back to the top, focus on the house name.
  // This runs after the Layer's own focus frame, so the visible heading wins.
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      bodyRef.current?.scrollTo({ top: 0 });
      titleRef.current?.focus({ preventScroll: true });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [slug]);

  useEffect(() => {
    if (copiedAt === null) return;
    const timer = window.setTimeout(() => setCopiedAt(null), TOAST_MS);
    return () => window.clearTimeout(timer);
  }, [copiedAt]);

  const services = entry.data?.services;
  const groups = useMemo(() => (services ? pickRows(services) : []), [services]);

  if (!house) return null;

  const data = entry.data;
  const resolving = !venueId && catalog.loading;
  const unavailable = !venueId && !catalog.loading;
  const loading = resolving || (Boolean(venueId) && !data && !entry.error);
  const failed = Boolean(venueId) && !data && Boolean(entry.error);
  const status = data && now ? venueStatus(house.hours, data, now) : null;
  const facts = data && now ? menuFacts(data, now) : null;
  const street = house.address.split(",")[0];
  const sister = house.sister;
  const pkg = PACKAGES.find((item) => item.house === slug);
  const offers: Offer[] = [...MEMBERSHIPS, ...(pkg ? [pkg] : []), ...GIFT_CARDS];

  const share = async () => {
    const url = window.location.href;
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title: `${house.name} · Maison Élan`, url });
        return;
      } catch (issue) {
        // The visitor closed the share sheet; anything else falls back to copying.
        if (issue instanceof DOMException && issue.name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopiedAt(Date.now());
    } catch {
      // Clipboard access was refused; the address bar still holds the link.
    }
  };

  const seeFullMenu = () => {
    setCurrentHouse(slug);
    onClose();
    const jump = () => window.requestAnimationFrame(() => window.requestAnimationFrame(() => jumpTo("menu")));
    if (!new URLSearchParams(window.location.search).has("house")) {
      jump();
      return;
    }
    // Closing went Back in history; jump once that entry (and its scroll) is restored.
    let done = false;
    let timer = 0;
    const finish = () => {
      if (done) return;
      done = true;
      window.removeEventListener("popstate", finish);
      window.clearTimeout(timer);
      jump();
    };
    timer = window.setTimeout(finish, 400);
    window.addEventListener("popstate", finish);
  };

  const nextOpening = facts?.nextDate
    ? relativeDay(facts.nextDate, now ?? undefined) ?? formatDate(facts.nextDate)
    : "No online dates at the moment";
  const onlineMenu = facts
    ? facts.count
      ? `${plural(facts.count, "service", "services")} in ${plural(facts.categories, "category", "categories")}${
        facts.fromPrice != null ? ` · from ${formatPrice(facts.fromPrice)}` : ""
      }`
      : "No online services at the moment"
    : null;
  const liveValue = (text: string | null) => {
    if (text) return text;
    if (loading) return <span className={`${ui.skeleton} ${s.skeletonLine}`} aria-hidden="true" />;
    return "Not loading just now";
  };

  return (
    <Layer
      open
      onClose={onClose}
      variant="drawer"
      title={house.name}
      hideTitle
      className={s.sheet}
      bodyRef={bodyRef}
      headerExtra={
        <>
          <span className={`${ui.label} ${s.topLabel}`}>{house.label}</span>
          <button type="button" className={ui.iconBtn} onClick={() => void share()} aria-label={`Share ${house.name}`}>
            <Share size={20} />
          </button>
        </>
      }
      footer={
        <>
          <button
            type="button"
            className={`${ui.btn} ${ui.primary} ${ui.lg} ${s.footBook}`}
            data-book=""
            onClick={() => openBooking({ house: slug })}
            onPointerEnter={prefetchBooking}
            onFocus={prefetchBooking}
            onTouchStart={prefetchBooking}
          >
            Book at {house.name}
          </button>
          <a
            href={house.directionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`${ui.btn} ${ui.secondary} ${ui.lg} ${s.footDirections}`}
          >
            Directions
            <ArrowUpRight />
            <span className={ui.srOnly}> (opens Google Maps)</span>
          </a>
        </>
      }
    >
      <div className={s.hero}>
        <div className={s.heroFrame}>
          <Image
            src={house.image}
            alt={house.imageAlt}
            quality={60}
            sizes="(max-width: 759px) 100vw, 600px"
            className={s.heroImg}
          />
          <span className={s.chip} aria-hidden="true">Illustrative photograph</span>
        </div>
      </div>

      <div className={s.titleBlock}>
        <h2 ref={titleRef} className={s.title} tabIndex={-1} data-layer-focus="">
          {house.name}
        </h2>
        {status ? (
          <p className={`${ui.status} ${statusToneClass(status.tone)}`}>{status.text}</p>
        ) : loading ? (
          <span className={`${ui.skeleton} ${s.skeletonLine}`} aria-hidden="true" />
        ) : (
          <p className={ui.status}>{house.hoursLabel}</p>
        )}
        <p className={s.blurb}>{house.blurb}</p>
      </div>

      <div className={s.factsBlock}>
        <dl className={s.facts}>
          <div className={s.fact}>
            <dt className={ui.label}>Address</dt>
            <dd className={s.factValue}>
              <span className={s.factText}>{house.address}</span>
              <a
                href={house.directionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`${ui.textBtn} ${s.inlineAction}`}
              >
                <span className={ui.underline}>Directions</span>
                <ArrowUpRight />
                <span className={ui.srOnly}> (opens Google Maps)</span>
              </a>
            </dd>
          </div>
          <div className={s.fact}>
            <dt className={ui.label}>Hours</dt>
            <dd className={s.factValue}>{house.hours ? house.hoursLabel : "Shown when you book"}</dd>
          </div>
          {unavailable ? null : (
            <>
              <div className={s.fact}>
                <dt className={ui.label}>Next opening</dt>
                <dd className={`${s.factValue} ${ui.num}`}>{liveValue(facts ? nextOpening : null)}</dd>
              </div>
              <div className={s.fact}>
                <dt className={ui.label}>Online menu</dt>
                <dd className={`${s.factValue} ${ui.num}`}>{liveValue(onlineMenu)}</dd>
              </div>
            </>
          )}
        </dl>
        <p className={s.tiny}>All times are Singapore time (SGT).</p>
        {unavailable ? <p className={s.tiny}>Live details for this house are unavailable right now.</p> : null}

        {sister && house.sisterLine ? (
          <div className={s.sister}>
            <p className={s.sisterLabel}>Also at {street}</p>
            <button
              type="button"
              className={`${ui.textBtn} ${s.inlineAction}`}
              onClick={() => openHouse(sister, { replace: true })}
            >
              <span className={ui.underline}>{house.sisterLine}</span>
              <ArrowRight />
            </button>
          </div>
        ) : null}
      </div>

      {house.amenities.length ? (
        <section className={s.block} aria-labelledby={`${id}-amenities`}>
          <h3 id={`${id}-amenities`} className={ui.label}>Amenities</h3>
          <ul className={s.tags}>
            {house.amenities.map((amenity) => (
              <li key={amenity} className={s.tag}>{amenity}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {unavailable ? null : (
        <section className={s.block} aria-labelledby={`${id}-menu`}>
          <h3 id={`${id}-menu`} className={s.blockTitle}>The menu here</h3>
          {data ? (
            data.services.length ? (
              <>
                <div className={s.groups}>
                  {groups.map((group) => (
                    <div key={group.category} className={s.group}>
                      <h4 className={ui.label}>{group.category}</h4>
                      <ul className={s.rows}>
                        {group.services.map((service) => {
                          const duration = formatDuration(service.duration);
                          const price = priceLabel(service);
                          return (
                            <li key={service.id} className={s.rowItem}>
                              <button
                                type="button"
                                className={s.row}
                                data-book=""
                                onClick={() => openBooking({ house: slug, serviceId: service.id })}
                                onPointerEnter={prefetchBooking}
                                onFocus={prefetchBooking}
                                onTouchStart={prefetchBooking}
                              >
                                <span className={s.rowText}>
                                  <span className={ui.srOnly}>Book </span>
                                  <span className={s.rowName}>{service.name}</span>
                                  <span className={ui.srOnly}>{`, ${house.name}, ${duration}, ${price}`}</span>
                                  <span className={`${s.rowMeta} ${ui.num}`} aria-hidden="true">
                                    {duration} · {price}
                                  </span>
                                </span>
                                <span className={s.rowCue} aria-hidden="true">
                                  Book
                                  <ArrowRight />
                                </span>
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  ))}
                </div>
                <button type="button" className={`${ui.btn} ${ui.textBtn} ${s.more}`} onClick={seeFullMenu}>
                  <span className={ui.underline}>See the full menu</span>
                  <ArrowRight />
                </button>
              </>
            ) : (
              <p className={s.stateText}>{house.name} has no services open for online booking at the moment.</p>
            )
          ) : failed ? (
            <div className={s.state}>
              <p className={s.stateText}>The menu here isn&apos;t loading just now.</p>
              <button
                type="button"
                className={`${ui.btn} ${ui.secondary} ${ui.sm}`}
                onClick={() => venueId && void fetchVenue(venueId, true)}
              >
                Try again
              </button>
            </div>
          ) : (
            <div className={s.skeletonRows}>
              <span className={ui.srOnly}>Loading the menu at {house.name}…</span>
              {[0, 1, 2, 3].map((row) => (
                <div key={row} className={s.skeletonRow} aria-hidden="true">
                  <span className={`${ui.skeleton} ${s.skeletonName}`} />
                  <span className={`${ui.skeleton} ${s.skeletonMeta}`} />
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      <section className={s.block} aria-labelledby={`${id}-offers`}>
        <div className={s.blockHead}>
          <h3 id={`${id}-offers`} className={s.blockTitle}>Offers at this house</h3>
          <span className={ui.demoBadge}>Demo</span>
        </div>
        <ul className={s.offers}>
          {offers.map((offer) => {
            const line = offerLine(offer);
            return (
              <li key={offer.id} className={s.offer}>
                <CardFace offer={offer} size="thumb" />
                <span className={s.offerText}>
                  <button
                    type="button"
                    className={s.offerBtn}
                    onClick={() => (offer.kind === "gift" ? openGift(offer.id, slug) : openOffer(offer.id, slug))}
                    onPointerEnter={prefetchFlows}
                    onFocus={prefetchFlows}
                    onTouchStart={prefetchFlows}
                  >
                    {offer.name}
                    <span className={ui.srOnly}>, {line}</span>
                  </button>
                  <span className={`${s.offerValue} ${ui.num}`} aria-hidden="true">{line}</span>
                </span>
                <ChevronRight size={20} className={s.chevron} />
              </li>
            );
          })}
        </ul>
      </section>

      <p className={s.footnote}>Address and hours from the house&apos;s public da Salon listing. Photograph is illustrative.</p>

      <p className={s.toast} role="status" aria-live="polite">{copiedAt !== null ? "Link copied" : null}</p>
    </Layer>
  );
}
