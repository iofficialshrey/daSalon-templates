"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import SalonBooking from "../salon-booking";
import { BrandCommerce } from "@/app/components/brand-commerce";
import type {
  BrandCommerceCopy,
  GiftOffer,
  MembershipOffer,
  PackageOffer,
} from "@/app/components/brand-commerce";
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
  { id: "memberships", number: "03", label: "Circle" },
  { id: "packages", number: "04", label: "Seasonal sets" },
  { id: "gift-cards", number: "05", label: "Gifts" },
  { id: "method", number: "06", label: "Method" },
  { id: "studios", number: "07", label: "Studios" },
  { id: "note", number: "08", label: "Studio note" },
  { id: "finale", number: "09", label: "Finale" },
];

const memberships: MembershipOffer[] = [
  {
    id: "paloma-circle",
    name: "Paloma Circle",
    validityLabel: "Valid for 12 months",
    savePercent: 15,
    description: "The yearly studio membership for guests who prefer continuity, priority and one shared record.",
    details: [
      "Ten-day early booking across every studio",
      "Annual studio credit for cut, colour and care",
      "Two complimentary finishes each year",
      "One ledger shared across Mumbai, Delhi, Bengaluru and Goa",
    ],
    pay: 360,
    credit: 420,
    tone: "cobalt",
  },
  {
    id: "paloma-studio-card",
    name: "Studio Card",
    validityLabel: "Valid for 6 months",
    savePercent: 10,
    description: "A half-year balance for the guests who keep one shape and refresh it often.",
    details: [
      "Studio credit for cuts, finishes and weekday colour",
      "Balance follows you between the four studios",
      "Rebook from the same record each visit",
      "Unused credit closes with the window",
    ],
    pay: 180,
    credit: 200,
    tone: "ink",
  },
  {
    id: "paloma-front-row",
    name: "Front Row",
    validityLabel: "Valid for 3 months",
    savePercent: 8,
    description: "A short season of credit, sized for blowouts, gloss and between-issue upkeep.",
    details: [
      "A lighter, shorter membership",
      "Best for finishes, gloss and quick edits",
      "Redeemable at any Paloma studio",
      "An easy way to hold a balance",
    ],
    pay: 95,
    credit: 105,
    tone: "ivory",
  },
];

const packages: PackageOffer[] = [
  {
    id: "paloma-first-impression",
    name: "First Impression",
    savePercent: 12,
    sessionsLabel: "1 session included",
    validityLabel: "Valid for 90 days",
    inclusions: ["Full consultation", "Signature cut", "Air-dry lesson"],
    description: "The new guest edit—read the material, find the line, then teach the finish.",
    details: [
      "Opens with a full consultation on texture and routine",
      "Signature cut drawn for the person, not the season",
      "Air-dry lesson so the shape repeats at home",
      "Book with any available cutter within the window",
    ],
    pay: 98,
    worth: 112,
    tone: "cobalt",
  },
  {
    id: "paloma-colour-continuity",
    name: "Colour Continuity",
    savePercent: 18,
    sessionsLabel: "4 sessions included",
    validityLabel: "Valid for 6 months",
    inclusions: ["Two colour sessions", "Two gloss appointments", "Home care set"],
    description: "The six month edit, written to keep colour reading the same way in every light.",
    details: [
      "Two full colour sessions with your colourist",
      "Two gloss appointments spaced between them",
      "Home care set matched to the formula",
      "Sessions booked independently across six months",
    ],
    pay: 480,
    worth: 585,
    tone: "ink",
  },
  {
    id: "paloma-event-study",
    name: "Event Study",
    savePercent: 10,
    sessionsLabel: "2 sessions included",
    validityLabel: "Valid for 120 days",
    inclusions: ["Styling trial", "Event-day hair", "Touch-up kit"],
    description: "The occasion edit—one trial, one event, nothing decided on the morning.",
    details: [
      "A styling trial held well before the date",
      "Event-day hair with the agreed finish",
      "Touch-up kit to carry with you",
      "Both sessions inside a 120 day window",
    ],
    pay: 176,
    worth: 196,
    tone: "ivory",
  },
];

