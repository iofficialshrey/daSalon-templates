"use client";

import Image from "next/image";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import SalonBooking from "../salon-booking";
import { formatCatalogPrice, serviceDescription, useDaSalonCatalog } from "@/lib/dasalon/client";
import {
  assets,
  giftAmounts,
  introStorageKey,
  memberships,
  navLinks,
  storyBeats,
  studioIdentity,
  venueDirectory,
} from "./config";

type IntroPhase = "hook" | "type" | "hold" | "aperture" | "done" | "skipped";
type MenuImage = (typeof navLinks)[number]["image"];

function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function readIntroSeen() {
  try {
    return sessionStorage.getItem(introStorageKey) === "1";
  } catch {
    return false;
  }
}

function markIntroSeen() {
  try {
    sessionStorage.setItem(introStorageKey, "1");
  } catch {
    /* fail open */
  }
}

function StudioMark() {
  return (
    <span className="s7-mark">
      <strong>STUDIO</strong>
      <span aria-hidden="true">/</span>
      <b>07</b>
    </span>
  );
}

export default function Studio07() {
  const catalog = useDaSalonCatalog();
  const pageRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [introPhase, setIntroPhase] = useState<IntroPhase>("hook");
  const [typedCount, setTypedCount] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuImage, setMenuImage] = useState<MenuImage>(navLinks[0].image);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [bookingServiceId, setBookingServiceId] = useState<string | null>(null);
  const [activeService, setActiveService] = useState(0);
  const [membershipIndex, setMembershipIndex] = useState(1);
  const [giftOpen, setGiftOpen] = useState(false);
  const [giftAmount, setGiftAmount] = useState<string>(giftAmounts[1]);
  const [giftRecipient, setGiftRecipient] = useState("");
  const [deckEntered, setDeckEntered] = useState(false);
  const supportLine = "Your next era starts here.";
  const timers = useRef<number[]>([]);
  const menuTriggerRef = useRef<HTMLElement | null>(null);

  const services = (catalog.data?.services ?? []).map((service, index) => ({
    ...service,
    number: String(index + 1).padStart(2, "0"),
    priceLabel: formatCatalogPrice(service.price, catalog.data?.currency),
    note: serviceDescription(service),
    image: assets.services[index % assets.services.length],
  }));
  const active = services[activeService] ?? null;
  const showAllServices = services.length > 4;
  const visibleServices = showAllServices ? services.slice(0, 4) : services;

  const clearTimers = useCallback(() => {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
  }, []);

  const finishIntro = useCallback((reason: "done" | "skipped" = "done") => {
    clearTimers();
    markIntroSeen();
    setIntroPhase(reason);
    setTypedCount(supportLine.length);
    document.body.classList.remove("s7-intro-lock");
  }, [clearTimers]);

  const openBooking = useCallback((serviceId?: string | null) => {
    finishIntro("skipped");
    setBookingServiceId(serviceId || null);
    setBookingOpen(true);
    setMenuOpen(false);
  }, [finishIntro]);

  useEffect(() => {
    const reduced = prefersReducedMotion();
    const hashBooking = /#(book|services|memberships)/.test(window.location.hash);
    if (reduced || hashBooking || readIntroSeen()) {
      const skipTimer = window.setTimeout(() => {
        setIntroPhase("skipped");
        setTypedCount(supportLine.length);
      }, 0);
      return () => window.clearTimeout(skipTimer);
    }

    document.body.classList.add("s7-intro-lock");
    const startTimer = window.setTimeout(() => setIntroPhase("hook"), 0);
    const schedule = (delay: number, fn: () => void) => {
      timers.current.push(window.setTimeout(fn, delay));
    };

    schedule(550, () => setIntroPhase("type"));
    supportLine.split("").forEach((_, index) => {
      schedule(850 + index * 45, () => {
        setTypedCount(index + 1);
      });
    });
    schedule(2050, () => setIntroPhase("hold"));
    schedule(2400, () => setIntroPhase("aperture"));
    schedule(3400, () => finishIntro("done"));

    return () => {
      window.clearTimeout(startTimer);
      clearTimers();
      document.body.classList.remove("s7-intro-lock");
    };
  }, [clearTimers, finishIntro]);

  useEffect(() => {
    const page = pageRef.current;
    if (!page) return;
    page.classList.add("s7-motion-ready");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-in-view");
          if (entry.target.id === "memberships") setDeckEntered(true);
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.18 },
    );
    page.querySelectorAll("[data-s7-reveal]").forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const hero = heroRef.current;
    if (!hero || prefersReducedMotion()) return;
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const rect = hero.getBoundingClientRect();
        const progress = Math.min(1, Math.max(0, -rect.top / Math.max(rect.height, 1)));
        hero.style.setProperty("--s7-hero-scale", String(1 + progress * 0.05));
        hero.style.setProperty("--s7-hero-title-y", `${progress * -18}px`);
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    menuTriggerRef.current = previous;
    const dialog = menuRef.current;
    const focusables = () => Array.from(
      dialog?.querySelectorAll<HTMLElement>('button, a[href], [tabindex]:not([tabindex="-1"])') ?? [],
    ).filter((el) => el.getClientRects().length > 0);

    const frame = requestAnimationFrame(() => focusables()[0]?.focus());
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        return;
      }
      if (event.key !== "Tab" || !dialog) return;
      const items = focusables();
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
      menuTriggerRef.current?.focus();
    };
  }, [menuOpen]);

  function shiftMembership(delta: number) {
    setMembershipIndex((current) => (current + delta + memberships.length) % memberships.length);
  }

  function onDeckKey(event: ReactKeyboardEvent<HTMLElement>) {
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      event.preventDefault();
      shiftMembership(1);
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      event.preventDefault();
      shiftMembership(-1);
    }
  }

  const introActive = introPhase !== "done" && introPhase !== "skipped";
  const apertureOpen = introPhase === "aperture" || introPhase === "done" || introPhase === "skipped";

  return (
    <div
      ref={pageRef}
      className={`studio-07${introActive ? " is-intro" : ""}${apertureOpen ? " is-hero-ready" : ""}`}
    >
      {introActive && (
        <div className={`s7-intro s7-intro-${introPhase}`} role="dialog" aria-modal="true" aria-label="Studio introduction">
          <div className="s7-intro-inner">
            <p className="s7-intro-hook" aria-hidden={introPhase !== "hook" && introPhase !== "type" && introPhase !== "hold"}>
              <span>LOOK LIKE</span>
              <span>YOU MEAN IT.</span>
            </p>
            <p className="s7-intro-support">
              <span className="sr-only">{supportLine}</span>
              <span aria-hidden="true" className="s7-type-track">
                {supportLine.slice(0, typedCount)}
                <i className={typedCount < supportLine.length ? "is-on" : ""} />
              </span>
            </p>
          </div>
          <div className="s7-intro-actions">
            <button type="button" onClick={() => finishIntro("skipped")}>Skip intro</button>
            <button type="button" className="s7-intro-book" onClick={() => openBooking()}>Book appointment</button>
          </div>
        </div>
      )}

      <header className="s7-nav">
        <a href="#top" className="s7-brand" aria-label="STUDIO / 07 home">
          <StudioMark />
        </a>
        <div className="s7-nav-actions">
          <button
            type="button"
            className="s7-menu-toggle"
            aria-expanded={menuOpen}
            aria-controls="s7-fullscreen-menu"
            onClick={() => setMenuOpen(true)}
          >
            Menu
          </button>
          <button type="button" className="s7-nav-book" onClick={() => openBooking()}>
            Book appointment
          </button>
        </div>
      </header>

      {menuOpen && (
        <div
          ref={menuRef}
          id="s7-fullscreen-menu"
          className="s7-fullscreen-menu"
          role="dialog"
          aria-modal="true"
          aria-label="Studio sections"
        >
          <div className="s7-menu-media" aria-hidden="true">
            <Image src={menuImage} alt="" fill sizes="50vw" className="s7-menu-image" />
          </div>
          <div className="s7-menu-panel">
            <button type="button" className="s7-menu-close" onClick={() => setMenuOpen(false)}>Close</button>
            <nav>
              {navLinks.map((link, index) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  onFocus={() => setMenuImage(link.image)}
                  onMouseEnter={() => setMenuImage(link.image)}
                  style={{ "--s7-stagger": `${index * 45}ms` } as CSSProperties}
                >
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  {link.label}
                </a>
              ))}
            </nav>
          </div>
        </div>
      )}

      <main id="top">
        <section ref={heroRef} className="s7-hero" aria-labelledby="s7-hero-title">
          <p className="sr-only">LOOK LIKE YOU MEAN IT. Your next era starts here.</p>
          <div className="s7-hero-aperture">
            <div className="s7-hero-media">
              <Image
                src={assets.heroStill}
                alt="Editorial portrait for STUDIO / 07"
                fill
                priority
                sizes="(max-width: 768px) 100vw, 60vw"
                className="s7-hero-still"
              />
            </div>
          </div>
          <div className="s7-hero-copy">
            <p className="s7-mono">STUDIO / 07</p>
            <h1 id="s7-hero-title">
              <span>MAKE AN</span>
              <span>ENTRANCE.</span>
            </h1>
            <p className="s7-hero-support">{studioIdentity.tagline}</p>
            <button type="button" className="s7-cta" onClick={() => openBooking()}>
              Book appointment
            </button>
          </div>
        </section>

        <section id="services" className="s7-services" data-s7-reveal aria-labelledby="s7-services-title">
          <header>
            <p className="s7-mono">01 — Signature</p>
            <h2 id="s7-services-title">THE SIGNATURE EDIT.</h2>
            <p>Live services, durations, and prices from da Salon. Choose an edit, then book that exact service.</p>
          </header>

          {catalog.loading && !catalog.data && (
            <div className="s7-status" role="status">Loading the live menu…</div>
          )}
          {catalog.error && !catalog.data && (
            <div className="s7-status s7-status-error" role="alert">
              <span>{catalog.error}</span>
              <button type="button" onClick={() => void catalog.refresh()}>Try again</button>
            </div>
          )}
          {catalog.data && services.length === 0 && (
            <div className="s7-status">No online services are available right now.</div>
          )}

          {visibleServices.length > 0 && (
            <div className="s7-service-layout">
              <div className="s7-service-list" role="listbox" aria-label="Signature services">
                {visibleServices.map((service, index) => (
                  <button
                    key={service.id}
                    type="button"
                    role="option"
                    aria-selected={activeService === index}
                    className={activeService === index ? "is-active" : ""}
                    onClick={() => setActiveService(index)}
                    onFocus={() => setActiveService(index)}
                    onMouseEnter={() => setActiveService(index)}
                  >
                    <span>{service.number}</span>
                    <strong>{service.name}</strong>
                    <small>{service.duration} min</small>
                  </button>
                ))}
              </div>
              <aside className="s7-service-detail" aria-live="polite">
                {active && (
                  <>
                    <div className="s7-service-image">
                      <Image
                        key={active.id}
                        src={active.image}
                        alt=""
                        fill
                        sizes="(max-width: 900px) 100vw, 48vw"
                      />
                    </div>
                    <div className="s7-service-meta">
                      <p className="s7-mono">{active.category || "Service"}</p>
                      <h3>{active.name}</h3>
                      <p>{active.note}</p>
                      <div className="s7-service-facts">
                        <span>{active.duration} min</span>
                        <strong>{active.priceLabel}</strong>
                      </div>
                      <button type="button" className="s7-cta" onClick={() => openBooking(active.id)}>
                        Book this service
                      </button>
                    </div>
                  </>
                )}
              </aside>
            </div>
          )}

          {showAllServices && (
            <button type="button" className="s7-text-link" onClick={() => openBooking()}>
              View all services ({services.length})
            </button>
          )}
        </section>

        <section id="story" className="s7-story" data-s7-reveal aria-labelledby="s7-story-title">
          <p className="s7-mono">02 — Studio</p>
          <h2 id="s7-story-title">CRAFT WITH<br />CONSEQUENCE.</h2>
          <div className="s7-story-grid">
            {storyBeats.map((beat) => (
              <article key={beat.number}>
                <span className="s7-mono">{beat.number}</span>
                <h3>{beat.title}</h3>
                <p>{beat.copy}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="book" className="s7-book-invite" data-s7-reveal aria-labelledby="s7-book-title">
          <p className="s7-mono">03 — Appointment</p>
          <h2 id="s7-book-title">MAKE TIME.</h2>
          <p>Open the booking instrument to choose venue, service, date, and hour from live availability.</p>
          <button type="button" className="s7-cta s7-cta-large" onClick={() => openBooking()}>
            Book appointment
          </button>
        </section>

        <section id="memberships" className="s7-memberships" data-s7-reveal aria-labelledby="s7-memberships-title">
          <header>
            <p className="s7-mono">04 — Circle</p>
            <h2 id="s7-memberships-title">THE INNER CIRCLE.</h2>
            <p>
              Illustrative membership labels for layout demonstration. Selecting a card does not purchase a plan.
              {" "}
              <span className="s7-demo-tag">Demo content</span>
            </p>
          </header>

          <div className={`s7-deck${deckEntered ? " is-fanned" : ""}`}>
            {memberships.map((card, index) => {
              const offset = index - membershipIndex;
              let wrapped = ((offset % memberships.length) + memberships.length) % memberships.length;
              if (wrapped > 1) wrapped -= memberships.length;
              const isActive = index === membershipIndex;
              return (
                <article
                  key={card.id}
                  className={`s7-card${isActive ? " is-active" : ""}`}
                  data-offset={wrapped}
                  aria-hidden={!isActive}
                  style={{ zIndex: isActive ? 3 : 2 - Math.abs(wrapped) }}
                >
                  <p className="s7-mono">{card.label}</p>
                  <h3>{card.label}</h3>
                  <p>{card.summary}</p>
                  <strong>{card.price}</strong>
                </article>
              );
            })}
          </div>

          <div className="s7-deck-controls">
            <button type="button" onClick={() => shiftMembership(-1)} aria-label="Previous membership">←</button>
            <div className="s7-deck-dots" role="tablist" aria-label="Membership cards">
              {memberships.map((card, index) => (
                <button
                  key={card.id}
                  type="button"
                  role="tab"
                  aria-selected={membershipIndex === index}
                  aria-label={card.label}
                  className={membershipIndex === index ? "is-active" : ""}
                  onClick={() => setMembershipIndex(index)}
                  onKeyDown={onDeckKey}
                />
              ))}
            </div>
            <button type="button" onClick={() => shiftMembership(1)} aria-label="Next membership">→</button>
          </div>

          <div className="s7-membership-panel" aria-live="polite">
            <h3>{memberships[membershipIndex].label}</h3>
            <ul>
              {memberships[membershipIndex].benefits.map((benefit) => (
                <li key={benefit}>{benefit}</li>
              ))}
            </ul>
            <p className="s7-footnote">Enquiry only in this template — membership commerce is not connected.</p>
          </div>
        </section>

        <section id="gifts" className="s7-gifts" data-s7-reveal aria-labelledby="s7-gifts-title">
          <header>
            <p className="s7-mono">05 — Gift</p>
            <h2 id="s7-gifts-title">GIVE A MOMENT.</h2>
            <p>
              Preview a gift card envelope. This is not a purchase.
              {" "}
              <span className="s7-demo-tag">Demo content</span>
            </p>
          </header>

          <div className="s7-gift-stage">
            <button
              type="button"
              className={`s7-envelope${giftOpen ? " is-open" : ""}`}
              aria-expanded={giftOpen}
              onClick={() => setGiftOpen((value) => !value)}
            >
              <span className="s7-envelope-flap" aria-hidden="true" />
              <span className="s7-envelope-body" aria-hidden="true" />
              <span className="s7-envelope-label">{giftOpen ? "Close preview" : "Open envelope"}</span>
            </button>

            <div className={`s7-gift-card${giftOpen ? " is-visible" : ""}`} aria-hidden={!giftOpen}>
              <p className="s7-mono">STUDIO / 07</p>
              <strong>{giftAmount}</strong>
              <span>{giftRecipient.trim() || "For someone who means it"}</span>
            </div>
          </div>

          <div className="s7-gift-form">
            <fieldset>
              <legend>Amount</legend>
              <div className="s7-amount-row">
                {giftAmounts.map((amount) => (
                  <button
                    key={amount}
                    type="button"
                    className={giftAmount === amount ? "is-active" : ""}
                    onClick={() => {
                      setGiftAmount(amount);
                      setGiftOpen(true);
                    }}
                  >
                    {amount}
                  </button>
                ))}
              </div>
            </fieldset>
            <label>
              <span>Recipient name</span>
              <input
                value={giftRecipient}
                maxLength={60}
                placeholder="Name on the card"
                onChange={(event) => {
                  setGiftRecipient(event.target.value);
                  setGiftOpen(true);
                }}
              />
            </label>
            <p className="s7-footnote">Checkout is not connected. Preview only.</p>
          </div>
        </section>

        <section id="venues" className="s7-venues" data-s7-reveal aria-labelledby="s7-venues-title">
          <header>
            <p className="s7-mono">06 — Locations</p>
            <h2 id="s7-venues-title">FIND YOUR STUDIO.</h2>
            <p>Demonstration directory. Live booking uses the venues returned by your da Salon Partner API.</p>
          </header>
          <div className="s7-venue-list">
            {venueDirectory.map((venue, index) => {
              const live = catalog.data?.venues[index];
              return (
                <article key={venue.city}>
                  <div className="s7-venue-image">
                    <Image src={venue.image} alt="" fill sizes="(max-width: 900px) 100vw, 33vw" />
                  </div>
                  <div>
                    <p className="s7-mono">{String(index + 1).padStart(2, "0")}</p>
                    <h3>{live?.name || venue.city}</h3>
                    <p>{live?.city || venue.place}</p>
                    <small>{venue.hours}</small>
                    <p className="s7-footnote">{venue.note}</p>
                    <button
                      type="button"
                      className="s7-text-link"
                      onClick={() => openBooking()}
                    >
                      Book this studio
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section id="loyalty" className="s7-loyalty" data-s7-reveal aria-labelledby="s7-loyalty-title">
          <p className="s7-mono">07 — Loyalty</p>
          <h2 id="s7-loyalty-title">EVERY VISIT COUNTS.</h2>
          <p>
            Guests earn recognition across visits. Balances and rewards appear here only when a verified loyalty API is connected.
            {" "}
            <span className="s7-demo-tag">Demo content</span>
          </p>
          <div className="s7-loyalty-track" aria-hidden="true">
            <i />
          </div>
          <p className="s7-footnote">No invented points, tiers, or rewards are shown.</p>
        </section>
      </main>

      <footer className="s7-footer">
        <div>
          <StudioMark />
          <p>{studioIdentity.demoNotice}</p>
        </div>
        <button type="button" className="s7-cta" onClick={() => openBooking()}>
          Book appointment
        </button>
      </footer>

      <div className="s7-mobile-book">
        <button type="button" onClick={() => openBooking()}>Book appointment</button>
      </div>

      {bookingOpen && (
        <SalonBooking
          brand={studioIdentity.shortName}
          theme="studio"
          initialBootstrap={catalog.data}
          initialServiceId={bookingServiceId}
          onClose={() => setBookingOpen(false)}
        />
      )}
    </div>
  );
}
