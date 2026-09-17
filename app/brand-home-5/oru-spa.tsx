"use client";

import { useEffect, useRef, useState } from "react";
import SalonBooking from "../salon-booking";
import { BrandCommerce, defaultOffersForBrand } from "@/app/components/brand-commerce";
import type {
  BrandCommerceCopy,
  GiftOffer,
  MembershipOffer,
  PackageOffer,
} from "@/app/components/brand-commerce";
import { formatCatalogPrice, serviceDescription, useDaSalonCatalog } from "@/lib/dasalon/client";

const oruMemberships: MembershipOffer[] = [
  {
    id: "oru-house",
    name: "Oru House",
    validityLabel: "Valid for 6 months",
    savePercent: 12,
    description: "Recovery as part of your ordinary rhythm: credit for a monthly ritual and open access to the pool, steam, and resting room.",
    details: [
      "Credit for roughly one treatment each month",
      "Pool, steam, and resting room on any day you visit",
      "Guest treatments 10% less",
      "One balance shared across Mumbai and Bengaluru",
    ],
    pay: 720,
    credit: 820,
    tone: "aubergine",
  },
  {
    id: "oru-year-of-water",
    name: "Year of Water",
    validityLabel: "Valid for 12 months",
    savePercent: 16,
    description: "A full year of water, warmth, and touch, with the deepest credit and first sight of every seasonal journey.",
    details: [
      "The fullest wallet, for guests who return every few weeks",
      "Priority booking windows ahead of general release",
      "Seasonal journeys released to members first",
      "Unused credit expires with the membership window",
    ],
    pay: 1450,
    credit: 1720,
    tone: "ink",
  },
  {
    id: "oru-quiet-hour",
    name: "The Quiet Hour",
    validityLabel: "Valid for 3 months",
    savePercent: 9,
    description: "A lighter wallet for the short visits — steam, a massage on the way home, an hour with nothing in it.",
    details: [
      "Sized for 60 and 75 minute treatments",
      "Steam and resting room included with every visit",
      "A simple way to keep a balance ready between appointments",
      "Redeemable at either house",
    ],
    pay: 240,
    credit: 265,
    tone: "vermilion",
  },
];

const oruPackages: PackageOffer[] = [
  {
    id: "oru-deep-exhale",
    name: "The Deep Exhale",
    savePercent: 10,
    sessionsLabel: "1 visit · 120 min",
    validityLabel: "Valid for 90 days",
    inclusions: ["Mineral steam", "Full-body massage", "Quiet pool time"],
    description: "Steam, full-body massage, and quiet pool time — the long version of putting everything down.",
    details: [
      "One 120 minute visit, booked whenever the window suits",
      "Begins in the steam room and ends beside the pool",
      "Therapist matched after a short conversation",
      "Available at both houses",
    ],
    pay: 144,
    worth: 160,
    tone: "aubergine",
  },
  {
    id: "oru-skin-and-stillness",
    name: "Skin and Stillness",
    savePercent: 12,
    sessionsLabel: "1 visit · 105 min",
    validityLabel: "Valid for 90 days",
    inclusions: ["Mineral steam", "Skin Reset treatment", "Cooling tea and rest"],
    description: "Mineral steam, our Skin Reset, and cooling tea in the resting room afterwards.",
    details: [
      "One 105 minute visit shaped around skin",
      "Steam first, so the treatment settles deeper",
      "Home-care notes written for you before you leave",
      "Valid for ninety days from purchase",
    ],
    pay: 128,
    worth: 145,
    tone: "vermilion",
  },
  {
    id: "oru-sunday",
    name: "Sunday at Oru",
    savePercent: 15,
    sessionsLabel: "1 visit · 180 min",
    validityLabel: "Valid for 120 days",
    inclusions: ["Pool and steam circuit", "Full-body massage", "Seasonal lunch"],
    description: "Pool, massage, seasonal lunch, and no clock anywhere in the building.",
    details: [
      "Half a day held open for one guest",
      "Seasonal lunch served between water and treatment",
      "Best taken on a Sunday, though any day is yours",
      "Valid for one hundred and twenty days",
    ],
    pay: 196,
    worth: 230,
    tone: "ink",
  },
];

