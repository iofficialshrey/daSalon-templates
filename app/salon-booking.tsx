"use client";

import Image from "next/image";
import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type FormEvent } from "react";
import type { BookingBootstrap, PublicService, PublicVenue, TimeSlot } from "@/lib/dasalon/types";
import { buildAppointmentIcs, downloadIcs } from "@/lib/dasalon/calendar";
import {
  DAY_PERIODS,
  PHONE_COUNTRIES,
  SINGAPORE,
  addMinutes,
  dateParts,
  dayPeriod,
  formatDate,
  formatDuration,
  formatLongDate,
  formatPrice,
  formatTime,
  isValidNationalNumber,
  phoneCountry,
  relativeDay,
  splitPhone,
  type DayPeriod,
} from "@/lib/dasalon/locale";
import { emptyBookingDraft, type StudioBookingDraft } from "./brand-home-7/booking-draft";
import StudioBookingReels, { StudioServiceReel } from "./salon-booking-studio-reels";
import "./salon-booking.css";

export type BookingService = { name: string; duration: string; price: string };
export type BookingTheme = "maison" | "atelier" | "serein" | "paloma" | "oru" | "neroli" | "studio";

export type StudioServiceMediaProp = {
  kind: "photo" | "type";
  src?: string;
  label: string;
  alt?: string;
};

type SalonBookingProps = {
  brand: string;
  theme: BookingTheme;
  services?: BookingService[];
  initialBootstrap?: BookingBootstrap | null;
  initialServiceId?: string | null;
  /** Studio theme: preselect a live venue and reload its catalog. */
  initialVenueId?: string | null;
  /** Studio theme: restore in-session draft (guest fields + appointment choices). */
  initialDraft?: Partial<StudioBookingDraft> | null;
  /** Studio theme: service image / type panel for the compact summary. */
  serviceMedia?: StudioServiceMediaProp | null;
  /** Verified directions URL only. */
  directionsUrl?: string | null;
  /** Resolves a verified directions URL for whichever venue the guest ends up booking. */
  directionsFor?: (venueId: string) => string | null;
  /** The name shown for a live venue, e.g. a template's own house name. Defaults to the venue's API name. */
  venueLabel?: (venue: PublicVenue) => string;
  onDraftChange?: (draft: StudioBookingDraft) => void;
  onClose: () => void;
};

type ApiResult<T> = { success: boolean; data?: T; message?: string; code?: string };
type Confirmation = {
  id: string | null;
  appointmentId: string | null;
  status: string;
  date: string;
  startTime: string;
  total?: number;
};
type Step = 1 | 2 | 3 | 4;
type SlotState = { key: string; slots: TimeSlot[]; error: string };
type GuestField = "name" | "phone" | "email";

const SLOT_CACHE_MS = 60_000;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const bookingThemes: Record<BookingTheme, {
  eyebrow: string;
  title: string;
  atmosphereTitle: string;
  atmosphereCopy: string;
  steps: [string, string, string];
  servicePrompt: string;
  datePrompt: string;
  timePrompt: string;
  nextService: string;
  nextDetails: string;
  confirm: string;
  success: string;
  /** Shown beside the disabled Next on the service step; defaults to "Choose a service to continue". */
  serviceHint?: string;
  notePlaceholder?: string;
}> = {
  maison: {
    eyebrow: "Your visit", title: "Book a visit.", atmosphereTitle: "Your suite\nis prepared.",
    atmosphereCopy: "Choose the service, the day and the hour. Payment is taken at the house, after your visit.",
    steps: ["Service", "Time", "Details"], servicePrompt: "Choose a service", datePrompt: "Choose a day",
    timePrompt: "Choose a time (SGT)", nextService: "Choose a time", nextDetails: "Add your details",
    confirm: "Confirm booking", success: "Your visit is booked.",
  },
  atelier: {
    eyebrow: "Your appointment", title: "Book an appointment.", atmosphereTitle: "Your hour,\nmade personal.",
    atmosphereCopy: "Choose the service, the day and the time from the atelier's live diary. You pay at the atelier, after your visit.",
    steps: ["Service", "Day & time", "Your details"], servicePrompt: "Choose a service", datePrompt: "Choose a day",
    timePrompt: "Choose a time (SGT)", nextService: "Choose a time", nextDetails: "Add your details",
    confirm: "Confirm appointment", success: "You're booked in.",
  },
  serein: {
    eyebrow: "Book a ritual", title: "Make space to exhale.", atmosphereTitle: "Arrive softly.\nLeave lighter.",
    atmosphereCopy: "Choose a ritual, a day and a quiet hour from the live diary. You pay on the day, after your ritual.",
    steps: ["Ritual", "Day & time", "Your details"], servicePrompt: "What does your body need?", datePrompt: "Choose a day",
    timePrompt: "Choose a quiet hour (SGT)", nextService: "Choose a time", nextDetails: "Add your details",
    confirm: "Confirm booking", success: "Your ritual is booked.",
    serviceHint: "Choose a ritual to continue",
    notePlaceholder: "Pressure, injuries, pregnancy, allergies — anything your therapist should know",
  },
  paloma: {
    eyebrow: "Book the look", title: "Book your edit.", atmosphereTitle: "Your time.\nYour edit.",
    atmosphereCopy: "Choose your edit, then a day and time from the studio's live diary. You pay at the studio, after your appointment.",
    steps: ["Edit", "Day & time", "Details"], servicePrompt: "Choose your edit", datePrompt: "Choose a day",
    timePrompt: "Choose a time", nextService: "Choose a time", nextDetails: "Add your details",
    confirm: "Confirm booking", success: "Your edit is booked.",
    serviceHint: "Choose your edit to continue",
    notePlaceholder: "Hair history, skin concerns, the occasion — anything we should know",
  },
  oru: {
    eyebrow: "A ritual in your rhythm", title: "Let the day soften.", atmosphereTitle: "A slower hour\nstarts here.",
    atmosphereCopy: "Select a treatment, follow the warmth and leave the rest of the preparation to us.",
    steps: ["Choose", "Unfold", "Belong"], servicePrompt: "Choose what calls to you", datePrompt: "Choose your day",
    timePrompt: "Follow the light", nextService: "Choose your hour", nextDetails: "Tell us about you",
    confirm: "Begin the ritual", success: "Your ritual awaits.",
  },
  neroli: {
    eyebrow: "The water path", title: "Follow the calm.", atmosphereTitle: "From first ripple\nto still water.",
    atmosphereCopy: "Move gently through treatment, tide and guest details. Your time will be waiting at the house.",
    steps: ["Ripple", "Tide", "Stillness"], servicePrompt: "Choose your first ripple", datePrompt: "Meet the right tide",
    timePrompt: "Choose when the water settles", nextService: "Follow the tide", nextDetails: "Complete the journey",
    confirm: "Reserve this ritual", success: "Stillness is reserved.",
  },
  studio: {
    eyebrow: "The booking instrument", title: "Make an entrance.", atmosphereTitle: "Look like\nyou mean it.",
    atmosphereCopy: "Select the service, lock the hour, and leave your details. Presence starts on the calendar.",
    steps: ["Edit", "Hour", "Guest"], servicePrompt: "Select your edit", datePrompt: "MAKE TIME.",
    timePrompt: "Choose your day. Find your moment.", nextService: "Choose the hour", nextDetails: "Continue",
    confirm: "Confirm appointment", success: "You're booked.",
  },
};

