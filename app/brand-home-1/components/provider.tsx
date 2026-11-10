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
import type { BookingBootstrap, PublicVenue } from "@/lib/dasalon/types";
import { HOUSE_BY_SLUG, HOUSES, isHouseSlug, type House, type HouseSlug } from "../data/houses";
import { seedVenue, snapshotFor } from "@/lib/dasalon/venue-cache";
import { venueSlug } from "@/lib/dasalon/slug";

const loadBooking = () => import("../../salon-booking");
const loadOfferFlow = () => import("./offer-flow");
const loadGiftFlow = () => import("./gift-flow");
const loadHouseSheet = () => import("./house-sheet");

const SalonBooking = dynamic(loadBooking, { ssr: false });
const OfferFlow = dynamic(loadOfferFlow, { ssr: false });
const GiftFlow = dynamic(loadGiftFlow, { ssr: false });
const HouseSheet = dynamic(loadHouseSheet, { ssr: false });

export type LiveHouse = House & { venueId: string | null };

export type BookingRequest = {
  house?: HouseSlug | null;
  venueId?: string | null;
  serviceId?: string | null;
};

type BookingState = {
  key: number;
  venueId: string | null;
  serviceId: string | null;
  snapshot: BookingBootstrap | null;
  directionsUrl: string | null;
};

type FlowState = { kind: "offer" | "gift"; offerId: string; house: HouseSlug | null; key: number } | null;

type LayerEntry = { id: string; close: () => void; closeOnEsc: boolean };

type MaisonContextValue = {
  houses: LiveHouse[];
  houseBySlug: (slug: HouseSlug | null | undefined) => LiveHouse | undefined;
  catalog: ReturnType<typeof useDaSalonCatalog>;
  currentHouse: HouseSlug | null;
  setCurrentHouse: (slug: HouseSlug | null) => void;
  openBooking: (request?: BookingRequest) => void;
  prefetchBooking: () => void;
  bookingOpen: boolean;
  openOffer: (offerId: string, house?: HouseSlug | null) => void;
  openGift: (offerId: string, house?: HouseSlug | null) => void;
  prefetchFlows: () => void;
  openHouse: (slug: HouseSlug, options?: { replace?: boolean }) => void;
  closeHouse: () => void;
  activeHouse: HouseSlug | null;
  prefetchHouseSheet: () => void;
  /** True while a ?house= deep link holds the film back until the sheet closes. */
  filmHold: boolean;
  layerHost: HTMLElement | null;
  registerLayer: (entry: LayerEntry) => () => void;
  topLayerId: string | null;
  layerOpen: boolean;
};

const MaisonContext = createContext<MaisonContextValue | null>(null);

export function useMaison() {
  const value = useContext(MaisonContext);
  if (!value) throw new Error("useMaison must be used inside <MaisonProvider>.");
  return value;
}

function prefetch(loader: () => Promise<unknown>) {
  void loader().catch(() => undefined);
}

function readHouseParam() {
  const value = new URLSearchParams(window.location.search).get("house");
  return isHouseSlug(value) ? value : null;
}

