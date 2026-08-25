"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import type { BookingBootstrap, PublicService, TimeSlot } from "@/lib/dasalon/types";

export type BookingService = { name: string; duration: string; price: string };
export type BookingTheme = "maison" | "atelier" | "serein" | "paloma" | "oru" | "neroli";

type SalonBookingProps = {
  brand: string;
  theme: BookingTheme;
  services?: BookingService[];
  initialBootstrap?: BookingBootstrap | null;
  initialServiceId?: string | null;
  onClose: () => void;
};

type ApiResult<T> = { success: boolean; data?: T; message?: string };
type Confirmation = {
  id: string | null;
  appointmentId: string | null;
  status: string;
  date: string;
  startTime: string;
};

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
}> = {
  maison: {
    eyebrow: "The reservation ledger", title: "Reserve your chair.", atmosphereTitle: "A private ritual,\nkept for you.",
    atmosphereCopy: "Choose the care, the hour and the details. We will prepare the atelier before you arrive.",
    steps: ["Ritual", "Hour", "Guest"], servicePrompt: "Select your ritual", datePrompt: "Choose the day",
    timePrompt: "Choose the hour", nextService: "Mark the hour", nextDetails: "Enter your details",
    confirm: "Reserve the chair", success: "The chair is yours.",
  },
  atelier: {
    eyebrow: "Enter the atelier", title: "Begin your visit.", atmosphereTitle: "Cross the\nthreshold.",
    atmosphereCopy: "Your appointment unfolds in three considered movements: service, time and arrival notes.",
    steps: ["Compose", "Place", "Arrive"], servicePrompt: "Compose your appointment", datePrompt: "Place it in the calendar",
    timePrompt: "Select your entrance", nextService: "Open the calendar", nextDetails: "Complete the portrait",
    confirm: "Enter the atelier", success: "Your visit is composed.",
  },
  serein: {
    eyebrow: "A moment for yourself", title: "Make space to exhale.", atmosphereTitle: "Arrive softly.\nLeave lighter.",
    atmosphereCopy: "We will hold the time. You only need to choose the ritual that feels right today.",
    steps: ["Ground", "Settle", "Receive"], servicePrompt: "What does your body need?", datePrompt: "When can you soften?",
    timePrompt: "Choose a quiet hour", nextService: "Find a quiet hour", nextDetails: "Share your details",
    confirm: "Hold this space", success: "Your space is held.",
  },
  paloma: {
    eyebrow: "Booking studio / 01—03", title: "Build your booking.", atmosphereTitle: "YOUR TIME.\nYOUR EDIT.",
    atmosphereCopy: "A sharp three-step edit. Pick the treatment, lock the slot, leave your coordinates.",
    steps: ["Select", "Schedule", "Submit"], servicePrompt: "01 / Select an edition", datePrompt: "02A / Select date",
    timePrompt: "02B / Select slot", nextService: "Lock a slot", nextDetails: "Add coordinates",
    confirm: "Submit booking", success: "Booking locked.",
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
};

async function readApi<T>(response: Response): Promise<T> {
  const payload = await response.json().catch(() => null) as ApiResult<T> | null;
  if (!response.ok || !payload?.success || !payload.data) {
    throw new Error(payload?.message || "Something went wrong. Please try again.");
  }
  return payload.data;
}

function dateLabel(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function timeLabel(value: string) {
  const [hour, minute] = value.split(":").map(Number);
  return new Date(2000, 0, 1, hour, minute).toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatPrice(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `₹${amount.toFixed(0)}`;
  }
}

export default function SalonBooking({
  brand,
  theme,
  services: visualServices = [],
  initialBootstrap = null,
  initialServiceId = null,
  onClose,
}: SalonBookingProps) {
  const themeCopy = bookingThemes[theme];
  const [step, setStep] = useState(1);
  const [bootstrap, setBootstrap] = useState<BookingBootstrap | null>(initialBootstrap);
  const [venueId, setVenueId] = useState(initialBootstrap?.selectedVenueId || "");
  const [service, setService] = useState<PublicService | null>(
    initialBootstrap?.services.find((item) => item.id === initialServiceId) || initialBootstrap?.services[0] || null,
  );
  const [date, setDate] = useState(initialBootstrap?.dates[0] || "");
  const [time, setTime] = useState("");
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [firstName, setFirstName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [loadingCatalog, setLoadingCatalog] = useState(!initialBootstrap);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const attemptKey = useRef<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(
    typeof document !== "undefined" && document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null,
  );

  async function loadBootstrap(nextVenueId?: string) {
    try {
      const query = nextVenueId ? `?venueId=${encodeURIComponent(nextVenueId)}` : "";
      const data = await readApi<BookingBootstrap>(await fetch(`/api/dasalon/bootstrap${query}`, { cache: "no-store" }));
      const preferredName = service?.name || visualServices[0]?.name;
      const nextService = data.services.find((item) => item.id === initialServiceId)
        || data.services.find((item) => item.name.toLowerCase() === preferredName?.toLowerCase())
        || data.services[0]
        || null;
      setBootstrap(data);
      setVenueId(data.selectedVenueId);
      setService(nextService);
      setDate(data.dates[0] || "");
      setTime("");
      setSlots([]);
      if (data.services.length === 0) setError("No online services are available at this venue.");
      else if (data.dates.length === 0) setError("This venue has no bookable dates right now.");
    } catch (issue) {
      setError(issue instanceof Error ? issue.message : "Booking is temporarily unavailable.");
    } finally {
      setLoadingCatalog(false);
    }
  }

  // The modal mounts on open; venue changes call the loader explicitly.
  /* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
  useEffect(() => {
    if (!initialBootstrap) void loadBootstrap();
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const previousFocus = returnFocusRef.current;
    document.body.style.overflow = "hidden";
    const focusFrame = window.requestAnimationFrame(() => {
      dialogRef.current?.querySelector<HTMLButtonElement>('[aria-label="Close booking"]')?.focus();
    });
    const handleDialogKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
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
  }, [onClose]);

  useEffect(() => {
    attemptKey.current = null;
  }, [venueId, service?.id, date, time]);

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    panelRef.current?.scrollTo({ top: 0, behavior: reducedMotion ? "auto" : "smooth" });
  }, [step]);

  useEffect(() => {
    if (step !== 2 || !venueId || !service || !date) return;
    const controller = new AbortController();
    const query = new URLSearchParams({ venueId, date, serviceIds: service.id });

    void fetch(`/api/dasalon/time-slots?${query}`, { cache: "no-store", signal: controller.signal })
      .then(readApi<{ date: string; timeSlots: TimeSlot[] }>)
      .then((data) => setSlots(data.timeSlots))
      .catch((issue) => {
        if (issue instanceof Error && issue.name === "AbortError") return;
        setSlots([]);
        setError(issue instanceof Error ? issue.message : "Times could not be loaded.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoadingSlots(false);
      });

    return () => controller.abort();
  }, [date, service, step, venueId]);

  async function confirm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!service || !venueId || !date || !time || submitting) return;
    setSubmitting(true);
    setError("");
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
          client: { name: firstName, phone, email },
          note,
        }),
      }));
      setConfirmation(data);
      setStep(4);
    } catch (issue) {
      setError(issue instanceof Error ? issue.message : "The booking could not be confirmed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={`salon-booking-overlay booking-experience-overlay booking-overlay-${theme}`} role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <aside ref={dialogRef} className={`salon-booker booking-experience booking-theme-${theme}`} role="dialog" aria-modal="true" aria-label={`Book at ${brand}`} aria-busy={loadingCatalog || loadingSlots || submitting}>
        <div className="salon-booker-atmosphere" aria-hidden="true">
          <div className="salon-booker-ornament"><i /><i /><i /></div>
          <small>{themeCopy.eyebrow}</small>
          <h2>{themeCopy.atmosphereTitle.split("\n").map((line) => <span key={line}>{line}</span>)}</h2>
          <p>{themeCopy.atmosphereCopy}</p>
          <div className="salon-booker-atmosphere-mark"><span>{String(Math.min(step, 3)).padStart(2, "0")}</span><i />03</div>
        </div>
        <div className="salon-booker-panel" ref={panelRef}>
          <header className="salon-booker-head">
            <div><small>{brand} · {themeCopy.eyebrow}</small><h2>{step === 4 ? themeCopy.success : themeCopy.title}</h2></div>
            <button type="button" onClick={onClose} aria-label="Close booking"><span>Close</span>×</button>
          </header>

          {step < 4 && <div className="salon-booker-progress" aria-label={`Step ${step} of 3`}>{themeCopy.steps.map((label, index) => <button type="button" key={label} className={index + 1 <= step ? "active" : ""} disabled={index + 1 > step} onClick={() => index + 1 < step && setStep(index + 1)}><i>{String(index + 1).padStart(2, "0")}</i><span>{label}</span></button>)}</div>}

        {step === 1 && <section className="salon-booker-step">
          {bootstrap && bootstrap.venues.length > 1 && <label className="salon-booker-venue"><span>Location</span><select value={venueId} onChange={(event) => { setLoadingCatalog(true); setError(""); void loadBootstrap(event.target.value); }} disabled={loadingCatalog}>{bootstrap.venues.map((venue) => <option value={venue.id} key={venue.id}>{venue.name}{venue.city ? ` · ${venue.city}` : ""}</option>)}</select></label>}
          <p>{themeCopy.servicePrompt}</p>
          {loadingCatalog && <div className="salon-booker-status" role="status">Loading live services…</div>}
          {!loadingCatalog && error && <div className="salon-booker-status salon-booker-error" role="alert"><span>{error}</span><button type="button" onClick={() => void loadBootstrap(venueId || undefined)}>Try again</button></div>}
          {!loadingCatalog && bootstrap && <div className="salon-booker-services">{bootstrap.services.map((item) => <button type="button" className={service?.id === item.id ? "selected" : ""} key={item.id} onClick={() => setService(item)}><span><strong>{item.name}</strong><small>{item.duration} min{item.category ? ` · ${item.category}` : ""}</small></span><b>{formatPrice(item.price, bootstrap.currency)}</b></button>)}</div>}
          <button className="salon-booker-next" type="button" disabled={!service || !bootstrap?.dates.length || loadingCatalog} onClick={() => { setError(""); setTime(""); setSlots([]); setLoadingSlots(true); setStep(2); }}>{themeCopy.nextService} <span>→</span></button>
        </section>}

        {step === 2 && <section className="salon-booker-step">
          <button className="salon-booker-back" type="button" onClick={() => { setError(""); setStep(1); }}>← Services</button>
          <p>{themeCopy.datePrompt}</p>
          <div className="salon-booker-dates">{bootstrap?.dates.slice(0, 9).map((item) => <button type="button" key={item} className={date === item ? "selected" : ""} onClick={() => { setError(""); setTime(""); setSlots([]); setLoadingSlots(true); setDate(item); }}>{dateLabel(item)}</button>)}</div>
          <p>{themeCopy.timePrompt}</p>
          {loadingSlots && <div className="salon-booker-status" role="status">Checking availability…</div>}
          {!loadingSlots && error && <div className="salon-booker-status salon-booker-error" role="alert">{error}</div>}
          {!loadingSlots && !error && slots.length === 0 && <div className="salon-booker-status">No times are available on this date.</div>}
          <div className="salon-booker-times">{slots.map((item) => <button type="button" key={item.time} className={time === item.time ? "selected" : ""} onClick={() => setTime(item.time)}>{timeLabel(item.time)}</button>)}</div>
          <button className="salon-booker-next" type="button" disabled={!time || loadingSlots} onClick={() => { setError(""); setStep(3); }}>{themeCopy.nextDetails} <span>→</span></button>
        </section>}

        {step === 3 && <form className="salon-booker-step" onSubmit={confirm}>
          <button className="salon-booker-back" type="button" onClick={() => { setError(""); setStep(2); }}>← Date and time</button>
          <label><span>Full name</span><input required minLength={2} maxLength={100} autoComplete="name" value={firstName} onChange={(event) => setFirstName(event.target.value)} /></label>
          <label><span>Mobile number</span><input required minLength={5} maxLength={32} inputMode="tel" autoComplete="tel" placeholder={bootstrap?.phoneCode ? `${bootstrap.phoneCode} …` : undefined} value={phone} onChange={(event) => setPhone(event.target.value)} /></label>
          <label><span>Email address · optional</span><input type="email" maxLength={254} autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} /></label>
          <label><span>Appointment note · optional</span><input maxLength={1000} value={note} onChange={(event) => setNote(event.target.value)} /></label>
          <div className="salon-booker-summary"><span>{service?.name}<small>{brand}</small></span><strong>{date ? dateLabel(date) : ""}<br />{time ? timeLabel(time) : ""}</strong></div>
          {error && <div className="salon-booker-status salon-booker-error" role="alert">{error}</div>}
          <button className="salon-booker-next" type="submit" disabled={submitting}>{submitting ? "Confirming…" : themeCopy.confirm} <span>→</span></button>
        </form>}

          {step === 4 && service && confirmation && <section className="salon-booker-confirmation"><span>{brand.charAt(0)}</span><p>Thank you{firstName ? `, ${firstName}` : ""}.</p><h3>{service.name}</h3><strong>{dateLabel(confirmation.date)} at {timeLabel(confirmation.startTime)}</strong><small>Your appointment is confirmed in da Salon{confirmation.appointmentId ? ` with reference ${confirmation.appointmentId}` : ""}. Payment is due at the venue.</small><button type="button" onClick={onClose}>Return to {brand}</button></section>}
        </div>
      </aside>
    </div>
  );
}
