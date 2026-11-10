import { SINGAPORE, formatDate, formatPrice, formatTime, relativeDay, singaporeToday } from "./locale";
import type { BookingBootstrap, PublicService } from "./types";
import type { VenueFacts } from "./venues";

export type VenueStatus = { tone: "open" | "next" | "none"; text: string };

export type StatusWords = {
  /** Shown when today is a working date and the venue publishes no hours. */
  today: string;
  /** "Next opening Tomorrow", "Next bookable day: Wed, 14 Oct"… */
  next: (day: string) => string;
};

const DEFAULT_WORDS: StatusWords = {
  today: "Open today",
  next: (day) => `Next opening ${day}`,
};

/** "14:05" in Singapore, whatever the visitor's clock says. */
function singaporeClock(now: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: SINGAPORE.timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(now);
}

function nextOpening(dates: string[], after: string, now: Date, words: StatusWords): VenueStatus {
  const next = dates.find((date) => date > after);
  if (!next) return { tone: "none", text: "No online dates at the moment" };
  return { tone: "next", text: words.next(relativeDay(next, now) ?? formatDate(next)) };
}

/**
 * "Open now", "Opens today at …" or the next working day, from the venue's live
 * working dates. Wording never claims a free slot: dates are not availability.
 */
export function venueStatus(
  hours: VenueFacts["hours"],
  data: BookingBootstrap | null,
  now = new Date(),
  words: StatusWords = DEFAULT_WORDS,
): VenueStatus | null {
  if (!data) return null;
  const dates = [...data.dates].sort();
  const today = singaporeToday(now);
  if (!dates.some((date) => date >= today)) return { tone: "none", text: "No online dates at the moment" };
  const openToday = dates.includes(today);

  if (hours) {
    const clock = singaporeClock(now);
    if (openToday && clock < hours.open) return { tone: "open", text: `Opens today at ${formatTime(hours.open)}` };
    if (openToday && clock < hours.close) return { tone: "open", text: `Open now · until ${formatTime(hours.close)}` };
    return nextOpening(dates, today, now, words);
  }

  if (openToday) return { tone: "open", text: words.today };
  return nextOpening(dates, today, now, words);
}

export type MenuFacts = {
  count: number;
  categories: number;
  fromPrice: number | null;
  nextDate: string | null;
};

export function menuFacts(data: BookingBootstrap | null, now = new Date()): MenuFacts | null {
  if (!data) return null;
  const prices = data.services.map((service) => service.price).filter((price) => price > 0);
  const today = singaporeToday(now);
  return {
    count: data.services.length,
    categories: new Set(data.services.map((service) => service.category?.trim() || "Other services")).size,
    fromPrice: prices.length ? Math.min(...prices) : null,
    nextDate: [...data.dates].sort().find((date) => date >= today) ?? null,
  };
}

/** "8 services · from S$10" */
export function factsLine(facts: MenuFacts | null) {
  if (!facts) return null;
  if (!facts.count) return "No online services at the moment";
  const count = `${facts.count} ${facts.count === 1 ? "service" : "services"}`;
  return facts.fromPrice != null ? `${count} · from ${formatPrice(facts.fromPrice)}` : count;
}

export type ServiceGroup = { category: string; slug: string; services: PublicService[] };

/** Services grouped by category in API order; a missing category becomes "Other services". */
export function groupByCategory(services: PublicService[], slugify: (value: string) => string): ServiceGroup[] {
  const groups = new Map<string, PublicService[]>();
  for (const service of services) {
    const category = service.category?.trim() || "Other services";
    groups.set(category, [...(groups.get(category) ?? []), service]);
  }
  return Array.from(groups, ([category, list]) => ({ category, slug: slugify(category), services: list }));
}
