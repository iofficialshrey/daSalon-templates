"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import SalonBooking from "../salon-booking";
import { formatCatalogPrice, serviceDescription, useDaSalonCatalog } from "@/lib/dasalon/client";

type Venue = {
  name: string;
  city: string;
  address: string;
  note: string;
  hours: string;
  image: string;
};

type OfferKind = "membership" | "package" | "gift";

type OfferDetail = {
  kind: OfferKind;
  id: string;
  name: string;
  tone: string;
  badge: string | null;
  validityLabel: string;
  description: string;
  details: string[];
  pay: number;
  secondaryLabel: string;
  secondaryValue: number;
  sessionsLabel?: string;
  inclusions?: readonly string[];
};

const memberships = [
  {
    id: "elan-atelier",
    name: "Élan Atelier",
    validityLabel: "Valid for 6 months",
    savePercent: 10,
    description: "Studio credit for cuts, finishes and weekday colour across every Maison.",
    details: [
      "Wallet credit usable at every Maison Élan studio",
      "Ideal for cuts, finishes and weekday colour",
      "Balance follows you across cities",
      "Unused credit expires with the membership window",
    ],
    pay: 180,
    credit: 200,
    tone: "espresso",
  },
  {
    id: "private-circle",
    name: "Private Circle",
    validityLabel: "Valid for 12 months",
    savePercent: 15,
    description: "Priority booking windows plus fuller credit for colour and care rituals.",
    details: [
      "Priority booking windows ahead of general release",
      "Higher wallet credit for colour and care rituals",
      "Preferred stylist requests when available",
      "One shared member record across every Maison",
    ],
    pay: 320,
    credit: 380,
    tone: "champagne",
  },
  {
    id: "maison-house",
    name: "Maison House",
    validityLabel: "Valid for 3 months",
    savePercent: 8,
    description: "A lighter wallet for guests who return often for blowouts and gloss.",
    details: [
      "A lighter wallet for frequent return visits",
      "Best for blowouts, gloss and quick finishes",
      "Redeemable at any participating Maison",
      "Simple way to keep a balance ready between appointments",
    ],
    pay: 95,
    credit: 105,
    tone: "rose",
  },
] as const;

const packages = [
  {
    id: "sunday-reset",
    name: "Sunday Reset",
    savePercent: 12,
    sessionsLabel: "1 session included",
    validityLabel: "Valid for 90 days",
    inclusions: ["Scalp ritual", "Treatment", "Signature finish"],
    description: "A complete weekend reset in a single visit.",
    details: [
      "One complete reset visit in a single appointment",
      "Includes scalp ritual, treatment and signature finish",
      "Book any available artist within the validity window",
      "Designed as a weekend recovery ritual",
    ],
    pay: 88,
    worth: 100,
    tone: "champagne",
  },
  {
    id: "polished-three",
    name: "Polished Three",
    savePercent: 14,
    sessionsLabel: "3 sessions included",
    validityLabel: "Valid for 120 days",
    inclusions: ["Blowout session 1", "Blowout session 2", "Blowout session 3"],
    description: "Keep the cut sharp between full appointments.",
    details: [
      "Three signature blowout sessions",
      "Space visits across 120 days",
      "Keep shape and polish between full appointments",
      "Sessions can be booked independently",
    ],
    pay: 120,
    worth: 140,
    tone: "espresso",
  },
  {
    id: "colour-keeping",
    name: "Colour Keeping",
    savePercent: 11,
    sessionsLabel: "2 sessions included",
    validityLabel: "Valid for 6 months",
    inclusions: ["Gloss service", "Repair treatment", "Home-ritual consult"],
    description: "Maintain luminous colour with guided at-home care.",
    details: [
      "Two visits focused on colour longevity",
      "Gloss service and repair treatment included",
      "Home-ritual consult for between-visit care",
      "Valid for six months from purchase",
    ],
    pay: 155,
    worth: 175,
    tone: "rose",
  },
] as const;

