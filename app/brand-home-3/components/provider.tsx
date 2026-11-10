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
import { jumpTo, scrollToTop } from "@/lib/page/jump";
import { liteSnapshot } from "@/lib/page/lite";
import { readSaveData } from "@/lib/page/use-clock";
import type { OfferRequest, Receipt } from "../data/offers";
import { DEFAULT_PLACE, PLACES, PLACE_ORDER, type Place, type PlaceSlug } from "../data/places";
import styles from "./provider.module.css";

export type { OfferRequest, Receipt } from "../data/offers";

const loadBooking = () => import("../../salon-booking");
const loadOfferSheet = () => import("./offer-sheet");

// Rendered inside .root, so --sr-font-display resolves in the booking CSS.
const SalonBooking = dynamic(loadBooking, { ssr: false });
const OfferSheet = dynamic(loadOfferSheet, { ssr: false });

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

export type LivePlace = Place & { venueId: string | null };

export type BookingRequest = {
  /** Omit for the current place. */
  slug?: PlaceSlug | null;
  serviceId?: string | null;
  /** Resolved against that place's live menu (case-insensitive) when no id is known. */
  serviceName?: string | null;
};

/** Where focus returns when an overlay closes. Pass event.currentTarget: Safari does not focus clicked buttons. */
export type OpenOptions = { returnTo?: HTMLElement | null };

type LayerEntry = {
  id: string;
  close: () => void;
  closeOnEsc: boolean;
  /** The layer's opener, so a Book pressed inside a sheet hands focus back to what opened the sheet. */
  returnTo?: () => HTMLElement | null;
};

/** Longest a Book tap waits for the catalogue, a place's menu or the booking code. */
const VENUE_WAIT_MS = 4000;
const TOAST_DELAY_MS = 700;
const BUSY_DELAY_MS = 300;

type StartOptions = {
  returnTo?: HTMLElement | null;
  /** The button that was pressed (busy state, ignored second press). */
  pressed?: HTMLElement | null;
  /** The catalogue wait already ran: don't wait for it again. */
  catalogWaited?: boolean;
  noWait?: boolean;
};
type WaitingBooking = {
  request: BookingRequest & { slug: PlaceSlug };
  pressed: HTMLElement | null;
  returnTo: HTMLElement | null;
  token: number;
  on: "catalog" | "ready";
};
type BookingState = { key: number; venueId: string | null; serviceId: string | null; snapshot: BookingBootstrap | null };
type OfferState = { request: OfferRequest; key: number; returnTo: HTMLElement | null } | null;

type SereinContextValue = {
  /** PLACE_ORDER, bound to live venue ids by name. */
  places: LivePlace[];
  placeBySlug: (slug: PlaceSlug | null | undefined) => LivePlace | undefined;
  catalog: ReturnType<typeof useDaSalonCatalog>;
  /** The place the guest chose anywhere on the page; every generic Book opens there. Memory only. */
  currentPlace: PlaceSlug;
  setCurrentPlace: (slug: PlaceSlug) => void;
  openBooking: (request?: BookingRequest, options?: OpenOptions) => void;
  prefetchBooking: () => void;
  bookingOpen: boolean;
  openOffer: (request: OfferRequest, options?: OpenOptions) => void;
  closeOffer: () => void;
  prefetchOffer: () => void;
  /** Offer id → times bought this visit. */
  purchases: ReadonlyMap<string, number>;
  /** Offer id → latest receipt. */
  receipts: ReadonlyMap<string, Receipt>;
  recordPurchase: (id: string, receipt: Receipt) => void;
  showToast: (message: string) => void;
  layerHost: HTMLElement | null;
  registerLayer: (entry: LayerEntry) => () => void;
  topLayerId: string | null;
  /** The menu sheet or the offer sheet is open. */
  layerOpen: boolean;
};

const SereinContext = createContext<SereinContextValue | null>(null);

export function useSerein() {
  const value = useContext(SereinContext);
  if (!value) throw new Error("useSerein must be used inside <SereinProvider>.");
  return value;
}

function prefetch(loader: () => Promise<unknown>) {
  void loader().catch(() => undefined);
}

function activeElement() {
  return document.activeElement instanceof HTMLElement && document.activeElement !== document.body ? document.activeElement : null;
}

