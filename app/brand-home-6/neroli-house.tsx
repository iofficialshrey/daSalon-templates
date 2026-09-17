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

const neroliMemberships: MembershipOffer[] = [
  {
    id: "neroli-house",
    name: "Néroli House",
    validityLabel: "Valid for 6 months",
    savePercent: 12,
    description: "One treatment each month, open use of the mineral pool and steam rooms, and a quiet place waiting between visits.",
    details: [
      "Credit for one treatment each month",
      "Unlimited mineral pool and steam room access",
      "Guest rituals 12% less",
      "One balance shared across Mumbai and Bengaluru",
    ],
    pay: 780,
    credit: 890,
    tone: "celadon",
  },
  {
    id: "neroli-mineral-year",
    name: "The Mineral Year",
    validityLabel: "Valid for 12 months",
    savePercent: 15,
    description: "A year of water and warmth, with the fullest credit and the first invitations to seasonal rituals.",
    details: [
      "The fullest wallet, for guests who visit every few weeks",
      "Priority booking windows ahead of general release",
      "Seasonal rituals offered to members first",
      "Unused credit expires with the membership window",
    ],
    pay: 1580,
    credit: 1860,
    tone: "sage",
  },
  {
    id: "neroli-still-water",
    name: "Still Water",
    validityLabel: "Valid for 3 months",
    savePercent: 9,
    description: "A lighter balance for short visits — steam, a shorter treatment, and an hour by the pool.",
    details: [
      "Sized for 60 and 75 minute rituals",
      "Mineral pool and steam access on every visit",
      "A simple way to keep a balance ready between visits",
      "Redeemable at either house",
    ],
    pay: 265,
    credit: 290,
    tone: "coral",
  },
];

const neroliPackages: PackageOffer[] = [
  {
    id: "neroli-three-waters",
    name: "The Three Waters",
    savePercent: 15,
    sessionsLabel: "3 visits included",
    validityLabel: "Valid for 120 days",
    inclusions: ["Mineral steam circuit", "Signature body ritual", "Pool and resting hour"],
    description: "Three visits through the same sequence — settle, restore, return — spaced however your months allow.",
    details: [
      "Three complete visits, each shaped the same way",
      "Space them across one hundred and twenty days",
      "Mineral steam circuit before every treatment",
      "Book each visit independently",
    ],
    pay: 340,
    worth: 400,
    tone: "celadon",
  },
  {
    id: "neroli-skin-restored",
    name: "Skin, Restored",
    savePercent: 12,
    sessionsLabel: "2 visits included",
    validityLabel: "Valid for 6 months",
    inclusions: ["Mineral facial ritual", "Repair mask and massage", "Home-care consult"],
    description: "Two visits built around skin, with a home-care consult so the work holds between them.",
    details: [
      "Two visits focused on skin and its recovery",
      "Repair mask and facial massage in both sessions",
      "Home-care consult with notes written for you",
      "Valid for six months from purchase",
    ],
    pay: 245,
    worth: 280,
    tone: "coral",
  },
  {
    id: "neroli-slow-weekend",
    name: "A Slow Weekend",
    savePercent: 12,
    sessionsLabel: "1 visit · half a day",
    validityLabel: "Valid for 90 days",
    inclusions: ["Néroli tea and mineral steam", "Full-body ritual", "Seasonal lunch by the pool"],
    description: "Half a day held open: tea, steam, a full-body ritual, and lunch beside the water.",
    details: [
      "One long visit, roughly half a day",
      "Seasonal lunch served between water and treatment",
      "Slow re-entry to the city, at your own pace",
      "Valid for ninety days from purchase",
    ],
    pay: 210,
    worth: 240,
    tone: "sage",
  },
];

const neroliGifts: GiftOffer[] = [
  {
    id: "neroli-time-well-spent",
    name: "For Time Well Spent",
    validityLabel: "Valid for 1 year",
    savePercent: 10,
    description: "Enough for a ritual and the quiet hour that follows it.",
    details: [
      "Redeemable against any treatment or package",
      "Send instantly or have it wrapped in mineral paper",
      "Valid for twelve months from purchase",
      "Usable at either house",
    ],
    pay: 90,
    value: 100,
    tone: "celadon",
  },
  {
    id: "neroli-long-soak",
    name: "The Long Soak",
    validityLabel: "Valid for 1 year",
    savePercent: 10,
    description: "A fuller card, sized for the half-day rituals and the pool afterwards.",
    details: [
      "Covers a half-day ritual with room to spare",
      "Arrives with a handwritten note if you prefer",
      "Valid for twelve months from purchase",
      "The day and the therapist are theirs to choose",
    ],
    pay: 180,
    value: 200,
    tone: "coral",
  },
  {
    id: "neroli-open-card",
    name: "Open Néroli",
    validityLabel: "No expiry",
    savePercent: null,
    description: "An open card with no date on it, waiting for the week they need it.",
    details: [
      "Open value with no expiry date",
      "Redeemable against treatments, packages, or membership",
      "Balance can be spent across more than one visit",
      "Valid in Bandra West and Indiranagar",
    ],
    pay: 150,
    value: 150,
    tone: "sage",
  },
];

