"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import SalonBooking, { type BookingService } from "../salon-booking";

const services: BookingService[] = [
  { name: "The Signature Cut", duration: "70 min", price: "₹3,200" },
  { name: "Chromatic Colour", duration: "120 min", price: "₹7,800" },
  { name: "Air-Dry Shape", duration: "55 min", price: "₹2,600" },
  { name: "Editorial Finish", duration: "50 min", price: "₹2,400" },
];

const editions = [
  { number: "01", title: "Cut / Form", note: "Movement before symmetry", description: "A dry and wet cutting dialogue that follows texture, proportion and the shape you make when you move.", price: "from ₹3,200" },
  { number: "02", title: "Colour / Light", note: "Dimension without noise", description: "Custom tone, placement and finish designed around skin, natural light and a considered grow-out.", price: "from ₹7,800" },
  { number: "03", title: "Care / Repair", note: "Structure, restored", description: "Scalp analysis and bond-led rituals that restore clarity, softness and strength without weighing hair down.", price: "from ₹3,600" },
  { number: "04", title: "Style / Occasion", note: "A look with a point of view", description: "Editorial styling for evenings, weddings and shoots, developed with wardrobe and context in mind.", price: "from ₹2,400" },
];

const studios = [
  { city: "Mumbai", address: "Bandra West", code: "BOM / 01", hours: "Tue–Sun, 10–20" },
  { city: "Delhi", address: "Lodhi Colony", code: "DEL / 02", hours: "Tue–Sun, 10–20" },
  { city: "Bengaluru", address: "Indiranagar", code: "BLR / 03", hours: "Mon–Sat, 09–19" },
  { city: "Goa", address: "Assagao", code: "GOI / 04", hours: "Wed–Sun, 10–19" },
];

function PalomaMark() {
  return <span className="p4-mark"><b>PALOMA</b><small>Hair + Form</small></span>;
}