const giftCards = [
  {
    id: "new-season",
    name: "New Season",
    validityLabel: "Valid for 1 year",
    savePercent: 10,
    description: "A new-season invitation for colour, cut or a quiet reset.",
    details: [
      "Redeemable for colour, cut or a quiet reset",
      "Valid for twelve months from purchase",
      "Can be used at any Maison Élan studio",
      "A considered gift for a new season",
    ],
    pay: 90,
    value: 100,
    tone: "ember",
  },
  {
    id: "private-gift",
    name: "Private Gift",
    validityLabel: "No expiry",
    savePercent: null,
    description: "An open Maison gift, ready whenever they choose to visit.",
    details: [
      "Open value with no expiry date",
      "Recipient chooses when and how to redeem",
      "Valid across every Maison Élan studio",
      "Ideal when you want the gift to wait for them",
    ],
    pay: 150,
    value: 150,
    tone: "ink",
  },
  {
    id: "wellness-wrapped",
    name: "Wellness Wrapped",
    validityLabel: "Valid for 1 year",
    savePercent: 8,
    description: "A softer gift for treatment-led rituals and finishes.",
    details: [
      "Suited to treatment-led rituals and finishes",
      "Valid for twelve months from purchase",
      "Redeemable at any participating Maison",
      "A quieter gift for restorative care",
    ],
    pay: 120,
    value: 130,
    tone: "garden",
  },
] as const;

function formatSgd(amount: number) {
  return `S$${new Intl.NumberFormat("en-SG", { maximumFractionDigits: 0 }).format(amount)}`;
}

function discountBadge(savePercent: number | null | undefined) {
  if (savePercent == null || savePercent <= 0) return null;
  return `${savePercent}% off`;
}

const venues: Venue[] = [
  {
    name: "The Bandra Atelier",
    city: "Mumbai",
    address: "Pali Hill, Bandra West",
    note: "The original house",
    hours: "Open until 8:30 PM",
    image: "/brand-home-1/location-bandra.jpg",
  },
  {
    name: "The Lodhi House",
    city: "New Delhi",
    address: "Lodhi Colony, South Delhi",
    note: "Private colour rooms",
    hours: "Open until 8:00 PM",
    image: "/brand-home-1/location-lodhi.jpg",
  },
  {
    name: "Indiranagar Studio",
    city: "Bengaluru",
    address: "12th Main, Indiranagar",
    note: "Garden ritual terrace",
    hours: "Open until 9:00 PM",
    image: "/brand-home-1/location-indiranagar.jpg",
  },
];

function Arrow({ direction = "right" }: { direction?: "right" | "down" | "up" }) {
  const transform = direction === "down" ? "rotate(90 12 12)" : direction === "up" ? "rotate(-90 12 12)" : undefined;
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <g transform={transform}>
        <path d="M5 12h13M14 7l5 5-5 5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  );
}

function Mark() {
  return (
    <span className="me-mark" aria-hidden="true">
      <i>M</i><b>E</b>
    </span>
  );
}