const neroliCommerceCopy: BrandCommerceCopy = {
  ...defaultOffersForBrand("Néroli", { eyebrowNumbers: ["03", "04", "05"] }).copy,
  membershipsTitle: "Make restoration part of your rhythm.",
  membershipsCopy: "Swipe through Néroli memberships — treatment credit, mineral pool and steam access, and what you actually pay.",
  packagesTitle: "Several visits, gathered into one price.",
  packagesCopy: "Every package shows the visits included, how long they last, what they are worth and what you pay.",
  giftsTitle: "A ritual, chosen now or later.",
  giftsCopy: "Swipe through Néroli cards — send one instantly, or keep it until the right week arrives.",
};

const dayRituals = [
  { number: "I", title: "Settle", copy: "Neroli tea, mineral steam, and time to arrive without rushing." },
  { number: "II", title: "Restore", copy: "A treatment shaped around how your body and skin feel today." },
  { number: "III", title: "Return", copy: "Quiet pool time, seasonal fruit, and a slow re-entry to the city." },
];

const locations = [
  { city: "Mumbai", place: "Bandra West", hours: "Daily 09:00 to 21:00" },
  { city: "Bengaluru", place: "Indiranagar", hours: "Daily 08:00 to 20:00" },
];

function clamp(value: number, minimum = 0, maximum = 1) {
  return Math.min(maximum, Math.max(minimum, value));
}

function mix(from: number, to: number, progress: number) {
  return from + (to - from) * progress;
}

function smoothstep(value: number) {
  const progress = clamp(value);
  return progress * progress * (3 - 2 * progress);
}

function NeroliWordmark() {
  return (
    <span className="n6-wordmark">
      <span className="n6-wordmark-symbol" aria-hidden="true"><i /><b /><em /></span>
      <strong>Néroli</strong>
      <small>House</small>
    </span>
  );
}