class BookingApiError extends Error {
  constructor(message: string, readonly status: number, readonly code?: string) {
    super(message);
    this.name = "BookingApiError";
  }
}

/** Credential and server faults are never the guest's to read about, whatever the server says. */
const UNAVAILABLE = "Online booking is unavailable just now. Please try again shortly.";

/** Only messages written here (BookingApiError) reach the guest; network and abort errors get the fallback. */
function guestMessage(issue: unknown, fallback: string) {
  return issue instanceof BookingApiError ? issue.message : fallback;
}

async function readApi<T>(response: Response): Promise<T> {
  const payload = await response.json().catch(() => null) as ApiResult<T> | null;
  if (!response.ok || !payload?.success || !payload.data) {
    const internal = response.status === 401 || response.status === 403 || response.status >= 500;
    const message = internal ? UNAVAILABLE : payload?.message || "Something went wrong. Please try again.";
    throw new BookingApiError(message, response.status, payload?.code);
  }
  return payload.data;
}

function groupServices(services: PublicService[]) {
  const groups = new Map<string, PublicService[]>();
  for (const service of services) {
    const category = service.category?.trim() || "Services";
    groups.set(category, [...(groups.get(category) ?? []), service]);
  }
  return Array.from(groups, ([category, items]) => ({ category, items }));
}

function guestErrors(guest: { name: string; phoneCode: string; phone: string; email: string }) {
  const errors: Partial<Record<GuestField, string>> = {};
  if (guest.name.trim().length < 2) errors.name = "Please enter your full name.";
  if (!isValidNationalNumber(guest.phoneCode, guest.phone)) {
    const country = phoneCountry(guest.phoneCode);
    errors.phone = `Enter a ${country.label} mobile number, for example ${country.example}.`;
  }
  if (guest.email.trim() && !EMAIL.test(guest.email.trim())) errors.email = "Please check your email address.";
  return errors;
}

function fileSlug(value: string) {
  return value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "appointment";
}

