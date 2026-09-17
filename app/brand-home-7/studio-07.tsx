"use client";

import Image from "next/image";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import SalonBooking from "../salon-booking";
import BrandCommerce from "../components/brand-commerce";
import { formatCatalogPrice, serviceDescription, useDaSalonCatalog } from "@/lib/dasalon/client";
import {
  assets,
  introStorageKey,
  bookingDraftStorageKey,
  menuChapters,
  menuSecondary,
  peopleChapter,
  storyBeats,
  studioCommerceCopy,
  studioGifts,
  studioIdentity,
  studioMemberships,
  studioPackages,
  venueExtrasById,
  illustrativeVenuePlates,
  trailer,
  getTrailerBeat,
  type MenuPreview,
} from "./config";
import {
  lookDirections,
  matchesLookDirection,
  resolveServiceMedia,
  type LookDirection,
  type ServiceMedia,
} from "./service-media";
import {
  clearBookingDraft,
  emptyBookingDraft,
  readBookingDraft,
  writeBookingDraft,
  type StudioBookingDraft,
} from "./booking-draft";

type IntroPhase =
  | "settle"
  | "feeling"
  | "pause"
  | "yourself"
  | "louder"
  | "aperture"
  | "hero"
  | "done"
  | "skipped";

type OpenBookingOpts = {
  serviceId?: string | null;
  venueId?: string | null;
};

type VenueCard = {
  id: string | null;
  name: string;
  city: string | null;
  image: string;
  imageKind: "verified" | "illustrative";
  address?: string;
  hours?: string;
  amenities?: string[];
  directionsUrl?: string | null;
  live: boolean;
};

function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function markIntroSeen() {
  try {
    sessionStorage.setItem(introStorageKey, "1");
  } catch {
    /* fail open */
  }
}

function hasIntroBeenSeen() {
  try {
    return sessionStorage.getItem(introStorageKey) === "1";
  } catch {
    return false;
  }
}

function shouldSkipTrailer() {
  if (prefersReducedMotion()) return true;
  if (hasIntroBeenSeen()) return true;
  const hash = window.location.hash.toLowerCase();
  if (hash && hash !== "#" && hash !== "#top") return true;
  const params = new URLSearchParams(window.location.search);
  if (params.has("book") || params.get("booking") === "1" || params.get("open") === "booking") {
    return true;
  }
  return false;
}

function trailerTimingScale() {
  if (typeof window === "undefined") return 1;
  return window.matchMedia("(max-width: 720px)").matches ? 0.92 : 1;
}

