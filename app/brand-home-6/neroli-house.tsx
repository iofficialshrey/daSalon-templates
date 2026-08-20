"use client";

import { useEffect, useRef, useState } from "react";
import SalonBooking, { type BookingService } from "../salon-booking";

const treatments: (BookingService & { note: string; index: string })[] = [
  {
    index: "01",
    name: "Mineral Immersion",
    duration: "90 min",
    price: "₹5,800",
    note: "Warm water, full-body exfoliation, and a slow mineral-oil massage.",
  },
  {
    index: "02",
    name: "Néroli Face Ritual",
    duration: "75 min",
    price: "₹4,600",
    note: "Barrier-first skin work, cool glass massage, and neroli hydration.",
  },
  {
    index: "03",
    name: "Deep Current",
    duration: "60 min",
    price: "₹4,200",
    note: "Targeted pressure, assisted stretch, and warmth for tired muscles.",
  },
  {
    index: "04",
    name: "Quiet Headspace",
    duration: "45 min",
    price: "₹3,200",
    note: "Scalp, neck, and facial release designed for screen-heavy days.",
  },
];

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
  const homeRef = useRef<HTMLDivElement>(null);
  const guideRef = useRef<HTMLDivElement>(null);
  const [activeTreatment, setActiveTreatment] = useState(0);
  const [giftValue, setGiftValue] = useState("₹5,000");
  const [bookingOpen, setBookingOpen] = useState(false);

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

  function openBooking(serviceIndex?: number) {
    if (typeof serviceIndex === "number") setActiveTreatment(serviceIndex);
    setBookingOpen(true);
  }

  return (
    <div className="n6-home" id="top" ref={homeRef}>
      <div className="n6-page-progress" aria-hidden="true"><i /></div>
      <header className="n6-nav">
        <a href="#top" aria-label="Néroli House home"><NeroliWordmark /></a>
        <nav aria-label="Primary navigation">
          <a href="#treatments">Treatments</a>
          <a href="#house">The House</a>
          <a href="#gifting">Gifting</a>
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
          <div className="n6-hero-index" aria-hidden="true"><span>01</span><i /><span>07</span></div>
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
              {treatments.map((treatment, index) => (
                <article className={activeTreatment === index ? "is-active" : ""} key={treatment.name}>
                  <button type="button" onClick={() => setActiveTreatment(index)} aria-expanded={activeTreatment === index}>
                    <span>{treatment.index}</span>
                    <strong>{treatment.name}</strong>
                    <small>{treatment.duration}</small>
                    <b>{treatment.price}</b>
                    <i aria-hidden="true" />
                  </button>
                  <div className="n6-treatment-note">
                    <p>{treatment.note}</p>
                    <button type="button" onClick={() => openBooking(index)}>Reserve this ritual <span>↗</span></button>
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

        <section className="n6-house" id="house" data-scroll-section aria-labelledby="n6-house-title">
          <div className="n6-house-image">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand-home-6/neroli-house.png" alt="The Néroli House recovery lounge opening onto a reflecting pool" />
            <div className="n6-house-stamp" aria-hidden="true"><span>NH</span><i>Est. 2026</i></div>
          </div>
          <div className="n6-house-copy">
            <p><span>03</span> Néroli House</p>
            <h2 id="n6-house-title">Make restoration part of your rhythm.</h2>
            <p>One treatment each month, open use of the mineral pool and steam rooms, and a quiet place waiting between visits.</p>
            <ul>
              <li><span>Monthly treatment credit</span><strong>01</strong></li>
              <li><span>Pool and steam access</span><strong>Unlimited</strong></li>
              <li><span>Guest ritual saving</span><strong>12%</strong></li>
              <li><span>Monthly</span><strong>₹7,400</strong></li>
            </ul>
            <button type="button" onClick={() => openBooking()}><span>Enter the House</span><i aria-hidden="true">↗</i></button>
          </div>
          <span className="n6-anchor n6-anchor-house" data-guide data-scale=".52" data-shape=".2" data-bloom="1" data-rotate="45" />
        </section>

        <section className="n6-gift" id="gifting" data-scroll-section aria-labelledby="n6-gift-title">
          <div className="n6-gift-copy">
            <p><span>04</span> Give time</p>
            <h2 id="n6-gift-title">A ritual, chosen now or later.</h2>
            <p>Send a Néroli card instantly or have it wrapped in mineral paper with a handwritten note.</p>
          </div>
          <div className="n6-gift-builder">
            <div className="n6-gift-card" aria-label={`Néroli House gift card for ${giftValue}`}>
              <NeroliWordmark />
              <span>For time well spent</span>
              <strong>{giftValue}</strong>
              <i aria-hidden="true" />
            </div>
            <div className="n6-gift-values" aria-label="Choose gift card value">
              {["₹3,500", "₹5,000", "₹7,500", "₹10,000"].map((value) => (
                <button className={giftValue === value ? "is-selected" : ""} type="button" key={value} onClick={() => setGiftValue(value)}>{value}</button>
              ))}
            </div>
            <button className="n6-send-gift" type="button">Send this ritual <span aria-hidden="true">↗</span></button>
          </div>
          <span className="n6-anchor n6-anchor-gift" data-guide data-scale=".7" data-shape=".5" data-bloom=".7" data-rotate="88" />
        </section>

        <section className="n6-guest" data-scroll-section aria-labelledby="n6-guest-title">
          <p><span>05</span> Guest note</p>
          <blockquote id="n6-guest-title">“It feels considered from the first cup of tea to the moment you step outside.”</blockquote>
          <div><span>Aanya S.</span><span>House member since 2025</span></div>
        </section>

        <section className="n6-locations" data-scroll-section aria-labelledby="n6-locations-title">
          <header>
            <p><span>06</span> Visit</p>
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
          <p><span>07</span> Your time</p>
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
          services={treatments}
          onClose={() => setBookingOpen(false)}
        />
      )}
    </div>
  );
}