export function MaisonProvider({ children }: { children: ReactNode }) {
  const catalog = useDaSalonCatalog();
  const [currentHouse, setCurrentHouse] = useState<HouseSlug | null>(null);
  const [booking, setBooking] = useState<BookingState | null>(null);
  const [flow, setFlow] = useState<FlowState>(null);
  const [activeHouse, setActiveHouse] = useState<HouseSlug | null>(null);
  // A ?house= deep link holds the film back from the very first render, before the film's own effects run.
  const [filmHold, setFilmHold] = useState(() => typeof window !== "undefined" && readHouseParam() !== null);
  const [layers, setLayers] = useState<LayerEntry[]>([]);
  const [layerHost, setLayerHost] = useState<HTMLElement | null>(null);
  const pushedHouse = useRef(false);
  const bookingKey = useRef(0);
  const flowKey = useRef(0);
  const flowOpener = useRef<HTMLElement | null>(null);
  const bookingReturn = useRef<HTMLElement | null>(null);

  // Static houses, bound to live venue ids by name once the catalog arrives.
  const houses = useMemo<LiveHouse[]>(() => {
    const venues = catalog.data?.venues ?? [];
    const idBySlug = new Map(venues.map((venue) => [venueSlug(venue.name), venue.id]));
    return HOUSES.map((house) => ({ ...house, venueId: idBySlug.get(house.slug) ?? null }));
  }, [catalog.data?.venues]);

  const houseBySlug = useCallback(
    (slug: HouseSlug | null | undefined) => (slug ? houses.find((house) => house.slug === slug) : undefined),
    [houses],
  );

  useEffect(() => {
    if (catalog.data) seedVenue(catalog.data);
  }, [catalog.data]);

  const openBooking = useCallback((request: BookingRequest = {}) => {
    const house = request.house
      ? houseBySlug(request.house)
      : request.venueId
        ? houses.find((item) => item.venueId === request.venueId)
        : houseBySlug(currentHouse);
    const venueId = request.venueId ?? house?.venueId ?? null;
    if (house) setCurrentHouse(house.slug);
    // When a flow hands over to booking, its buttons disappear: return focus to whatever opened the flow.
    const active = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    bookingReturn.current = flow && flowOpener.current ? flowOpener.current : active;
    bookingKey.current += 1;
    setBooking({
      key: bookingKey.current,
      venueId,
      serviceId: request.serviceId ?? null,
      // Never hand the modal another venue's menu; without a fresh snapshot it loads the venue itself.
      snapshot: venueId
        ? snapshotFor(venueId) ?? (catalog.data?.selectedVenueId === venueId ? catalog.data : null)
        : catalog.data ?? null,
      directionsUrl: house?.directionsUrl ?? null,
    });
  }, [catalog.data, currentHouse, flow, houseBySlug, houses]);

  const directionsFor = useCallback(
    (venueId: string) => houses.find((house) => house.venueId === venueId)?.directionsUrl ?? null,
    [houses],
  );

  // The booking window names each venue by its Maison Élan house, as the rest of the page does.
  const venueLabel = useCallback(
    (venue: PublicVenue) => HOUSE_BY_SLUG.get(venueSlug(venue.name) as HouseSlug)?.name ?? venue.name,
    [],
  );

  const closeBooking = useCallback(() => setBooking(null), []);

  const openOffer = useCallback((offerId: string, house: HouseSlug | null = null) => {
    flowOpener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    flowKey.current += 1;
    setFlow({ kind: "offer", offerId, house, key: flowKey.current });
  }, []);

  const openGift = useCallback((offerId: string, house: HouseSlug | null = null) => {
    flowOpener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    flowKey.current += 1;
    setFlow({ kind: "gift", offerId, house, key: flowKey.current });
  }, []);

  const closeFlow = useCallback(() => setFlow(null), []);

  const openHouse = useCallback((slug: HouseSlug, options: { replace?: boolean } = {}) => {
    const url = `${window.location.pathname}?house=${slug}`;
    if (options.replace || readHouseParam()) {
      window.history.replaceState(window.history.state, "", url);
    } else {
      window.history.pushState(window.history.state, "", url);
      pushedHouse.current = true;
    }
    setActiveHouse(slug);
    setCurrentHouse(slug);
  }, []);

  const closeHouse = useCallback(() => {
    setActiveHouse(null);
    setFilmHold(false);
    if (pushedHouse.current) {
      pushedHouse.current = false;
      window.history.back();
    } else if (readHouseParam()) {
      window.history.replaceState(window.history.state, "", window.location.pathname);
    }
  }, []);

  // Deep links (?house=slug) open the sheet on arrival; Back closes it.
  useEffect(() => {
    const initial = readHouseParam();
    const raw = new URLSearchParams(window.location.search).get("house");
    if (raw && !initial) window.history.replaceState(window.history.state, "", window.location.pathname);
    let frame = 0;
    if (initial) {
      frame = window.requestAnimationFrame(() => {
        setActiveHouse(initial);
        setCurrentHouse(initial);
        setFilmHold(true);
      });
    }
    const onPopState = () => {
      const slug = readHouseParam();
      pushedHouse.current = false;
      setActiveHouse(slug);
      if (!slug) setFilmHold(false);
    };
    window.addEventListener("popstate", onPopState);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("popstate", onPopState);
    };
  }, []);

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
  const prefetchFlows = useCallback(() => {
    prefetch(loadOfferFlow);
    prefetch(loadGiftFlow);
  }, []);
  const prefetchHouseSheet = useCallback(() => prefetch(loadHouseSheet), []);

  // Warm the booking window when the browser is idle, unless the visitor asked to save data.
  useEffect(() => {
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    if (connection?.saveData) return;
    const timer = window.setTimeout(() => prefetch(loadBooking), 6000);
    return () => window.clearTimeout(timer);
  }, []);

  const value = useMemo<MaisonContextValue>(() => ({
    houses,
    houseBySlug,
    catalog,
    currentHouse,
    setCurrentHouse,
    openBooking,
    prefetchBooking,
    bookingOpen,
    openOffer,
    openGift,
    prefetchFlows,
    openHouse,
    closeHouse,
    activeHouse,
    prefetchHouseSheet,
    filmHold,
    layerHost,
    registerLayer,
    topLayerId,
    layerOpen,
  }), [
    houses, houseBySlug, catalog, currentHouse, openBooking, prefetchBooking, bookingOpen, openOffer, openGift,
    prefetchFlows, openHouse, closeHouse, activeHouse, prefetchHouseSheet, filmHold, layerHost, registerLayer,
    topLayerId, layerOpen,
  ]);

  return (
    <MaisonContext.Provider value={value}>
      {children}
      <div ref={setLayerHost} />
      {activeHouse ? <HouseSheet slug={activeHouse} onClose={closeHouse} /> : null}
      {flow?.kind === "offer" ? (
        <OfferFlow key={flow.key} offerId={flow.offerId} initialHouse={flow.house ?? currentHouse} onClose={closeFlow} />
      ) : null}
      {flow?.kind === "gift" ? (
        <GiftFlow key={flow.key} offerId={flow.offerId} initialHouse={flow.house ?? currentHouse} onClose={closeFlow} />
      ) : null}
      {booking ? (
        <SalonBooking
          key={booking.key}
          brand="Maison Élan"
          theme="maison"
          initialBootstrap={booking.snapshot}
          initialVenueId={booking.venueId}
          initialServiceId={booking.serviceId}
          directionsUrl={booking.directionsUrl}
          directionsFor={directionsFor}
          venueLabel={venueLabel}
          onClose={closeBooking}
        />
      ) : null}
    </MaisonContext.Provider>
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
  const { layerOpen, bookingOpen } = useMaison();
  return (
    <Tag className={className} id={id} inert={layerOpen || bookingOpen}>
      {children}
    </Tag>
  );
}
