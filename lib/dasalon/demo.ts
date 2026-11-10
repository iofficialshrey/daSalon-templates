import { SINGAPORE, singaporeToday } from "@/lib/dasalon/locale";

/*
 * Helpers for the demonstration checkout. Nothing here leaves the browser tab:
 * no network calls, no storage, no logging.
 */

const REFERENCE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function demoReference() {
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  return `DEMO-${Array.from(bytes, (byte) => REFERENCE_ALPHABET[byte % REFERENCE_ALPHABET.length]).join("")}`;
}

/** "Sat, 11 Oct 2026, 2:14 pm SGT" */
export function sgtStamp(now = new Date()) {
  const text = new Intl.DateTimeFormat(SINGAPORE.locale, {
    timeZone: SINGAPORE.timeZone,
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(now);
  return `${text} SGT`;
}

/** Calendar date `months` after today in Singapore, as YYYY-MM-DD. */
export function validUntil(months: number, now = new Date()) {
  const [year, month, day] = singaporeToday(now).split("-").map(Number);
  const target = new Date(Date.UTC(year, month - 1 + months, 1));
  const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  target.setUTCDate(Math.min(day, lastDay));
  return target.toISOString().slice(0, 10);
}

/** "11 Apr 2027" */
export function formatLongCalendarDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString(SINGAPORE.locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

const cents = new Intl.NumberFormat(SINGAPORE.locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** "S$200.00" for order summaries. */
export function formatCents(amount: number) {
  return `${amount < 0 ? "−" : ""}S$${cents.format(Math.abs(amount))}`;
}
