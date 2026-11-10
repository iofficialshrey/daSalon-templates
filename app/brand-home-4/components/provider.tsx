"use client";

import dynamic from "next/dynamic";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useDaSalonCatalog } from "@/lib/dasalon/client";
import { fetchVenue, seedVenue, snapshotFor } from "@/lib/dasalon/venue-cache";
import { venueIdsBySlug } from "@/lib/dasalon/venues";
import type { BookingBootstrap } from "@/lib/dasalon/types";
import { jumpTo } from "@/lib/page/jump";
import { liteSnapshot } from "@/lib/page/lite";
import { STUDIOS, STUDIO_SLUGS, type Studio, type StudioSlug } from "../data/studios";
import styles from "./provider.module.css";

const loadBooking = () => import("../../salon-booking");
const loadOfferSpread = () => import("./offer-spread");
const loadContents = () => import("./contents-sheet");

const SalonBooking = dynamic(loadBooking, { ssr: false });

// The booking window opens only once its code has arrived, so a tap never leaves an inert,
// scroll-locked page with nothing on it while the chunk downloads.
let bookingChunk: Promise<unknown> | null = null;
let bookingChunkReady = false;
function ensureBookingChunk() {
  bookingChunk ??= loadBooking().then(
    (module) => {
      bookingChunkReady = true;
      return module;
    },
    (issue: unknown) => {
      bookingChunk = null;
      throw issue;
    },
  );
  return bookingChunk;
}
const OfferSpread = dynamic(loadOfferSpread, { ssr: false });
const ContentsSheet = dynamic(loadContents, { ssr: false });

export type LiveStudio = Studio & { venueId: string | null };

export type BookingRequest = {
  slug?: StudioSlug | null;
  venueId?: string | null;
  serviceId?: string | null;
  /** Resolved against the studio's live menu when no id is known (e.g. "Hair Spa"). */
  serviceName?: string | null;
};

/** Where focus returns when an overlay closes. Pass event.currentTarget: Safari does not focus clicked buttons. */
export type OpenOptions = { returnTo?: HTMLElement | null };

export type OfferRequest =
  | { kind: "membership"; id: string }
  | { kind: "set"; id: string }
  | { kind: "gift"; design: string; value: number };

/** Longest a Book tap waits for the catalog, a studio menu or the booking code. */
const VENUE_WAIT_MS = 4000;

type StartOptions = { returnTo?: HTMLElement | null; noWait?: boolean };
type WaitingBooking = { request: BookingRequest; returnTo: HTMLElement | null; token: number; on: "catalog" | "ready" };
type BookingState = { key: number; venueId: string | null; serviceId: string | null; snapshot: BookingBootstrap | null };
type OfferState = { request: OfferRequest; key: number; returnTo: HTMLElement | null } | null;
type ContentsState = { returnTo: HTMLElement | null; key: number } | null;
type LayerEntry = { id: string; close: () => void; closeOnEsc: boolean };
export type Motion = "on" | "paused";

type PalomaContextValue = {
  studios: LiveStudio[];
  studioBySlug: (slug: StudioSlug | null | undefined) => LiveStudio | undefined;
  catalog: ReturnType<typeof useDaSalonCatalog>;
  /** The studio the guest chose anywhere on the page; every Book opens there. In memory only. */
  currentStudio: StudioSlug | null;
  setCurrentStudio: (slug: StudioSlug | null) => void;
  /** The slug of the API's default venue, once bound. */
  defaultStudio: StudioSlug | null;
  openBooking: (request?: BookingRequest, options?: OpenOptions) => void;
  prefetchBooking: () => void;
  bookingOpen: boolean;
  openOffer: (request: OfferRequest, options?: OpenOptions) => void;
  closeOffer: () => void;
  prefetchOffer: () => void;
  purchased: ReadonlySet<string>;
  markPurchased: (id: string) => void;
  contentsOpen: boolean;
  openContents: (options?: OpenOptions) => void;
  closeContents: () => void;
  prefetchContents: () => void;
  motion: Motion;
  toggleMotion: () => void;
  showToast: (message: string) => void;
  layerHost: HTMLElement | null;
  registerLayer: (entry: LayerEntry) => () => void;
  topLayerId: string | null;
  /** The Contents sheet or an offer spread is open. */
  layerOpen: boolean;
};

const PalomaContext = createContext<PalomaContextValue | null>(null);

export function usePaloma() {
  const value = useContext(PalomaContext);
  if (!value) throw new Error("usePaloma must be used inside <PalomaProvider>.");
  return value;
}

function prefetch(loader: () => Promise<unknown>) {
  void loader().catch(() => undefined);
}