const gifts: GiftOffer[] = [
  {
    id: "paloma-open-edition",
    name: "Open Edition",
    validityLabel: "Valid for 1 year",
    savePercent: 10,
    description: "For hair, form and whatever comes next—the recipient writes the rest.",
    details: [
      "Redeemable for cut, colour or care",
      "Valid for twelve months from purchase",
      "Accepted at every Paloma studio",
      "Personalised by you at checkout",
    ],
    pay: 90,
    value: 100,
    tone: "cobalt",
  },
  {
    id: "paloma-full-issue",
    name: "Full Issue",
    validityLabel: "Valid for 1 year",
    savePercent: 10,
    description: "The larger gift—enough for a full change rather than a trim.",
    details: [
      "Sized for colour work or a complete restyle",
      "Valid for twelve months from purchase",
      "Can be split across more than one visit",
      "Accepted at every Paloma studio",
    ],
    pay: 180,
    value: 200,
    tone: "ink",
  },
  {
    id: "paloma-short-note",
    name: "Short Note",
    validityLabel: "No expiry",
    savePercent: null,
    description: "A small, open card with no date attached to it.",
    details: [
      "Open value with no expiry",
      "The recipient chooses when to book",
      "Pairs well with a first appointment",
      "Delivered instantly",
    ],
    pay: 60,
    value: 60,
    tone: "ivory",
  },
];

const commerceCopy: BrandCommerceCopy = {
  membershipsEyebrow: "Paloma Circle / 003",
  membershipsTitle: "Keep your place in line.",
  membershipsCopy:
    "A studio membership for guests who prefer continuity, priority and one shared record across every city. Swipe the cards to read credit, validity and price.",
  packagesEyebrow: "Seasonal sets / 004",
  packagesTitle: "More than one good hair day.",
  packagesCopy:
    "Edits written as a series rather than a single appointment—sessions included, how long they run and what they are worth.",
  giftsEyebrow: "Gift edition / 005",
  giftsTitle: "Give them the change.",
  giftsCopy:
    "Delivered instantly, personalised by you and valid at every Paloma studio. Swipe the cards to choose the edition.",
  membershipSwipeHint: "Swipe to browse the Circle",
  giftSwipeHint: "Swipe to browse gift editions",
};

const heroTitleWords = ["Form", "follows", "feeling."];
const heroTitleWordOffsets = heroTitleWords.map((_, wordIndex) =>
  heroTitleWords.slice(0, wordIndex).reduce((total, word) => total + word.length, 0),
);
const heroTitleCharacterCount = heroTitleWords.reduce((total, word) => total + word.length, 0);

function PalomaMark() {
  return <span className="p4-mark"><b>PALOMA</b><small>Hair + Form</small></span>;
}

