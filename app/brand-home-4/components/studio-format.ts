import { formatPrice } from "@/lib/dasalon/locale";
import { categorySlug, titleCase } from "@/lib/dasalon/slug";
import type { BookingBootstrap, PublicService, PublicVenue } from "@/lib/dasalon/types";
import { factsLine, groupByCategory, menuFacts, type VenueStatus } from "@/lib/dasalon/venue-status";
import type { VenueFacts } from "@/lib/dasalon/venues";
import { sisterOf, type Studio, type StudioSlug } from "../data/studios";
import type { LiveStudio } from "./provider";
import ui from "./ui.module.css";

/*
 * Pure helpers shared by the edit (02) and the studio directory (07): the
 * venues a guest can choose, tax and price wording, quick picks and status
 * dots. Nothing here reads the clock or the network.
 */

/** A studio in the menu switch: one of the four, or a live venue that matches none of them ("05"). */
export type MenuVenue = {
  /** The studio slug, or `venue-{id}` for an unmatched live venue. */
  key: string;
  slug: StudioSlug | null;
  no: string;
  name: string;
  short: string;
  area: string;
  trade: string | null;
  address: string | null;
  hours: VenueFacts["hours"];
  hoursLabel: string;
  note: string | null;
  directionsUrl: string | null;
  venueId: string | null;
};

const UNKNOWN_HOURS = "Hours shown when you book";

/** The four studios in issue order, then any live venue none of them matched. */
export function menuVenues(studios: readonly LiveStudio[], live: readonly PublicVenue[] | undefined): MenuVenue[] {
  const list: MenuVenue[] = studios.map((studio) => ({
    key: studio.slug,
    slug: studio.slug,
    no: studio.no,
    name: studio.name,
    short: studio.short,
    area: studio.area,
    trade: studio.trade,
    address: studio.address,
    hours: studio.hours,
    hoursLabel: studio.hoursLabel,
    note: studio.note,
    directionsUrl: studio.directionsUrl,
    venueId: studio.venueId,
  }));
  const bound = new Set(studios.map((studio) => studio.venueId).filter(Boolean));
  for (const venue of live ?? []) {
    if (bound.has(venue.id)) continue;
    list.push({
      key: `venue-${venue.id}`,
      slug: null,
      no: String(list.length + 1).padStart(2, "0"),
      name: venue.name,
      short: venue.name,
      area: titleCase(venue.city?.trim() || "Singapore"),
      trade: null,
      address: null,
      hours: null,
      hoursLabel: UNKNOWN_HOURS,
      note: null,
      directionsUrl: null,
      venueId: venue.id,
    });
  }
  return list;
}

/** "463 Clementi Road, Singapore 599494" → "463 Clementi Road" */
export function street(address: string | null) {
  return address ? address.split(",")[0].trim() : null;
}

/** "10 services · from S$5". menuFacts only reads the clock for a date this line never shows. */
const EPOCH = new Date(0);
export function factsText(data: BookingBootstrap | null) {
  return data ? factsLine(menuFacts(data, EPOCH)) : null;
}

/** The amount due at the studio. Older API shapes have no total: it is then the menu price. */
export function serviceTotal(service: PublicService) {
  return typeof service.total === "number" && Number.isFinite(service.total) ? service.total : service.price;
}

/** The API's tax label ("+ GST 9%", "Incl. GST 9%"), or null when it gives none. */
export function serviceTax(service: PublicService) {
  return service.taxLabel?.trim() || null;
}

/** "+ GST 9%" → " plus GST 9%", so screen readers never meet a bare "+". */
export function spokenTax(label: string | null) {
  if (!label) return "";
  if (label.startsWith("+")) return ` plus ${label.slice(1).trim()}`;
  if (/^incl\.?/i.test(label)) return ` including ${label.replace(/^incl\.?\s*/i, "")}`;
  return ` ${label}`;
}

/** The detail spread's tax row: "GST" — "+ 9%" or "Included (9%)". */
export function taxRow(label: string) {
  const percent = label.match(/\d+(?:\.\d+)?\s*%/)?.[0].replace(/\s+/g, "");
  const term = /gst/i.test(label) ? "GST" : "Tax";
  if (/^incl/i.test(label)) return { term, value: percent ? `Included (${percent})` : "Included" };
  return { term, value: percent ? `+ ${percent}` : label };
}

/** "S$45", or null for a price the studio quotes in person. */
export function priceText(price: number) {
  return price > 0 ? formatPrice(price) : null;
}

export const CONSULT = "Price on consultation";

/** Three quick rows: the first service of each of the first three categories, topped up in menu order. */
export function quickPicks(services: PublicService[], count = 3) {
  const picks = groupByCategory(services, categorySlug)
    .slice(0, count)
    .map((group) => group.services[0]);
  for (const service of services) {
    if (picks.length >= count) break;
    if (!picks.includes(service)) picks.push(service);
  }
  return picks;
}

/** The 8px status dot: filled when open, a ring for the next opening, muted when nothing is bookable. */
export function statusClass(status: VenueStatus | null) {
  if (status?.tone === "open") return `${ui.status} ${ui.statusOpen}`;
  if (status?.tone === "none") return `${ui.status} ${ui.statusNone}`;
  return ui.status;
}

/** "Good to know" lines, only where true. */
export function goodToKnow(studio: Studio) {
  const lines: string[] = [];
  if (studio.note) lines.push(studio.note);
  const sister = sisterOf(studio);
  if (sister) lines.push(`Shares ${street(studio.address)} with ${sister.name}.`);
  return lines;
}

export function servicesLabel(count: number) {
  return `${count} ${count === 1 ? "service" : "services"}`;
}
