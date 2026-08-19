"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Service = {
  name: string;
  category: string;
  duration: string;
  price: string;
  description: string;
};

type Venue = {
  name: string;
  city: string;
  address: string;
  note: string;
  hours: string;
  image: string;
};

const services: Service[] = [
  {
    name: "Signature Cut",
    category: "Cut & Style",
    duration: "90 min",
    price: "₹2,800",
    description: "Consultation, precision cut and a tailored finish.",
  },
  {
    name: "Transformation Cut",
    category: "Cut & Style",
    duration: "120 min",
    price: "₹4,200",
    description: "A considered shape change with styling education.",
  },
  {
    name: "The Élan Blowout",
    category: "Cut & Style",
    duration: "50 min",
    price: "₹1,650",
    description: "Polished movement, gloss and an enduring finish.",
  },
  {
    name: "Lived-in Colour",
    category: "Colour",
    duration: "180 min",
    price: "₹7,800",
    description: "Dimensional placement that grows out beautifully.",
  },
  {
    name: "Gloss & Tone",
    category: "Colour",
    duration: "75 min",
    price: "₹2,600",
    description: "Refresh tone, restore shine and soften brassiness.",
  },
  {
    name: "Dimensional Brunette",
    category: "Colour",
    duration: "150 min",
    price: "₹6,400",
    description: "Rich tonal ribbons with a soft, expensive finish.",
  },
  {
    name: "Botanical Scalp Reset",
    category: "Rituals",
    duration: "75 min",
    price: "₹2,900",
    description: "Microscope consultation, exfoliation and warm infusion.",
  },
  {
    name: "Silk Repair Ritual",
    category: "Rituals",
    duration: "90 min",
    price: "₹3,400",
    description: "Bond repair, steam therapy and a glass-hair finish.",
  },
  {
    name: "Curl Ceremony",
    category: "Rituals",
    duration: "100 min",
    price: "₹3,200",
    description: "Hydration, curl-by-curl shaping and home ritual mapping.",
  },
  {
    name: "Modern Bridal",
    category: "Occasion",
    duration: "Private ritual",
    price: "From ₹12,500",
    description: "Trial, wedding-day styling and a private atelier suite.",
  },
  {
    name: "Editorial Styling",
    category: "Occasion",
    duration: "90 min",
    price: "₹4,800",
    description: "Camera-ready hair tailored to your wardrobe and mood.",
  },
  {
    name: "Private Event",
    category: "Occasion",
    duration: "120 min",
    price: "₹5,900",
    description: "A complete finish with optional makeup pairing.",
  },
];

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

const categories = ["Cut & Style", "Colour", "Rituals", "Occasion"];
const bookingDates = [
  { day: "Tue", date: "18", month: "Aug" },
  { day: "Wed", date: "19", month: "Aug" },
  { day: "Thu", date: "20", month: "Aug" },
  { day: "Fri", date: "21", month: "Aug" },
  { day: "Sat", date: "22", month: "Aug" },
];
const timeSlots = ["10:00 AM", "11:30 AM", "1:15 PM", "3:00 PM", "4:45 PM", "6:30 PM"];

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

