"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import SalonBooking from "../salon-booking";
import { formatCatalogPrice, serviceDescription, useDaSalonCatalog } from "@/lib/dasalon/client";

const studios = [
  { city: "Mumbai", address: "Bandra West", code: "BOM / 01", hours: "Tue–Sun, 10–20" },
  { city: "Delhi", address: "Lodhi Colony", code: "DEL / 02", hours: "Tue–Sun, 10–20" },
  { city: "Bengaluru", address: "Indiranagar", code: "BLR / 03", hours: "Mon–Sat, 09–19" },
  { city: "Goa", address: "Assagao", code: "GOI / 04", hours: "Wed–Sun, 10–19" },
];

const chapters = [
  { id: "cover", number: "00", label: "Cover" },
  { id: "view", number: "01", label: "Point of view" },
  { id: "editions", number: "02", label: "Services" },
  { id: "packages", number: "03", label: "Seasonal sets" },
  { id: "method", number: "04", label: "Method" },
  { id: "circle", number: "05", label: "Circle" },
  { id: "gifts", number: "06", label: "Gifts" },
  { id: "studios", number: "07", label: "Studios" },
  { id: "note", number: "08", label: "Studio note" },
  { id: "finale", number: "09", label: "Finale" },
];

function PalomaMark() {
  return <span className="p4-mark"><b>PALOMA</b><small>Hair + Form</small></span>;
}

