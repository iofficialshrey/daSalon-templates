"use client";

import dynamic from "next/dynamic";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useDaSalonCatalog } from "@/lib/dasalon/client";
import { venueSlug } from "@/lib/dasalon/slug";
import type { BookingBootstrap, PublicVenue } from "@/lib/dasalon/types";
import { fetchVenue, prefetchVenues, seedVenue, snapshotFor } from "@/lib/dasalon/venue-cache";
import { readSaveData } from "@/lib/page/use-clock";
import { DEFAULT_ROOM, ROOMS, type Room, type RoomSlug } from "../data/rooms";

const loadBooking = () => import("../../salon-booking");
const loadOffer = () => import("./offer-dialog");

const SalonBooking = dynamic(loadBooking, { ssr: false });
const OfferDialog = dynamic(loadOffer, { ssr: false });

export type LiveRoom = Room & { venueId: string | null };

export type BookingRequest = { slug?: RoomSlug | null; serviceId?: string | null };

/** "Any" or the longest treatment the guest has time for, in minutes. */
export type TimeBudget = number | null;

type OruContextValue = {
  rooms: LiveRoom[];
  catalog: ReturnType<typeof useDaSalonCatalog>;
  /** The room whose menu is on the page; Book opens there. */
  room: RoomSlug;
  setRoom: (slug: RoomSlug) => void;
  budget: TimeBudget;
  setBudget: (minutes: TimeBudget) => void;
  openBooking: (request?: BookingRequest) => void;
  warmBooking: () => void;
  openOffer: (id: string) => void;
  warmOffer: () => void;
  /** Offers bought (as a demonstration) in this tab; cleared on reload. */
  purchased: ReadonlySet<string>;
  markPurchased: (id: string) => void;
  /** The booking window or an offer is open: the page behind is inert. */
  overlayOpen: boolean;
};

const OruContext = createContext<OruContextValue | null>(null);

export function useOru() {
  const value = useContext(OruContext);
  if (!value) throw new Error("useOru must be used inside <OruProvider>.");
  return value;
}

type BookingState = { key: number; venueId: string | null; serviceId: string | null; snapshot: BookingBootstrap | null };

