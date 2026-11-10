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
import { pendingVenue, seedVenue, snapshotFor } from "@/lib/dasalon/venue-cache";
import { venueSlug } from "@/lib/dasalon/slug";
import type { BookingBootstrap, PublicVenue } from "@/lib/dasalon/types";
import { ATELIERS, type Atelier, type AtelierSlug } from "../data/ateliers";
import { venueIdsBySlug } from "../lib/match";
import styles from "./provider.module.css";

const loadBooking = () => import("../../salon-booking");
const loadFittingRoom = () => import("./fitting-room");

const SalonBooking = dynamic(loadBooking, { ssr: false });
const FittingRoom = dynamic(loadFittingRoom, { ssr: false });

export type LiveAtelier = Atelier & { venueId: string | null };

export type BookingRequest = {
  slug?: AtelierSlug | null;
  venueId?: string | null;
  serviceId?: string | null;
  /** Resolved against the venue's live menu when no id is known (e.g. "Beard Styling"). */
  serviceName?: string | null;
};

/** Longest a Book tap waits for a venue's live menu that is already on its way. */
const VENUE_WAIT_MS = 4000;

type StartOptions = { returnTo?: HTMLElement | null; noWait?: boolean };

type WaitingBooking = { request: BookingRequest; returnTo: HTMLElement | null; token: number; on: "catalog" | "venue" };

type BookingState = {
  key: number;
  venueId: string | null;
  serviceId: string | null;
  snapshot: BookingBootstrap | null;
};

type PieceState = { pieceId: string; key: number } | null;

type LayerEntry = { id: string; close: () => void; closeOnEsc: boolean };

type AtelierContextValue = {
  ateliers: LiveAtelier[];
  atelierBySlug: (slug: AtelierSlug | null | undefined) => LiveAtelier | undefined;
  catalog: ReturnType<typeof useDaSalonCatalog>;
  /** The atelier the guest is browsing; Book opens there. In memory only. */
  currentAtelier: AtelierSlug | null;
  setCurrentAtelier: (slug: AtelierSlug | null) => void;
  openBooking: (request?: BookingRequest) => void;
  prefetchBooking: () => void;
  bookingOpen: boolean;
  /** Opens the fitting room for a membership, package or gift card. */
  openPiece: (pieceId: string) => void;
  closePiece: () => void;
  prefetchFittingRoom: () => void;
  /** Pieces bought (as a demonstration) in this tab; cleared on reload. */
  purchased: ReadonlySet<string>;
  markPurchased: (pieceId: string) => void;
  menuOpen: boolean;
  setMenuOpen: (open: boolean) => void;
  showToast: (message: string) => void;
  layerHost: HTMLElement | null;
  registerLayer: (entry: LayerEntry) => () => void;
  topLayerId: string | null;
  /** A menu sheet or fitting room is open. */
  layerOpen: boolean;
};

const AtelierContext = createContext<AtelierContextValue | null>(null);

export function useAtelier() {
  const value = useContext(AtelierContext);
  if (!value) throw new Error("useAtelier must be used inside <AtelierProvider>.");
  return value;
}

function prefetch(loader: () => Promise<unknown>) {
  void loader().catch(() => undefined);
}

