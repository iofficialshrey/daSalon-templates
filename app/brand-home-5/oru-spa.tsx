"use client";

import { useEffect, useRef, useState } from "react";
import SalonBooking, { type BookingService } from "../salon-booking";

const services: (BookingService & { index: string; note: string })[] = [
  { index: "01", name: "Deep Exhale Massage", duration: "75 min", price: "₹4,900", note: "Long pressure, warm botanical oil, and breath-led pacing for a body that has been holding too much." },
  { index: "02", name: "Oru Skin Reset", duration: "60 min", price: "₹4,200", note: "A barrier-first facial with gentle enzymes, cool sculpting tools, and concentrated hydration." },
  { index: "03", name: "Headspace Ritual", duration: "45 min", price: "₹3,300", note: "Scalp, neck, jaw, and facial release for screen-heavy days and restless sleep." },
  { index: "04", name: "Mineral Body Polish", duration: "60 min", price: "₹4,500", note: "Mineral exfoliation, a warm rinse, and eucalyptus body serum for smooth, rested skin." },
];

const journeys = [
  { index: "A", title: "The Deep Exhale", time: "120 min", price: "₹7,200", note: "Steam, full-body massage, and quiet pool time." },
  { index: "B", title: "Skin and Stillness", time: "105 min", price: "₹6,400", note: "Mineral steam, Skin Reset, and cooling tea." },
  { index: "C", title: "Sunday at Oru", time: "180 min", price: "₹9,800", note: "Pool, massage, seasonal lunch, and no clock." },
];

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
  const homeRef = useRef<HTMLDivElement>(null);
  const [activeService, setActiveService] = useState(0);
  const [giftValue, setGiftValue] = useState("₹5,000");
  const [bookingOpen, setBookingOpen] = useState(false);

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
          <a href="#o2-house">Oru House</a>
          <a href="#o2-locations">Locations</a>
        </nav>
        <button type="button" onClick={() => setBookingOpen(true)}>Book a ritual <span>↗</span></button>
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
              <button type="button" onClick={() => setBookingOpen(true)}><span>Begin at Oru</span><i>↘</i></button>
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
              {services.map((service, index) => (
                <article className={activeService === index ? "is-active" : ""} key={service.name}>
                  <button type="button" onClick={() => setActiveService(index)} aria-expanded={activeService === index}>
                    <span>{service.index}</span>
                    <strong>{service.name}</strong>
                    <small>{service.duration}</small>
                    <b>{service.price}</b>
                    <i aria-hidden="true" />
                  </button>
                  <div className="o2-treatment-detail">
                    <p>{service.note}</p>
                    <button type="button" onClick={() => setBookingOpen(true)}>Reserve this treatment <span>↗</span></button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="o2-journeys" data-o2-section aria-labelledby="o2-journeys-title">
          <header>
            <div className="o2-section-label"><span>03</span><p>Stay a little longer</p></div>
            <h2 id="o2-journeys-title">Half a day can change the shape of a week.</h2>
          </header>
          <div className="o2-journey-list">
            {journeys.map((journey) => (
              <article key={journey.title}>
                <span>{journey.index}</span>
                <h3>{journey.title}</h3>
                <p>{journey.note}</p>
                <div><small>{journey.time}</small><strong>{journey.price}</strong></div>
                <button type="button" onClick={() => setBookingOpen(true)}>Choose journey <i>↗</i></button>
              </article>
            ))}
          </div>
        </section>

        <section className="o2-house" id="o2-house" data-o2-section aria-labelledby="o2-house-title">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand-home-5/oru-house.png" alt="The lavender pool and recovery room at Oru House" />
          <span className="o2-house-grade" aria-hidden="true" />
          <div className="o2-house-copy">
            <div className="o2-section-label"><span>04</span><p>Oru House</p></div>
            <h2 id="o2-house-title">Come for the treatment. Stay for the quiet.</h2>
            <p>Membership makes recovery part of your ordinary rhythm, with a monthly ritual and open access to the pool, steam, and resting room.</p>
            <ul>
              <li><span>Monthly treatment</span><strong>1 credit</strong></li>
              <li><span>Pool and steam</span><strong>Any day</strong></li>
              <li><span>Guest treatments</span><strong>10% less</strong></li>
              <li><span>Monthly</span><strong>₹6,800</strong></li>
            </ul>
            <button type="button" onClick={() => setBookingOpen(true)}>Join Oru House <span>↗</span></button>
          </div>
        </section>

        <section className="o2-gift" data-o2-section aria-labelledby="o2-gift-title">
          <div className="o2-gift-copy">
            <div className="o2-section-label"><span>05</span><p>Oru, for someone else</p></div>
            <h2 id="o2-gift-title">Give them somewhere to put everything down.</h2>
            <p>Send instantly or choose a wrapped card with a handwritten note.</p>
          </div>
          <div className="o2-gift-builder">
            <div className="o2-gift-card">
              <OruMark />
              <p>A little room<br />for yourself.</p>
              <strong>{giftValue}</strong>
              <span aria-hidden="true"><i /><b /></span>
            </div>
            <div className="o2-gift-values" aria-label="Choose gift card value">
              {["₹3,500", "₹5,000", "₹7,500", "₹10,000"].map((value) => (
                <button className={giftValue === value ? "is-selected" : ""} type="button" key={value} onClick={() => setGiftValue(value)}>{value}</button>
              ))}
            </div>
            <button className="o2-gift-send" type="button">Send an Oru card <span>↗</span></button>
          </div>
        </section>

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
                <button type="button" onClick={() => setBookingOpen(true)}>Book this house <i>↗</i></button>
              </article>
            ))}
          </div>
        </section>

        <section className="o2-finale" data-o2-section aria-labelledby="o2-finale-title">
          <OruMark />
          <h2 id="o2-finale-title">You have time<br />to feel better.</h2>
          <button type="button" onClick={() => setBookingOpen(true)}><span>Book a ritual</span><i>↗</i></button>
          <footer>
            <span>Oru Spa</span>
            <span>Mumbai · Bengaluru</span>
            <a href="#o2-top">Return to the top ↑</a>
          </footer>
        </section>
      </main>

      {bookingOpen && <SalonBooking brand="Oru Spa" services={services} onClose={() => setBookingOpen(false)} />}
    </div>
  );
}