export default function NeroliHouse() {
  const catalog = useDaSalonCatalog();
  const homeRef = useRef<HTMLDivElement>(null);
  const guideRef = useRef<HTMLDivElement>(null);
  const [activeTreatment, setActiveTreatment] = useState(0);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [bookingServiceId, setBookingServiceId] = useState<string | null>(null);
  const treatments = (catalog.data?.services ?? []).map((service, index) => ({
    ...service,
    index: String(index + 1).padStart(2, "0"),
    durationLabel: `${service.duration} min`,
    priceLabel: formatCatalogPrice(service.price, catalog.data?.currency),
    note: serviceDescription(service),
  }));

  useEffect(() => {
    const home = homeRef.current;
    const guide = guideRef.current;
    if (!home || !guide) return;

    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const compactQuery = window.matchMedia("(max-width: 899px)");
    let frame = 0;
    let targetScroll = window.scrollY;
    let paintedScroll = targetScroll;
    let anchors: Array<{
      x: number;
      y: number;
      trigger: number;
      scale: number;
      shape: number;
      bloom: number;
      rotate: number;
    }> = [];

    const measure = () => {
      targetScroll = window.scrollY;
      anchors = Array.from(home.querySelectorAll<HTMLElement>("[data-guide]"))
        .map((element) => {
          const rect = element.getBoundingClientRect();
          const y = rect.top + window.scrollY + rect.height / 2;
          return {
            x: rect.left + rect.width / 2,
            y,
            trigger: y - window.innerHeight * 0.5,
            scale: Number(element.dataset.scale ?? 1),
            shape: Number(element.dataset.shape ?? 0),
            bloom: Number(element.dataset.bloom ?? 0),
            rotate: Number(element.dataset.rotate ?? 0),
          };
        })
        .sort((a, b) => a.trigger - b.trigger);
    };

    const paintSections = () => {
      home.querySelectorAll<HTMLElement>("[data-scroll-section]").forEach((section) => {
        const rect = section.getBoundingClientRect();
        const distance = Math.abs(rect.top + rect.height / 2 - window.innerHeight / 2);
        const range = window.innerHeight * 0.72 + rect.height * 0.32;
        section.style.setProperty("--n6-section", clamp(1 - distance / range).toFixed(4));
      });
      const pageDistance = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
      home.style.setProperty("--n6-page", clamp(window.scrollY / pageDistance).toFixed(4));
    };

    const paintGuide = () => {
      if (anchors.length === 0 || motionQuery.matches || compactQuery.matches) return;

      let start = anchors[0];
      let end = anchors[0];
      for (let index = 0; index < anchors.length - 1; index += 1) {
        if (paintedScroll >= anchors[index].trigger) {
          start = anchors[index];
          end = anchors[index + 1];
        }
      }
      if (paintedScroll >= anchors[anchors.length - 1].trigger) {
        start = anchors[anchors.length - 1];
        end = start;
      }

      const distance = Math.max(end.trigger - start.trigger, 1);
      const progress = start === end ? 0 : smoothstep((paintedScroll - start.trigger) / distance);
      const x = mix(start.x, end.x, progress);
      const documentY = mix(start.y, end.y, progress);
      const scale = mix(start.scale, end.scale, progress);
      const shape = mix(start.shape, end.shape, progress);
      const bloom = mix(start.bloom, end.bloom, progress);
      const rotate = mix(start.rotate, end.rotate, progress);

      guide.style.setProperty("--n6-guide-scale", scale.toFixed(4));
      guide.style.setProperty("--n6-guide-shape", shape.toFixed(4));
      guide.style.setProperty("--n6-guide-bloom", bloom.toFixed(4));
      guide.style.setProperty("--n6-guide-rotate", `${rotate.toFixed(2)}deg`);
      guide.style.transform = `translate3d(${x.toFixed(1)}px, ${(documentY - paintedScroll).toFixed(1)}px, 0) translate(-50%, -50%) scale(${scale.toFixed(4)})`;
    };

    const tick = () => {
      paintedScroll += (targetScroll - paintedScroll) * 0.085;
      if (Math.abs(targetScroll - paintedScroll) < 0.05) paintedScroll = targetScroll;
      paintGuide();
      paintSections();
      frame = window.requestAnimationFrame(tick);
    };

    const onScroll = () => {
      targetScroll = window.scrollY;
    };
    const onResize = () => measure();
    const onMotionChange = () => {
      home.dataset.motion = motionQuery.matches || compactQuery.matches ? "static" : "live";
      measure();
    };

    home.dataset.motion = motionQuery.matches || compactQuery.matches ? "static" : "live";
    measure();
    paintSections();
    frame = window.requestAnimationFrame(tick);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    motionQuery.addEventListener("change", onMotionChange);
    compactQuery.addEventListener("change", onMotionChange);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      motionQuery.removeEventListener("change", onMotionChange);
      compactQuery.removeEventListener("change", onMotionChange);
    };
  }, []);

  function openBooking(serviceId?: string) {
    setBookingServiceId(serviceId || null);
    setBookingOpen(true);
  }

  return (
    <div className="n6-home" id="top" ref={homeRef}>
      <div className="n6-page-progress" aria-hidden="true"><i /></div>
      <header className="n6-nav">
        <a href="#top" aria-label="Néroli House home"><NeroliWordmark /></a>
        <nav aria-label="Primary navigation">
          <a href="#treatments">Treatments</a>
          <a href="#memberships">Memberships</a>
          <a href="#packages">Packages</a>
          <a href="#gift-cards">Gifting</a>
        </nav>
        <button type="button" onClick={() => openBooking()}>
          Book a visit <span aria-hidden="true">↗</span>
        </button>
      </header>

      <div className="n6-guide" ref={guideRef} aria-hidden="true">
        <span className="n6-guide-shadow" />
        <span className="n6-guide-petal n6-petal-one" />
        <span className="n6-guide-petal n6-petal-two" />
        <span className="n6-guide-petal n6-petal-three" />
        <span className="n6-guide-petal n6-petal-four" />
        <span className="n6-guide-pearl"><i /><b /><em /></span>
      </div>

      <main>
        <section className="n6-hero" data-scroll-section>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="n6-hero-image" src="/brand-home-6/neroli-arrival.png" alt="A luminous mineral spa with a circular water basin" />
          <span className="n6-hero-wash" aria-hidden="true" />
          <div className="n6-hero-copy">
            <p className="n6-kicker"><span>Mineral spa</span><span>Mumbai · Bengaluru</span></p>
            <h1>
              <span className="n6-title-line"><span>Come back</span></span>
              <span className="n6-title-line"><span>to your senses.</span></span>
            </h1>
            <p>Water, warmth, touch, and enough time to feel the difference.</p>
            <button className="n6-hero-cta" type="button" onClick={() => openBooking()}>
              <span>Begin your visit</span><i aria-hidden="true">↘</i>
            </button>
          </div>
          <div className="n6-hero-index" aria-hidden="true"><span>01</span><i /><span>08</span></div>
          <span className="n6-anchor n6-anchor-hero" data-guide data-scale="1.18" data-shape="0" data-bloom="0" data-rotate="0" />
          <a className="n6-scroll-cue" href="#treatments"><span>Follow the water</span><i /></a>
        </section>

        <section className="n6-treatments" id="treatments" data-scroll-section aria-labelledby="n6-treatments-title">
          <span className="n6-route-line" aria-hidden="true"><i /></span>
          <header className="n6-section-head">
            <p><span>01</span> Treatment menu</p>
            <h2 id="n6-treatments-title">Rituals shaped around how you arrive.</h2>
            <span className="n6-anchor n6-anchor-treatments" data-guide data-scale=".34" data-shape=".35" data-bloom="0" data-rotate="18" />
          </header>
          <div className="n6-treatment-layout">
            <div className="n6-treatment-image">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/brand-home-6/neroli-treatment.png" alt="A mineral treatment room with celadon linen and neroli blossom" />
              <span>Botanical oils, mineral warmth, unhurried hands</span>
              <span className="n6-anchor n6-anchor-treatment-image" data-guide data-scale=".82" data-shape="1" data-bloom=".12" data-rotate="-12" />
            </div>
            <div className="n6-treatment-list">
              {!treatments.length && <p className="live-menu-state" role="status">{catalog.loading ? "Loading the live treatment menu…" : catalog.error || "No treatments are currently bookable."}</p>}
              {treatments.map((treatment, index) => (
                <article className={activeTreatment === index ? "is-active" : ""} key={treatment.name}>
                  <button type="button" onClick={() => setActiveTreatment(index)} aria-expanded={activeTreatment === index}>
                    <span>{treatment.index}</span>
                    <strong>{treatment.name}</strong>
                    <small>{treatment.durationLabel}</small>
                    <b>{treatment.priceLabel}</b>
                    <i aria-hidden="true" />
                  </button>
                  <div className="n6-treatment-note">
                    <p>{treatment.note}</p>
                    <button type="button" onClick={() => openBooking(treatment.id)}>Reserve this ritual <span>↗</span></button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="n6-day" data-scroll-section aria-labelledby="n6-day-title">
          <header>
            <p><span>02</span> A day at Néroli</p>
            <h2 id="n6-day-title">Rest is not one moment. It is a sequence.</h2>
          </header>
          <div className="n6-day-track">
            {dayRituals.map((ritual) => (
              <article key={ritual.title}>
                <span>{ritual.number}</span>
                <div><h3>{ritual.title}</h3><p>{ritual.copy}</p></div>
              </article>
            ))}
          </div>
          <span className="n6-anchor n6-anchor-day" data-guide data-scale=".47" data-shape=".72" data-bloom=".28" data-rotate="24" />
        </section>

        <BrandCommerce
          theme="neroli"
          brandName="Néroli"
          brandMark="N"
          memberships={neroliMemberships}
          packages={neroliPackages}
          gifts={neroliGifts}
          copy={neroliCommerceCopy}
        />

        <section className="n6-guest" data-scroll-section aria-labelledby="n6-guest-title">
          <p><span>06</span> Guest note</p>
          <blockquote id="n6-guest-title">“It feels considered from the first cup of tea to the moment you step outside.”</blockquote>
          <div><span>Aanya S.</span><span>House member since 2025</span></div>
        </section>

        <section className="n6-locations" data-scroll-section aria-labelledby="n6-locations-title">
          <header>
            <p><span>07</span> Visit</p>
            <h2 id="n6-locations-title">Find your water.</h2>
          </header>
          <div className="n6-location-list">
            {locations.map((location, index) => (
              <article key={location.city}>
                <span>0{index + 1}</span>
                <h3>{location.city}</h3>
                <p>{location.place}</p>
                <small>{location.hours}</small>
                <button type="button" onClick={() => openBooking()}>Book here <i>↗</i></button>
              </article>
            ))}
          </div>
          <span className="n6-anchor n6-anchor-locations" data-guide data-scale=".28" data-shape=".9" data-bloom=".1" data-rotate="125" />
        </section>

        <section className="n6-finale" data-scroll-section aria-labelledby="n6-finale-title">
          <p><span>08</span> Your time</p>
          <h2 id="n6-finale-title">Leave room<br />for yourself.</h2>
          <button type="button" onClick={() => openBooking()}><span>Book Néroli</span><i aria-hidden="true">↗</i></button>
          <span className="n6-anchor n6-anchor-finale" data-guide data-scale="1.05" data-shape="0" data-bloom="1" data-rotate="180" />
          <footer>
            <NeroliWordmark />
            <span>Mumbai · Bengaluru</span>
            <a href="#top">Return to the surface ↑</a>
          </footer>
        </section>
      </main>

      {bookingOpen && (
        <SalonBooking
          brand="Néroli House"
          theme="neroli"
          initialBootstrap={catalog.data}
          initialServiceId={bookingServiceId}
          onClose={() => setBookingOpen(false)}
        />
      )}
    </div>
  );
}