export function OruProvider({ children }: { children: ReactNode }) {
  const catalog = useDaSalonCatalog();
  const [room, setRoom] = useState<RoomSlug>(DEFAULT_ROOM);
  const [budget, setBudget] = useState<TimeBudget>(null);
  const [booking, setBooking] = useState<BookingState | null>(null);
  const [offer, setOffer] = useState<{ id: string; key: number } | null>(null);
  const [purchased, setPurchased] = useState<ReadonlySet<string>>(() => new Set());
  const counter = useRef(0);
  const returnTo = useRef<HTMLElement | null>(null);
  /** A Book tap made before the catalog arrived; the newest one wins. */
  const waiting = useRef<BookingRequest | null>(null);

  // Static rooms, bound to live venue ids by name once the catalog arrives.
  const venues = catalog.data?.venues;
  const rooms = useMemo<LiveRoom[]>(
    () => ROOMS.map((item) => ({
      ...item,
      venueId: venues?.find((venue) => venueSlug(venue.name) === item.slug)?.id ?? null,
    })),
    [venues],
  );

  // The catalog holds the API's default venue; the spa (Oru's home menu) and the rest follow.
  useEffect(() => {
    if (!catalog.data) return;
    seedVenue(catalog.data);
    const ids = rooms.flatMap((item) => (item.venueId ? [item.venueId] : []));
    const home = rooms.find((item) => item.slug === DEFAULT_ROOM)?.venueId;
    if (home) void fetchVenue(home);
    if (readSaveData()) return;
    const timer = window.setTimeout(() => void prefetchVenues(ids.filter((id) => id !== home)), 1500);
    return () => window.clearTimeout(timer);
  }, [catalog.data, rooms]);

  const remember = () => {
    returnTo.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  };

  const openBooking = useCallback((request: BookingRequest = {}) => {
    const target = rooms.find((item) => item.slug === (request.slug ?? room));
    if (target && target.slug !== room) setRoom(target.slug);
    const venueId = target?.venueId ?? null;
    // The rooms are not bound to their venues until the catalog answers: wait for it, so the
    // window never opens on the API's default venue (another room's menu) by mistake.
    if (!venueId && !catalog.data && catalog.loading) {
      if (!waiting.current) remember();
      waiting.current = request;
      return;
    }
    waiting.current = null;
    // Never hand the window another venue's menu; without a fresh snapshot it loads the venue itself.
    const snapshot = venueId
      ? snapshotFor(venueId) ?? (catalog.data?.selectedVenueId === venueId ? catalog.data : null)
      : catalog.data ?? null;
    if (!returnTo.current) remember();
    counter.current += 1;
    setOffer(null);
    setBooking({ key: counter.current, venueId, serviceId: request.serviceId ?? null, snapshot });
  }, [catalog.data, catalog.loading, room, rooms]);

  // The catalog answered: run the Book tap that was waiting for it.
  useEffect(() => {
    if (catalog.loading || !waiting.current) return;
    openBooking(waiting.current);
  }, [catalog.loading, openBooking]);

  const openOffer = useCallback((id: string) => {
    remember();
    counter.current += 1;
    setOffer({ id, key: counter.current });
  }, []);

  const markPurchased = useCallback((id: string) => {
    setPurchased((current) => (current.has(id) ? current : new Set(current).add(id)));
  }, []);

  const warmBooking = useCallback(() => void loadBooking().catch(() => undefined), []);
  const warmOffer = useCallback(() => void loadOffer().catch(() => undefined), []);

  // The booking window names each venue as Oru does (the live API keeps the real names).
  const venueLabel = useCallback(
    (venue: PublicVenue) => ROOMS.find((item) => item.slug === venueSlug(venue.name))?.name ?? venue.name,
    [],
  );
  const directionsFor = useCallback(
    (venueId: string) => rooms.find((item) => item.venueId === venueId)?.directionsUrl ?? null,
    [rooms],
  );

  const overlayOpen = booking !== null || offer !== null;

  // The page stops scrolling while a window is open, and focus returns to what opened it.
  useEffect(() => {
    document.body.style.overflow = overlayOpen ? "hidden" : "";
    if (overlayOpen) return;
    const target = returnTo.current;
    returnTo.current = null;
    if (target?.isConnected) target.focus({ preventScroll: true });
  }, [overlayOpen]);
  useEffect(() => () => {
    document.body.style.overflow = "";
  }, []);

  const value = useMemo<OruContextValue>(() => ({
    rooms, catalog, room, setRoom, budget, setBudget, openBooking, warmBooking, openOffer, warmOffer,
    purchased, markPurchased, overlayOpen,
  }), [rooms, catalog, room, budget, openBooking, warmBooking, openOffer, warmOffer, purchased, markPurchased, overlayOpen]);

  return (
    <OruContext.Provider value={value}>
      {children}
      {offer ? <OfferDialog key={offer.key} offerId={offer.id} onClose={() => setOffer(null)} /> : null}
      {booking ? (
        <SalonBooking
          key={booking.key}
          brand="Oru Spa"
          theme="oru"
          initialBootstrap={booking.snapshot}
          initialVenueId={booking.venueId}
          initialServiceId={booking.serviceId}
          directionsFor={directionsFor}
          venueLabel={venueLabel}
          onClose={() => setBooking(null)}
        />
      ) : null}
    </OruContext.Provider>
  );
}

/** Page regions that must be inert while the booking window or an offer is open. */
export function Page({ children, className }: { children: ReactNode; className?: string }) {
  const { overlayOpen } = useOru();
  return (
    <div className={className} inert={overlayOpen}>
      {children}
    </div>
  );
}