function focusableWithin(root: HTMLElement | null) {
  return Array.from(
    root?.querySelectorAll<HTMLElement>('button, a[href], [tabindex]:not([tabindex="-1"])') ?? [],
  ).filter((el) => el.getClientRects().length > 0);
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
  const venuePanelRef = useRef<HTMLDivElement>(null);
  const timers = useRef<number[]>([]);
  const menuTriggerRef = useRef<HTMLElement | null>(null);
  const venueTriggerRef = useRef<HTMLElement | null>(null);
  const skipMenuFocusRef = useRef(false);

  const [introPhase, setIntroPhase] = useState<IntroPhase>("settle");
  const [introRunId, setIntroRunId] = useState(0);
  const [yourselfTyped, setYourselfTyped] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuClosing, setMenuClosing] = useState(false);
  const [menuPreviewId, setMenuPreviewId] = useState<string>(menuChapters[0].id);
  const menuCloseTimer = useRef<number | null>(null);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [bookingDraft, setBookingDraft] = useState<StudioBookingDraft>(() => {
    if (typeof window === "undefined") return emptyBookingDraft();
    return readBookingDraft(bookingDraftStorageKey) || emptyBookingDraft();
  });
  const [bookingServiceId, setBookingServiceId] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return readBookingDraft(bookingDraftStorageKey)?.serviceId ?? null;
  });
  const [bookingVenueId, setBookingVenueId] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return readBookingDraft(bookingDraftStorageKey)?.venueId ?? null;
  });
  const [activeServiceId, setActiveServiceId] = useState<string | null>(null);
  const [lookDirection, setLookDirection] = useState<LookDirection>("all");
  const [servicesExpanded, setServicesExpanded] = useState(false);
  const [venuePanelId, setVenuePanelId] = useState<string | null>(null);
  const forceTrailerPlay = useRef(false);

  const feelingBeat = getTrailerBeat("feeling");
  const yourselfBeat = getTrailerBeat("yourself");
  const louderBeat = getTrailerBeat("louder");

  const services = useMemo(() => {
    return (catalog.data?.services ?? []).map((service) => ({
      ...service,
      priceLabel: formatCatalogPrice(service.price, catalog.data?.currency),
      note: serviceDescription(service),
      media: resolveServiceMedia(service),
    }));
  }, [catalog.data]);

  const filteredServices = useMemo(
    () => services.filter((service) => matchesLookDirection(service, lookDirection)),
    [services, lookDirection],
  );

  const collapsedServiceCount = 4;
  const visibleServices = servicesExpanded
    ? filteredServices
    : filteredServices.slice(0, collapsedServiceCount);
  const hasHiddenServices = filteredServices.length > collapsedServiceCount;
  const active = filteredServices.find((service) => service.id === activeServiceId)
    ?? visibleServices[0]
    ?? null;

  const venueCards = useMemo<VenueCard[]>(() => {
    const live = catalog.data?.venues ?? [];
    if (live.length > 0) {
      return live.map((venue, index) => {
        const extras = venueExtrasById[venue.id];
        const plate = illustrativeVenuePlates[index % illustrativeVenuePlates.length];
        return {
          id: venue.id,
          name: venue.name,
          city: venue.city,
          image: extras?.image || plate.image,
          imageKind: extras?.image ? extras.imageKind : "illustrative",
          address: extras?.address,
          hours: extras?.hours,
          amenities: extras?.amenities,
          directionsUrl: extras?.directionsUrl ?? null,
          live: true,
        };
      });
    }

    return illustrativeVenuePlates.map((plate) => ({
      id: null,
      name: plate.label,
      city: null,
      image: plate.image,
      imageKind: "illustrative" as const,
      live: false,
      hours: undefined,
      address: undefined,
      amenities: undefined,
      directionsUrl: null,
    }));
  }, [catalog.data?.venues]);

  const activeVenuePanel = venueCards.find((venue) => venue.id === venuePanelId) ?? null;

  const draftServiceName = useMemo(() => {
    if (!bookingDraft.serviceId) return null;
    return services.find((service) => service.id === bookingDraft.serviceId)?.name
      ?? catalog.data?.services.find((service) => service.id === bookingDraft.serviceId)?.name
      ?? "Selected service";
  }, [bookingDraft.serviceId, services, catalog.data?.services]);

  const draftVenueName = useMemo(() => {
    if (!bookingDraft.venueId) return null;
    return catalog.data?.venues.find((venue) => venue.id === bookingDraft.venueId)?.name ?? null;
  }, [bookingDraft.venueId, catalog.data?.venues]);

  const clearTimers = useCallback(() => {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
  }, []);

  const finishIntro = useCallback((reason: "done" | "skipped" = "done") => {
    clearTimers();
    markIntroSeen();
    setYourselfTyped(yourselfBeat.text.length);
    setIntroPhase(reason);
    document.body.classList.remove("s7-intro-lock");
  }, [clearTimers, yourselfBeat.text.length]);

  const replayIntro = useCallback(() => {
    clearTimers();
    forceTrailerPlay.current = true;
    setYourselfTyped(0);
    setIntroPhase("settle");
    document.body.classList.add("s7-intro-lock");
    setIntroRunId((value) => value + 1);
  }, [clearTimers]);

  const resolveMediaForServiceId = useCallback((serviceId: string | null | undefined): ServiceMedia | null => {
    if (!serviceId) return null;
    const mapped = services.find((item) => item.id === serviceId);
    if (mapped) return mapped.media;
    const raw = catalog.data?.services.find((item) => item.id === serviceId);
    return raw ? resolveServiceMedia(raw) : null;
  }, [services, catalog.data?.services]);

  const openBooking = useCallback((opts: OpenBookingOpts = {}) => {
    finishIntro("skipped");
    const hasService = Object.prototype.hasOwnProperty.call(opts, "serviceId");
    const hasVenue = Object.prototype.hasOwnProperty.call(opts, "venueId");

    const nextServiceId = hasService ? (opts.serviceId ?? null) : bookingDraft.serviceId;
    const nextVenueId = hasVenue ? (opts.venueId ?? null) : bookingDraft.venueId;

    setBookingDraft((prev) => {
      const next: StudioBookingDraft = { ...prev };

      if (hasService) {
        const sid = opts.serviceId ?? null;
        if (sid !== prev.serviceId) {
          next.date = null;
          next.time = null;
        }
        next.serviceId = sid;
      }

      if (hasVenue) {
        const vid = opts.venueId ?? null;
        if (vid !== prev.venueId) {
          next.date = null;
          next.time = null;
        }
        next.venueId = vid;
      }

      writeBookingDraft(bookingDraftStorageKey, next);
      return next;
    });

    setBookingServiceId(nextServiceId);
    setBookingVenueId(nextVenueId);
    setBookingOpen(true);
    setMenuOpen(false);
    setVenuePanelId(null);
  }, [finishIntro, bookingDraft.serviceId, bookingDraft.venueId]);

  const resetBookingDraft = useCallback(() => {
    clearBookingDraft(bookingDraftStorageKey);
    const blank = emptyBookingDraft();
    setBookingDraft(blank);
    setBookingServiceId(null);
    setBookingVenueId(null);
  }, []);

  const bookingServiceMedia = useMemo(() => {
    const id = bookingServiceId || bookingDraft.serviceId;
    return id ? resolveMediaForServiceId(id) : null;
  }, [bookingServiceId, bookingDraft.serviceId, resolveMediaForServiceId]);

  useEffect(() => {
    const forced = forceTrailerPlay.current;
    forceTrailerPlay.current = false;

    if (!forced && shouldSkipTrailer()) {
      const skipTimer = window.setTimeout(() => {
        setYourselfTyped(yourselfBeat.text.length);
        setIntroPhase("skipped");
        document.body.classList.remove("s7-intro-lock");
      }, 0);
      return () => window.clearTimeout(skipTimer);
    }

    clearTimers();
    setYourselfTyped(0);
    setIntroPhase("settle");
    document.body.classList.add("s7-intro-lock");

    const schedule = (delay: number, fn: () => void) => {
      timers.current.push(window.setTimeout(fn, delay));
    };

    const scale = trailerTimingScale();
    const timing = {
      settleEnd: Math.round(trailer.timing.settleEnd * scale),
      feelingEnd: Math.round(trailer.timing.feelingEnd * scale),
      pauseEnd: Math.round(trailer.timing.pauseEnd * scale),
      yourselfEnd: Math.round(trailer.timing.yourselfEnd * scale),
      louderEnd: Math.round(trailer.timing.louderEnd * scale),
      apertureEnd: Math.round(trailer.timing.apertureEnd * scale),
      complete: Math.round(trailer.timing.complete * scale),
      typeCharMs: Math.max(42, Math.round(trailer.timing.typeCharMs * scale)),
    };

    const yourselfText = yourselfBeat.text;
    const typeDuration = yourselfText.length * timing.typeCharMs;
    const yourselfWindow = timing.yourselfEnd - timing.pauseEnd;
    const typedHold = Math.max(500, yourselfWindow - typeDuration);
    const louderAt = timing.pauseEnd + typeDuration + typedHold;

    schedule(timing.settleEnd, () => setIntroPhase("feeling"));
    schedule(timing.feelingEnd, () => setIntroPhase("pause"));
    schedule(timing.pauseEnd, () => {
      setIntroPhase("yourself");
      setYourselfTyped(0);
    });

    yourselfText.split("").forEach((_, index) => {
      schedule(timing.pauseEnd + (index + 1) * timing.typeCharMs, () => {
        setYourselfTyped(index + 1);
      });
    });

    schedule(louderAt, () => setIntroPhase("louder"));
    schedule(Math.max(louderAt + 900, timing.louderEnd), () => setIntroPhase("aperture"));
    schedule(timing.apertureEnd, () => setIntroPhase("hero"));
    schedule(timing.complete, () => finishIntro("done"));

    return () => {
      clearTimers();
      document.body.classList.remove("s7-intro-lock");
    };
  }, [introRunId, clearTimers, finishIntro, yourselfBeat.text]);

  useEffect(() => {
    const page = pageRef.current;
    if (!page) return;
    page.classList.add("s7-motion-ready");
    if (prefersReducedMotion()) page.classList.add("is-reduced");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-in-view");
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
    if (!venuePanelId) return;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    venueTriggerRef.current = previous;
    const dialog = venuePanelRef.current;
    const frame = requestAnimationFrame(() => focusableWithin(dialog)[0]?.focus());
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        setVenuePanelId(null);
        return;
      }
      if (event.key !== "Tab" || !dialog) return;
      const items = focusableWithin(dialog);
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
      venueTriggerRef.current?.focus();
    };
  }, [venuePanelId]);

  const introActive = introPhase !== "done" && introPhase !== "skipped";
  const apertureOpen =
    introPhase === "aperture"
    || introPhase === "hero"
    || introPhase === "done"
    || introPhase === "skipped";
  const heroCopyReady =
    introPhase === "hero"
    || introPhase === "done"
    || introPhase === "skipped";
  const showReplay = introPhase === "done";
  const activeMenuItem = useMemo(() => {
    return (
      menuChapters.find((item) => item.id === menuPreviewId)
      || menuSecondary.find((item) => item.id === menuPreviewId)
      || menuChapters[0]
    );
  }, [menuPreviewId]);

  const activeMenuPreview: MenuPreview = activeMenuItem.preview;
  const activeMenuCaption = {
    title: activeMenuItem.captionTitle,
    line: activeMenuItem.captionLine,
  };

  const clearMenuCloseTimer = useCallback(() => {
    if (menuCloseTimer.current !== null) {
      window.clearTimeout(menuCloseTimer.current);
      menuCloseTimer.current = null;
    }
  }, []);

  const closeMenu = useCallback((after?: () => void) => {
    clearMenuCloseTimer();
    if (prefersReducedMotion() || !menuOpen) {
      setMenuClosing(false);
      setMenuOpen(false);
      after?.();
      return;
    }
    setMenuClosing(true);
    menuCloseTimer.current = window.setTimeout(() => {
      setMenuOpen(false);
      setMenuClosing(false);
      menuCloseTimer.current = null;
      after?.();
    }, 220);
  }, [clearMenuCloseTimer, menuOpen]);

  const openMenu = useCallback(() => {
    clearMenuCloseTimer();
    setMenuClosing(false);
    setMenuPreviewId(menuChapters[0].id);
    setMenuOpen(true);
  }, [clearMenuCloseTimer]);

  const focusSectionDestination = useCallback((href: string) => {
    const id = href.replace("#", "");
    const section = document.getElementById(id);
    if (!section) return;
    const reduced = prefersReducedMotion();
    section.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
    const heading = section.querySelector<HTMLElement>("h2, h1");
    const target = heading || section;
    const previousTabIndex = target.getAttribute("tabindex");
    target.setAttribute("tabindex", "-1");
    target.focus({ preventScroll: true });
    const cleanup = () => {
      if (previousTabIndex === null) target.removeAttribute("tabindex");
      else target.setAttribute("tabindex", previousTabIndex);
      target.removeEventListener("blur", cleanup);
    };
    target.addEventListener("blur", cleanup);
  }, []);

  const navigateFromMenu = useCallback((href: string) => {
    skipMenuFocusRef.current = true;
    closeMenu(() => {
      window.history.replaceState(null, "", href);
      focusSectionDestination(href);
    });
  }, [closeMenu, focusSectionDestination]);

  const bookFromMenu = useCallback(() => {
    // Close immediately so booking is the only active modal/focus trap.
    skipMenuFocusRef.current = true;
    clearMenuCloseTimer();
    setMenuClosing(false);
    setMenuOpen(false);
    openBooking();
  }, [clearMenuCloseTimer, openBooking]);

  useEffect(() => () => clearMenuCloseTimer(), [clearMenuCloseTimer]);

  useEffect(() => {
    if (!menuOpen) return;
    const photos = [...menuChapters, ...menuSecondary]
      .map((item) => item.preview)
      .filter((preview): preview is Extract<MenuPreview, { kind: "photo" }> => preview.kind === "photo");
    photos.forEach((preview) => {
      const image = new window.Image();
      image.src = preview.src;
    });
  }, [menuOpen]);

  useEffect(() => {
    if (!menuOpen) return;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    menuTriggerRef.current = previous;
    const dialog = menuRef.current;
    const frame = window.setTimeout(() => {
      dialog?.querySelector<HTMLElement>(".s7-menu-close")?.focus();
    }, 0);
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        closeMenu();
        return;
      }
      if (event.key !== "Tab" || !dialog) return;
      const items = focusableWithin(dialog);
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
      window.clearTimeout(frame);
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
      if (!skipMenuFocusRef.current) menuTriggerRef.current?.focus();
      skipMenuFocusRef.current = false;
    };
  }, [menuOpen, closeMenu]);

  const dockVisible = !bookingOpen && !introActive && !menuOpen;
  const liveVenuesAvailable = (catalog.data?.venues?.length ?? 0) > 0;
  const bookingMedia = bookingServiceMedia
    ?? resolveMediaForServiceId(bookingServiceId || bookingDraft.serviceId);
  const directionsUrl = bookingVenueId
    ? venueExtrasById[bookingVenueId]?.directionsUrl || null
    : bookingDraft.venueId
      ? venueExtrasById[bookingDraft.venueId]?.directionsUrl || null
      : null;

  return (
    <div
      ref={pageRef}
      className={`studio-07${introActive ? " is-intro" : ""}${apertureOpen ? " is-hero-ready" : ""}${heroCopyReady ? " is-hero-copy" : ""}`}
    >
      {introActive && (
        <div
          className={`s7-intro s7-intro-${introPhase}`}
          role="dialog"
          aria-modal="true"
          aria-label="Studio introduction"
        >
          <div className="s7-intro-sr">
            <p>{feelingBeat.text}</p>
            <p>{yourselfBeat.text}</p>
            <p>{louderBeat.text}</p>
            <p>{trailer.heroTitle}</p>
            <p>{trailer.heroDescription}</p>
          </div>

          <div className="s7-intro-stage" aria-hidden="true">
            <p
              className={`s7-intro-beat s7-intro-beat-feeling${introPhase === "feeling" ? " is-visible" : ""}${introPhase === "pause" ? " is-leaving" : ""}`}
              data-treatment={feelingBeat.treatment}
            >
              {feelingBeat.lines.map((line) => (
                <span key={line}>{line}</span>
              ))}
            </p>

            <p
              className={`s7-intro-beat s7-intro-beat-yourself${introPhase === "yourself" ? " is-visible" : ""}${introPhase === "louder" || introPhase === "aperture" || introPhase === "hero" ? " is-leaving" : ""}`}
              data-treatment={yourselfBeat.treatment}
            >
              <span className="s7-intro-type-track">
                {yourselfBeat.text.slice(0, yourselfTyped)}
                <i
                  className={
                    introPhase === "yourself" && yourselfTyped < yourselfBeat.text.length
                      ? "is-on"
                      : ""
                  }
                />
              </span>
            </p>

            <p
              className={`s7-intro-beat s7-intro-beat-louder${introPhase === "louder" ? " is-visible" : ""}${introPhase === "aperture" || introPhase === "hero" ? " is-leaving" : ""}`}
              data-treatment={louderBeat.treatment}
            >
              {louderBeat.lines.map((line) => (
                <span key={line}>{line}</span>
              ))}
            </p>
          </div>

          <div className="s7-intro-actions">
            <button type="button" onClick={() => finishIntro("skipped")}>
              Skip intro
            </button>
          </div>
        </div>
      )}

      {showReplay && (
        <button type="button" className="s7-replay-intro" onClick={replayIntro}>
          Replay intro
        </button>
      )}

      <header className="s7-nav" {...(introActive ? { inert: true } : {})}>
        <a href="#top" className="s7-brand" aria-label="STUDIO / 07 home">
          <StudioMark />
        </a>
        <div className="s7-nav-actions">
          <button
            type="button"
            className="s7-menu-toggle"
            aria-expanded={menuOpen}
            aria-controls="s7-fullscreen-menu"
            onClick={openMenu}
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
          className={`s7-fullscreen-menu${menuClosing ? " is-closing" : ""}`}
          role="dialog"
          aria-modal="true"
          aria-label="Studio chapter navigation"
        >
          <div className="s7-menu-media" aria-hidden="true">
            <div
              key={
                activeMenuPreview.kind === "photo"
                  ? activeMenuPreview.src
                  : `composition-${activeMenuPreview.composition}`
              }
              className="s7-menu-media-frame"
            >
              {activeMenuPreview.kind === "photo" ? (
                <Image
                  src={activeMenuPreview.src}
                  alt=""
                  fill
                  sizes="(max-width: 900px) 0px, 45vw"
                  className="s7-menu-image"
                  priority
                />
              ) : (
                <div
                  className="s7-menu-composition"
                  data-composition={activeMenuPreview.composition}
                >
                  <span>{activeMenuPreview.label}</span>
                </div>
              )}
            </div>
            <div className="s7-menu-caption">
              <p>{activeMenuCaption.title}</p>
              <span>{activeMenuCaption.line}</span>
            </div>
          </div>

          <div className="s7-menu-panel">
            <div className="s7-menu-panel-head">
              <p className="s7-menu-brand" aria-hidden="true">
                <StudioMark />
              </p>
              <button type="button" className="s7-menu-close" onClick={() => closeMenu()}>
                Close <span aria-hidden="true">×</span>
              </button>
            </div>

            <nav className="s7-menu-nav" aria-label="Primary chapters">
              <ul className="s7-menu-chapters">
                {menuChapters.map((chapter, index) => (
                  <li key={chapter.id} style={{ "--s7-stagger": `${40 + index * 45}ms` } as CSSProperties}>
                    <a
                      href={chapter.href}
                      className={`s7-menu-chapter${menuPreviewId === chapter.id ? " is-previewed" : ""}`}
                      onMouseEnter={() => setMenuPreviewId(chapter.id)}
                      onFocus={() => setMenuPreviewId(chapter.id)}
                      onClick={(event) => {
                        event.preventDefault();
                        navigateFromMenu(chapter.href);
                      }}
                    >
                      <span className="s7-menu-chapter-copy">
                        <strong>{chapter.label}</strong>
                        <small>{chapter.descriptor}</small>
                      </span>
                      <span className="s7-menu-chapter-arrow" aria-hidden="true">↗</span>
                    </a>
                  </li>
                ))}
              </ul>

              <ul className="s7-menu-secondary">
                {menuSecondary.map((link, index) => (
                  <li key={link.id} style={{ "--s7-stagger": `${220 + index * 35}ms` } as CSSProperties}>
                    <a
                      href={link.href}
                      className={`s7-menu-secondary-link${menuPreviewId === link.id ? " is-previewed" : ""}`}
                      onMouseEnter={() => setMenuPreviewId(link.id)}
                      onFocus={() => setMenuPreviewId(link.id)}
                      onClick={(event) => {
                        event.preventDefault();
                        navigateFromMenu(link.href);
                      }}
                    >
                      {link.label}
                    </a>
                    {index < menuSecondary.length - 1 ? (
                      <span className="s7-menu-secondary-sep" aria-hidden="true">·</span>
                    ) : null}
                  </li>
                ))}
              </ul>
            </nav>

            <button
              type="button"
              className="s7-menu-book"
              style={{ "--s7-stagger": "340ms" } as CSSProperties}
              onClick={bookFromMenu}
            >
              Book your moment <span aria-hidden="true">↗</span>
            </button>
          </div>
        </div>
      )}

      <main id="top" {...(introActive ? { inert: true } : {})}>
        <section ref={heroRef} className="s7-hero" aria-labelledby="s7-hero-title">
          <p className="sr-only">
            {trailer.heroTitle}
            {" "}
            {trailer.heroDescription}
          </p>
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
              {trailer.heroTitleLines.map((line) => (
                <span key={line}>{line}</span>
              ))}
            </h1>
            <p className="s7-hero-support">{trailer.heroDescription}</p>
            <button type="button" className="s7-cta" onClick={() => openBooking()}>
              Book appointment
            </button>
          </div>
        </section>

        <section id="services" className="s7-services" data-s7-reveal aria-labelledby="s7-services-title">
          <header>
            <p className="s7-mono">Signature</p>
            <h2 id="s7-services-title">THE SIGNATURE EDIT.</h2>
            <p>Live services, durations, and prices from da Salon. Choose an edit, then book that exact service.</p>
          </header>

          <div className="s7-look-filters" role="group" aria-label="Find your look">
            <p className="s7-mono">Find your look</p>
            <div className="s7-look-buttons">
              {lookDirections.map((direction) => (
                <button
                  key={direction.id}
                  type="button"
                  className={lookDirection === direction.id ? "is-active" : ""}
                  aria-pressed={lookDirection === direction.id}
                  title={direction.hint}
                  onClick={() => setLookDirection(direction.id)}
                >
                  {direction.label}
                </button>
              ))}
            </div>
          </div>

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
          {catalog.data && services.length > 0 && filteredServices.length === 0 && (
            <div className="s7-status s7-look-empty" role="status">
              <p>No services match this look yet.</p>
              <button type="button" onClick={() => setLookDirection("all")}>
                Show the full edit
              </button>
            </div>
          )}

          {visibleServices.length > 0 && (
            <div className="s7-service-layout">
              <div
                className="s7-service-list"
                id="s7-service-list"
                role="listbox"
                aria-label="Signature services"
              >
                {visibleServices.map((service) => (
                  <button
                    key={service.id}
                    type="button"
                    role="option"
                    aria-selected={active?.id === service.id}
                    className={active?.id === service.id ? "is-active" : ""}
                    onClick={() => setActiveServiceId(service.id)}
                    onFocus={() => setActiveServiceId(service.id)}
                    onMouseEnter={() => setActiveServiceId(service.id)}
                  >
                    <strong>{service.name}</strong>
                    <small>{service.duration} min</small>
                  </button>
                ))}
              </div>
              <aside className="s7-service-detail" aria-live="polite">
                {active && (
                  <>
                    {active.media.kind === "photo" && active.media.src ? (
                      <div className="s7-service-image">
                        <Image
                          key={active.id}
                          src={active.media.src}
                          alt={active.media.alt}
                          fill
                          sizes="(max-width: 900px) 100vw, 48vw"
                        />
                      </div>
                    ) : (
                      <div className="s7-service-type" aria-label={active.media.alt}>
                        <span>{active.media.label}</span>
                      </div>
                    )}
                    <div className="s7-service-meta">
                      <p className="s7-mono">{active.category || "Service"}</p>
                      <h3>{active.name}</h3>
                      <p>{active.note}</p>
                      <div className="s7-service-facts">
                        <span>{active.duration} min</span>
                        <strong>{active.priceLabel}</strong>
                      </div>
                      <button
                        type="button"
                        className="s7-cta"
                        onClick={() => openBooking({ serviceId: active.id })}
                      >
                        Book this service
                      </button>
                    </div>
                  </>
                )}
              </aside>
            </div>
          )}

          {hasHiddenServices && (
            <button
              type="button"
              className="s7-text-link"
              aria-expanded={servicesExpanded}
              aria-controls="s7-service-list"
              onClick={() => setServicesExpanded((value) => !value)}
            >
              {servicesExpanded
                ? "Show fewer services"
                : `View all services (${filteredServices.length})`}
            </button>
          )}
        </section>

        <section id="story" className="s7-story" data-s7-reveal aria-labelledby="s7-story-title">
          <p className="s7-mono">Studio</p>
          <h2 id="s7-story-title">CRAFT WITH<br />CONSEQUENCE.</h2>
          <div className="s7-story-grid">
            {storyBeats.map((beat) => (
              <article key={beat.id}>
                <h3>{beat.title}</h3>
                <p>{beat.copy}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="people" className="s7-people" data-s7-reveal aria-labelledby="s7-people-title">
          <div className="s7-people-media">
            <Image
              src={assets.craftPhoto}
              alt="Hands shaping a look in the studio"
              fill
              sizes="(max-width: 900px) 100vw, 55vw"
            />
          </div>
          <div className="s7-people-copy">
            <p className="s7-mono">{peopleChapter.eyebrow}</p>
            <h2 id="s7-people-title">{peopleChapter.title}</h2>
            <p className="s7-people-support">{peopleChapter.support}</p>
            {peopleChapter.copy.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
            <p className="s7-footnote">{peopleChapter.note}</p>
          </div>
        </section>

        <section id="book" className="s7-book-invite" data-s7-reveal aria-labelledby="s7-book-title">
          <p className="s7-mono">Appointment</p>
          <h2 id="s7-book-title">MAKE TIME.</h2>
          <p>Open the booking instrument to choose venue, service, date, and hour from live availability.</p>
          <button type="button" className="s7-cta s7-cta-large" onClick={() => openBooking()}>
            Book appointment
          </button>
        </section>

        {/* Commerce is browse-only: every offer ends in a details dialog, never in booking. */}
        <div className="s7-commerce" data-s7-reveal>
          <BrandCommerce
            theme="studio07"
            brandName={studioIdentity.brand}
            brandMark="07"
            memberships={studioMemberships}
            packages={studioPackages}
            gifts={studioGifts}
            copy={studioCommerceCopy}
          />
        </div>

        <section id="venues" className="s7-venues" data-s7-reveal aria-labelledby="s7-venues-title">
          <header>
            <p className="s7-mono">Locations</p>
            <h2 id="s7-venues-title">FIND YOUR STUDIO.</h2>
            <p>
              {liveVenuesAvailable
                ? "Live venues from your da Salon Partner API. Hours and directions appear only when verified extras are configured."
                : "Illustrative architecture plates until live venues load from the Partner API."}
            </p>
          </header>

          {!liveVenuesAvailable && (
            <p className="s7-footnote">
              Demonstration plates only — not live studio names.
            </p>
          )}

          <div className="s7-venue-list">
            {venueCards.map((venue, index) => (
              <article key={venue.id ?? `plate-${index}`}>
                <div className="s7-venue-image">
                  <Image src={venue.image} alt="" fill sizes="(max-width: 900px) 100vw, 33vw" />
                </div>
                <div>
                  <h3>{venue.name}</h3>
                  {venue.city && <p>{venue.city}</p>}
                  {venue.hours && <small>{venue.hours}</small>}
                  <p className="s7-footnote">
                    {venue.imageKind === "verified" ? "Verified studio photograph" : "Illustrative architecture plate"}
                  </p>
                  {venue.live && venue.id ? (
                    <button
                      type="button"
                      className="s7-text-link"
                      onClick={() => setVenuePanelId(venue.id)}
                    >
                      Explore this studio
                    </button>
                  ) : (
                    <button type="button" className="s7-text-link" onClick={() => openBooking()}>
                      Book appointment
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section id="loyalty" className="s7-loyalty" data-s7-reveal aria-labelledby="s7-loyalty-title">
          <p className="s7-mono">Loyalty</p>
          <h2 id="s7-loyalty-title">EVERY VISIT COUNTS.</h2>
          <p>
            Guests earn recognition across visits. Balances and rewards appear here only when a verified loyalty API is connected.
          </p>
          <div className="s7-loyalty-track" aria-hidden="true">
            <i />
          </div>
          <p className="s7-footnote">No invented points, tiers, or rewards are shown.</p>
        </section>
      </main>

      <footer className="s7-footer" {...(introActive ? { inert: true } : {})}>
        <div>
          <StudioMark />
          <p>{studioIdentity.demoNotice}</p>
        </div>
        <button type="button" className="s7-cta" onClick={() => openBooking()}>
          Book appointment
        </button>
      </footer>

      {dockVisible && (
        <div className="s7-booking-dock">
          {!bookingDraft.serviceId ? (
            <button type="button" className="s7-booking-dock-cta" onClick={() => openBooking()}>
              Book appointment
            </button>
          ) : (
            <div className="s7-booking-dock-resume">
              <div className="s7-booking-dock-meta">
                <strong>{draftServiceName}</strong>
                {draftVenueName && <span>{draftVenueName}</span>}
                {bookingDraft.date && <span>{bookingDraft.date}</span>}
              </div>
              <div className="s7-booking-dock-actions">
                <button type="button" className="s7-booking-dock-cta" onClick={() => openBooking()}>
                  Continue booking
                </button>
                <button type="button" className="s7-booking-dock-clear" onClick={resetBookingDraft}>
                  Clear
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {activeVenuePanel && activeVenuePanel.id && (
        <div
          ref={venuePanelRef}
          className="s7-venue-panel"
          role="dialog"
          aria-modal="true"
          aria-labelledby="s7-venue-panel-title"
        >
          <button type="button" className="s7-venue-panel-close" onClick={() => setVenuePanelId(null)}>
            Close
          </button>
          <div className="s7-venue-panel-media">
            <Image
              src={activeVenuePanel.image}
              alt=""
              fill
              sizes="(max-width: 900px) 100vw, 40vw"
            />
          </div>
          <div className="s7-venue-panel-body">
            <p className="s7-mono">
              {activeVenuePanel.imageKind === "verified" ? "Verified studio" : "Illustrative plate"}
            </p>
            <h3 id="s7-venue-panel-title">{activeVenuePanel.name}</h3>
            {activeVenuePanel.city && <p>{activeVenuePanel.city}</p>}
            {activeVenuePanel.address && <p>{activeVenuePanel.address}</p>}
            {activeVenuePanel.hours && <p>{activeVenuePanel.hours}</p>}
            {activeVenuePanel.amenities && activeVenuePanel.amenities.length > 0 && (
              <ul>
                {activeVenuePanel.amenities.map((amenity) => (
                  <li key={amenity}>{amenity}</li>
                ))}
              </ul>
            )}
            {activeVenuePanel.directionsUrl && (
              <a href={activeVenuePanel.directionsUrl} target="_blank" rel="noreferrer">
                Directions
              </a>
            )}
            <button
              type="button"
              className="s7-cta"
              onClick={() => openBooking({ venueId: activeVenuePanel.id })}
            >
              Book at this studio
            </button>
          </div>
        </div>
      )}

      {bookingOpen && (
        <SalonBooking
          brand={studioIdentity.shortName}
          theme="studio"
          initialBootstrap={catalog.data}
          initialServiceId={bookingServiceId}
          initialVenueId={bookingVenueId}
          initialDraft={bookingDraft}
          serviceMedia={bookingMedia}
          directionsUrl={directionsUrl}
          onDraftChange={(draft) => {
            setBookingDraft(draft);
            writeBookingDraft(bookingDraftStorageKey, draft);
            setBookingServiceId(draft.serviceId);
            setBookingVenueId(draft.venueId);
          }}
          onClose={() => setBookingOpen(false)}
        />
      )}
    </div>
  );
}
