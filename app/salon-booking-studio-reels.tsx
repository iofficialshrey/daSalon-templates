"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import "./salon-booking-studio-reels.css";

export const STUDIO_REEL_ROW = 52;
const VISIBLE_ROWS = 5;
const VIEWPORT = STUDIO_REEL_ROW * VISIBLE_ROWS;
const PAD = STUDIO_REEL_ROW * 2; // centers first/last item
const FRICTION = 0.92;
const MIN_VELOCITY = 0.08;
const SETTLE_MS = 320;

function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function hapticSettle() {
  try {
    if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
      navigator.vibrate(10);
    }
  } catch {
    /* unsupported */
  }
}

export type StudioReelItem = {
  value: string;
  primary: ReactNode;
  secondary?: ReactNode;
};

type VerticalReelProps = {
  label: string;
  items: StudioReelItem[];
  value: string | null;
  onSettle: (value: string) => void;
  onMovingChange?: (moving: boolean) => void;
  disabled?: boolean;
  loading?: boolean;
  emptyMessage?: string;
  variant?: "default" | "service";
};

function clampIndex(index: number, length: number) {
  if (length <= 0) return 0;
  return Math.max(0, Math.min(length - 1, index));
}

function offsetForIndex(index: number) {
  return PAD - index * STUDIO_REEL_ROW;
}

function indexFromOffset(offset: number, length: number) {
  const raw = (PAD - offset) / STUDIO_REEL_ROW;
  return clampIndex(Math.round(raw), length);
}