function SectionIntro({
  eyebrow,
  title,
  copy,
  light = false,
}: {
  eyebrow: string;
  title: string;
  copy?: string;
  light?: boolean;
}) {
  return (
    <div className={`me-section-intro${light ? " is-light" : ""}`}>
      <span>{eyebrow}</span>
      <div>
        <h2>{title}</h2>
        {copy ? <p>{copy}</p> : null}
      </div>
    </div>
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
    <header className="me-commerce-intro">
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

function PlasticCardDeck({
  items,
  kindLabel,
  valueLabel,
  getValue,
  faceClassFor,
  ariaLabel,
  swipeHint,
  onViewDetails,
}: {
  items: readonly {
    id: string;
    name: string;
    tone: string;
    validityLabel: string;
    savePercent: number | null;
  }[];
  kindLabel: string;
  valueLabel: string;
  getValue: (item: { id: string }) => number;
  faceClassFor: (tone: string) => string;
  ariaLabel: string;
  swipeHint: string;
  onViewDetails: (item: (typeof items)[number], badge: string | null) => void;
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
    <div className="me-card-deck">
      <div
        className="me-card-track"
        ref={trackRef}
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
              className={`me-plastic-card ${faceClassFor(item.tone)}${activeIndex === index ? " is-active" : ""}`}
              aria-label={`${item.name}, ${formatSgd(value)} ${valueLabel.toLowerCase()}`}
              aria-current={activeIndex === index ? "true" : undefined}
            >
              <div className="me-plastic-shine" aria-hidden="true" />
              <div className="me-plastic-top">
                <span className="me-plastic-brand">Maison Élan</span>
                {badge ? <span className="me-plastic-badge">{badge}</span> : null}
              </div>
              <div className="me-plastic-mid">
                <p className="me-plastic-kind">{kindLabel}</p>
                <h3>{item.name}</h3>
                <p className="me-plastic-validity">{item.validityLabel}</p>
              </div>
              <div className="me-plastic-bottom">
                <div>
                  <span>{valueLabel}</span>
                  <strong>{formatSgd(value)}</strong>
                </div>
                <button
                  type="button"
                  className="me-plastic-action"
                  onClick={() => onViewDetails(item, badge)}
                >
                  View details
                </button>
              </div>
              <span className="me-plastic-mark" aria-hidden="true">É</span>
            </article>
          );
        })}
      </div>

      <div className="me-card-deck-controls">
        <button
          type="button"
          className="me-card-nav"
          aria-label={`Previous ${kindLabel.toLowerCase()}`}
          disabled={activeIndex === 0}
          onClick={() => scrollToIndex(Math.max(0, activeIndex - 1))}
        >
          <Arrow direction="right" />
        </button>
        <div className="me-card-dots" role="tablist" aria-label={`${ariaLabel} slides`}>
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
          className="me-card-nav me-card-nav-next"
          aria-label={`Next ${kindLabel.toLowerCase()}`}
          disabled={activeIndex === items.length - 1}
          onClick={() => scrollToIndex(Math.min(items.length - 1, activeIndex + 1))}
        >
          <Arrow />
        </button>
      </div>
      <p className="me-card-swipe-hint">{swipeHint}</p>
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
  const faceClass = offer.kind === "gift"
    ? `me-gift-face-${offer.tone}`
    : `me-offer-face-${offer.tone}`;

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
    <div className="me-offer-modal" role="presentation" onClick={onClose}>
      <div
        className="me-offer-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="me-offer-dialog-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className={`me-offer-dialog-hero ${faceClass}`}>
          <div className="me-offer-dialog-hero-top">
            <span className="me-offer-dialog-kind">{offerKindLabel(offer.kind)}</span>
            <button
              ref={closeRef}
              type="button"
              className="me-offer-dialog-close"
              aria-label="Close details"
              onClick={onClose}
            >
              ×
            </button>
          </div>
          {offer.badge ? <span className="me-offer-badge">{offer.badge}</span> : null}
          <h2 id="me-offer-dialog-title">{offer.name}</h2>
        </header>

        <div className="me-offer-dialog-body">
          <p className="me-offer-validity">
            {offer.sessionsLabel ? (
              <>
                {offer.sessionsLabel}
                <span aria-hidden="true"> · </span>
              </>
            ) : null}
            {offer.validityLabel}
          </p>
          <p className="me-commerce-desc">{offer.description}</p>

          {offer.inclusions && offer.inclusions.length > 0 ? (
            <div className="me-offer-dialog-block">
              <h3>Included</h3>
              <ul className="me-offer-inclusions">
                {offer.inclusions.map((entry) => (
                  <li key={entry}>{entry}</li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="me-offer-dialog-block">
            <h3>Details</h3>
            <ul className="me-offer-dialog-details">
              {offer.details.map((entry) => (
                <li key={entry}>{entry}</li>
              ))}
            </ul>
          </div>

          <div className="me-offer-finance">
            <div>
              <span>You pay</span>
              <strong className="is-pay">{formatSgd(offer.pay)}</strong>
            </div>
            <div>
              <span>{offer.secondaryLabel}</span>
              <strong>{formatSgd(offer.secondaryValue)}</strong>
            </div>
          </div>

          <button type="button" className="me-offer-buy" disabled aria-disabled="true">
            Buy now
          </button>
          <p className="me-offer-dialog-note">Purchase is not available in this preview.</p>
        </div>
      </div>
    </div>
  );
}

export default function MaisonElan() {
  const catalog = useDaSalonCatalog();
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState("");
  const [bookingOpen, setBookingOpen] = useState(false);
  const [bookingServiceId, setBookingServiceId] = useState<string | null>(null);
  const [activeOffer, setActiveOffer] = useState<OfferDetail | null>(null);
  const heroRef = useRef<HTMLElement>(null);
  const services = useMemo(() => catalog.data?.services ?? [], [catalog.data?.services]);
  const categories = useMemo(
    () => Array.from(new Set(services.map((service) => service.category || "Services"))),
    [services],
  );
  const selectedCategory = categories.includes(activeCategory) ? activeCategory : categories[0];

  const visibleServices = useMemo(
    () => services.filter((service) => (service.category || "Services") === selectedCategory),
    [selectedCategory, services],
  );

  function openBooking(serviceId?: string) {
    setBookingServiceId(serviceId || null);
    setBookingOpen(true);
    setMenuOpen(false);
  }

  function moveHero(event: React.PointerEvent<HTMLElement>) {
    const box = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - box.left) / box.width - 0.5) * 2;
    const y = ((event.clientY - box.top) / box.height - 0.5) * 2;
    heroRef.current?.style.setProperty("--hero-x", x.toFixed(3));
    heroRef.current?.style.setProperty("--hero-y", y.toFixed(3));
  }

  function resetHero() {
    heroRef.current?.style.setProperty("--hero-x", "0");
    heroRef.current?.style.setProperty("--hero-y", "0");
  }

  return (
    <div className="maison-elan" id="top">
      <header className="me-header">
        <a className="me-logo" href="#top" aria-label="Maison Élan home">
          <Mark />
          <span>Maison Élan<small>Private hair atelier</small></span>
        </a>
        <nav className={menuOpen ? "is-open" : ""} aria-label="Main navigation">
          <a href="#ritual" onClick={() => setMenuOpen(false)}>The ritual</a>
          <a href="#services" onClick={() => setMenuOpen(false)}>Services</a>
          <a href="#memberships" onClick={() => setMenuOpen(false)}>Memberships</a>
          <a href="#locations" onClick={() => setMenuOpen(false)}>Locations</a>
        </nav>
        <div className="me-header-actions">
          <button className="me-book-link" onClick={() => openBooking()}>Book an appointment</button>
          <button
            className={`me-menu-toggle${menuOpen ? " is-active" : ""}`}
            type="button"
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((value) => !value)}
          >
            <span /><span />
          </button>
        </div>
      </header>

      <main>
        <section
          className="me-hero"
          ref={heroRef}
          onPointerMove={moveHero}
          onPointerLeave={resetHero}
          aria-labelledby="me-hero-title"
        >
          <div className="me-hero-media" aria-hidden="true">
            <video
              autoPlay
              muted
              loop
              playsInline
              poster="/brand-home-1/maison-elan-hero.jpg"
            >
              <source src="/brand-home-1/maison-elan-hero.mp4" type="video/mp4" />
            </video>
            <div className="me-hero-vignette" />
            <div className="me-hero-glass me-hero-glass-one" />
            <div className="me-hero-glass me-hero-glass-two" />
            <div className="me-hero-orbit"><span>01</span><i /></div>
          </div>
          <div className="me-hero-copy">
            <p className="me-kicker"><span /> A private hair atelier</p>
            <h1 id="me-hero-title">Where the cut<br />becomes <em>ritual.</em></h1>
            <p className="me-hero-description">
              Precision, intuition and unhurried care—shaped around the person in the chair.
            </p>
            <div className="me-hero-buttons">
              <button className="me-button me-button-light" onClick={() => openBooking()}>
                Reserve your chair <Arrow />
              </button>
              <a className="me-text-link" href="#ritual">Enter the atelier <Arrow direction="down" /></a>
            </div>
          </div>
          <div className="me-hero-meta">
            <span>Scroll to enter</span>
            <i />
            <span>Mumbai · Delhi · Bengaluru</span>
          </div>
          <div className="me-depth-note" aria-hidden="true"><span>Move</span> to feel the space</div>
        </section>

        <section className="me-ritual" id="ritual">
          <div className="me-ritual-heading">
            <p className="me-index">01 / The Maison ritual</p>
            <h2>More than a service.<br /><em>A sequence of attention.</em></h2>
            <p>
              Inspired by the intimacy of a private atelier, every visit unfolds slowly—from a considered consultation to a finish designed for real life.
            </p>
          </div>
          <div className="me-ritual-stage">
            <div className="me-ritual-image-wrap">
              <span className="me-ritual-frame frame-one" aria-hidden="true" />
              <span className="me-ritual-frame frame-two" aria-hidden="true" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/brand-home-1/maison-elan-ritual.jpg"
                alt="Woman receiving an attentive luxury hair ritual in a mirror-lined salon"
                width={2336}
                height={1744}
              />
              <div className="me-image-caption"><span>Maison Élan</span><span>Ritual study, 2026</span></div>
            </div>
            <div className="me-ritual-steps">
              {[
                ["01", "Listen", "We begin with texture, rhythm and the way you want to feel."],
                ["02", "Shape", "Technique is chosen around your hair—not a one-size ritual."],
                ["03", "Reveal", "The finish is taught, refined and made effortless to repeat."],
              ].map(([number, title, copy]) => (
                <article key={number}>
                  <span>{number}</span>
                  <div><h3>{title}</h3><p>{copy}</p></div>
                </article>
              ))}
              <button className="me-circle-button" onClick={() => openBooking()} aria-label="Book the ritual">
                <span>Book<br />the ritual</span><Arrow />
              </button>
            </div>
          </div>
        </section>

        <section className="me-services" id="services">
          <SectionIntro
            eyebrow="02 / The service edit"
            title="Designed around your hair."
            copy="A concise menu of high-touch services, each beginning with a personal consultation."
          />
          <div className="me-service-tabs" role="tablist" aria-label="Service categories">
            {categories.map((category) => (
              <button
                key={category}
                className={selectedCategory === category ? "is-active" : ""}
                role="tab"
                aria-selected={selectedCategory === category}
                onClick={() => setActiveCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>
          <div className="me-service-list">
            {!visibleServices.length && <p className="live-menu-state" role="status">{catalog.loading ? "Loading the live service menu…" : catalog.error || "No services are currently bookable."}</p>}
            {visibleServices.map((service, index) => (
              <article key={service.name}>
                <span className="me-service-number">{String(index + 1).padStart(2, "0")}</span>
                <div className="me-service-main">
                  <h3>{service.name}</h3>
                  <p>{serviceDescription(service)}</p>
                </div>
                <div className="me-service-price"><span>{service.duration} min</span><strong>{formatCatalogPrice(service.price, catalog.data?.currency)}</strong></div>
                <button onClick={() => openBooking(service.id)} aria-label={`Book ${service.name}`}><Arrow /></button>
              </article>
            ))}
          </div>
        </section>

        <section className="me-commerce me-card-section" id="memberships">
          <CommerceIntro
            eyebrow="03 / Memberships"
            title="Belong with a balance that follows you."
            copy="Swipe through Maison memberships—wallet credit, validity and what you actually pay."
          />
          <div className="me-commerce-shell">
            <PlasticCardDeck
              items={memberships}
              kindLabel="Membership"
              valueLabel="Wallet credit"
              getValue={(item) => memberships.find((entry) => entry.id === item.id)?.credit ?? 0}
              faceClassFor={(tone) => `me-offer-face-${tone}`}
              ariaLabel="Memberships"
              swipeHint="Swipe to browse memberships"
              onViewDetails={(item, badge) => {
                const membership = memberships.find((entry) => entry.id === item.id);
                if (!membership) return;
                setActiveOffer({
                  kind: "membership",
                  id: membership.id,
                  name: membership.name,
                  tone: membership.tone,
                  badge,
                  validityLabel: membership.validityLabel,
                  description: membership.description,
                  details: [...membership.details],
                  pay: membership.pay,
                  secondaryLabel: "Wallet credit",
                  secondaryValue: membership.credit,
                });
              }}
            />
          </div>
        </section>

        <section className="me-commerce me-commerce-alt" id="packages">
          <CommerceIntro
            eyebrow="04 / Packages"
            title="Bundled rituals, priced with intention."
            copy="See the sessions included, how long they last, what they are worth and what you pay."
          />
          <div className="me-commerce-shell">
            <div className="me-commerce-rail">
              {packages.map((item) => {
                const badge = discountBadge(item.savePercent);
                return (
                  <article key={item.id} className="me-offer-card">
                    <header className={`me-offer-header me-offer-face-${item.tone}`}>
                      {badge ? <span className="me-offer-badge">{badge}</span> : null}
                      <h3>{item.name}</h3>
                    </header>
                    <div className="me-offer-body">
                      <p className="me-offer-validity">
                        {item.sessionsLabel}
                        <span aria-hidden="true"> · </span>
                        {item.validityLabel}
                      </p>
                      <ul className="me-offer-inclusions">
                        {item.inclusions.map((entry) => (
                          <li key={entry}>{entry}</li>
                        ))}
                      </ul>
                      <p className="me-commerce-desc">{item.description}</p>
                      <div className="me-offer-foot">
                        <div className="me-offer-finance">
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
                          className="me-offer-buy"
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

        <section className="me-commerce me-card-section" id="gift-cards">
          <CommerceIntro
            eyebrow="05 / Gift cards"
            title="Give them time in the chair."
            copy="Swipe through Maison gift cards—each one sized like a card you would keep in your wallet."
          />
          <div className="me-commerce-shell">
            <PlasticCardDeck
              items={giftCards}
              kindLabel="Gift card"
              valueLabel="Gift value"
              getValue={(item) => giftCards.find((entry) => entry.id === item.id)?.value ?? 0}
              faceClassFor={(tone) => `me-gift-face-${tone}`}
              ariaLabel="Gift cards"
              swipeHint="Swipe to browse gift cards"
              onViewDetails={(item, badge) => {
                const gift = giftCards.find((entry) => entry.id === item.id);
                if (!gift) return;
                setActiveOffer({
                  kind: "gift",
                  id: gift.id,
                  name: gift.name,
                  tone: gift.tone,
                  badge,
                  validityLabel: gift.validityLabel,
                  description: gift.description,
                  details: [...gift.details],
                  pay: gift.pay,
                  secondaryLabel: "Gift value",
                  secondaryValue: gift.value,
                });
              }}
            />
          </div>
        </section>

        <section className="me-about" id="about">
          <div className="me-about-panel">
            <p className="me-index">06 / The venue</p>
            <h2>A quiet place<br />for considered <em>beauty.</em></h2>
            <p>
              Maison Élan was founded on a simple idea: when time, technique and attention come together, a salon visit feels completely different. Each venue is built as a private house—warm, textural and intentionally unhurried.
            </p>
            <a href="#locations" className="me-underlined-link">Discover our Maisons <Arrow /></a>
          </div>
          <div className="me-about-details">
            <article><strong>12</strong><span>Private styling chairs</span></article>
            <article><strong>24</strong><span>Senior artists</span></article>
            <article><strong>4.9</strong><span>Average guest rating</span></article>
            <div className="me-amenities">
              <span>Private colour rooms</span><span>Quiet appointments</span><span>Valet parking</span><span>Wheelchair access</span><span>Pet friendly</span><span>Wi-Fi</span>
            </div>
          </div>
        </section>

        <section className="me-locations" id="locations">
          <SectionIntro
            eyebrow="07 / Our locations"
            title="Choose your Maison."
            copy="Your profile, preferences and loyalty follow you wherever you book."
          />
          <div className="me-location-grid">
            {venues.map((venue, index) => (
              <article key={venue.name}>
                <div className={`me-location-art location-${index + 1}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={venue.image}
                    alt={`Fictional preview of ${venue.name}`}
                    width={1536}
                    height={1024}
                    loading="lazy"
                  />
                  <span>{String(index + 1).padStart(2, "0")}</span><i />
                </div>
                <div className="me-location-copy">
                  <span>{venue.city} · {venue.note}</span>
                  <h3>{venue.name}</h3>
                  <p>{venue.address}</p>
                  <small><i /> {venue.hours}</small>
                  <button onClick={() => openBooking()}>Book this Maison <Arrow /></button>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="me-final-cta">
          <div className="me-final-monogram" aria-hidden="true">É</div>
          <p>Your chair is waiting.</p>
          <h2>Begin your ritual.</h2>
          <button className="me-button me-button-light" onClick={() => openBooking()}>Book an appointment <Arrow /></button>
        </section>
      </main>

      <footer className="me-footer">
        <div className="me-footer-brand"><a className="me-logo" href="#top"><Mark /><span>Maison Élan<small>Private hair atelier</small></span></a><p>Precision, intuition and unhurried care.</p></div>
        <div className="me-footer-links"><div><span>Explore</span><a href="#services">Services</a><a href="#memberships">Memberships</a><a href="#packages">Packages</a><a href="#gift-cards">Gift cards</a></div><div><span>Visit</span><a href="#locations">Locations</a><a href="#about">Our story</a><button onClick={() => openBooking()}>Book now</button></div></div>
        <div className="me-footer-bottom"><span>© 2026 Maison Élan</span><span>Custom salon experience by da Salon</span><a href="#top">Back to top <Arrow direction="up" /></a></div>
      </footer>

      <button className="me-mobile-book" onClick={() => openBooking()}>Book now <Arrow /></button>

      {activeOffer ? (
        <OfferDetailsModal offer={activeOffer} onClose={() => setActiveOffer(null)} />
      ) : null}

      {bookingOpen && <SalonBooking brand="Maison Élan" theme="maison" initialBootstrap={catalog.data} initialServiceId={bookingServiceId} onClose={() => setBookingOpen(false)} />}
    </div>
  );
}
