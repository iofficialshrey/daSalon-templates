"use client";

import { useEffect, useRef, useState } from "react";
import SalonBooking, { type BookingService } from "../salon-booking";

const services: BookingService[] = [
  { name: "Grounding Massage", duration: "75 min", price: "₹4,800" },
  { name: "Mineral Facial", duration: "60 min", price: "₹3,900" },
  { name: "Warm Stone Ritual", duration: "90 min", price: "₹5,600" },
  { name: "Water and Steam", duration: "45 min", price: "₹2,800" },
];

const chapters = [
  {
    id: "arrival",
    label: "Arrival",
    title: "Quiet begins here.",
    body: "Step out of the city and into a slower rhythm designed around touch, water, warmth, and rest.",
    align: "left",
  },
  {
    id: "ritual",
    label: "Ritual",
    title: "Choose your ritual.",
    body: "Massage, skin, and hydrotherapy sessions are shaped around what your body needs today.",
    align: "right",
  },
  {
    id: "touch",
    label: "Touch",
    title: "Attention changes everything.",
    body: "Every treatment is unhurried, tactile, and guided by trained hands rather than a fixed script.",
    align: "left",
  },
  {
    id: "return",
    label: "Return",
    title: "Leave feeling more like yourself.",
    body: "Book one visit or make restoration part of your week with the Oru House membership.",
    align: "right",
  },
] as const;

const treatmentNotes = [
  "Long, grounding pressure with breath-led pacing and warm botanical oil.",
  "A barrier-first skin ritual with mineral compresses and a cooling sculptural massage.",
  "Heated basalt, slow stretching, and deep pressure for tired backs and shoulders.",
  "Private steam, contrast bathing, and a quiet recovery lounge with seasonal tea.",
];

const locations = [
  { city: "Mumbai", address: "Bandra West", hours: "Daily, 9:00 to 21:00" },
  { city: "Bengaluru", address: "Indiranagar", hours: "Daily, 8:00 to 20:00" },
];

function OruMark() {
  return (
    <span className="oru-mark" aria-hidden="true">
      <i />
      <b>oru</b>
    </span>
  );
}