const oruGifts: GiftOffer[] = [
  {
    id: "oru-a-little-room",
    name: "A Little Room",
    validityLabel: "Valid for 1 year",
    savePercent: 10,
    description: "A little room for themselves — enough for a treatment and the slow hour after it.",
    details: [
      "Redeemable against any treatment or journey",
      "Send instantly or choose a wrapped card with a handwritten note",
      "Valid for twelve months from purchase",
      "Usable at either house",
    ],
    pay: 90,
    value: 100,
    tone: "aubergine",
  },
  {
    id: "oru-afternoon-off",
    name: "An Afternoon Off",
    validityLabel: "Valid for 1 year",
    savePercent: 10,
    description: "Enough for a full journey — steam, treatment, pool, and nowhere else to be.",
    details: [
      "Covers a complete journey with room to spare",
      "Arrives wrapped in house paper if you prefer",
      "Valid for twelve months from purchase",
      "The day and the therapist are theirs to choose",
    ],
    pay: 180,
    value: 200,
    tone: "vermilion",
  },
  {
    id: "oru-open-card",
    name: "The Open Card",
    validityLabel: "No expiry",
    savePercent: null,
    description: "An open card that waits as long as they need it to.",
    details: [
      "Open value with no expiry date",
      "Redeemable against treatments, journeys, or membership",
      "Balance can be spent across more than one visit",
      "Valid in Bandra West and Indiranagar",
    ],
    pay: 150,
    value: 150,
    tone: "ink",
  },
];

const oruCommerceCopy: BrandCommerceCopy = {
  ...defaultOffersForBrand("Oru", { eyebrowNumbers: ["03", "04", "05"] }).copy,
  membershipsTitle: "Come for the treatment. Stay for the quiet.",
  membershipsCopy: "Swipe through Oru memberships — wallet credit for treatments, open pool and steam days, and what you actually pay.",
  packagesTitle: "Half a day can change the shape of a week.",
  packagesCopy: "Every journey shows what it includes, how long the window lasts, what it is worth and what you pay.",
  giftsTitle: "Give them somewhere to put everything down.",
  giftsCopy: "Swipe through Oru cards — each one sized like something you would keep in your wallet.",
};

const locations = [
  { city: "Mumbai", area: "Bandra West", hours: "09:00 to 21:00" },
  { city: "Bengaluru", area: "Indiranagar", hours: "08:00 to 20:00" },
];

function OruMark() {
  return (
    <span className="o2-mark">
      <span aria-hidden="true"><i /><b /></span>
      <strong>oru</strong>
    </span>
  );
}

function clamp(value: number) {
  return Math.min(1, Math.max(0, value));
}