export default function MaisonElan() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState(categories[0]);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [bookingStep, setBookingStep] = useState(0);
  const [selectedService, setSelectedService] = useState(services[0].name);
  const [selectedVenue, setSelectedVenue] = useState(venues[0].name);
  const [selectedDate, setSelectedDate] = useState("Tue 18 Aug");
  const [selectedTime, setSelectedTime] = useState("11:30 AM");
  const [confirmed, setConfirmed] = useState(false);
  const [giftAmount, setGiftAmount] = useState("₹5,000");
  const [giftSent, setGiftSent] = useState(false);
  const heroRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const visibleServices = useMemo(
    () => services.filter((service) => service.category === activeCategory),
    [activeCategory],
  );

  useEffect(() => {
    if (!bookingOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setBookingOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [bookingOpen]);

  function openBooking(service?: string, venue?: string) {
    if (service) setSelectedService(service);
    if (venue) setSelectedVenue(venue);
    setBookingStep(service ? 1 : 0);
    setConfirmed(false);
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

  const selectedServiceData = services.find((service) => service.name === selectedService) ?? services[0];
  const selectedVenueData = venues.find((venue) => venue.name === selectedVenue) ?? venues[0];

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
          <a href="#circle" onClick={() => setMenuOpen(false)}>The circle</a>
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
                className={activeCategory === category ? "is-active" : ""}
                role="tab"
                aria-selected={activeCategory === category}
                onClick={() => setActiveCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>
          <div className="me-service-list">
            {visibleServices.map((service, index) => (
              <article key={service.name}>
                <span className="me-service-number">{String(index + 1).padStart(2, "0")}</span>
                <div className="me-service-main">
                  <h3>{service.name}</h3>
                  <p>{service.description}</p>
                </div>
                <div className="me-service-price"><span>{service.duration}</span><strong>{service.price}</strong></div>
                <button onClick={() => openBooking(service.name)} aria-label={`Book ${service.name}`}><Arrow /></button>
              </article>
            ))}
          </div>
        </section>

        <section className="me-collections" id="collections">
          <SectionIntro
            eyebrow="03 / Offers & packages"
            title="A little more of what you love."
            copy="Seasonal privileges and carefully paired rituals, available across every Maison."
            light
          />
          <div className="me-offer-grid">
            <article className="me-feature-offer">
              <div className="me-offer-art" aria-hidden="true"><span /><i>É</i><b>20</b></div>
              <div className="me-offer-copy">
                <span>Limited atelier edit</span>
                <h3>The New Season<br />Colour Ritual</h3>
                <p>Consultation, dimensional colour, silk repair and signature finish.</p>
                <div><strong>₹8,900</strong><s>₹11,200</s></div>
                <button onClick={() => openBooking("Lived-in Colour")}>Reserve the edit <Arrow /></button>
              </div>
            </article>
            <div className="me-package-stack">
              {[
                ["The Sunday Reset", "Scalp ritual · treatment · finish", "₹4,400", "Save 15%"],
                ["The Polished Three", "Three signature blowouts", "₹4,250", "Valid 90 days"],
                ["Colour Keeping", "Gloss · repair · home ritual consult", "₹5,100", "Most loved"],
              ].map(([title, copy, price, note], index) => (
                <article key={title}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <div><h3>{title}</h3><p>{copy}</p></div>
                  <div><small>{note}</small><strong>{price}</strong></div>
                  <button onClick={() => openBooking()} aria-label={`View ${title}`}><Arrow /></button>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="me-circle" id="circle">
          <div className="me-circle-card">
            <div className="me-membership-visual">
              <span>Maison Élan</span>
              <Mark />
              <div><small>Private member</small><strong>The Élan Circle</strong></div>
              <b>MEMBER · 0087</b>
            </div>
            <div className="me-membership-copy">
              <p className="me-index">04 / Membership</p>
              <h2>Belong to<br /><em>the inner circle.</em></h2>
              <p>Priority appointments, monthly rituals and thoughtful privileges that follow you to every Maison.</p>
              <ul>
                <li><span>01</span> One signature blowout every month</li>
                <li><span>02</span> 15% on colour and care rituals</li>
                <li><span>03</span> Priority weekend reservations</li>
                <li><span>04</span> Complimentary birthday treatment</li>
              </ul>
              <div className="me-membership-price"><strong>₹2,900</strong><span>/ month</span></div>
              <button className="me-button me-button-dark" onClick={() => openBooking()}>Join the circle <Arrow /></button>
            </div>
          </div>
          <div className="me-loyalty-card">
            <div>
              <span className="me-index">Maison points</span>
              <h3>Care that remembers you.</h3>
              <p>Earn one point for every ₹100 spent, with thoughtful rewards along the way.</p>
            </div>
            <div className="me-loyalty-progress">
              <div className="me-points"><strong>740</strong><span>points</span></div>
              <div className="me-progress-track"><i /><span style={{ left: "74%" }}>You</span></div>
              <div className="me-progress-labels"><span>0</span><span>1,000 · Complimentary ritual</span></div>
            </div>
            <div className="me-rewards">
              <article><span>250</span><p>Express treatment</p><b>Unlocked</b></article>
              <article><span>500</span><p>Signature finish</p><b>Unlocked</b></article>
              <article><span>1K</span><p>Scalp ritual</p><b>Next</b></article>
            </div>
          </div>
        </section>

        <section className="me-gift" id="gift-cards">
          <div className="me-gift-copy">
            <p className="me-index">05 / Gift cards</p>
            <h2>Give them time<br /><em>in the chair.</em></h2>
            <p>A beautifully delivered invitation to pause, reset and leave feeling entirely themselves.</p>
            <div className="me-gift-amounts" aria-label="Select gift card amount">
              {["₹2,500", "₹5,000", "₹7,500", "₹10,000"].map((amount) => (
                <button key={amount} className={giftAmount === amount ? "is-active" : ""} onClick={() => { setGiftAmount(amount); setGiftSent(false); }}>{amount}</button>
              ))}
            </div>
            <button className="me-button me-button-dark" onClick={() => setGiftSent(true)}>
              {giftSent ? "Gift card prepared" : `Send ${giftAmount} gift card`} <Arrow />
            </button>
            {giftSent ? <p className="me-gift-success" role="status">A preview is ready. Recipient details would be collected at checkout.</p> : null}
          </div>
          <div className="me-gift-visual" aria-hidden="true">
            <div className="me-gift-shadow" />
            <div className="me-gift-card-front"><span>Maison Élan</span><Mark /><strong>For time well spent.</strong><small>Private gift · {giftAmount}</small></div>
            <div className="me-gift-card-back"><i /><span>MAISON ÉLAN</span></div>
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
                  <button onClick={() => openBooking(undefined, venue.name)}>Book this Maison <Arrow /></button>
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
        <div className="me-footer-links"><div><span>Explore</span><a href="#services">Services</a><a href="#circle">Membership</a><a href="#gift-cards">Gift cards</a></div><div><span>Visit</span><a href="#locations">Locations</a><a href="#about">Our story</a><button onClick={() => openBooking()}>Book now</button></div></div>
        <div className="me-footer-bottom"><span>© 2026 Maison Élan</span><span>Custom salon experience by da Salon</span><a href="#top">Back to top <Arrow direction="up" /></a></div>
      </footer>

      <button className="me-mobile-book" onClick={() => openBooking()}>Book now <Arrow /></button>

      {bookingOpen ? (
        <div className="me-booking-layer" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setBookingOpen(false); }}>
          <section className="me-booking-panel" role="dialog" aria-modal="true" aria-labelledby="booking-title">
            <header>
              <div><span>Maison Élan</span><small>Private appointment</small></div>
              <button ref={closeButtonRef} onClick={() => setBookingOpen(false)} aria-label="Close booking">×</button>
            </header>
            {!confirmed ? (
              <>
                <div className="me-booking-progress" aria-label={`Booking step ${bookingStep + 1} of 4`}>
                  {["Service", "Maison", "Date & time", "Review"].map((step, index) => <span key={step} className={index <= bookingStep ? "is-active" : ""}>{index + 1}<small>{step}</small></span>)}
                </div>
                <div className="me-booking-body">
                  {bookingStep === 0 ? (
                    <div className="me-booking-step">
                      <p className="me-index">Step 01</p><h2 id="booking-title">Choose your ritual.</h2>
                      <div className="me-book-service-list">
                        {services.slice(0, 9).map((service) => <button key={service.name} className={selectedService === service.name ? "is-selected" : ""} onClick={() => setSelectedService(service.name)}><span><strong>{service.name}</strong><small>{service.duration} · {service.category}</small></span><b>{service.price}</b><i /></button>)}
                      </div>
                    </div>
                  ) : null}
                  {bookingStep === 1 ? (
                    <div className="me-booking-step">
                      <p className="me-index">Step 02</p><h2 id="booking-title">Choose your Maison.</h2>
                      <div className="me-book-venue-list">
                        {venues.map((venue, index) => <button key={venue.name} className={selectedVenue === venue.name ? "is-selected" : ""} onClick={() => setSelectedVenue(venue.name)}><span>{String(index + 1).padStart(2, "0")}</span><div><strong>{venue.name}</strong><small>{venue.address}</small><em>{venue.hours}</em></div><i /></button>)}
                      </div>
                    </div>
                  ) : null}
                  {bookingStep === 2 ? (
                    <div className="me-booking-step">
                      <p className="me-index">Step 03</p><h2 id="booking-title">Select a time.</h2>
                      <p className="me-step-copy">Availability at {selectedVenueData.name}</p>
                      <div className="me-date-list">
                        {bookingDates.map((date) => { const value = `${date.day} ${date.date} ${date.month}`; return <button key={value} className={selectedDate === value ? "is-selected" : ""} onClick={() => setSelectedDate(value)}><span>{date.day}</span><strong>{date.date}</strong><small>{date.month}</small></button>; })}
                      </div>
                      <div className="me-time-heading"><span>Available times</span><small>All times are local</small></div>
                      <div className="me-time-list">{timeSlots.map((time) => <button key={time} className={selectedTime === time ? "is-selected" : ""} onClick={() => setSelectedTime(time)}>{time}</button>)}</div>
                    </div>
                  ) : null}
                  {bookingStep === 3 ? (
                    <div className="me-booking-step me-review-step">
                      <p className="me-index">Step 04</p><h2 id="booking-title">Review your ritual.</h2>
                      <div className="me-review-card"><div><span>Service</span><strong>{selectedServiceData.name}</strong><small>{selectedServiceData.duration} · {selectedServiceData.price}</small></div><button onClick={() => setBookingStep(0)}>Change</button></div>
                      <div className="me-review-card"><div><span>Maison</span><strong>{selectedVenueData.name}</strong><small>{selectedVenueData.address}</small></div><button onClick={() => setBookingStep(1)}>Change</button></div>
                      <div className="me-review-card"><div><span>Date & time</span><strong>{selectedDate} · {selectedTime}</strong><small>Please arrive five minutes before your appointment.</small></div><button onClick={() => setBookingStep(2)}>Change</button></div>
                      <label className="me-note-field"><span>Anything we should know? <small>Optional</small></span><textarea placeholder="Tell your artist about your hair, preferences or accessibility needs…" /></label>
                    </div>
                  ) : null}
                </div>
                <footer className="me-booking-actions">
                  <button className="me-back-button" onClick={() => bookingStep === 0 ? setBookingOpen(false) : setBookingStep((step) => step - 1)}>{bookingStep === 0 ? "Cancel" : "Back"}</button>
                  <button className="me-next-button" onClick={() => bookingStep === 3 ? setConfirmed(true) : setBookingStep((step) => step + 1)}>{bookingStep === 3 ? "Confirm appointment" : "Continue"}<Arrow /></button>
                </footer>
              </>
            ) : (
              <div className="me-confirmed">
                <div className="me-confirmed-mark">✓</div>
                <p className="me-index">Appointment reserved</p>
                <h2 id="booking-title">Your chair is waiting.</h2>
                <p>{selectedDate} at {selectedTime}<br />{selectedVenueData.name}</p>
                <div><span>{selectedServiceData.name}</span><strong>{selectedServiceData.price}</strong></div>
                <small>A confirmation and calendar invitation would be sent to the guest.</small>
                <button className="me-next-button" onClick={() => setBookingOpen(false)}>Done <Arrow /></button>
              </div>
            )}
          </section>
        </div>
      ) : null}
    </div>
  );
}