export default function OruSpa() {
  const journeyRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [activeChapter, setActiveChapter] = useState(0);
  const [activeTreatment, setActiveTreatment] = useState(0);
  const [bookingOpen, setBookingOpen] = useState(false);

  useEffect(() => {
    const journey = journeyRef.current;
    const video = videoRef.current;
    if (!journey || !video) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let destroyed = false;
    let frame = 0;
    let ready = false;
    let objectUrl = "";
    let current = 0;
    let target = 0;
    let lastActive = -1;
    const controller = new AbortController();

    const measure = () => {
      const rect = journey.getBoundingClientRect();
      const distance = Math.max(rect.height - window.innerHeight, 1);
      target = Math.min(1, Math.max(0, -rect.top / distance));
      const nextActive = Math.min(chapters.length - 1, Math.floor(target * chapters.length));
      if (nextActive !== lastActive) {
        lastActive = nextActive;
        setActiveChapter(nextActive);
      }
    };

    const tick = () => {
      if (destroyed) return;
      current += (target - current) * 0.085;
      journey.style.setProperty("--oru-scroll", current.toFixed(4));
      if (ready && !video.seeking && Number.isFinite(video.duration)) {
        const time = Math.min(video.duration - 0.03, Math.max(0, current * video.duration));
        if (Math.abs(video.currentTime - time) > 0.018) {
          try {
            video.currentTime = time;
          } catch {
            // The exact poster remains visible while the decoder catches up.
          }
        }
      }
      frame = window.requestAnimationFrame(tick);
    };

    const showPaintedFrame = () => {
      journey.dataset.videoPainted = "true";
    };

    const prime = async () => {
      if (!ready) return;
      try {
        await video.play();
        video.pause();
      } catch {
        // Muted inline scrubbing can continue without an autoplay retry loop.
      }
    };

    const loadFilm = async () => {
      if (reducedMotion) return;
      try {
        const response = await fetch("/assets/spa-entrance.mp4", { signal: controller.signal });
        if (!response.ok) throw new Error("Film unavailable");
        const blob = await response.blob();
        if (destroyed) return;
        objectUrl = URL.createObjectURL(blob);
        video.src = objectUrl;
        video.load();
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          journey.dataset.videoFailed = "true";
        }
      }
    };

    const onMetadata = () => {
      ready = true;
      measure();
    };
    const onScroll = () => measure();
    const onResize = () => measure();

    video.addEventListener("loadedmetadata", onMetadata);
    video.addEventListener("seeked", showPaintedFrame);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    window.addEventListener("pointerdown", prime, { once: true, passive: true });
    measure();
    void loadFilm();
    frame = window.requestAnimationFrame(tick);

    return () => {
      destroyed = true;
      controller.abort();
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointerdown", prime);
      video.removeEventListener("loadedmetadata", onMetadata);
      video.removeEventListener("seeked", showPaintedFrame);
      video.pause();
      video.removeAttribute("src");
      video.load();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      journey.style.removeProperty("--oru-scroll");
    };
  }, []);

  function jumpToChapter(index: number) {
    document.getElementById(chapters[index].id)?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <div className="oru-home">
      <header className="oru-nav">
        <a href="#arrival" aria-label="Oru Spa home"><OruMark /></a>
        <nav aria-label="Primary navigation">
          <a href="#treatments">Treatments</a>
          <a href="#house">Oru House</a>
          <a href="#locations">Locations</a>
        </nav>
        <button className="oru-nav-book" type="button" onClick={() => setBookingOpen(true)}>
          <span>Book now</span><i aria-hidden="true" />
        </button>
      </header>

      <main>
        <section className="oru-journey" ref={journeyRef} aria-label="The Oru experience">
          <div className="oru-film-stage">
            <div className="oru-film-aperture" aria-hidden="true">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="oru-film-poster" src="/brand-home-3/threshold.png" alt="" />
              <video ref={videoRef} className="oru-film" muted playsInline preload="none" poster="/brand-home-3/threshold.png" />
              <span className="oru-film-grade" />
            </div>
            <div className="oru-orbit oru-orbit-one" />
            <div className="oru-orbit oru-orbit-two" />
            <div className="oru-progress" aria-hidden="true"><i /></div>
            <nav className="oru-route" aria-label="Experience chapters">
              {chapters.map((chapter, index) => (
                <button
                  type="button"
                  key={chapter.id}
                  aria-current={activeChapter === index ? "step" : undefined}
                  onClick={() => jumpToChapter(index)}
                >
                  <span>{chapter.label}</span><i />
                </button>
              ))}
            </nav>
          </div>

          <div className="oru-story">
            {chapters.map((chapter, index) => {
              const Heading = index === 0 ? "h1" : "h2";
              return (
                <article className="oru-chapter" id={chapter.id} data-align={chapter.align} key={chapter.id}>
                  <div className="oru-chapter-pin">
                    <div className="oru-chapter-copy">
                      <Heading>{chapter.title}</Heading>
                      <p>{chapter.body}</p>
                      {index === 0 && (
                        <button className="oru-journey-cta" type="button" onClick={() => jumpToChapter(1)}>
                          <span>View treatments</span><i aria-hidden="true">↘</i>
                        </button>
                      )}
                      {index === chapters.length - 1 && (
                        <button className="oru-return-cta" type="button" onClick={() => setBookingOpen(true)}>
                          Book now <span aria-hidden="true">↗</span>
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="oru-treatments" id="treatments" aria-labelledby="oru-treatments-title">
          <header>
            <p>Four ways to return</p>
            <h2 id="oru-treatments-title">Treatments that begin with listening.</h2>
          </header>
          <div className="oru-treatment-list">
            {services.map((service, index) => (
              <article className={activeTreatment === index ? "is-open" : ""} key={service.name}>
                <button type="button" onClick={() => setActiveTreatment(index)} aria-expanded={activeTreatment === index}>
                  <span className="oru-treatment-symbol" aria-hidden="true"><i /><b /></span>
                  <strong>{service.name}</strong>
                  <small>{service.duration}</small>
                  <b>{service.price}</b>
                  <i className="oru-treatment-plus" aria-hidden="true" />
                </button>
                <div className="oru-treatment-detail">
                  <p>{treatmentNotes[index]}</p>
                  <button type="button" onClick={() => setBookingOpen(true)}>Choose this ritual <span>↗</span></button>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="oru-method" aria-labelledby="oru-method-title">
          <div className="oru-breathing-form" aria-hidden="true">
            <span /><i /><b />
          </div>
          <div className="oru-method-copy">
            <h2 id="oru-method-title">A room for your nervous system.</h2>
            <p>Oru is designed for the minutes before and after treatment too. Warm light, low sound, natural scent, and no rushed departures.</p>
            <dl>
              <div><dt>Before</dt><dd>Tea, conversation, and time to settle</dd></div>
              <div><dt>During</dt><dd>Pressure and pace chosen with you</dd></div>
              <div><dt>After</dt><dd>Quiet recovery with no immediate checkout</dd></div>
            </dl>
          </div>
        </section>

        <section className="oru-house" id="house" aria-labelledby="oru-house-title">
          <div className="oru-house-art" aria-hidden="true">
            <div className="oru-house-window">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/brand-home-3/threshold.png" alt="" />
            </div>
            <span>ORU</span>
          </div>
          <div className="oru-house-copy">
            <p>Oru House</p>
            <h2 id="oru-house-title">Rest works best as a rhythm.</h2>
            <p>One monthly treatment, priority booking, and open use of the steam and recovery rooms.</p>
            <ul>
              <li><span>Monthly treatment credit</span><b>1</b></li>
              <li><span>Steam and recovery access</span><b>Any day</b></li>
              <li><span>Guest treatment saving</span><b>10%</b></li>
              <li><span>Monthly membership</span><b>₹6,800</b></li>
            </ul>
            <button type="button" onClick={() => setBookingOpen(true)}>
              <span>Join Oru House</span><i aria-hidden="true" />
            </button>
          </div>
        </section>

        <section className="oru-locations" id="locations" aria-labelledby="oru-locations-title">
          <h2 id="oru-locations-title">Find your quiet.</h2>
          <div>
            {locations.map((location) => (
              <article key={location.city}>
                <h3>{location.city}</h3>
                <p>{location.address}</p>
                <span>{location.hours}</span>
                <button type="button" onClick={() => setBookingOpen(true)}>Book now <i>↗</i></button>
              </article>
            ))}
          </div>
        </section>

        <section className="oru-finale" aria-labelledby="oru-finale-title">
          <OruMark />
          <h2 id="oru-finale-title">Keep a little room for yourself.</h2>
          <button type="button" onClick={() => setBookingOpen(true)}><span>Book now</span><i>↗</i></button>
          <footer>
            <span>Oru Spa</span>
            <span>Mumbai and Bengaluru</span>
            <a href="#arrival">Back to quiet ↑</a>
          </footer>
        </section>
      </main>

      {bookingOpen && <SalonBooking brand="Oru Spa" services={services} onClose={() => setBookingOpen(false)} />}
    </div>
  );
}