export default function PalomaStudio() {
  const catalog = useDaSalonCatalog();
  const pageRef = useRef<HTMLDivElement>(null);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [activeService, setActiveService] = useState(0);
  const [activeChapter, setActiveChapter] = useState("cover");
  const [bookingServiceId, setBookingServiceId] = useState<string | null>(null);
  const [visibleHeroCharacters, setVisibleHeroCharacters] = useState(0);
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
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const reducedMotionTimer = window.setTimeout(
        () => setVisibleHeroCharacters(heroTitleCharacterCount),
        0,
      );
      return () => window.clearTimeout(reducedMotionTimer);
    }

    let characterTimer = 0;
    const startTimer = window.setTimeout(() => {
      let nextCharacter = 1;
      setVisibleHeroCharacters(nextCharacter);
      characterTimer = window.setInterval(() => {
        nextCharacter += 1;
        setVisibleHeroCharacters(Math.min(nextCharacter, heroTitleCharacterCount));
        if (nextCharacter >= heroTitleCharacterCount) window.clearInterval(characterTimer);
      }, 160);
    }, 200);

    return () => {
      window.clearTimeout(startTimer);
      if (characterTimer) window.clearInterval(characterTimer);
    };
  }, []);

  useEffect(() => {
    const page = pageRef.current;
    if (!page) return;
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
    // BrandCommerce owns its own markup, so its sections join the rail by id.
    const chapterElements = page.querySelectorAll<HTMLElement>("[data-p4-chapter], .bc-root > section[id]");
    chapterElements.forEach((element) => chapterObserver.observe(element));

    let frame = 0;
    const update = () => {
      frame = 0;
      const scrollable = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
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
      <nav><a href="#editions">Services</a><a href="#memberships">Circle</a><a href="#packages">Sets</a><a href="#gift-cards">Gifts</a><a href="#studios">Studios</a></nav>
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
      <section id="cover" className="p4-cover" aria-labelledby="p4-title" data-p4-chapter>
        <div className="p4-cover-media">
          <video
            autoPlay
            muted
            playsInline
            preload="auto"
            poster="/brand-home-4/hero-video-poster.jpg"
            aria-label="A Paloma model turns through a sequence of hairstyles"
          >
            <source src="/brand-home-4/hero-video.mp4" type="video/mp4" />
          </video>
        </div>
        <div className="p4-cover-grid" aria-hidden="true" />
        <p className="p4-issue">Issue 04 <span>◆</span> 2026</p>
        <h1 id="p4-title" aria-label="Form follows feeling.">
          <span className="p4-cover-title-sequence" aria-hidden="true">
            {heroTitleWords.map((word, wordIndex) => (
              <span className="p4-cover-title-word" key={word}>
                {Array.from(word).map((character, characterIndex) => {
                  const sequenceIndex = heroTitleWordOffsets[wordIndex] + characterIndex;
                  return (
                    <span
                      className={`p4-cover-title-character${sequenceIndex < visibleHeroCharacters ? " is-visible" : ""}`}
                      key={`${word}-${characterIndex}`}
                    >
                      {character}
                    </span>
                  );
                })}
              </span>
            ))}
          </span>
        </h1>
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

      <BrandCommerce
        theme="paloma"
        brandName="Paloma"
        brandMark="P"
        memberships={memberships}
        packages={packages}
        gifts={gifts}
        copy={commerceCopy}
      />

      <section id="method" className="p4-method" data-p4-reveal data-p4-chapter data-p4-number="06">
        <div className="p4-method-image"><Image src="/brand-home-4/object-study.png" alt="Paloma tools and treatment objects" fill sizes="(max-width: 900px) 100vw, 58vw" /><span>Object study No. 09</span></div>
        <div className="p4-method-copy"><span className="p4-kicker">Our method / 006</span><h2>Look.<br />Listen.<br /><i>Then cut.</i></h2><ol><li><b>01</b><span><strong>Read the material</strong>Texture, history, routine and condition.</span></li><li><b>02</b><span><strong>Find the line</strong>A shape drawn for the person, not the season.</span></li><li><b>03</b><span><strong>Teach the finish</strong>Simple movements you can repeat at home.</span></li></ol></div>
      </section>

      <section className="p4-interlude" aria-label="Paloma studio principles" data-p4-reveal>
        <div aria-hidden="true"><span>SHAPE WITH INTENTION</span><b>◆</b><span>COLOUR WITH MEMORY</span><b>◆</b><span>STYLE THAT MOVES</span><b>◆</b><span>SHAPE WITH INTENTION</span><b>◆</b></div>
        <div aria-hidden="true"><span>LOOK</span><b>◆</b><span>LISTEN</span><b>◆</b><span>THEN CUT</span><b>◆</b><span>LOOK</span><b>◆</b><span>LISTEN</span><b>◆</b><span>THEN CUT</span><b>◆</b></div>
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