export function AtelierProvider({ children }: { children: ReactNode }) {
  const catalog = useDaSalonCatalog();
  const [currentAtelier, setCurrentAtelier] = useState<AtelierSlug | null>(null);
  const [booking, setBooking] = useState<BookingState | null>(null);
  const [piece, setPiece] = useState<PieceState>(null);
  const [purchased, setPurchased] = useState<ReadonlySet<string>>(() => new Set());
  const [menuOpen, setMenuOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; key: number } | null>(null);
  const [layers, setLayers] = useState<LayerEntry[]>([]);
  const [layerHost, setLayerHost] = useState<HTMLElement | null>(null);
  const bookingKey = useRef(0);
  /** A Book tap waiting for live data; the newest tap wins. */
  const waitingBooking = useRef<WaitingBooking | null>(null);
  const waitToken = useRef(0);
  const startBookingRef = useRef<(request: BookingRequest, options?: StartOptions) => void>(() => undefined);
  const pieceKey = useRef(0);
  const pieceOpener = useRef<HTMLElement | null>(null);
  const bookingReturn = useRef<HTMLElement | null>(null);

  // Static ateliers, bound to live venue ids by name once the catalog arrives.
  const ateliers = useMemo<LiveAtelier[]>(() => {
    const ids = venueIdsBySlug(catalog.data?.venues);
    return ATELIERS.map((atelier) => ({ ...atelier, venueId: ids.get(atelier.slug) ?? null }));
  }, [catalog.data?.venues]);

  const atelierBySlug = useCallback(
    (slug: AtelierSlug | null | undefined) => (slug ? ateliers.find((atelier) => atelier.slug === slug) : undefined),
    [ateliers],
  );

  useEffect(() => {
    if (catalog.data) seedVenue(catalog.data);
  }, [catalog.data]);

  const startBooking = useCallback((request: BookingRequest, options: StartOptions = {}) => {
    const atelier = request.slug
      ? atelierBySlug(request.slug)
      : request.venueId
        ? ateliers.find((item) => item.venueId === request.venueId)
        : atelierBySlug(currentAtelier);
    const venueId = request.venueId ?? atelier?.venueId ?? null;
    if (atelier) setCurrentAtelier(atelier.slug);
    // A fitting room or the menu hands over to booking: return focus to whatever opened them.
    const active = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const returnTo = options.returnTo !== undefined
      ? options.returnTo
      : piece && pieceOpener.current ? pieceOpener.current : active;
    // Never hand the window another venue's menu; without a fresh snapshot it loads the venue itself.
    const snapshot = venueId
      ? snapshotFor(venueId) ?? (catalog.data?.selectedVenueId === venueId ? catalog.data : null)
      : catalog.data ?? null;

    // Live data on its way: wait for it rather than open the wrong venue (the catalog has not
    // bound this atelier yet) or fetch the same menu twice (the venue is already loading).
    if (!options.noWait) {
      const awaitingCatalog = Boolean(atelier && !venueId && !catalog.data && catalog.loading);
      const inflight = venueId && !snapshot ? pendingVenue(venueId) : undefined;
      if (awaitingCatalog || inflight) {
        waitToken.current += 1;
        const entry: WaitingBooking = {
          request: atelier ? { ...request, slug: atelier.slug } : request,
          returnTo,
          token: waitToken.current,
          on: inflight ? "venue" : "catalog",
        };
        waitingBooking.current = entry;
        setPiece(null);
        setMenuOpen(false);
        // Say so only if the wait is noticeable.
        window.setTimeout(() => {
          if (waitingBooking.current?.token !== entry.token) return;
          setToast((current) => ({ message: atelier ? `Opening ${atelier.name}…` : "Opening the booking window…", key: (current?.key ?? 0) + 1 }));
        }, 700);
        if (inflight) {
          const timeout = new Promise<void>((resolve) => window.setTimeout(resolve, VENUE_WAIT_MS));
          void Promise.race([inflight, timeout]).then(() => {
            if (waitingBooking.current?.token !== entry.token) return;
            waitingBooking.current = null;
            startBookingRef.current({ ...entry.request, venueId }, { returnTo: entry.returnTo, noWait: true });
          });
        }
        return;
      }
    }

    const serviceId = request.serviceId
      ?? (request.serviceName
        ? snapshot?.services.find((service) => service.name.toLowerCase() === request.serviceName?.toLowerCase())?.id ?? null
        : null);
    waitingBooking.current = null;
    bookingReturn.current = returnTo;
    setPiece(null);
    setMenuOpen(false);
    bookingKey.current += 1;
    setBooking({ key: bookingKey.current, venueId, serviceId, snapshot });
  }, [ateliers, atelierBySlug, catalog.data, catalog.loading, currentAtelier, piece]);

  useEffect(() => {
    startBookingRef.current = startBooking;
  }, [startBooking]);

  const openBooking = useCallback((request: BookingRequest = {}) => startBooking(request), [startBooking]);

  // The catalog answered: run a Book tap that was waiting for it. If the atelier still has no
  // live id (an error or a renamed venue), the window opens at the default venue.
  useEffect(() => {
    const entry = waitingBooking.current;
    if (catalog.loading || entry?.on !== "catalog") return;
    waitingBooking.current = null;
    startBooking(entry.request, { returnTo: entry.returnTo });
  }, [catalog.loading, startBooking]);

  // The booking window names each venue as the house does (the live API keeps the real names).
  const venueLabel = useCallback(
    (venue: PublicVenue) => ATELIERS.find((atelier) => atelier.slug === venueSlug(venue.name))?.name ?? venue.name,
    [],
  );

  const directionsFor = useCallback(
    (venueId: string) => ateliers.find((atelier) => atelier.venueId === venueId)?.directionsUrl ?? null,
    [ateliers],
  );

  const closeBooking = useCallback(() => setBooking(null), []);

  const openPiece = useCallback((pieceId: string) => {
    pieceOpener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    pieceKey.current += 1;
    setMenuOpen(false);
    setPiece({ pieceId, key: pieceKey.current });
  }, []);

  const closePiece = useCallback(() => setPiece(null), []);

  const markPurchased = useCallback((pieceId: string) => {
    setPurchased((current) => (current.has(pieceId) ? current : new Set(current).add(pieceId)));
  }, []);

  const showToast = useCallback((message: string) => {
    setToast((current) => ({ message, key: (current?.key ?? 0) + 1 }));
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2400);
    return () => window.clearTimeout(timer);
  }, [toast]);

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
  // outright rather than saved and restored: the booking window keeps its own save/restore, and
  // this effect runs after its cleanup, so the page can never be left locked.
  const scrollLocked = layerOpen || bookingOpen;
  useEffect(() => {
    document.body.style.overflow = scrollLocked ? "hidden" : "";
  }, [scrollLocked]);

  // After the booking window closes, make sure focus lands somewhere meaningful.
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

  const prefetchBooking = useCallback(() => prefetch(loadBooking), []);
  const prefetchFittingRoom = useCallback(() => prefetch(loadFittingRoom), []);

  // Warm the booking window when the browser is idle, unless the visitor asked to save data.
  useEffect(() => {
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    if (connection?.saveData) return;
    const timer = window.setTimeout(() => prefetch(loadBooking), 6000);
    return () => window.clearTimeout(timer);
  }, []);

  const value = useMemo<AtelierContextValue>(() => ({
    ateliers,
    atelierBySlug,
    catalog,
    currentAtelier,
    setCurrentAtelier,
    openBooking,
    prefetchBooking,
    bookingOpen,
    openPiece,
    closePiece,
    prefetchFittingRoom,
    purchased,
    markPurchased,
    menuOpen,
    setMenuOpen,
    showToast,
    layerHost,
    registerLayer,
    topLayerId,
    layerOpen,
  }), [
    ateliers, atelierBySlug, catalog, currentAtelier, openBooking, prefetchBooking, bookingOpen, openPiece,
    closePiece, prefetchFittingRoom, purchased, markPurchased, menuOpen, showToast, layerHost, registerLayer,
    topLayerId, layerOpen,
  ]);

  return (
    <AtelierContext.Provider value={value}>
      {children}
      <div ref={setLayerHost} />
      {piece ? <FittingRoom key={piece.key} pieceId={piece.pieceId} onClose={closePiece} /> : null}
      {booking ? (
        <SalonBooking
          key={booking.key}
          brand="Atelier"
          theme="atelier"
          initialBootstrap={booking.snapshot}
          initialVenueId={booking.venueId}
          initialServiceId={booking.serviceId}
          directionsFor={directionsFor}
          venueLabel={venueLabel}
          onClose={closeBooking}
        />
      ) : null}
      <div className={styles.toastHost} aria-live="polite" role="status">
        {toast ? <p key={toast.key} className={styles.toast}>{toast.message}</p> : null}
      </div>
    </AtelierContext.Provider>
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
  const { layerOpen, bookingOpen } = useAtelier();
  return (
    <Tag className={className} id={id} inert={layerOpen || bookingOpen}>
      {children}
    </Tag>
  );
}

/** Mounted by an atelier page so the header Book and the floating tag book there. */
export function CurrentAtelier({ slug }: { slug: AtelierSlug }) {
  const { setCurrentAtelier } = useAtelier();
  useEffect(() => {
    setCurrentAtelier(slug);
  }, [setCurrentAtelier, slug]);
  return null;
}