export default function PalomaStudio() {
  const catalog = useDaSalonCatalog();
  const pageRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLElement>(null);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [activeService, setActiveService] = useState(0);
  const [gift, setGift] = useState("₹5,000");
  const [activeChapter, setActiveChapter] = useState("cover");
  const [bookingServiceId, setBookingServiceId] = useState<string | null>(null);
  const editions = (catalog.data?.services ?? []).map((service, index) => ({
    id: service.id,
    number: String(index + 1).padStart(2, "0"),
    title: service.name,
    note: `${service.duration} min${service.category ? ` · ${service.category}` : ""}`,
    description: serviceDescription(service),
    price: formatCatalogPrice(service.price, catalog.data?.currency),
  }));
  const activeEdition = editions[activeService] || editions[0];

  function openBooking(serviceId?: string) {
    setBookingServiceId(serviceId || null);
    setBookingOpen(true);
  }

  useEffect(() => {
    const page = pageRef.current;
    const hero = heroRef.current;
    if (!page || !hero) return;
    page.classList.add("p4-motion-ready");

    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-in-view");
          revealObserver.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -12%", threshold: 0.12 },
    );
    const revealElements = page.querySelectorAll<HTMLElement>("[data-p4-reveal]");
    revealElements.forEach((element) => revealObserver.observe(element));

    const chapterObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveChapter((entry.target as HTMLElement).id);
        });
      },
      { rootMargin: "-38% 0px -52%", threshold: 0 },
    );
    const chapterElements = page.querySelectorAll<HTMLElement>("[data-p4-chapter]");
    chapterElements.forEach((element) => chapterObserver.observe(element));

    let frame = 0;
    const update = () => {
      frame = 0;
      const distance = Math.max(0, -hero.getBoundingClientRect().top);
      const progress = Math.min(1, distance / Math.max(hero.offsetHeight, 1));
      const scrollable = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
      hero.style.setProperty("--p4-scroll", progress.toFixed(4));
      page.style.setProperty("--p4-page-progress", Math.min(1, window.scrollY / scrollable).toFixed(4));
    };
    const requestUpdate = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", requestUpdate, { passive: true });
    return () => {
      window.removeEventListener("scroll", requestUpdate);
      revealObserver.disconnect();
      chapterObserver.disconnect();
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return <div ref={pageRef} className="paloma-brand-home">
    <header className="p4-nav">
      <a href="#cover" aria-label="Paloma home"><PalomaMark /></a>
      <nav><a href="#editions">Services</a><a href="#circle">Circle</a><a href="#studios">Studios</a></nav>
      <button onClick={() => openBooking()}>Make an appointment <span>↗</span></button>
    </header>

    <aside className="p4-chapter-rail" aria-label="Paloma issue index">
      <p><span>Issue</span><b>{chapters.find((chapter) => chapter.id === activeChapter)?.number ?? "00"}</b></p>
      <nav>
        {chapters.map((chapter) => (
          <a
            className={activeChapter === chapter.id ? "is-active" : ""}
            href={`#${chapter.id}`}
            aria-label={`Go to ${chapter.label}`}
            aria-current={activeChapter === chapter.id ? "location" : undefined}
            key={chapter.id}
          >
            <i aria-hidden="true" />
            <span>{chapter.number}</span>
            <em>{chapter.label}</em>
          </a>
        ))}
      </nav>
    </aside>

    <main>
      <section ref={heroRef} id="cover" className="p4-cover" aria-labelledby="p4-title" data-p4-chapter>
        <div className="p4-cover-media"><Image src="/brand-home-4/hero.png" alt="Woman with sculptural flowing hair in a dark editorial portrait" fill priority sizes="(max-width: 640px) 100vw, 60vw" /></div>
        <div className="p4-cover-grid" aria-hidden="true" />
        <p className="p4-issue">Issue 04 <span>◆</span> 2026</p>
        <h1 id="p4-title"><span className="p4-cover-title-line">Form follows</span><strong className="p4-cover-title-line">feeling.</strong></h1>
        <p className="p4-cover-note">Cut, colour and care for people who would rather be recognised than repeated.</p>
        <button className="p4-cover-cta" onClick={() => openBooking()}><span>Book<br />the look</span><b>↗</b></button>
        <div className="p4-scroll-note"><span>Scroll the issue</span><i /></div>
      </section>

      <section className="p4-ticker" aria-label="Paloma studio philosophy"><div><span>HAIR IS MATERIAL</span><b>◆</b><span>STYLE IS PERSONAL</span><b>◆</b><span>CHANGE IS WELCOME</span><b>◆</b><span>HAIR IS MATERIAL</span><b>◆</b></div></section>

      <section id="view" className="p4-manifesto" data-p4-reveal data-p4-chapter data-p4-number="01">
        <span className="p4-kicker">Paloma point of view / 001</span>
        <h2>Not a makeover.<br /><em className="p4-typewrite">A clearer version.</em></h2>
        <div><p>We begin with how you live, then work through line, texture and colour. No reference photo is copied. No finish is prescribed.</p><p>Every appointment leaves room for instinct, with the technical discipline to make it last beyond the mirror.</p></div>
      </section>

      <section id="editions" className="p4-editions" data-p4-reveal data-p4-chapter data-p4-number="02">
        <header><span className="p4-kicker">Live service editions / 002</span><h2>Choose your edit.</h2><p>The current menu, synced directly with the venue.</p></header>
        <div className="p4-edition-layout">
          <div className="p4-edition-list" role="tablist">{editions.map((edition, index) => <button role="tab" aria-selected={activeService === index} onClick={() => setActiveService(index)} key={edition.title}><span>{edition.number}</span><strong>{edition.title}</strong><small>{edition.price}</small></button>)}</div>
          {activeEdition ? <article className="p4-edition-detail" key={activeEdition.number}><span>{activeEdition.number} / {String(editions.length).padStart(2, "0")}</span><h3>{activeEdition.note}</h3><p>{activeEdition.description}</p><button onClick={() => openBooking(activeEdition.id)}>Book this edition <b>→</b></button></article> : <article className="p4-edition-detail live-menu-state" role="status">{catalog.loading ? "Loading the live service menu…" : catalog.error || "No services are currently bookable."}</article>}
        </div>
      </section>

      <section id="packages" className="p4-packages" data-p4-reveal data-p4-chapter data-p4-number="03">
        <header><span className="p4-kicker">Seasonal sets / 003</span><h2>More than one good hair day.</h2></header>
        <div>
          <article className="p4-package-blue"><small>New guest edit</small><span>01</span><h3>First<br />Impression</h3><p>Consultation + signature cut + air-dry lesson</p><strong>₹4,900</strong><button onClick={() => openBooking()}>Select</button></article>
          <article className="p4-package-image"><Image src="/brand-home-4/object-study.png" alt="Gold comb and salon objects arranged as an editorial still life" fill sizes="(max-width: 900px) 100vw, 45vw" /><div><small>Six month edit</small><span>02</span><h3>Colour<br />Continuity</h3><p>Two colour sessions + two gloss appointments + home care</p><strong>₹24,000</strong><button onClick={() => openBooking()}>Select</button></div></article>
          <article className="p4-package-line"><small>Occasion edit</small><span>03</span><h3>Event<br />Study</h3><p>Trial + event-day hair + touch-up kit</p><strong>₹8,800</strong><button onClick={() => openBooking()}>Select</button></article>
        </div>
      </section>

      <section id="method" className="p4-method" data-p4-reveal data-p4-chapter data-p4-number="04">
        <div className="p4-method-image"><Image src="/brand-home-4/object-study.png" alt="Paloma tools and treatment objects" fill sizes="(max-width: 900px) 100vw, 58vw" /><span>Object study No. 09</span></div>
        <div className="p4-method-copy"><span className="p4-kicker">Our method / 004</span><h2>Look.<br />Listen.<br /><i>Then cut.</i></h2><ol><li><b>01</b><span><strong>Read the material</strong>Texture, history, routine and condition.</span></li><li><b>02</b><span><strong>Find the line</strong>A shape drawn for the person, not the season.</span></li><li><b>03</b><span><strong>Teach the finish</strong>Simple movements you can repeat at home.</span></li></ol></div>
      </section>

      <section className="p4-interlude" aria-label="Paloma studio principles" data-p4-reveal>
        <div aria-hidden="true"><span>SHAPE WITH INTENTION</span><b>◆</b><span>COLOUR WITH MEMORY</span><b>◆</b><span>STYLE THAT MOVES</span><b>◆</b><span>SHAPE WITH INTENTION</span><b>◆</b></div>
        <div aria-hidden="true"><span>LOOK</span><b>◆</b><span>LISTEN</span><b>◆</b><span>THEN CUT</span><b>◆</b><span>LOOK</span><b>◆</b><span>LISTEN</span><b>◆</b><span>THEN CUT</span><b>◆</b></div>
      </section>

      <section id="circle" className="p4-circle" data-p4-reveal data-p4-chapter data-p4-number="05">
        <div className="p4-circle-intro"><span className="p4-kicker">Paloma Circle / 005</span><h2>Keep your<br />place in line.</h2><p>A yearly studio membership for guests who prefer continuity, priority and one shared record across every city.</p><button onClick={() => openBooking()}>Join for ₹18,000 / year <span>↗</span></button></div>
        <div className="p4-circle-ledger"><header><b>Your studio ledger</b><span>Member 0824</span></header><dl><div><dt>Early booking</dt><dd>10 days</dd></div><div><dt>Annual credit</dt><dd>₹15,000</dd></div><div><dt>Complimentary finish</dt><dd>02</dd></div><div><dt>Loyalty return</dt><dd>5%</dd></div></dl><footer><span>Credits follow you across studios.</span><b>P / C</b></footer></div>
      </section>

      <section id="gifts" className="p4-gifts" data-p4-reveal data-p4-chapter data-p4-number="06">
        <div className="p4-gift-card"><span>PALOMA</span><p>This card holds</p><strong className="p4-gift-value" key={gift}>{gift}</strong><small>For hair, form and whatever comes next.</small></div>
        <div className="p4-gift-copy"><span className="p4-kicker">Gift edition / 006</span><h2>Give them<br />the change.</h2><p>Delivered instantly, personalised by you and valid at every Paloma studio for twelve months.</p><div>{["₹3,000", "₹5,000", "₹10,000", "Custom"].map((value) => <button key={value} className={gift === value ? "active" : ""} onClick={() => setGift(value)}>{value}</button>)}</div><button className="p4-gift-send">Create gift card <span>→</span></button></div>
      </section>

      <section id="studios" className="p4-studios" data-p4-reveal data-p4-chapter data-p4-number="07">
        <header><span className="p4-kicker">Studio directory / 007</span><h2>Find your Paloma.</h2></header>
        <div>{studios.map((studio) => <article key={studio.city}><small>{studio.code}</small><h3>{studio.city}</h3><p>{studio.address}</p><span>{studio.hours}</span><button onClick={() => openBooking()}>Book this studio ↗</button></article>)}</div>
      </section>

      <section id="note" className="p4-note" data-p4-reveal data-p4-chapter data-p4-number="08"><span className="p4-kicker">The studio / 008</span><p>Paloma is an independent collective of cutters, colourists and image-makers. We believe personal style should feel considered, not corrected.</p><aside><b>22</b><span>artists across<br />four studios</span></aside></section>

      <section id="finale" className="p4-final" data-p4-reveal data-p4-chapter><PalomaMark /><h2>Ready for<br /><em className="p4-typewrite">your next shape?</em></h2><button onClick={() => openBooking()}>Make an appointment <span>↗</span></button><footer><span>Instagram</span><span>Journal</span><span>Careers</span><small>Concept storefront for da Salon</small></footer></section>
    </main>
    {bookingOpen && <SalonBooking brand="Paloma" theme="paloma" initialBootstrap={catalog.data} initialServiceId={bookingServiceId} onClose={() => setBookingOpen(false)} />}
  </div>;
}
