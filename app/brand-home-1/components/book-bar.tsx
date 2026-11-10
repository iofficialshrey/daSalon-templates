"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { HouseSlug } from "../data/houses";
import { fetchVenue, prefetchVenues, useVenueEntry } from "@/lib/dasalon/venue-cache";
import { venueStatus } from "@/lib/dasalon/venue-status";
import { BookButton } from "./actions";
import { FAR_BELOW, watchElements } from "./header";
import { useClock } from "@/lib/page/use-clock";
import { Layer } from "./layer";
import { useMaison, type LiveHouse } from "./provider";
import styles from "./book-bar.module.css";
import ui from "./ui.module.css";

const PHONE = "(max-width: 759px)";

/** Inputs that raise the on-screen keyboard; radios, checkboxes and buttons do not. */
const NON_TEXT_INPUTS = new Set(["button", "checkbox", "color", "file", "hidden", "image", "radio", "range", "reset", "submit"]);

function isTextEntry(target: EventTarget | null) {
  if (target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement) return true;
  if (target instanceof HTMLInputElement) return !NON_TEXT_INPUTS.has(target.type);
  return target instanceof HTMLElement && target.isContentEditable;
}

function subscribePhone(onChange: () => void) {
  const query = window.matchMedia(PHONE);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

function usePhone() {
  return useSyncExternalStore(
    subscribePhone,
    () => window.matchMedia(PHONE).matches,
    () => false,
  );
}

/** Phone-only Book bar: the chosen house on the left (opens the chooser), Book on the right. */
export function BookBar() {
  const {
    houses,
    houseBySlug,
    catalog,
    currentHouse,
    setCurrentHouse,
    openBooking,
    prefetchBooking,
    layerOpen,
    bookingOpen,
  } = useMaison();
  const isPhone = usePhone();
  const [pastFilm, setPastFilm] = useState(false);
  const [atEnd, setAtEnd] = useState(false);
  const [typing, setTyping] = useState(false);
  const [chooserOpen, setChooserOpen] = useState(false);
  const pending = useRef<{ house: HouseSlug | null } | null>(null);

  const house = houseBySlug(currentHouse);
  const venueId = house?.venueId ?? null;
  const entry = useVenueEntry(venueId);
  // The clock ticks once a minute, so "Open now" turns into "Next opening" on time.
  const now = useClock();
  const status = house && now ? venueStatus(house.hours, entry.data, now) : null;
  const defaultVenueId = catalog.data?.selectedVenueId ?? null;
  const shown = isPhone && pastFilm && !atEnd && !layerOpen && !bookingOpen && !typing;

  // Shown only once the film's end has scrolled above the viewport top.
  useEffect(
    () =>
      watchElements(["film-end"], (element) => {
        const observer = new IntersectionObserver(
          (entries) => {
            const last = entries[entries.length - 1];
            if (last) setPastFilm(!last.isIntersecting);
          },
          { rootMargin: `0px 0px ${FAR_BELOW} 0px` },
        );
        observer.observe(element);
        return () => observer.disconnect();
      }),
    [],
  );

  // Hidden while the closing band or the footer is on screen: both carry their own Book actions.
  useEffect(() => {
    const inView = new Set<Element>();
    const observer = new IntersectionObserver((entries) => {
      for (const item of entries) {
        if (item.isIntersecting) inView.add(item.target);
        else inView.delete(item.target);
      }
      setAtEnd(inView.size > 0);
    });
    const stop = watchElements(["book", "footer"], (element) => {
      observer.observe(element);
      return () => {
        observer.unobserve(element);
        inView.delete(element);
      };
    });
    return () => {
      stop();
      observer.disconnect();
    };
  }, []);

  // Hidden while a text field has focus, so it never rides on top of the on-screen keyboard.
  useEffect(() => {
    const onFocusIn = (event: FocusEvent) => setTyping(isTextEntry(event.target));
    const onFocusOut = (event: FocusEvent) => setTyping(isTextEntry(event.relatedTarget));
    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("focusout", onFocusOut);
    return () => {
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("focusout", onFocusOut);
    };
  }, []);

  // html[data-bookbar] lets the header hide its own phone Book button while the bar is up.
  useEffect(() => {
    document.documentElement.dataset.bookbar = shown ? "on" : "off";
  }, [shown]);

  useEffect(
    () => () => {
      delete document.documentElement.dataset.bookbar;
    },
    [],
  );

  // Keep the chosen house's live status current while the bar is on screen.
  useEffect(() => {
    // The default venue is already refreshed by the shared catalog.
    if (shown && venueId && venueId !== defaultVenueId) void fetchVenue(venueId);
  }, [shown, venueId, defaultVenueId]);

  // "Book at {House}" opens the booking window once the chooser has closed and returned focus.
  useEffect(() => {
    if (chooserOpen || layerOpen || !pending.current) return;
    const frame = window.requestAnimationFrame(() => {
      const request = pending.current;
      pending.current = null;
      if (request) openBooking(request.house ? { house: request.house } : {});
    });
    return () => window.cancelAnimationFrame(frame);
  }, [chooserOpen, layerOpen, openBooking]);

  const openChooser = () => {
    prefetchVenues(houses.flatMap((item) => (item.venueId && item.venueId !== defaultVenueId ? [item.venueId] : [])));
    setChooserOpen(true);
  };

  const bookChosen = () => {
    pending.current = { house: currentHouse };
    setChooserOpen(false);
  };

  return (
    <>
      <div
        className={`${styles.bar} ${ui.onDark}`}
        data-state={shown ? "shown" : "hidden"}
        aria-hidden={shown ? undefined : true}
        inert={!shown}
      >
        <button
          type="button"
          className={styles.chooser}
          aria-label={house ? `Change house, currently ${house.name}` : "Choose a house"}
          aria-haspopup="dialog"
          onClick={openChooser}
        >
          <span className={styles.chooserTitle}>{house ? house.name : "Book a visit"}</span>
          <span className={styles.chooserLine}>
            {house ? (status ? `${status.text} · Change` : "Change") : "Choose a house ›"}
          </span>
        </button>
        <BookButton
          className={`${ui.btn} ${ui.primaryOnDark} ${styles.book}`}
          aria-label={house ? `Book at ${house.name}` : "Book a visit"}
        >
          Book
        </BookButton>
      </div>

      <Layer
        open={chooserOpen}
        onClose={() => setChooserOpen(false)}
        variant="sheet"
        title="Choose a house"
        footer={
          <button
            type="button"
            className={`${ui.btn} ${ui.lg} ${ui.primary} ${ui.block} ${styles.chooserBook}`}
            data-book=""
            onClick={bookChosen}
            onPointerEnter={prefetchBooking}
            onFocus={prefetchBooking}
            onTouchStart={prefetchBooking}
          >
            {house ? `Book at ${house.name}` : "Book a visit"}
          </button>
        }
      >
        <div className={styles.sheet}>
          <fieldset className={ui.radioCards}>
            <legend className={ui.srOnly}>Houses</legend>
            {houses.map((item) => (
              <HouseOption
                key={item.slug}
                house={item}
                checked={item.slug === currentHouse}
                catalogLoading={catalog.loading}
                onSelect={setCurrentHouse}
              />
            ))}
          </fieldset>
        </div>
      </Layer>
    </>
  );
}

function HouseOption({
  house,
  checked,
  catalogLoading,
  onSelect,
}: {
  house: LiveHouse;
  checked: boolean;
  catalogLoading: boolean;
  onSelect: (slug: HouseSlug) => void;
}) {
  const entry = useVenueEntry(house.venueId);
  const now = useClock();
  const status = now ? venueStatus(house.hours, entry.data, now) : null;
  // A skeleton while this house's dates are on their way; nothing if they cannot arrive.
  const waiting = !status && !entry.error && (house.venueId ? true : catalogLoading);
  const toneClass = status?.tone === "open" ? ui.statusOpen : status?.tone === "none" ? ui.statusQuiet : "";

  return (
    <label className={ui.radioCard}>
      <input
        type="radio"
        name="mx-book-bar-house"
        value={house.slug}
        checked={checked}
        onChange={() => onSelect(house.slug)}
      />
      <span className={styles.option}>
        <span className={ui.radioName}>{house.name}</span>
        <span className={ui.radioMeta}>
          {house.specialty} · {house.area}
        </span>
        {status ? (
          <span className={`${ui.status} ${toneClass} ${styles.optionStatus}`}>{status.text}</span>
        ) : waiting ? (
          <span className={`${ui.skeleton} ${styles.optionSkeleton}`} aria-hidden="true" />
        ) : null}
      </span>
    </label>
  );
}