export default function OruSpa() {
  const catalog = useDaSalonCatalog();
  const homeRef = useRef<HTMLDivElement>(null);
  const [activeService, setActiveService] = useState(0);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [bookingServiceId, setBookingServiceId] = useState<string | null>(null);
  const services = (catalog.data?.services ?? []).map((service, index) => ({
    ...service,
    index: String(index + 1).padStart(2, "0"),
    durationLabel: `${service.duration} min`,
    priceLabel: formatCatalogPrice(service.price, catalog.data?.currency),
    note: serviceDescription(service),
  }));

  function openBooking(serviceId?: string) {
    setBookingServiceId(serviceId || null);
    setBookingOpen(true);
  }

  useEffect(() => {
    const home = homeRef.current;
    if (!home) return;

    let frame = 0;
    let scheduled = false;

    const paint = () => {
      scheduled = false;
      const pageDistance = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
      home.style.setProperty("--o2-page", clamp(window.scrollY / pageDistance).toFixed(4));
      home.querySelectorAll<HTMLElement>("[data-o2-section]").forEach((section) => {
        const rect = section.getBoundingClientRect();
        const range = window.innerHeight + rect.height;
        const progress = clamp((window.innerHeight - rect.top) / range);
        section.style.setProperty("--o2-view", progress.toFixed(4));
      });
    };

    const requestPaint = () => {
      if (scheduled) return;
      scheduled = true;
      frame = window.requestAnimationFrame(paint);
    };

    paint();
    window.addEventListener("scroll", requestPaint, { passive: true });
    window.addEventListener("resize", requestPaint);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", requestPaint);
      window.removeEventListener("resize", requestPaint);
    };
  }, []);

  return (
    <div className="o2-home" id="o2-top" ref={homeRef}>
      <div className="o2-breath-meter" aria-hidden="true">
        <span>Inhale</span><i><b /></i><span>Exhale</span>
      </div>

      <header className="o2-nav">
        <a href="#o2-top" aria-label="Oru Spa home"><OruMark /></a>
        <nav aria-label="Primary navigation">
          <a href="#o2-treatments">Treatments</a>
          <a href="#memberships">Oru House</a>
          <a href="#o2-locations">Locations</a>
        </nav>
        <button type="button" onClick={() => openBooking()}>Book a ritual <span>↗</span></button>
      </header>

      <main>
        <section className="o2-hero" data-o2-section>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand-home-5/oru-hero.png" alt="A guest standing beside the lavender-tiled thermal bath at Oru Spa" />
          <span className="o2-hero-wash" aria-hidden="true" />
          <div className="o2-hero-copy">
            <p>Urban spa · Mumbai and Bengaluru</p>
            <h1><span>The art of</span><strong>exhale.</strong></h1>
            <div>
              <p>Rest is not an escape. It is how you return with more of yourself.</p>
              <button type="button" onClick={() => openBooking()}><span>Begin at Oru</span><i>↘</i></button>
            </div>
          </div>
          <span className="o2-hero-edition">Oru / 05</span>
          <a className="o2-hero-scroll" href="#o2-manifesto">Scroll to soften <i /></a>
        </section>

        <section className="o2-manifesto" id="o2-manifesto" data-o2-section aria-labelledby="o2-manifesto-title">
          <div className="o2-section-label"><span>01</span><p>Our point of view</p></div>
          <div className="o2-manifesto-copy">
            <h2 id="o2-manifesto-title">Your body is not another thing to optimise.</h2>
            <div>
              <p>Oru is a house for touch, water, warmth, and the minutes between them. We listen first, then shape the ritual around what you need today.</p>
              <a href="#o2-treatments">Explore the treatment index <span>↘</span></a>
            </div>
          </div>
          <span className="o2-orbit o2-orbit-one" aria-hidden="true" />
          <span className="o2-orbit o2-orbit-two" aria-hidden="true" />
        </section>

        <section className="o2-treatments" id="o2-treatments" data-o2-section aria-labelledby="o2-treatments-title">
          <header>
            <div className="o2-section-label"><span>02</span><p>Treatment index</p></div>
            <h2 id="o2-treatments-title">Choose what you need, not what you should.</h2>
          </header>
          <div className="o2-treatment-grid">
            <div className="o2-treatment-image">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/brand-home-5/oru-ritual.png" alt="Botanical oil being prepared for an Oru ritual" />
              <span>Every ritual begins with a short conversation.</span>
            </div>
            <div className="o2-treatment-list">
              {!services.length && <p className="live-menu-state" role="status">{catalog.loading ? "Loading the live treatment menu…" : catalog.error || "No treatments are currently bookable."}</p>}
              {services.map((service, index) => (
                <article className={activeService === index ? "is-active" : ""} key={service.name}>
                  <button type="button" onClick={() => setActiveService(index)} aria-expanded={activeService === index}>
                    <span>{service.index}</span>
                    <strong>{service.name}</strong>
                    <small>{service.durationLabel}</small>
                    <b>{service.priceLabel}</b>
                    <i aria-hidden="true" />
                  </button>
                  <div className="o2-treatment-detail">
                    <p>{service.note}</p>
                    <button type="button" onClick={() => openBooking(service.id)}>Reserve this treatment <span>↗</span></button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <BrandCommerce
          theme="oru"
          brandName="Oru"
          brandMark="O"
          memberships={oruMemberships}
          packages={oruPackages}
          gifts={oruGifts}
          copy={oruCommerceCopy}
        />

        <section className="o2-quote" data-o2-section aria-labelledby="o2-quote-title">
          <div className="o2-section-label"><span>06</span><p>After Oru</p></div>
          <blockquote id="o2-quote-title">“I did not realise how much noise I was carrying until it was gone.”</blockquote>
          <p>Leena M. · Mumbai</p>
        </section>

        <section className="o2-locations" id="o2-locations" data-o2-section aria-labelledby="o2-locations-title">
          <header>
            <div className="o2-section-label"><span>07</span><p>Find Oru</p></div>
            <h2 id="o2-locations-title">Two houses.<br />One slower rhythm.</h2>
          </header>
          <div>
            {locations.map((location, index) => (
              <article key={location.city}>
                <span>0{index + 1}</span>
                <h3>{location.city}</h3>
                <p>{location.area}</p>
                <small>Daily · {location.hours}</small>
                <button type="button" onClick={() => openBooking()}>Book this house <i>↗</i></button>
              </article>
            ))}
          </div>
        </section>

        <section className="o2-finale" data-o2-section aria-labelledby="o2-finale-title">
          <OruMark />
          <h2 id="o2-finale-title">You have time<br />to feel better.</h2>
          <button type="button" onClick={() => openBooking()}><span>Book a ritual</span><i>↗</i></button>
          <footer>
            <span>Oru Spa</span>
            <span>Mumbai · Bengaluru</span>
            <a href="#o2-top">Return to the top ↑</a>
          </footer>
        </section>
      </main>

      {bookingOpen && <SalonBooking brand="Oru Spa" theme="oru" initialBootstrap={catalog.data} initialServiceId={bookingServiceId} onClose={() => setBookingOpen(false)} />}
    </div>
  );
}