export default function SalonBooking({
  brand,
  theme,
  services: visualServices = [],
  initialBootstrap = null,
  initialServiceId = null,
  initialVenueId = null,
  initialDraft = null,
  serviceMedia = null,
  directionsUrl = null,
  directionsFor,
  venueLabel,
  onDraftChange,
  onClose,
}: SalonBookingProps) {
  const themeCopy = bookingThemes[theme];
  const isStudio = theme === "studio";
  const ids = useId();
  const formId = `${ids}-guest`;
  const draftSeed = { ...emptyBookingDraft(), ...initialDraft };
  const preferredServiceId = initialServiceId || draftSeed.serviceId || null;
  const preferredVenueId = initialVenueId || draftSeed.venueId || initialBootstrap?.selectedVenueId || "";
  const needsVenueReload = Boolean(preferredVenueId && initialBootstrap && preferredVenueId !== initialBootstrap.selectedVenueId);
  const initialPhone = splitPhone(draftSeed.phone || "", initialBootstrap?.phoneCode || SINGAPORE.phoneCode);
  // A guest who picked a service on the page starts at the date step; they can still go back.
  const startsAtTime = !isStudio && !needsVenueReload && Boolean(
    initialServiceId
    && initialBootstrap?.dates.length
    && initialBootstrap.services.some((item) => item.id === initialServiceId),
  );

  const [step, setStep] = useState<Step>(
    isStudio ? (Math.min(3, Math.max(1, draftSeed.step || 1)) as Step) : startsAtTime ? 2 : 1,
  );
  const [bootstrap, setBootstrap] = useState<BookingBootstrap | null>(initialBootstrap);
  const [venueId, setVenueId] = useState(preferredVenueId);
  // Studio's reel always rests on a service, so the centred first item counts as chosen.
  const [service, setService] = useState<PublicService | null>(
    initialBootstrap?.services.find((item) => item.id === preferredServiceId)
      || (isStudio ? initialBootstrap?.services[0] ?? null : null),
  );
  const [date, setDate] = useState(draftSeed.date || initialBootstrap?.dates[0] || "");
  const [time, setTime] = useState(draftSeed.time || "");
  const [slotState, setSlotState] = useState<SlotState | null>(null);
  const [slotNonce, setSlotNonce] = useState(0);
  const [periodChoice, setPeriodChoice] = useState<DayPeriod | null>(null);
  const [name, setName] = useState(draftSeed.firstName || "");
  const [phoneCode, setPhoneCode] = useState(initialPhone.code);
  const [phone, setPhone] = useState(initialPhone.national);
  const [email, setEmail] = useState(draftSeed.email || "");
  const [note, setNote] = useState(draftSeed.note || "");
  const [touched, setTouched] = useState<Partial<Record<GuestField, boolean>>>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [loadingCatalog, setLoadingCatalog] = useState(!initialBootstrap || needsVenueReload);
  const [catalogError, setCatalogError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [notice, setNotice] = useState("");
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const [reelsMoving, setReelsMoving] = useState(false);
  const restoredTimeRef = useRef(draftSeed.time || "");
  const timeRef = useRef(time);
  const attemptKey = useRef<string | null>(null);
  const slotCache = useRef(new Map<string, { at: number; slots: TimeSlot[] }>());
  const bodyRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLElement>(null);
  const dateRailRef = useRef<HTMLDivElement>(null);
  const firstStepRender = useRef(true);
  const detailsShownAt = useRef(0);
  const onCloseRef = useRef(onClose);
  const returnFocusRef = useRef<HTMLElement | null>(
    typeof document !== "undefined" && document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null,
  );

  const venue = bootstrap?.venues.find((item) => item.id === venueId) ?? null;
  const venueName = (venue && (venueLabel?.(venue) || venue.name)) || brand;
  const dates = useMemo(() => [...(bootstrap?.dates ?? [])].sort(), [bootstrap?.dates]);
  const serviceGroups = useMemo(() => groupServices(bootstrap?.services ?? []), [bootstrap?.services]);
  const slotKey = venueId && service && date ? `${venueId}|${service.id}|${date}` : "";
  const slotsReady = Boolean(slotKey) && slotState?.key === slotKey;
  const slots = useMemo(() => (slotsReady && slotState ? slotState.slots : []), [slotsReady, slotState]);
  const slotsError = slotsReady && slotState ? slotState.error : "";
  const loadingSlots = step >= 2 && Boolean(slotKey) && !slotsReady;
  const periods = useMemo(() => DAY_PERIODS
    .map((period) => ({ ...period, count: slots.filter((slot) => dayPeriod(slot.time) === period.id).length }))
    .filter((period) => period.count > 0), [slots]);
  const activePeriod = periodChoice && periods.some((period) => period.id === periodChoice)
    ? periodChoice
    : time && slots.some((slot) => slot.time === time)
      ? dayPeriod(time)
      : [...periods].sort((a, b) => a.preference - b.preference)[0]?.id ?? null;
  const visibleSlots = slots.filter((slot) => dayPeriod(slot.time) === activePeriod);
  const nextDate = dates[dates.indexOf(date) + 1] ?? null;
  const endTime = service && time ? addMinutes(time, service.duration) : "";
  const errors = guestErrors({ name, phoneCode, phone, email });
  const visibleError = (field: GuestField) => (submitAttempted || touched[field] ? errors[field] : undefined);
  const firstName = name.trim().split(/\s+/)[0] || "";
  const reference = confirmation?.appointmentId || confirmation?.id || null;
  const bookedDirections = directionsFor
    ? (venueId ? directionsFor(venueId) : null)
    : (venueId === (initialVenueId || initialBootstrap?.selectedVenueId) ? directionsUrl : null);
  const amountDue = confirmation?.total ?? service?.total ?? service?.price ?? 0;
  const itinerary = [
    service ? service.name : "",
    time && date ? `${formatDate(date)} · ${formatTime(time)}` : "",
    firstName,
  ];

  function emitDraft(partial?: Partial<StudioBookingDraft>) {
    if (!isStudio || !onDraftChange || step === 4) return;
    onDraftChange({
      serviceId: service?.id || null,
      venueId: venueId || null,
      date: date || null,
      time: time || null,
      firstName: name,
      phone: phone ? `${phoneCode}${phone.replace(/\D/g, "")}` : "",
      email,
      note,
      step: step as 1 | 2 | 3,
      updatedAt: Date.now(),
      ...partial,
    });
  }

  async function loadBootstrap(nextVenueId?: string, preserveServiceId?: string | null) {
    setLoadingCatalog(true);
    setCatalogError("");
    try {
      const query = nextVenueId ? `?venueId=${encodeURIComponent(nextVenueId)}` : "";
      const data = await readApi<BookingBootstrap>(await fetch(`/api/dasalon/bootstrap${query}`, { cache: "no-store" }));
      const keepId = preserveServiceId ?? service?.id ?? preferredServiceId;
      const preferredName = service?.name || visualServices[0]?.name;
      const nextService = data.services.find((item) => item.id === keepId)
        || (preferredName ? data.services.find((item) => item.name.toLowerCase() === preferredName.toLowerCase()) : undefined)
        || (isStudio ? data.services[0] : undefined)
        || null;
      const sortedDates = [...data.dates].sort();
      const restoredDate = draftSeed.date && sortedDates.includes(draftSeed.date)
        ? draftSeed.date
        : date && sortedDates.includes(date) ? date : sortedDates[0] || "";
      if (draftSeed.date && !sortedDates.includes(draftSeed.date)) {
        setNotice("Your saved date is no longer available. Please choose a new day.");
      }
      setBootstrap(data);
      setVenueId(data.selectedVenueId);
      setService(nextService);
      setDate(restoredDate);
      if (!(draftSeed.time && restoredDate === draftSeed.date)) setTime("");
      if (data.services.length === 0) setCatalogError("No online services are available at this location.");
      else if (data.dates.length === 0) setCatalogError("This location has no bookable dates right now.");
    } catch (issue) {
      setCatalogError(guestMessage(issue, "Booking is temporarily unavailable."));
    } finally {
      setLoadingCatalog(false);
    }
  }

  // The modal mounts on open; venue changes call the loader explicitly.
  /* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
  useEffect(() => {
    if (!initialBootstrap || needsVenueReload) void loadBootstrap(preferredVenueId || undefined, preferredServiceId);
    if (!isStudio && service) {
      bodyRef.current?.querySelector<HTMLElement>('.salon-booker-service[aria-pressed="true"]')?.scrollIntoView({ block: "center" });
    }
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */

  useEffect(() => {
    emitDraft();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme, service?.id, venueId, date, time, name, phone, phoneCode, email, note, step]);

  useEffect(() => {
    timeRef.current = time;
  }, [time]);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  // Runs once per open: parents often pass an inline onClose, and re-running this
  // effect on their re-renders would steal focus from the field being typed in.
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const previousFocus = returnFocusRef.current;
    document.body.style.overflow = "hidden";
    const focusFrame = window.requestAnimationFrame(() => {
      dialogRef.current?.querySelector<HTMLButtonElement>('[aria-label="Close booking"]')?.focus();
    });
    const handleDialogKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onCloseRef.current();
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
      ) ?? []).filter((element) => element.getClientRects().length > 0);
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", handleDialogKey);
    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleDialogKey);
      previousFocus?.focus();
    };
  }, []);

  useEffect(() => {
    attemptKey.current = null;
  }, [venueId, service?.id, date, time]);

  // Recorded before the browser handles another click, so a double click cannot slip through.
  useLayoutEffect(() => {
    if (step === 3) detailsShownAt.current = performance.now();
  }, [step]);

  useEffect(() => {
    if (firstStepRender.current) {
      firstStepRender.current = false;
      return;
    }
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    bodyRef.current?.scrollTo({ top: 0, behavior: reducedMotion ? "auto" : "smooth" });
    bodyRef.current?.querySelector<HTMLElement>("[data-step-focus]")?.focus({ preventScroll: true });
  }, [step]);

  useEffect(() => {
    if (!submitError) return;
    bodyRef.current?.querySelector<HTMLElement>(".salon-booker-guest .salon-booker-error")?.scrollIntoView({ block: "nearest" });
  }, [submitError]);

  useEffect(() => {
    if (step !== 2 || isStudio) return;
    const rail = dateRailRef.current;
    const selected = rail?.querySelector<HTMLElement>('[aria-pressed="true"]');
    if (!rail || !selected) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    rail.scrollTo({
      left: Math.max(0, selected.offsetLeft - (rail.clientWidth - selected.offsetWidth) / 2),
      behavior: reducedMotion ? "auto" : "smooth",
    });
  }, [step, date, isStudio]);

  useEffect(() => {
    if (step < 2 || !slotKey || !service || slotState?.key === slotKey) return;
    const controller = new AbortController();
    const key = slotKey;
    const cached = slotCache.current.get(key);
    const request = cached && Date.now() - cached.at < SLOT_CACHE_MS
      ? Promise.resolve(cached.slots)
      : fetch(`/api/dasalon/time-slots?${new URLSearchParams({ venueId, date, serviceIds: service.id })}`, {
        cache: "no-store",
        signal: controller.signal,
      })
        .then(readApi<{ date: string; timeSlots: TimeSlot[] }>)
        .then((data) => {
          slotCache.current.set(key, { at: Date.now(), slots: data.timeSlots });
          return data.timeSlots;
        });

    request
      .then((nextSlots) => {
        if (controller.signal.aborted) return;
        const current = timeRef.current;
        const restored = restoredTimeRef.current;
        let nextTime = "";
        if (current && nextSlots.some((slot) => slot.time === current)) {
          nextTime = current;
        } else if (restored && nextSlots.some((slot) => slot.time === restored)) {
          nextTime = restored;
          restoredTimeRef.current = "";
        } else {
          if (current) setNotice("Your chosen time is no longer open. Please pick another.");
          if (isStudio) nextTime = nextSlots[0]?.time || "";
        }
        setSlotState({ key, slots: nextSlots, error: "" });
        setTime(nextTime);
      })
      .catch((issue) => {
        if (controller.signal.aborted || (issue instanceof Error && issue.name === "AbortError")) return;
        setSlotState({ key, slots: [], error: guestMessage(issue, "Times could not be loaded.") });
      });

    return () => controller.abort();
    // slotKey already encodes venue, service and date.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slotKey, step, slotNonce]);

  function chooseVenue(nextVenueId: string) {
    setNotice("");
    setTime("");
    setPeriodChoice(null);
    void loadBootstrap(nextVenueId, service?.id);
  }

  function chooseService(next: PublicService) {
    setService(next);
    setNotice("");
    setSubmitError("");
  }

  function chooseDate(next: string) {
    if (next === date) return;
    setDate(next);
    setTime("");
    setPeriodChoice(null);
    setNotice("");
  }

  function chooseTime(next: string) {
    setTime(next);
    setNotice("");
  }

  function continueToTime() {
    if (!service || dates.length === 0) return;
    if (!dates.includes(date)) setDate(dates[0]);
    setNotice("");
    setReelsMoving(false);
    setStep(2);
  }

  function continueToDetails() {
    if (!time) return;
    setNotice("");
    setStep(3);
  }

  function goBack() {
    setSubmitError("");
    setReelsMoving(false);
    setStep((current) => (current > 1 ? (current - 1) as Step : current));
  }

  function retrySlots() {
    slotCache.current.delete(slotKey);
    setSlotState(null);
    setSlotNonce((value) => value + 1);
  }

  function scrollDates(direction: 1 | -1) {
    const rail = dateRailRef.current;
    if (!rail) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    rail.scrollBy({ left: direction * rail.clientWidth * 0.8, behavior: reducedMotion ? "auto" : "smooth" });
  }

  function bookAnother() {
    slotCache.current.clear();
    attemptKey.current = null;
    setSlotState(null);
    setConfirmation(null);
    setService(isStudio ? service : null);
    setTime("");
    setPeriodChoice(null);
    setSubmitAttempted(false);
    setTouched({});
    setNote("");
    setStep(1);
  }

  function addToCalendar() {
    if (!service || !confirmation) return;
    const ics = buildAppointmentIcs({
      title: `${service.name} · ${brand}`,
      description: `${service.name} at ${venueName}.${reference ? ` Reference ${reference}.` : ""} Payment is due at the venue.`,
      location: [venueName, venue?.city].filter(Boolean).join(", "),
      date: confirmation.date,
      startTime: confirmation.startTime,
      durationMinutes: service.duration,
      timezone: venue?.timezone,
      uid: `${reference || crypto.randomUUID()}@dasalon-brand-home`,
    });
    downloadIcs(`${fileSlug(brand)}-appointment.ics`, ics);
  }

  async function confirm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!service || !venueId || !date || !time || submitting) return;
    // The details step must be on screen briefly before it can submit: a double click
    // on the previous step's button would otherwise confirm a real appointment.
    // event.timeStamp shares performance.now()'s clock.
    if (event.timeStamp - detailsShownAt.current < 600) return;
    setSubmitAttempted(true);
    const invalid = (["name", "phone", "email"] as GuestField[]).find((field) => errors[field]);
    if (invalid) {
      document.getElementById(`${ids}-${invalid}`)?.focus();
      return;
    }

    setSubmitting(true);
    setSubmitError("");
    attemptKey.current ||= crypto.randomUUID();

    try {
      const data = await readApi<Confirmation>(await fetch("/api/dasalon/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Idempotency-Key": attemptKey.current },
        body: JSON.stringify({
          venueId,
          serviceId: service.id,
          date,
          startTime: time,
          client: {
            name: name.trim(),
            phone: `${phoneCode}${phone.replace(/\D/g, "")}`,
            email: email.trim() || undefined,
          },
          note: note.trim() || undefined,
        }),
      }));
      slotCache.current.clear();
      setConfirmation(data);
      setStep(4);
      if (isStudio && onDraftChange) onDraftChange(emptyBookingDraft());
    } catch (issue) {
      if (issue instanceof BookingApiError && issue.code === "SLOT_TAKEN") {
        slotCache.current.delete(slotKey);
        setSlotState(null);
        setTime("");
        setNotice(issue.message);
        setStep(2);
      } else if (issue instanceof BookingApiError && issue.code === "SERVICE_UNAVAILABLE") {
        setNotice(issue.message);
        setStep(1);
        void loadBootstrap(venueId, null);
      } else {
        setSubmitError(guestMessage(issue, "The booking could not be confirmed."));
      }
    } finally {
      setSubmitting(false);
    }
  }

  const venueSelect = bootstrap && bootstrap.venues.length > 1 ? (
    <label className="salon-booker-venue">
      <span>Location</span>
      <select value={venueId} onChange={(event) => chooseVenue(event.target.value)} disabled={loadingCatalog}>
        {bootstrap.venues.map((item) => (
          <option value={item.id} key={item.id}>
            {venueLabel?.(item) || item.name}{item.city ? ` · ${item.city.charAt(0).toUpperCase()}${item.city.slice(1)}` : ""}
          </option>
        ))}
      </select>
    </label>
  ) : null;

  const footer = (() => {
    if (step === 4 || (isStudio && step < 3)) return null;
    const primary = step === 1
      ? { label: themeCopy.nextService, disabled: !service || loadingCatalog || dates.length === 0, onClick: continueToTime }
      : step === 2
        ? { label: themeCopy.nextDetails, disabled: !time || loadingSlots, onClick: continueToDetails }
        : null;
    const hint = step === 1 ? themeCopy.serviceHint ?? "Choose a service to continue" : "Choose a time to continue";
    const detail = step === 1
      ? service ? formatDuration(service.duration) : ""
      : date ? [formatDate(date), time ? formatTime(time) : ""].filter(Boolean).join(" · ") : "";

    return (
      <footer className="salon-booker-footer">
        <div className="salon-booker-footer-summary" aria-live="polite">
          {service ? (
            <span><strong>{service.name}</strong><small>{detail}</small></span>
          ) : (
            <span><small>{hint}</small></span>
          )}
          {service && (
            <b>
              <small>{step === 3 ? "Pay at venue" : "Total"}</small>
              {formatPrice(service.total ?? service.price)}
            </b>
          )}
        </div>
        <div className="salon-booker-footer-actions">
          {step > 1 && (
            <button type="button" className="salon-booker-back" onClick={goBack} aria-label="Back to the previous step">
              <span aria-hidden="true">←</span><span className="salon-booker-back-label"> Back</span>
            </button>
          )}
          {/* Keyed per step: reusing one element would let the click that opens
              the details step activate the new submit button and send the form. */}
          {primary ? (
            <button key={`next-${step}`} className="salon-booker-next" type="button" disabled={primary.disabled} onClick={primary.onClick}>
              {primary.label} <span aria-hidden="true">→</span>
            </button>
          ) : (
            <button key="submit" className="salon-booker-next" type="submit" form={formId} disabled={submitting}>
              {submitting ? "Confirming…" : themeCopy.confirm} <span aria-hidden="true">→</span>
            </button>
          )}
        </div>
        <p className="salon-booker-powered">Secure booking · Powered by da Salon</p>
      </footer>
    );
  })();

  return (
    <div className={`salon-booking-overlay booking-experience-overlay booking-overlay-${theme}`} role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <aside
        ref={dialogRef}
        className={`salon-booker booking-experience booking-theme-${theme}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${ids}-title`}
        aria-busy={loadingCatalog || loadingSlots || submitting}
      >
        <div className="salon-booker-atmosphere" aria-hidden="true">
          <div className="salon-booker-ornament"><i /><i /><i /></div>
          <small>{themeCopy.eyebrow}</small>
          <h2>{themeCopy.atmosphereTitle.split("\n").map((line) => <span key={line}>{line}</span>)}</h2>
          <p>{themeCopy.atmosphereCopy}</p>
          <ol className="salon-booker-itinerary">
            {themeCopy.steps.map((label, index) => (
              <li key={label} className={step === 4 || index + 1 < step ? "is-done" : index + 1 === step ? "is-current" : ""}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <b>{label}</b>
                <em>{itinerary[index] || "—"}</em>
              </li>
            ))}
          </ol>
        </div>

        <div className="salon-booker-panel">
          <header className="salon-booker-head">
            <div>
              <small>{brand} · {themeCopy.eyebrow}</small>
              <h2 id={`${ids}-title`}>{step === 4 ? themeCopy.success : themeCopy.title}</h2>
            </div>
            <button type="button" onClick={onClose} aria-label="Close booking"><span>Close</span>×</button>
          </header>

          {step < 4 && (
            <nav className="salon-booker-progress" aria-label="Booking steps">
              {themeCopy.steps.map((label, index) => (
                <button
                  type="button"
                  key={label}
                  className={index + 1 <= step ? "active" : ""}
                  aria-current={index + 1 === step ? "step" : undefined}
                  disabled={index + 1 > step}
                  onClick={() => index + 1 < step && setStep((index + 1) as Step)}
                >
                  {!isStudio && <i>{String(index + 1).padStart(2, "0")}</i>}
                  <span>{label}</span>
                </button>
              ))}
            </nav>
          )}

          <div className="salon-booker-body" ref={bodyRef}>
            {notice && <div className="salon-booker-status salon-booker-notice" role="status">{notice}</div>}

            {step === 1 && isStudio && (
              <section className="salon-booker-step studio-booker-step-reels">
                {service && (
                  <div className={`studio-booker-summary-card${serviceMedia ? " has-media" : ""}`} aria-live="polite">
                    {serviceMedia?.kind === "photo" && serviceMedia.src ? (
                      <div className="studio-booker-summary-media">
                        <Image src={serviceMedia.src} alt={serviceMedia.alt || ""} fill sizes="120px" />
                      </div>
                    ) : serviceMedia?.kind === "type" ? (
                      <div className="studio-booker-summary-type" aria-hidden="true">
                        <span>{serviceMedia.label}</span>
                      </div>
                    ) : null}
                    <div className="studio-booker-summary-copy">
                      <p className="s7-mono">Selected edit</p>
                      <strong>{service.name}</strong>
                      <span>{venueName} · {formatDuration(service.duration)} · {formatPrice(service.price)}</span>
                    </div>
                  </div>
                )}
                <StudioServiceReel
                  services={(bootstrap?.services ?? []).map((item) => ({
                    id: item.id,
                    name: item.name,
                    duration: item.duration,
                    priceLabel: formatPrice(item.price),
                    category: item.category,
                  }))}
                  serviceId={service?.id || null}
                  onServiceSettle={(nextId) => {
                    const next = bootstrap?.services.find((item) => item.id === nextId);
                    if (next) chooseService(next);
                  }}
                  onMovingChange={setReelsMoving}
                  loading={loadingCatalog}
                  error={!loadingCatalog ? catalogError : undefined}
                  onRetry={() => void loadBootstrap(venueId || undefined, service?.id)}
                  venueSelect={venueSelect}
                  onContinue={continueToTime}
                  continueDisabled={!service || dates.length === 0 || loadingCatalog || reelsMoving}
                  continueLabel={themeCopy.nextService}
                />
              </section>
            )}

            {step === 1 && !isStudio && (
              <section className="salon-booker-step">
                {venueSelect}
                <p className="salon-booker-label" data-step-focus tabIndex={-1}>{themeCopy.servicePrompt}</p>
                {loadingCatalog && (
                  <div className="salon-booker-skeleton salon-booker-skeleton-services" role="status" aria-label="Loading services">
                    <i /><i /><i /><i />
                  </div>
                )}
                {!loadingCatalog && catalogError && (
                  <div className="salon-booker-status salon-booker-error" role="alert">
                    <span>{catalogError}</span>
                    <button type="button" onClick={() => void loadBootstrap(venueId || undefined)}>Try again</button>
                  </div>
                )}
                {!loadingCatalog && bootstrap && (
                  <div className="salon-booker-services">
                    {serviceGroups.map((group) => (
                      <div className="salon-booker-service-group" key={group.category} role="group" aria-label={group.category}>
                        {serviceGroups.length > 1 && <h3>{group.category}</h3>}
                        {group.items.map((item) => (
                          <button
                            type="button"
                            className={`salon-booker-service${service?.id === item.id ? " selected" : ""}`}
                            aria-pressed={service?.id === item.id}
                            key={item.id}
                            onClick={() => chooseService(item)}
                          >
                            <span className="salon-booker-service-copy">
                              <strong>{item.name}</strong>
                              {item.description && <small>{item.description}</small>}
                            </span>
                            <span className="salon-booker-service-meta">
                              <small>{formatDuration(item.duration)}</small>
                              <b>{formatPrice(item.price)}</b>
                            </span>
                            <i className="salon-booker-check" aria-hidden="true" />
                          </button>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}

            {step === 2 && isStudio && (
              <section className="salon-booker-step studio-booker-step-reels">
                <button className="salon-booker-back" type="button" onClick={goBack}>← Services</button>
                <StudioBookingReels
                  dates={dates}
                  date={date}
                  onDateSettle={chooseDate}
                  times={slots.map((slot) => slot.time)}
                  time={time}
                  onTimeSettle={chooseTime}
                  loadingSlots={loadingSlots}
                  slotsError={slotsError || undefined}
                  onMovingChange={setReelsMoving}
                  onContinue={continueToDetails}
                  continueDisabled={!date || !time || loadingSlots || reelsMoving || slots.length === 0}
                  continueLabel={themeCopy.nextDetails}
                />
              </section>
            )}

            {step === 2 && !isStudio && (
              <section className="salon-booker-step">
                <div className="salon-booker-label-row">
                  <p className="salon-booker-label" data-step-focus tabIndex={-1}>{themeCopy.datePrompt}</p>
                  {date && <span>{dateParts(date).monthYear}</span>}
                </div>
                <div className="salon-booker-date-rail">
                  <button type="button" className="salon-booker-rail-arrow" aria-label="Earlier dates" onClick={() => scrollDates(-1)}>←</button>
                  <div className="salon-booker-dates" ref={dateRailRef} role="group" aria-label="Available dates">
                    {dates.map((item) => {
                      const parts = dateParts(item);
                      const relative = relativeDay(item);
                      return (
                        <button
                          type="button"
                          key={item}
                          aria-pressed={date === item}
                          aria-label={`${relative ? `${relative}, ` : ""}${formatLongDate(item)}`}
                          onClick={() => chooseDate(item)}
                        >
                          <small>{relative ?? parts.weekday}</small>
                          <strong>{parts.day}</strong>
                          <span>{parts.month}</span>
                        </button>
                      );
                    })}
                  </div>
                  <button type="button" className="salon-booker-rail-arrow" aria-label="Later dates" onClick={() => scrollDates(1)}>→</button>
                </div>

                <div className="salon-booker-label-row">
                  <p className="salon-booker-label">{themeCopy.timePrompt}</p>
                  <span>{SINGAPORE.timeZoneLabel}</span>
                </div>
                {loadingSlots && (
                  <div className="salon-booker-skeleton salon-booker-skeleton-times" role="status" aria-label="Checking availability">
                    {Array.from({ length: 8 }, (_, index) => <i key={index} />)}
                  </div>
                )}
                {!loadingSlots && slotsError && (
                  <div className="salon-booker-status salon-booker-error" role="alert">
                    <span>{slotsError}</span>
                    <button type="button" onClick={retrySlots}>Try again</button>
                  </div>
                )}
                {!loadingSlots && !slotsError && slotsReady && slots.length === 0 && (
                  <div className="salon-booker-status salon-booker-empty" role="status">
                    <span>No times left on {formatDate(date)}.</span>
                    {nextDate && <button type="button" onClick={() => chooseDate(nextDate)}>See {formatDate(nextDate)} <span aria-hidden="true">→</span></button>}
                  </div>
                )}
                {!loadingSlots && slots.length > 0 && (
                  <>
                    <div className="salon-booker-periods" role="group" aria-label="Time of day">
                      {periods.map((period) => (
                        <button
                          type="button"
                          key={period.id}
                          aria-pressed={activePeriod === period.id}
                          onClick={() => setPeriodChoice(period.id)}
                        >
                          <span>{period.label}</span>
                          <small>{period.count}</small>
                        </button>
                      ))}
                    </div>
                    <div className="salon-booker-times" role="group" aria-label="Available times">
                      {visibleSlots.map((slot) => (
                        <button type="button" key={slot.time} aria-pressed={time === slot.time} onClick={() => chooseTime(slot.time)}>
                          {formatTime(slot.time)}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </section>
            )}

            {step === 3 && service && (
              <form id={formId} className="salon-booker-step salon-booker-guest" onSubmit={confirm} noValidate>
                <p className="salon-booker-label" data-step-focus tabIndex={-1}>Your appointment</p>
                <dl className="salon-booker-review">
                  <div>
                    <dt>Service</dt>
                    <dd><strong>{service.name}</strong><span>{formatDuration(service.duration)} · {formatPrice(service.price)}</span></dd>
                    <button type="button" onClick={() => setStep(1)} aria-label="Change service">Change</button>
                  </div>
                  <div>
                    <dt>Date &amp; time</dt>
                    <dd><strong>{formatLongDate(date)}</strong><span>{formatTime(time)} – {formatTime(endTime)}</span></dd>
                    <button type="button" onClick={() => setStep(2)} aria-label="Change date and time">Change</button>
                  </div>
                  <div>
                    <dt>Location</dt>
                    <dd><strong>{venueName}</strong><span>{venue?.city ? `${venue.city.charAt(0).toUpperCase()}${venue.city.slice(1)}` : brand}</span></dd>
                    {(bootstrap?.venues.length ?? 0) > 1 && (
                      <button type="button" onClick={() => setStep(1)} aria-label="Change location">Change</button>
                    )}
                  </div>
                  <div>
                    <dt>Payment</dt>
                    <dd>
                      <strong>{formatPrice(service.total ?? service.price)} at the venue</strong>
                      <span>{service.taxLabel ? `${service.taxLabel} · ` : ""}Nothing is charged online</span>
                    </dd>
                  </div>
                </dl>

                <p className="salon-booker-label">Your details</p>
                <div className="salon-booker-field">
                  <label htmlFor={`${ids}-name`}>Full name</label>
                  <input
                    id={`${ids}-name`}
                    required
                    maxLength={100}
                    autoComplete="name"
                    value={name}
                    aria-invalid={Boolean(visibleError("name"))}
                    aria-describedby={visibleError("name") ? `${ids}-name-error` : undefined}
                    onBlur={() => setTouched((current) => ({ ...current, name: true }))}
                    onChange={(event) => setName(event.target.value)}
                  />
                  {visibleError("name") && <small id={`${ids}-name-error`} className="salon-booker-field-error">{visibleError("name")}</small>}
                </div>
                <div className="salon-booker-field">
                  <label htmlFor={`${ids}-phone`}>Mobile number</label>
                  <div className="salon-booker-phone-row">
                    {PHONE_COUNTRIES.length > 1 ? (
                      <select aria-label="Country code" value={phoneCode} onChange={(event) => setPhoneCode(event.target.value)}>
                        {PHONE_COUNTRIES.map((item) => (
                          <option key={item.code} value={item.code}>{item.region} {item.code}</option>
                        ))}
                      </select>
                    ) : (
                      <span className="salon-booker-phone-prefix" id={`${ids}-phone-prefix`}>{phoneCode}</span>
                    )}
                    <input
                      id={`${ids}-phone`}
                      required
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel-national"
                      maxLength={16}
                      placeholder={phoneCountry(phoneCode).example}
                      value={phone}
                      aria-invalid={Boolean(visibleError("phone"))}
                      aria-describedby={[PHONE_COUNTRIES.length > 1 ? "" : `${ids}-phone-prefix`, visibleError("phone") ? `${ids}-phone-error` : ""].filter(Boolean).join(" ") || undefined}
                      onBlur={() => setTouched((current) => ({ ...current, phone: true }))}
                      onChange={(event) => setPhone(event.target.value.replace(/[^\d\s]/g, ""))}
                    />
                  </div>
                  {visibleError("phone") && <small id={`${ids}-phone-error`} className="salon-booker-field-error">{visibleError("phone")}</small>}
                </div>
                <div className="salon-booker-field">
                  <label htmlFor={`${ids}-email`}>Email <em>Optional</em></label>
                  <input
                    id={`${ids}-email`}
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    maxLength={254}
                    value={email}
                    aria-invalid={Boolean(visibleError("email"))}
                    aria-describedby={visibleError("email") ? `${ids}-email-error` : undefined}
                    onBlur={() => setTouched((current) => ({ ...current, email: true }))}
                    onChange={(event) => setEmail(event.target.value)}
                  />
                  {visibleError("email") && <small id={`${ids}-email-error`} className="salon-booker-field-error">{visibleError("email")}</small>}
                </div>
                <div className="salon-booker-field">
                  <label htmlFor={`${ids}-note`}>A note for the team <em>Optional</em></label>
                  <textarea
                    id={`${ids}-note`}
                    rows={3}
                    maxLength={500}
                    placeholder={themeCopy.notePlaceholder ?? "Preferences, sensitivities or anything we should know"}
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                  />
                </div>

                {submitError && <div className="salon-booker-status salon-booker-error" role="alert">{submitError}</div>}
              </form>
            )}

            {step === 4 && service && confirmation && (
              <section className="salon-booker-confirmation">
                <span className="salon-booker-confirmation-mark" aria-hidden="true">{isStudio ? "✓" : brand.charAt(0)}</span>
                <p className="salon-booker-confirmation-eyebrow">Appointment confirmed</p>
                <h3 data-step-focus tabIndex={-1}>Thank you{firstName ? `, ${firstName}` : ""}.</h3>
                <dl className="salon-booker-confirmation-details">
                  <div><dt>Service</dt><dd>{service.name} · {formatDuration(service.duration)}</dd></div>
                  <div>
                    <dt>Date &amp; time</dt>
                    <dd>{formatLongDate(confirmation.date)}, {formatTime(confirmation.startTime)} – {formatTime(addMinutes(confirmation.startTime, service.duration))}</dd>
                  </div>
                  <div><dt>Location</dt><dd>{venueName}</dd></div>
                  {reference && <div><dt>Reference</dt><dd>{reference}</dd></div>}
                  <div><dt>Payment</dt><dd>{formatPrice(amountDue)}, due at the venue</dd></div>
                </dl>
                <div className="salon-booker-confirmation-actions">
                  <button type="button" className="salon-booker-secondary" onClick={addToCalendar}>Add to calendar</button>
                  {bookedDirections && (
                    <a className="salon-booker-secondary" href={bookedDirections} target="_blank" rel="noreferrer">Directions</a>
                  )}
                </div>
                <div className="salon-booker-confirmation-links">
                  <button type="button" onClick={bookAnother}>Book another visit</button>
                  <button type="button" onClick={onClose}>Return to {brand}</button>
                </div>
                <p className="salon-booker-powered">Secure booking · Powered by da Salon</p>
              </section>
            )}
          </div>

          {footer}
        </div>
      </aside>
    </div>
  );
}