export function SereinProvider({ children }: { children: ReactNode }) {
  // The page refreshes on focus, not on a 30 s timer; long-open menus refresh their own place.
  const catalog = useDaSalonCatalog({ poll: false });
  const [currentPlace, setCurrentPlace] = useState<PlaceSlug>(DEFAULT_PLACE);
  const [booking, setBooking] = useState<BookingState | null>(null);
  const [offer, setOffer] = useState<OfferState>(null);
  const [purchases, setPurchases] = useState<ReadonlyMap<string, number>>(() => new Map());
  const [receipts, setReceipts] = useState<ReadonlyMap<string, Receipt>>(() => new Map());
  const [toast, setToast] = useState<{ message: string; key: number } | null>(null);
  const [layers, setLayers] = useState<LayerEntry[]>([]);
  const [layerHost, setLayerHost] = useState<HTMLElement | null>(null);
  const bookingKey = useRef(0);
  const offerKey = useRef(0);
  const waitingBooking = useRef<WaitingBooking | null>(null);
  const waitToken = useRef(0);
  const busyElement = useRef<HTMLElement | null>(null);
  const layerStack = useRef<LayerEntry[]>([]);
  const startBookingRef = useRef<(request: BookingRequest, options?: StartOptions) => void>(() => undefined);
  const bookingReturn = useRef<HTMLElement | null>(null);
  const toastKey = useRef(0);
  /** Key of the "Opening {place}…" toast a waiting Book showed, so only that toast is cleared. */
  const waitToastKey = useRef<number | null>(null);

  // Static places, bound to live venue ids by name (never by a hard-coded id) once the catalogue arrives.
  const places = useMemo<LivePlace[]>(() => {
    const ids = venueIdsBySlug(catalog.data?.venues, PLACE_ORDER);
    return PLACES.map((place) => ({ ...place, venueId: ids.get(place.slug) ?? null }));
  }, [catalog.data?.venues]);

  const placeBySlug = useCallback(
    (slug: PlaceSlug | null | undefined) => (slug ? places.find((place) => place.slug === slug) : undefined),
    [places],
  );

  useEffect(() => {
    if (catalog.data) seedVenue(catalog.data);
  }, [catalog.data]);

  // Serenity first: the API's default venue is The Grooming Room, so Serein's home always needs its own
  // fetch. Under Save-Data it waits for #rituals / #journey to come near (useWarmPlaces) or a Book tap.
  const serenityId = places.find((place) => place.slug === DEFAULT_PLACE)?.venueId ?? null;
  useEffect(() => {
    if (serenityId && !readSaveData()) void fetchVenue(serenityId);
  }, [serenityId]);

  /** Returns the toast's key. */
  const showToast = useCallback((message: string) => {
    toastKey.current += 1;
    const key = toastKey.current;
    setToast({ message, key });
    return key;
  }, []);

  // The wait is over (the window opened, or the wait was cancelled): take down its "Opening…" toast,
  // unless another message has replaced it since.
  const clearWaitToast = useCallback(() => {
    const key = waitToastKey.current;
    waitToastKey.current = null;
    if (key !== null) setToast((current) => (current?.key === key ? null : current));
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2400);
    return () => window.clearTimeout(timer);
  }, [toast]);

  /* ---------- Busy state on the pressed Book while it waits ---------- */

  const setBusy = useCallback((element: HTMLElement | null) => {
    const current = busyElement.current;
    if (current && current !== element) {
      current.removeAttribute("aria-busy");
      delete current.dataset.waiting;
    }
    busyElement.current = element;
    if (element) {
      element.setAttribute("aria-busy", "true");
      element.dataset.waiting = "";
    }
  }, []);

  // A later choice cancels a Book tap that is still waiting, so it can't open over what the guest chose since.
  const cancelWaitingBooking = useCallback(() => {
    waitingBooking.current = null;
    waitToken.current += 1;
    setBusy(null);
    clearWaitToast();
  }, [clearWaitToast, setBusy]);

  /* ---------- Booking ---------- */

  const startBooking = useCallback((request: BookingRequest, options: StartOptions = {}) => {
    const slug = request.slug ?? currentPlace;
    const place = placeBySlug(slug);
    const venueId = place?.venueId ?? null;
    const pressed = options.pressed !== undefined ? options.pressed : options.returnTo ?? null;

    // A second press of the same button while it waits is ignored; a different button supersedes the wait.
    if (!options.noWait && pressed && waitingBooking.current?.pressed === pressed) return;

    setCurrentPlace(slug);

    // An overlay hands over to booking: return focus to whatever opened it.
    let returnTo = options.returnTo !== undefined ? options.returnTo : offer?.returnTo ?? activeElement();
    // A Book inside a sheet (a receipt, the menu sheet) goes away with the sheet: use the sheet's opener.
    if (returnTo && layerHost?.contains(returnTo)) {
      const top = layerStack.current[layerStack.current.length - 1];
      returnTo = top?.returnTo?.() ?? offer?.returnTo ?? null;
    }

    // Never hand the window another place's menu, or a stale one; without a fresh snapshot it loads the place itself.
    const fresh = venueId ? snapshotFor(venueId) : null;

    // Wait (at most VENUE_WAIT_MS) for what the window needs: the catalogue that binds this place, a fresh
    // menu for it (so a named service resolves and the window opens at Day & time), and the window's own
    // code. Requests already in flight are shared, never repeated.
    if (!options.noWait) {
      const awaitingCatalog = !options.catalogWaited && !venueId && !catalog.data && catalog.loading;
      const menu = !awaitingCatalog && venueId && !fresh ? fetchVenue(venueId) : undefined;
      let chunkFailed = false;
      const chunk = bookingChunkReady
        ? undefined
        : ensureBookingChunk().then(
            () => undefined,
            () => {
              chunkFailed = true;
            },
          );
      if (awaitingCatalog || menu || chunk) {
        waitToken.current += 1;
        const entry: WaitingBooking = {
          request: { ...request, slug },
          pressed,
          returnTo,
          token: waitToken.current,
          on: awaitingCatalog ? "catalog" : "ready",
        };
        setBusy(null);
        waitingBooking.current = entry;
        setOffer(null);
        // Say so only if the wait is noticeable.
        window.setTimeout(() => {
          if (waitingBooking.current?.token === entry.token) setBusy(entry.pressed?.isConnected ? entry.pressed : null);
        }, BUSY_DELAY_MS);
        window.setTimeout(() => {
          if (waitingBooking.current?.token !== entry.token) return;
          waitToastKey.current = showToast(place ? `Opening ${place.name}…` : "Opening the booking window…");
        }, TOAST_DELAY_MS);
        const limit = new Promise<void>((resolve) => window.setTimeout(resolve, VENUE_WAIT_MS));
        // The catalogue effect below resumes a catalogue wait; this cap covers a catalogue that never answers.
        const ready = awaitingCatalog ? limit : Promise.race([Promise.all([menu, chunk]), limit]);
        void ready.then(() => {
          if (waitingBooking.current?.token !== entry.token) return;
          waitingBooking.current = null;
          setBusy(null);
          if (awaitingCatalog) {
            // Still no catalogue: open unbound once the window's code is in hand.
            startBookingRef.current(entry.request, { returnTo: entry.returnTo, pressed: entry.pressed, catalogWaited: true });
            return;
          }
          if (chunkFailed && !bookingChunkReady) {
            clearWaitToast();
            showToast("The booking window didn't load. Please try again.");
            return;
          }
          startBookingRef.current(entry.request, { returnTo: entry.returnTo, pressed: entry.pressed, noWait: true });
        });
        return;
      }
    }

    const snapshot = fresh ?? (venueId && catalog.data?.selectedVenueId === venueId ? catalog.data : null);
    const wanted = request.serviceName?.toLowerCase();
    const serviceId = request.serviceId
      ?? (wanted ? snapshot?.services.find((service) => service.name.toLowerCase() === wanted)?.id ?? null : null);

    waitingBooking.current = null;
    setBusy(null);
    clearWaitToast();
    bookingReturn.current = returnTo;
    setOffer(null);
    bookingKey.current += 1;
    setBooking({ key: bookingKey.current, venueId, serviceId, snapshot });
    // Unbound (a renamed venue, or no catalogue): SalonBooking shows its own location select.
    if (!venueId && place) showToast(`Choose ${place.name} in the booking window.`);
  }, [catalog.data, catalog.loading, clearWaitToast, currentPlace, layerHost, offer, placeBySlug, setBusy, showToast]);

  useEffect(() => {
    startBookingRef.current = startBooking;
  }, [startBooking]);

  const openBooking = useCallback(
    (request: BookingRequest = {}, options: OpenOptions = {}) => startBooking(request, { returnTo: options.returnTo }),
    [startBooking],
  );

  // The catalogue answered: run a Book tap that was waiting for it. If the place still has no live id
  // (an error or a renamed venue), the window opens unbound and says which place to choose.
  useEffect(() => {
    const entry = waitingBooking.current;
    if (catalog.loading || entry?.on !== "catalog") return;
    waitingBooking.current = null;
    startBookingRef.current(entry.request, { returnTo: entry.returnTo, pressed: entry.pressed, catalogWaited: true });
  }, [catalog.loading]);

  const directionsFor = useCallback(
    (venueId: string) => places.find((place) => place.venueId === venueId)?.directionsUrl ?? null,
    [places],
  );

  const closeBooking = useCallback(() => setBooking(null), []);

  /* ---------- Offers (demonstration only: memory, never storage) ---------- */

  const openOffer = useCallback((request: OfferRequest, options: OpenOptions = {}) => {
    cancelWaitingBooking();
    // A fresh key: a tap during the closing animation opens a new sheet instead of being lost.
    offerKey.current += 1;
    setOffer({ request, key: offerKey.current, returnTo: options.returnTo ?? activeElement() });
  }, [cancelWaitingBooking]);

  const closeOffer = useCallback(() => setOffer(null), []);

  const recordPurchase = useCallback((id: string, receipt: Receipt) => {
    setPurchases((current) => new Map(current).set(id, (current.get(id) ?? 0) + 1));
    setReceipts((current) => new Map(current).set(id, receipt));
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
      // No such element: let the browser follow the hash.
      if (!document.getElementById(target)) return;
      event.preventDefault();
      // #top is the root: scroll to 0 instantly and focus nothing.
      if (target === "top") {
        scrollToTop();
        return;
      }
      jumpTo(target);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  /* ---------- Layers ---------- */

  const registerLayer = useCallback((entry: LayerEntry) => {
    layerStack.current = [...layerStack.current.filter((item) => item.id !== entry.id), entry];
    setLayers(layerStack.current);
    return () => {
      layerStack.current = layerStack.current.filter((item) => item.id !== entry.id);
      setLayers(layerStack.current);
    };
  }, []);

  const topLayerId = layers.length ? layers[layers.length - 1].id : null;
  const layerOpen = layers.length > 0;
  const bookingOpen = booking !== null;

  // Escape closes the top layer, unless the booking window (which owns its own Escape and Tab trap) is open.
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

  // After the booking window closes, return focus to the captured opener once the page is no longer inert.
  useEffect(() => {
    if (bookingOpen) return;
    const target = bookingReturn.current;
    if (!target) return;
    let frame = 0;
    const attempt = (tries: number) => {
      frame = window.requestAnimationFrame(() => {
        const active = document.activeElement;
        const lost = !active || active === document.body;
        if (lost && target.isConnected && target.closest("[inert]") && tries > 0) {
          attempt(tries - 1);
          return;
        }
        bookingReturn.current = null;
        if (lost && target.isConnected && !target.closest("[inert]")) target.focus({ preventScroll: true });
      });
    };
    attempt(10);
    return () => window.cancelAnimationFrame(frame);
  }, [bookingOpen]);

  /* ---------- Prefetch ---------- */

  const prefetchBooking = useCallback(() => prefetch(ensureBookingChunk), []);
  const prefetchOffer = useCallback(() => prefetch(loadOfferSheet), []);

  // Warm the booking window after 6 s of idle, except for lite visitors.
  useEffect(() => {
    if (liteSnapshot()) return;
    const timer = window.setTimeout(() => prefetch(ensureBookingChunk), 6000);
    return () => window.clearTimeout(timer);
  }, []);

  const value = useMemo<SereinContextValue>(() => ({
    places,
    placeBySlug,
    catalog,
    currentPlace,
    setCurrentPlace,
    openBooking,
    prefetchBooking,
    bookingOpen,
    openOffer,
    closeOffer,
    prefetchOffer,
    purchases,
    receipts,
    recordPurchase,
    showToast,
    layerHost,
    registerLayer,
    topLayerId,
    layerOpen,
  }), [
    places, placeBySlug, catalog, currentPlace, openBooking, prefetchBooking, bookingOpen, openOffer, closeOffer,
    prefetchOffer, purchases, receipts, recordPurchase, showToast, layerHost, registerLayer, topLayerId, layerOpen,
  ]);

  return (
    <SereinContext.Provider value={value}>
      {children}
      <div ref={setLayerHost} />
      {offer ? <OfferSheet key={offer.key} request={offer.request} onClose={closeOffer} returnTo={offer.returnTo} /> : null}
      {booking ? (
        <SalonBooking
          key={booking.key}
          brand="Serein House"
          theme="serein"
          initialBootstrap={booking.snapshot}
          initialVenueId={booking.venueId}
          initialServiceId={booking.serviceId}
          directionsFor={directionsFor}
          onClose={closeBooking}
        />
      ) : null}
      <div className={styles.toastHost} role="status" aria-live="polite">
        {toast ? <p key={toast.key} className={styles.toast}>{toast.message}</p> : null}
      </div>
    </SereinContext.Provider>
  );
}

/** Wraps page regions that become inert while a layer or the booking window is open. */
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
  const { layerOpen, bookingOpen } = useSerein();
  return (
    <Tag className={className} id={id} inert={layerOpen || bookingOpen}>
      {children}
    </Tag>
  );
}