function activeElement() {
  return document.activeElement instanceof HTMLElement && document.activeElement !== document.body ? document.activeElement : null;
}

export function PalomaProvider({ children }: { children: ReactNode }) {
  // The page refreshes on focus, not on a 30 s timer: the edit keeps each studio fresh itself.
  const catalog = useDaSalonCatalog({ poll: false });
  const [currentStudio, setCurrentStudio] = useState<StudioSlug | null>(null);
  const [booking, setBooking] = useState<BookingState | null>(null);
  const [offer, setOffer] = useState<OfferState>(null);
  const [contents, setContents] = useState<ContentsState>(null);
  const [purchased, setPurchased] = useState<ReadonlySet<string>>(() => new Set());
  const [motion, setMotion] = useState<Motion>("on");
  const [toast, setToast] = useState<{ message: string; key: number } | null>(null);
  const [layers, setLayers] = useState<LayerEntry[]>([]);
  const [layerHost, setLayerHost] = useState<HTMLElement | null>(null);
  const bookingKey = useRef(0);
  const offerKey = useRef(0);
  const contentsKey = useRef(0);
  const waitingBooking = useRef<WaitingBooking | null>(null);
  const waitToken = useRef(0);
  const startBookingRef = useRef<(request: BookingRequest, options?: StartOptions) => void>(() => undefined);
  const bookingReturn = useRef<HTMLElement | null>(null);

  // Static studios, bound to live venue ids by name once the catalog arrives.
  const studios = useMemo<LiveStudio[]>(() => {
    const ids = venueIdsBySlug(catalog.data?.venues, STUDIO_SLUGS);
    return STUDIOS.map((studio) => ({ ...studio, venueId: ids.get(studio.slug) ?? null }));
  }, [catalog.data?.venues]);

  const studioBySlug = useCallback(
    (slug: StudioSlug | null | undefined) => (slug ? studios.find((studio) => studio.slug === slug) : undefined),
    [studios],
  );

  const defaultStudio = useMemo(
    () => studios.find((studio) => studio.venueId && studio.venueId === catalog.data?.selectedVenueId)?.slug ?? null,
    [catalog.data?.selectedVenueId, studios],
  );

  useEffect(() => {
    if (catalog.data) seedVenue(catalog.data);
  }, [catalog.data]);

  const startBooking = useCallback((request: BookingRequest, options: StartOptions = {}) => {
    const studio = request.slug
      ? studioBySlug(request.slug)
      : request.venueId
        ? studios.find((item) => item.venueId === request.venueId)
        : studioBySlug(currentStudio);
    const venueId = request.venueId ?? studio?.venueId ?? null;
    if (studio) setCurrentStudio(studio.slug);
    // An overlay hands over to booking: return focus to whatever opened the overlay.
    const returnTo = options.returnTo !== undefined
      ? options.returnTo
      : offer?.returnTo ?? contents?.returnTo ?? activeElement();
    // Never hand the window another venue's menu, or a stale one; without a fresh snapshot it loads the venue itself.
    const fresh = venueId ? snapshotFor(venueId) : null;

    // Wait (at most VENUE_WAIT_MS) for what the window needs: the catalog that binds this studio,
    // a fresh menu for it (so a named service resolves and the window opens at Day & time),
    // and the window's own code. Requests already in flight are shared, never repeated.
    if (!options.noWait) {
      const awaitingCatalog = Boolean(studio && !venueId && !catalog.data && catalog.loading);
      const menu = !awaitingCatalog && venueId && !fresh ? fetchVenue(venueId) : undefined;
      let chunkFailed = false;
      const chunk = bookingChunkReady
        ? undefined
        : ensureBookingChunk().catch(() => {
            chunkFailed = true;
          });
      if (awaitingCatalog || menu || chunk) {
        waitToken.current += 1;
        const entry: WaitingBooking = {
          request: studio ? { ...request, slug: studio.slug } : request,
          returnTo,
          token: waitToken.current,
          on: awaitingCatalog ? "catalog" : "ready",
        };
        waitingBooking.current = entry;
        setOffer(null);
        setContents(null);
        // Say so only if the wait is noticeable.
        window.setTimeout(() => {
          if (waitingBooking.current?.token !== entry.token) return;
          setToast((current) => ({ message: studio ? `Opening ${studio.name}…` : "Opening the booking window…", key: (current?.key ?? 0) + 1 }));
        }, 700);
        const limit = new Promise<void>((resolve) => window.setTimeout(resolve, VENUE_WAIT_MS));
        // The catalog effect below resumes a catalog wait; this cap covers a catalog that never answers.
        const ready = awaitingCatalog ? limit : Promise.race([Promise.all([menu, chunk]), limit]);
        void ready.then(() => {
          if (waitingBooking.current?.token !== entry.token) return;
          waitingBooking.current = null;
          if (chunkFailed && !bookingChunkReady) {
            setToast((current) => ({ message: "The booking window didn't load. Please try again.", key: (current?.key ?? 0) + 1 }));
            return;
          }
          startBookingRef.current(
            awaitingCatalog ? entry.request : { ...entry.request, venueId },
            { returnTo: entry.returnTo, noWait: true },
          );
        });
        return;
      }
    }

    const snapshot = venueId
      ? fresh ?? (catalog.data?.selectedVenueId === venueId ? catalog.data : null)
      : catalog.data ?? null;

    const serviceId = request.serviceId
      ?? (request.serviceName
        ? snapshot?.services.find((service) => service.name.toLowerCase() === request.serviceName?.toLowerCase())?.id ?? null
        : null);
    waitingBooking.current = null;
    bookingReturn.current = returnTo;
    setOffer(null);
    setContents(null);
    bookingKey.current += 1;
    setBooking({ key: bookingKey.current, venueId, serviceId, snapshot });
  }, [catalog.data, catalog.loading, contents, currentStudio, offer, studioBySlug, studios]);

  useEffect(() => {
    startBookingRef.current = startBooking;
  }, [startBooking]);

  const openBooking = useCallback(
    (request: BookingRequest = {}, options: OpenOptions = {}) => startBooking(request, { returnTo: options.returnTo }),
    [startBooking],
  );

  // The catalog answered: run a Book tap that was waiting for it. If the studio still has no live
  // id (an error or a renamed venue), the window opens at the default venue.
  useEffect(() => {
    const entry = waitingBooking.current;
    if (catalog.loading || entry?.on !== "catalog") return;
    waitingBooking.current = null;
    startBooking(entry.request, { returnTo: entry.returnTo });
  }, [catalog.loading, startBooking]);

  const directionsFor = useCallback(
    (venueId: string) => studios.find((studio) => studio.venueId === venueId)?.directionsUrl ?? null,
    [studios],
  );

  const closeBooking = useCallback(() => setBooking(null), []);

  // A later choice cancels a Book tap that is still waiting, so it can't close what the guest opened since.
  const cancelWaitingBooking = useCallback(() => {
    waitingBooking.current = null;
    waitToken.current += 1;
  }, []);

  const openOffer = useCallback((request: OfferRequest, options: OpenOptions = {}) => {
    cancelWaitingBooking();
    offerKey.current += 1;
    setContents(null);
    setOffer({ request, key: offerKey.current, returnTo: options.returnTo ?? activeElement() });
  }, [cancelWaitingBooking]);

  const closeOffer = useCallback(() => setOffer(null), []);

  const openContents = useCallback((options: OpenOptions = {}) => {
    cancelWaitingBooking();
    setOffer(null);
    // A fresh key: a tap during the closing animation opens a new sheet instead of being lost.
    contentsKey.current += 1;
    setContents({ returnTo: options.returnTo ?? activeElement(), key: contentsKey.current });
  }, [cancelWaitingBooking]);

  const closeContents = useCallback(() => setContents(null), []);
  const contentsOpen = contents !== null;

  const markPurchased = useCallback((id: string) => {
    setPurchased((current) => (current.has(id) ? current : new Set(current).add(id)));
  }, []);

  const showToast = useCallback((message: string) => {
    setToast((current) => ({ message, key: (current?.key ?? 0) + 1 }));
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2400);
    return () => window.clearTimeout(timer);
  }, [toast]);

  /* ---------- Motion: one global Pause for the film and every marquee ---------- */

  const toggleMotion = useCallback(() => setMotion((current) => (current === "on" ? "paused" : "on")), []);

  useEffect(() => {
    const html = document.documentElement;
    html.dataset.p4Motion = motion;
    return () => {
      delete html.dataset.p4Motion;
    };
  }, [motion]);

  // Marquees pause while off-screen.
  useEffect(() => {
    const bands = Array.from(document.querySelectorAll<HTMLElement>("[data-marquee]"));
    if (!bands.length) return;
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) (entry.target as HTMLElement).dataset.run = entry.isIntersecting ? "true" : "false";
    });
    bands.forEach((band) => observer.observe(band));
    return () => observer.disconnect();
  }, []);

  /* ---------- In-page links: <a href="#id" data-jump> ---------- */

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = (event.target as Element | null)?.closest?.("a[data-jump]");
      if (!(link instanceof HTMLAnchorElement)) return;
      const id = link.hash.slice(1);
      if (!id || link.pathname !== window.location.pathname) return;
      const target = decodeURIComponent(id);
      // No such element (e.g. #studio-{slug}, handled on hashchange): let the browser follow the hash.
      if (!document.getElementById(target)) return;
      event.preventDefault();
      jumpTo(target);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  /* ---------- Layers ---------- */

  const registerLayer = useCallback((entry: LayerEntry) => {
    setLayers((current) => [...current.filter((item) => item.id !== entry.id), entry]);
    return () => setLayers((current) => current.filter((item) => item.id !== entry.id));
  }, []);

  const topLayerId = layers.length ? layers[layers.length - 1].id : null;
  const layerOpen = layers.length > 0;
  const bookingOpen = booking !== null;

  // Escape closes the top layer, unless the booking window (which owns its own Escape) is open.
  useEffect(() => {
    if (!layerOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || bookingOpen) return;
      const top = layers[layers.length - 1];
      if (top?.closeOnEsc) {
        event.preventDefault();
        top.close();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [layerOpen, layers, bookingOpen]);

  // The page stops scrolling while a layer or the booking window is open. The value is written
  // outright: the booking window keeps its own save/restore and this effect runs after its cleanup.
  const scrollLocked = layerOpen || bookingOpen;
  useEffect(() => {
    document.body.style.overflow = scrollLocked ? "hidden" : "";
  }, [scrollLocked]);

  // After the booking window closes, return focus to the captured opener.
  useEffect(() => {
    if (bookingOpen) return;
    const target = bookingReturn.current;
    if (!target) return;
    const frame = window.requestAnimationFrame(() => {
      const lost = !document.activeElement || document.activeElement === document.body;
      if (lost && target.isConnected && !target.closest("[inert]")) target.focus({ preventScroll: true });
      bookingReturn.current = null;
    });
    return () => window.cancelAnimationFrame(frame);
  }, [bookingOpen]);

  const prefetchBooking = useCallback(() => prefetch(ensureBookingChunk), []);
  const prefetchOffer = useCallback(() => prefetch(loadOfferSpread), []);
  const prefetchContents = useCallback(() => prefetch(loadContents), []);

  // Warm the booking window after 6 s of idle, except for lite visitors.
  useEffect(() => {
    if (liteSnapshot()) return;
    const timer = window.setTimeout(() => prefetch(ensureBookingChunk), 6000);
    return () => window.clearTimeout(timer);
  }, []);

  const value = useMemo<PalomaContextValue>(() => ({
    studios,
    studioBySlug,
    catalog,
    currentStudio,
    setCurrentStudio,
    defaultStudio,
    openBooking,
    prefetchBooking,
    bookingOpen,
    openOffer,
    closeOffer,
    prefetchOffer,
    purchased,
    markPurchased,
    contentsOpen,
    openContents,
    closeContents,
    prefetchContents,
    motion,
    toggleMotion,
    showToast,
    layerHost,
    registerLayer,
    topLayerId,
    layerOpen,
  }), [
    studios, studioBySlug, catalog, currentStudio, defaultStudio, openBooking, prefetchBooking, bookingOpen, openOffer,
    closeOffer, prefetchOffer, purchased, markPurchased, contentsOpen, openContents, closeContents, prefetchContents,
    motion, toggleMotion, showToast, layerHost, registerLayer, topLayerId, layerOpen,
  ]);

  return (
    <PalomaContext.Provider value={value}>
      {children}
      <div ref={setLayerHost} />
      {contents ? <ContentsSheet key={contents.key} onClose={closeContents} returnTo={contents.returnTo} /> : null}
      {offer ? <OfferSpread key={offer.key} request={offer.request} onClose={closeOffer} returnTo={offer.returnTo} /> : null}
      {booking ? (
        <SalonBooking
          key={booking.key}
          brand="Paloma"
          theme="paloma"
          initialBootstrap={booking.snapshot}
          initialVenueId={booking.venueId}
          initialServiceId={booking.serviceId}
          directionsFor={directionsFor}
          onClose={closeBooking}
        />
      ) : null}
      <div className={styles.toastHost} aria-live="polite" role="status">
        {toast ? <p key={toast.key} className={styles.toast}>{toast.message}</p> : null}
      </div>
    </PalomaContext.Provider>
  );
}

/** Wraps page regions that must become inert while a layer or the booking window is open. */
export function InertScope({
  as: Tag = "div",
  children,
  className,
  id,
}: {
  as?: "div" | "main" | "header" | "footer";
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  const { layerOpen, bookingOpen } = usePaloma();
  return (
    <Tag className={className} id={id} inert={layerOpen || bookingOpen}>
      {children}
    </Tag>
  );
}
