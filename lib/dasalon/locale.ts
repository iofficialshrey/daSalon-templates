/**
 * Singapore market conventions for every Brand Home.
 * Calendar dates arrive from da Salon as `YYYY-MM-DD` and times as `HH:mm`
 * in venue time, so formatting never shifts them through the visitor's clock.
 */

export const SINGAPORE = {
  locale: "en-SG",
  timeZone: "Asia/Singapore",
  timeZoneLabel: "Singapore time (SGT)",
  currency: "SGD",
  phoneCode: "+65",
} as const;

export type PhoneCountry = {
  code: string;
  region: string;
  label: string;
  /** National number pattern, digits only. */
  pattern: RegExp;
  example: string;
};

/** Singapore-only market: guests book with an 8-digit local number. */
export const PHONE_COUNTRIES: readonly PhoneCountry[] = [
  { code: "+65", region: "SG", label: "Singapore", pattern: /^[3689]\d{7}$/, example: "9123 4567" },
];

export function phoneCountry(code: string) {
  return PHONE_COUNTRIES.find((item) => item.code === code) ?? PHONE_COUNTRIES[0];
}

/** Splits a stored `+6591234567` style number back into country code and national digits. */
export function splitPhone(raw: string, fallbackCode: string = SINGAPORE.phoneCode) {
  const compact = raw.replace(/[\s()-]/g, "");
  for (const item of PHONE_COUNTRIES) {
    if (compact.startsWith(item.code)) return { code: item.code, national: compact.slice(item.code.length).replace(/\D/g, "") };
  }
  return { code: phoneCountry(fallbackCode).code, national: compact.replace(/\D/g, "") };
}

export function isValidNationalNumber(code: string, national: string) {
  return phoneCountry(code).pattern.test(national.replace(/\D/g, ""));
}

const priceFormatter = new Intl.NumberFormat(SINGAPORE.locale, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
const centsFormatter = new Intl.NumberFormat(SINGAPORE.locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** `S$45`, or `S$45.50` when the menu price carries cents. */
export function formatPrice(amount: number) {
  const value = Number(amount) || 0;
  return `S$${Number.isInteger(value) ? priceFormatter.format(value) : centsFormatter.format(value)}`;
}

function calendarDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year, (month || 1) - 1, day || 1));
}

function formatCalendar(value: string, options: Intl.DateTimeFormatOptions) {
  return calendarDate(value).toLocaleDateString(SINGAPORE.locale, { ...options, timeZone: "UTC" });
}

/** `Mon, 12 Oct` */
export function formatDate(value: string) {
  return formatCalendar(value, { weekday: "short", day: "numeric", month: "short" });
}

/** `Monday, 12 October` */
export function formatLongDate(value: string) {
  return formatCalendar(value, { weekday: "long", day: "numeric", month: "long" });
}

/** Pieces for a date chip: weekday, day number and month. */
export function dateParts(value: string) {
  return {
    weekday: formatCalendar(value, { weekday: "short" }),
    day: formatCalendar(value, { day: "numeric" }),
    month: formatCalendar(value, { month: "short" }),
    monthYear: formatCalendar(value, { month: "long", year: "numeric" }),
  };
}

/** `1:00 pm` */
export function formatTime(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return new Date(Date.UTC(2000, 0, 1, hours || 0, minutes || 0)).toLocaleTimeString(SINGAPORE.locale, {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
  });
}

/** Today's calendar date in Singapore, regardless of where the visitor is. */
export function singaporeToday(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: SINGAPORE.timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function addDays(value: string, days: number) {
  const date = calendarDate(value);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/** `Today`, `Tomorrow`, or null for any other day. */
export function relativeDay(value: string, now = new Date()) {
  const today = singaporeToday(now);
  if (value === today) return "Today";
  if (value === addDays(today, 1)) return "Tomorrow";
  return null;
}

export function addMinutes(startTime: string, minutes: number) {
  const [hours, mins] = startTime.split(":").map(Number);
  const total = hours * 60 + mins + minutes;
  return `${String(Math.floor(total / 60) % 24).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

export function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours} hr ${rest} min` : `${hours} hr`;
}

export type DayPeriod = "early" | "morning" | "afternoon" | "evening";

/** Listed in clock order; `preference` decides which group opens first. */
export const DAY_PERIODS: readonly { id: DayPeriod; label: string; from: number; to: number; preference: number }[] = [
  { id: "early", label: "Early", from: 0, to: 6, preference: 3 },
  { id: "morning", label: "Morning", from: 6, to: 12, preference: 0 },
  { id: "afternoon", label: "Afternoon", from: 12, to: 17, preference: 1 },
  { id: "evening", label: "Evening", from: 17, to: 24, preference: 2 },
];

export function dayPeriod(time: string): DayPeriod {
  const hour = Number(time.slice(0, 2));
  return DAY_PERIODS.find((period) => hour >= period.from && hour < period.to)?.id ?? "evening";
}