function VerticalReel({
  label,
  items,
  value,
  onSettle,
  onMovingChange,
  disabled = false,
  loading = false,
  emptyMessage = "Nothing available",
  variant = "default",
}: VerticalReelProps) {
  const selectedIndex = Math.max(0, items.findIndex((item) => item.value === value));
  const [offset, setOffset] = useState(() => offsetForIndex(Math.max(0, selectedIndex)));
  const [moving, setMoving] = useState(false);
  const [markerPulse, setMarkerPulse] = useState(false);
  const offsetRef = useRef(offset);
  const velocityRef = useRef(0);
  const frameRef = useRef(0);
  const dragRef = useRef<{
    pointerId: number;
    startY: number;
    startOffset: number;
    lastY: number;
    lastTime: number;
    samples: Array<{ y: number; t: number }>;
  } | null>(null);
  const settledValueRef = useRef(value);
  const itemsRef = useRef(items);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  const publishMoving = useCallback((next: boolean) => {
    setMoving(next);
    onMovingChange?.(next);
  }, [onMovingChange]);

  const stopAnimation = useCallback(() => {
    if (frameRef.current) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = 0;
    }
  }, []);

  const applyOffset = useCallback((next: number) => {
    offsetRef.current = next;
    setOffset(next);
  }, []);

  const settleToIndex = useCallback((index: number, animate: boolean) => {
    const list = itemsRef.current;
    if (list.length === 0) {
      publishMoving(false);
      return;
    }
    const nextIndex = clampIndex(index, list.length);
    const target = offsetForIndex(nextIndex);
    const nextValue = list[nextIndex].value;
    stopAnimation();

    const finish = () => {
      applyOffset(target);
      publishMoving(false);
      setMarkerPulse(true);
      window.setTimeout(() => setMarkerPulse(false), 180);
      if (settledValueRef.current !== nextValue) {
        settledValueRef.current = nextValue;
        hapticSettle();
        onSettle(nextValue);
      }
    };

    if (!animate || prefersReducedMotion()) {
      finish();
      return;
    }

    publishMoving(true);
    const start = offsetRef.current;
    const delta = target - start;
    const started = performance.now();

    const tick = (now: number) => {
      const progress = Math.min(1, (now - started) / SETTLE_MS);
      const eased = 1 - (1 - progress) ** 3;
      applyOffset(start + delta * eased);
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick);
      } else {
        finish();
      }
    };
    frameRef.current = requestAnimationFrame(tick);
  }, [applyOffset, onSettle, publishMoving, stopAnimation]);

  const glide = useCallback((initialVelocity: number) => {
    const list = itemsRef.current;
    if (list.length === 0 || prefersReducedMotion()) {
      settleToIndex(indexFromOffset(offsetRef.current, list.length), false);
      return;
    }

    stopAnimation();
    publishMoving(true);
    velocityRef.current = initialVelocity;

    const tick = () => {
      let next = offsetRef.current + velocityRef.current;
      const min = offsetForIndex(list.length - 1);
      const max = offsetForIndex(0);
      if (next > max) {
        next = max;
        velocityRef.current = 0;
      } else if (next < min) {
        next = min;
        velocityRef.current = 0;
      }
      applyOffset(next);
      velocityRef.current *= FRICTION;

      if (Math.abs(velocityRef.current) < MIN_VELOCITY) {
        settleToIndex(indexFromOffset(offsetRef.current, list.length), true);
        return;
      }
      frameRef.current = requestAnimationFrame(tick);
    };
    frameRef.current = requestAnimationFrame(tick);
  }, [applyOffset, publishMoving, settleToIndex, stopAnimation]);

  // Sync external value / item list without fighting an active drag.
  useEffect(() => {
    if (dragRef.current || moving) return;
    if (items.length === 0) return;
    const index = Math.max(0, items.findIndex((item) => item.value === value));
    const next = offsetForIndex(index);
    if (Math.abs(next - offsetRef.current) > 0.5) {
      applyOffset(next);
    }
    settledValueRef.current = items[index]?.value ?? null;
  }, [applyOffset, items, moving, value]);

  useEffect(() => () => stopAnimation(), [stopAnimation]);

  const viewportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = viewportRef.current;
    if (!node) return;
    const onNativeWheel = (event: WheelEvent) => {
      if (disabled || loading || itemsRef.current.length === 0) return;
      if (Math.abs(event.deltaY) < Math.abs(event.deltaX)) return;
      event.preventDefault();
      event.stopPropagation();
      const current = indexFromOffset(offsetRef.current, itemsRef.current.length);
      settleToIndex(current + (event.deltaY > 0 ? 1 : -1), !prefersReducedMotion());
    };
    node.addEventListener("wheel", onNativeWheel, { passive: false });
    return () => node.removeEventListener("wheel", onNativeWheel);
  }, [disabled, loading, settleToIndex]);

  function onPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (disabled || loading || items.length === 0) return;
    stopAnimation();
    publishMoving(true);
    const now = performance.now();
    dragRef.current = {
      pointerId: event.pointerId,
      startY: event.clientY,
      startOffset: offsetRef.current,
      lastY: event.clientY,
      lastTime: now,
      samples: [{ y: event.clientY, t: now }],
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function onPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const delta = event.clientY - drag.startY;
    const min = offsetForIndex(items.length - 1);
    const max = offsetForIndex(0);
    const next = Math.min(max + STUDIO_REEL_ROW * 0.35, Math.max(min - STUDIO_REEL_ROW * 0.35, drag.startOffset + delta));
    applyOffset(next);
    const now = performance.now();
    drag.samples.push({ y: event.clientY, t: now });
    if (drag.samples.length > 6) drag.samples.shift();
    drag.lastY = event.clientY;
    drag.lastTime = now;
  }

  function onPointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    dragRef.current = null;
    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      /* already released */
    }
    const samples = drag.samples;
    let velocity = 0;
    if (samples.length >= 2) {
      const first = samples[0];
      const last = samples[samples.length - 1];
      const dt = Math.max(16, last.t - first.t);
      velocity = (last.y - first.y) / dt;
    }
    if (Math.abs(velocity) > 0.2) glide(velocity * 14);
    else settleToIndex(indexFromOffset(offsetRef.current, items.length), true);
  }

  function stepBy(delta: number) {
    if (disabled || loading || items.length === 0) return;
    const current = indexFromOffset(offsetRef.current, items.length);
    settleToIndex(current + delta, !prefersReducedMotion());
  }

  const liveIndex = indexFromOffset(offset, items.length);
  const atStart = disabled || loading || liveIndex <= 0;
  const atEnd = disabled || loading || liveIndex >= items.length - 1;

  return (
    <div className={`studio-reel studio-reel-${variant}${moving ? " is-moving" : ""}${markerPulse ? " is-pulse" : ""}${disabled || loading ? " is-disabled" : ""}`}>
      <div className="studio-reel-label">{label}</div>

      <button
        type="button"
        className="studio-reel-step"
        aria-label={`Previous ${label.toLowerCase()}`}
        disabled={atStart}
        onClick={() => stepBy(-1)}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M6.5 14.5 12 9l5.5 5.5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="square" />
        </svg>
      </button>

      <div className="studio-reel-cylinder">
        <div
          ref={viewportRef}
          className="studio-reel-viewport"
          style={{ "--studio-reel-row": `${STUDIO_REEL_ROW}px`, "--studio-reel-viewport": `${VIEWPORT}px` } as CSSProperties}
          role="listbox"
          aria-label={label}
          aria-activedescendant={items[liveIndex] ? `studio-reel-${label}-${items[liveIndex].value}` : undefined}
          tabIndex={disabled || loading ? -1 : 0}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown") {
              event.preventDefault();
              stepBy(1);
            } else if (event.key === "ArrowUp") {
              event.preventDefault();
              stepBy(-1);
            } else if (event.key === "Home") {
              event.preventDefault();
              settleToIndex(0, !prefersReducedMotion());
            } else if (event.key === "End") {
              event.preventDefault();
              settleToIndex(items.length - 1, !prefersReducedMotion());
            }
          }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <div className="studio-reel-fade studio-reel-fade-top" aria-hidden="true" />
          <div className={`studio-reel-band${markerPulse ? " is-pulse" : ""}`} aria-hidden="true" />
          <div className="studio-reel-fade studio-reel-fade-bottom" aria-hidden="true" />

          {loading && <div className="studio-reel-status" role="status">Checking availability…</div>}
          {!loading && items.length === 0 && <div className="studio-reel-status" role="status">{emptyMessage}</div>}

          {!loading && items.length > 0 && (
            <div className="studio-reel-track" style={{ transform: `translate3d(0, ${offset}px, 0)` }}>
              {items.map((item, index) => {
                const distance = Math.abs(index - liveIndex);
                return (
                  <button
                    key={item.value}
                    id={`studio-reel-${label}-${item.value}`}
                    type="button"
                    role="option"
                    aria-selected={index === liveIndex}
                    className={`studio-reel-item distance-${Math.min(2, distance)}${index === liveIndex ? " is-selected" : ""}`}
                    tabIndex={-1}
                    onClick={() => settleToIndex(index, !prefersReducedMotion())}
                  >
                    <strong>{item.primary}</strong>
                    {item.secondary ? <small>{item.secondary}</small> : null}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <button
        type="button"
        className="studio-reel-step"
        aria-label={`Next ${label.toLowerCase()}`}
        disabled={atEnd}
        onClick={() => stepBy(1)}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M6.5 9.5 12 15l5.5-5.5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="square" />
        </svg>
      </button>
    </div>
  );
}

export type StudioServiceOption = {
  id: string;
  name: string;
  duration: number;
  priceLabel: string;
  category?: string | null;
};

type StudioServiceReelProps = {
  services: StudioServiceOption[];
  serviceId: string | null;
  onServiceSettle: (serviceId: string) => void;
  onMovingChange: (moving: boolean) => void;
  loading?: boolean;
  error?: string;
  onRetry?: () => void;
  onContinue: () => void;
  continueDisabled: boolean;
  continueLabel: string;
  venueSelect?: ReactNode;
};

export function StudioServiceReel({
  services,
  serviceId,
  onServiceSettle,
  onMovingChange,
  loading = false,
  error,
  onRetry,
  onContinue,
  continueDisabled,
  continueLabel,
  venueSelect,
}: StudioServiceReelProps) {
  const items: StudioReelItem[] = services.map((item) => ({
    value: item.id,
    primary: <span className="studio-reel-service-name">{item.name}</span>,
    secondary: (
      <span className="studio-reel-service-meta">
        <span>{item.duration} min{item.category ? ` · ${item.category}` : ""}</span>
        <b>{item.priceLabel}</b>
      </span>
    ),
  }));

  const selected = services.find((item) => item.id === serviceId) || null;

  return (
    <div className="studio-booking-reels studio-booking-reels-service">
      <header className="studio-booking-reels-copy">
        <h3>THE EDIT.</h3>
        <p>Scroll to the service you want. Settle it. Continue.</p>
      </header>

      {venueSelect}

      {error && !loading && (
        <div className="salon-booker-status salon-booker-error" role="alert">
          <span>{error}</span>
          {onRetry ? <button type="button" onClick={onRetry}>Try again</button> : null}
        </div>
      )}

      <div className="studio-booking-reels-single">
        <VerticalReel
          label="SERVICE"
          variant="service"
          items={items}
          value={serviceId}
          onSettle={onServiceSettle}
          onMovingChange={onMovingChange}
          loading={loading}
          disabled={loading || services.length === 0}
          emptyMessage="No online services are available right now."
        />
      </div>

      <div className="studio-booking-reels-summary" aria-live="polite">
        {selected ? (
          <p>
            <span>{selected.name}</span>
            <i aria-hidden="true" />
            <span>{selected.duration} min · {selected.priceLabel}</span>
          </p>
        ) : (
          <p>{loading ? "Loading live services…" : "Select a service to continue."}</p>
        )}
      </div>

      <button
        className="salon-booker-next"
        type="button"
        disabled={continueDisabled}
        onClick={onContinue}
      >
        {continueLabel} <span>→</span>
      </button>
    </div>
  );
}

type StudioBookingReelsProps = {
  dates: string[];
  date: string;
  onDateSettle: (next: string) => void;
  times: string[];
  time: string;
  onTimeSettle: (next: string) => void;
  loadingSlots: boolean;
  slotsError?: string;
  onMovingChange: (moving: boolean) => void;
  onContinue: () => void;
  continueDisabled: boolean;
  continueLabel: string;
};

function formatDateParts(value: string) {
  const parsed = new Date(`${value}T00:00:00`);
  return {
    weekday: parsed.toLocaleDateString("en-IN", { weekday: "short" }),
    day: parsed.toLocaleDateString("en-IN", { day: "2-digit" }),
    month: parsed.toLocaleDateString("en-IN", { month: "short" }),
  };
}

function formatTimeParts(value: string) {
  const [hour, minute] = value.split(":").map(Number);
  const parsed = new Date(2000, 0, 1, hour, minute);
  return parsed.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
}

export default function StudioBookingReels({
  dates,
  date,
  onDateSettle,
  times,
  time,
  onTimeSettle,
  loadingSlots,
  slotsError,
  onMovingChange,
  onContinue,
  continueDisabled,
  continueLabel,
}: StudioBookingReelsProps) {
  const dateMoving = useRef(false);
  const timeMoving = useRef(false);

  const reportMoving = useCallback(() => {
    onMovingChange(dateMoving.current || timeMoving.current);
  }, [onMovingChange]);

  const dateItems: StudioReelItem[] = dates.map((item) => {
    const parts = formatDateParts(item);
    return {
      value: item,
      primary: (
        <span className="studio-reel-date-line">
          <span className="studio-reel-weekday">{parts.weekday}</span>
          <span className="studio-reel-day">{parts.day}</span>
          <span className="studio-reel-month">{parts.month}</span>
        </span>
      ),
    };
  });

  const timeItems: StudioReelItem[] = times.map((item) => ({
    value: item,
    primary: <span className="studio-reel-time-line">{formatTimeParts(item)}</span>,
  }));

  const summaryDate = date ? formatDateParts(date) : null;
  const summaryTime = time ? formatTimeParts(time) : null;

  return (
    <div className="studio-booking-reels">
      <header className="studio-booking-reels-copy">
        <h3>MAKE TIME.</h3>
        <p>Choose your day. Find your moment.</p>
      </header>

      <div className="studio-booking-reels-pair">
        <VerticalReel
          label="DATE"
          items={dateItems}
          value={date || null}
          onSettle={onDateSettle}
          onMovingChange={(next) => {
            dateMoving.current = next;
            reportMoving();
          }}
          disabled={dates.length === 0}
          emptyMessage="No bookable dates"
        />
        <VerticalReel
          label="TIME"
          items={timeItems}
          value={time || null}
          onSettle={onTimeSettle}
          onMovingChange={(next) => {
            timeMoving.current = next;
            reportMoving();
          }}
          loading={loadingSlots}
          disabled={loadingSlots || times.length === 0}
          emptyMessage={slotsError || "No available times. Choose another date."}
        />
      </div>

      <div className="studio-booking-reels-summary" aria-live="polite">
        {summaryDate && summaryTime ? (
          <p>
            <span>{summaryDate.weekday} {summaryDate.day} {summaryDate.month}</span>
            <i aria-hidden="true" />
            <span>{summaryTime}</span>
          </p>
        ) : (
          <p>{loadingSlots ? "Finding available times…" : "Select a day and time to continue."}</p>
        )}
      </div>

      <button
        className="salon-booker-next"
        type="button"
        disabled={continueDisabled}
        onClick={onContinue}
      >
        {continueLabel} <span>→</span>
      </button>
    </div>
  );
}