export default function PalomaStudio() {
  const heroRef = useRef<HTMLElement>(null);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [activeService, setActiveService] = useState(0);
  const [gift, setGift] = useState("₹5,000");

  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const distance = Math.max(0, -hero.getBoundingClientRect().top);
      const progress = Math.min(1, distance / Math.max(hero.offsetHeight, 1));
      hero.style.setProperty("--p4-scroll", progress.toFixed(4));
    };
    const requestUpdate = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", requestUpdate, { passive: true });
    return () => { window.removeEventListener("scroll", requestUpdate); if (frame) cancelAnimationFrame(frame); };
  }, []);

  return <div className="paloma-brand-home">
    <header className="p4-nav">
      <a href="#cover" aria-label="Paloma home"><PalomaMark /></a>
      <nav><a href="#editions">Services</a><a href="#circle">Circle</a><a href="#studios">Studios</a></nav>
      <button onClick={() => setBookingOpen(true)}>Make an appointment <span>↗</span></button>
    </header>

    <main>
      <section ref={heroRef} id="cover" className="p4-cover" aria-labelledby="p4-title">
        <div className="p4-cover-media"><Image src="/brand-home-4/hero.png" alt="Woman with sculptural flowing hair in a dark editorial portrait" fill priority sizes="(max-width: 640px) 100vw, 60vw" /></div>
        <div className="p4-cover-grid" aria-hidden="true" />
        <p className="p4-issue">Issue 04 <span>◆</span> 2026</p>
        <h1 id="p4-title"><span>Form follows</span><strong>feeling.</strong></h1>
        <p className="p4-cover-note">Cut, colour and care for people who would rather be recognised than repeated.</p>
        <button className="p4-cover-cta" onClick={() => setBookingOpen(true)}><span>Book<br />the look</span><b>↗</b></button>
        <div className="p4-scroll-note"><span>Scroll the issue</span><i /></div>
      </section>

      <section className="p4-ticker" aria-label="Paloma studio philosophy"><div><span>HAIR IS MATERIAL</span><b>◆</b><span>STYLE IS PERSONAL</span><b>◆</b><span>CHANGE IS WELCOME</span><b>◆</b><span>HAIR IS MATERIAL</span><b>◆</b></div></section>

      <section className="p4-manifesto">
        <span className="p4-kicker">Paloma point of view / 001</span>
        <h2>Not a makeover.<br /><em>A clearer version.</em></h2>
        <div><p>We begin with how you live, then work through line, texture and colour. No reference photo is copied. No finish is prescribed.</p><p>Every appointment leaves room for instinct, with the technical discipline to make it last beyond the mirror.</p></div>
      </section>

      <section id="editions" className="p4-editions">
        <header><span className="p4-kicker">Service editions / 002</span><h2>Choose your edit.</h2><p>Four ways into the Paloma practice.</p></header>
        <div className="p4-edition-layout">
          <div className="p4-edition-list" role="tablist">{editions.map((edition, index) => <button role="tab" aria-selected={activeService === index} onClick={() => setActiveService(index)} key={edition.title}><span>{edition.number}</span><strong>{edition.title}</strong><small>{edition.price}</small></button>)}</div>
          <article className="p4-edition-detail"><span>{editions[activeService].number} / 04</span><h3>{editions[activeService].note}</h3><p>{editions[activeService].description}</p><button onClick={() => setBookingOpen(true)}>Book this edition <b>→</b></button></article>
        </div>
      </section>

      <section className="p4-packages">
        <header><span className="p4-kicker">Seasonal sets / 003</span><h2>More than one good hair day.</h2></header>
        <div>
          <article className="p4-package-blue"><small>New guest edit</small><span>01</span><h3>First<br />Impression</h3><p>Consultation + signature cut + air-dry lesson</p><strong>₹4,900</strong><button onClick={() => setBookingOpen(true)}>Select</button></article>
          <article className="p4-package-image"><Image src="/brand-home-4/object-study.png" alt="Gold comb and salon objects arranged as an editorial still life" fill sizes="(max-width: 900px) 100vw, 45vw" /><div><small>Six month edit</small><span>02</span><h3>Colour<br />Continuity</h3><p>Two colour sessions + two gloss appointments + home care</p><strong>₹24,000</strong><button onClick={() => setBookingOpen(true)}>Select</button></div></article>
          <article className="p4-package-line"><small>Occasion edit</small><span>03</span><h3>Event<br />Study</h3><p>Trial + event-day hair + touch-up kit</p><strong>₹8,800</strong><button onClick={() => setBookingOpen(true)}>Select</button></article>
        </div>
      </section>

      <section className="p4-method">
        <div className="p4-method-image"><Image src="/brand-home-4/object-study.png" alt="Paloma tools and treatment objects" fill sizes="(max-width: 900px) 100vw, 58vw" /><span>Object study No. 09</span></div>
        <div className="p4-method-copy"><span className="p4-kicker">Our method / 004</span><h2>Look.<br />Listen.<br /><i>Then cut.</i></h2><ol><li><b>01</b><span><strong>Read the material</strong>Texture, history, routine and condition.</span></li><li><b>02</b><span><strong>Find the line</strong>A shape drawn for the person, not the season.</span></li><li><b>03</b><span><strong>Teach the finish</strong>Simple movements you can repeat at home.</span></li></ol></div>
      </section>

      <section id="circle" className="p4-circle">
        <div className="p4-circle-intro"><span className="p4-kicker">Paloma Circle / 005</span><h2>Keep your<br />place in line.</h2><p>A yearly studio membership for guests who prefer continuity, priority and one shared record across every city.</p><button onClick={() => setBookingOpen(true)}>Join for ₹18,000 / year <span>↗</span></button></div>
        <div className="p4-circle-ledger"><header><b>Your studio ledger</b><span>Member 0824</span></header><dl><div><dt>Early booking</dt><dd>10 days</dd></div><div><dt>Annual credit</dt><dd>₹15,000</dd></div><div><dt>Complimentary finish</dt><dd>02</dd></div><div><dt>Loyalty return</dt><dd>5%</dd></div></dl><footer><span>Credits follow you across studios.</span><b>P / C</b></footer></div>
      </section>

      <section className="p4-gifts">
        <div className="p4-gift-card"><span>PALOMA</span><p>This card holds</p><strong>{gift}</strong><small>For hair, form and whatever comes next.</small></div>
        <div className="p4-gift-copy"><span className="p4-kicker">Gift edition / 006</span><h2>Give them<br />the change.</h2><p>Delivered instantly, personalised by you and valid at every Paloma studio for twelve months.</p><div>{["₹3,000", "₹5,000", "₹10,000", "Custom"].map((value) => <button key={value} className={gift === value ? "active" : ""} onClick={() => setGift(value)}>{value}</button>)}</div><button className="p4-gift-send">Create gift card <span>→</span></button></div>
      </section>

      <section id="studios" className="p4-studios">
        <header><span className="p4-kicker">Studio directory / 007</span><h2>Find your Paloma.</h2></header>
        <div>{studios.map((studio) => <article key={studio.city}><small>{studio.code}</small><h3>{studio.city}</h3><p>{studio.address}</p><span>{studio.hours}</span><button onClick={() => setBookingOpen(true)}>Book this studio ↗</button></article>)}</div>
      </section>

      <section className="p4-note"><span className="p4-kicker">The studio / 008</span><p>Paloma is an independent collective of cutters, colourists and image-makers. We believe personal style should feel considered, not corrected.</p><aside><b>22</b><span>artists across<br />four studios</span></aside></section>

      <section className="p4-final"><PalomaMark /><h2>Ready for<br /><em>your next shape?</em></h2><button onClick={() => setBookingOpen(true)}>Make an appointment <span>↗</span></button><footer><span>Instagram</span><span>Journal</span><span>Careers</span><small>Concept storefront for da Salon</small></footer></section>
    </main>
    {bookingOpen && <SalonBooking brand="Paloma" services={services} onClose={() => setBookingOpen(false)} />}
  </div>;
}
