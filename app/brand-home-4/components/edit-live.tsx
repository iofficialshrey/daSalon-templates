"use client";

import {
  Fragment,
  memo,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type RefObject,
} from "react";
import { serviceDescription } from "@/lib/dasalon/client";
import { formatDuration, formatPrice } from "@/lib/dasalon/locale";
import { categorySlug } from "@/lib/dasalon/slug";
import type { BookingBootstrap, PublicService } from "@/lib/dasalon/types";
import { fetchVenue, prefetchVenues, useVenueEntry } from "@/lib/dasalon/venue-cache";
import { groupByCategory, venueStatus, type ServiceGroup, type VenueStatus } from "@/lib/dasalon/venue-status";
import { isVenueSlug } from "@/lib/dasalon/venues";
import { jumpTo } from "@/lib/page/jump";
import { useLite } from "@/lib/page/lite";
import { useClock } from "@/lib/page/use-clock";
import type { StudioSlug } from "../data/studios";
import { EDIT_STUDIOS_ID, focusCheckedStudio, jumpToStudioSwitch } from "./edit-focus";
import { ArrowRight, ArrowUpRight } from "./icons";
import { usePaloma } from "./provider";
import { openStudioFile } from "./studio-file-store";
import {
  CONSULT,
  factsText,
  menuVenues,
  priceText,
  serviceTax,
  serviceTotal,
  servicesLabel,
  spokenTax,
  statusClass,
  street,
  taxRow,
  type MenuVenue,
} from "./studio-format";
import s from "./edit.module.css";
import ui from "./ui.module.css";

/*
 * 02 — The edit. The studio switch, the live list as one group of native
 * radios ("editions"), the sticky detail spread on desktop and the inline
 * detail on phones and tablets, the menu running head and every live state.
 * The server renders this island's first pass (the default studio and the
 * skeleton at final row heights), so nothing shifts when the menu arrives.
 */

const FALLBACK: StudioSlug = "the-grooming-room";
/** Longest a switch keeps the previous list (and its height) while the next studio loads. */
const HOLD_MS = 600;
const SKELETON_ROWS = ["a", "b", "c", "d", "e", "f"] as const;
const SKELETON_CHIPS = ["a", "b", "c"] as const;

type Status = "loading" | "error" | "empty" | "ready";
type Select = (serviceId: string, row: HTMLElement) => void;
type Book = (serviceId: string, button: HTMLElement) => void;
type Hold = { key: string; venue: MenuVenue; data: BookingBootstrap | null; height: number };

function rowId(serviceId: string) {
  return `edit-row-${serviceId}`;
}

function groupId(venueKey: string, slug: string) {
  return `menu-${venueKey}-${slug}`;
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function plainClick(event: ReactMouseEvent) {
  return event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;
}

function statusOf(data: BookingBootstrap | null, venueId: string | null, error: boolean, loading: boolean): Status {
  if (data) return data.services.length ? "ready" : "empty";
  if (venueId) return error && !loading ? "error" : "loading";
  return loading ? "loading" : "error";
}

function announcementFor(status: Status, venue: MenuVenue, data: BookingBootstrap | null) {
  if (status === "ready" && data) return `Showing ${servicesLabel(data.services.length)} at ${venue.name}.`;
  if (status === "error") return `The menu at ${venue.name} isn't loading just now.`;
  if (status === "empty") return `${venue.name} has no services open for online booking at the moment.`;
  return "";
}

/** "10 services · from S$5", read as "10 services from S$5". */
function Facts({ text }: { text: string }) {
  return (
    <>
      {text.split(" · ").map((part, index) => (
        <Fragment key={part}>
          {index ? <><span aria-hidden="true"> ·</span>{" "}</> : null}
          {part}
        </Fragment>
      ))}
    </>
  );
}

/* ---------- Links shared by the status line and the detail ---------- */

function AboutLink({ slug, name }: { slug: StudioSlug; name: string }) {
  return (
    <a
      href={`#studio-${slug}`}
      className={ui.textBtn}
      onClick={(event) => {
        if (!plainClick(event)) return;
        event.preventDefault();
        openStudioFile(slug, { jump: true });
      }}
    >
      <span>
        About this studio<span className={ui.srOnly}>{`: ${name}`}</span>
      </span>
      <ArrowRight />
    </a>
  );
}

function Directions({ url }: { url: string }) {
  return (
    <a href={url} className={ui.textBtn} target="_blank" rel="noopener noreferrer">
      <span>
        Directions<span className={ui.srOnly}> (opens Google Maps in a new tab)</span>
      </span>
      <ArrowUpRight />
    </a>
  );
}

/* ---------- Studio tile ---------- */

type TileProps = {
  venue: MenuVenue;
  checked: boolean;
  /** The shared catalog, when this is the API's default venue. */
  fallback: BookingBootstrap | null;
  unbound: boolean;
  catalogFailed: boolean;
  lite: boolean;
  onChoose: (venue: MenuVenue) => void;
  onWarm: (venue: MenuVenue) => void;
};

function Tile({ venue, checked, fallback, unbound, catalogFailed, lite, onChoose, onWarm }: TileProps) {
  const entry = useVenueEntry(venue.venueId);
  const data = entry.data ?? fallback;
  const facts = factsText(data);
  const offline = !facts && (unbound || catalogFailed);
  const pending = !facts && !offline && (entry.loading || (!entry.error && !lite));
  const inputId = `edit-studio-${venue.key}`;
  return (
    <div className={s.tile}>
      <input
        id={inputId}
        type="radio"
        name="p4-studio"
        value={venue.key}
        className={`${ui.srOnly} ${s.tileInput}`}
        checked={checked}
        disabled={unbound}
        onChange={() => onChoose(venue)}
        onFocus={() => onWarm(venue)}
      />
      <label htmlFor={inputId} className={s.tileLabel} onPointerEnter={() => onWarm(venue)}>
        <span className={s.tileNo} aria-hidden="true">
          <span className={s.tileNum}>{venue.no}</span> · {venue.area}
        </span>
        <span className={s.tileName}>{venue.name}</span>
        <span className={ui.srOnly}>{`, ${venue.area}${facts || offline ? ", " : ""}`}</span>
        <span className={s.tileFacts}>
          {facts ? <Facts text={facts} /> : null}
          {offline ? "Not online just now" : null}
          {pending ? <span className={`${ui.skeleton} ${s.tileSkel}`} aria-hidden="true" /> : null}
        </span>
      </label>
    </div>
  );
}

/* ---------- Service facts (desktop spread and inline detail) ---------- */

function ServiceFacts({ service, compact = false }: { service: PublicService; compact?: boolean }) {
  const price = priceText(service.price);
  const tax = serviceTax(service);
  const total = serviceTotal(service);
  const taxLine = tax ? taxRow(tax) : null;
  return (
    <dl className={compact ? s.factsCompact : s.facts}>
      <div>
        <dt>Duration</dt>
        <dd className={ui.num}>{formatDuration(service.duration)}</dd>
      </div>
      <div>
        <dt>Price</dt>
        <dd className={`${ui.num} ${price && !compact ? s.factsPrice : ""}`}>{price ?? CONSULT}</dd>
      </div>
      {taxLine ? (
        <div>
          <dt>{taxLine.term}</dt>
          <dd className={ui.num}>{taxLine.value}</dd>
        </div>
      ) : null}
      {price && total !== service.price ? (
        <div>
          <dt>Due at the studio</dt>
          <dd className={ui.num}>{formatPrice(total)}</dd>
        </div>
      ) : null}
    </dl>
  );
}

function BookEditLabel({ service, venueName }: { service: PublicService; venueName: string }) {
  return (
    <span>
      Book this edit<span className={ui.srOnly}>{`: ${service.name} at ${venueName}`}</span>
    </span>
  );
}

/** Phones and tablets: the detail opens inside the checked row, so Tab reaches its Book next. */
function InlineDetail({ service, venueName, onBook }: { service: PublicService; venueName: string; onBook: Book }) {
  return (
    <div id={`edit-detail-${service.id}`} className={s.inline} data-tone="porcelain">
      <p className={s.inlineText}>{serviceDescription(service)}</p>
      <ServiceFacts service={service} compact />
      <p className={ui.small}>You pay at the studio, after your appointment.</p>
      <button
        type="button"
        className={`${ui.btn} ${ui.btnPrimary} ${ui.block}`}
        data-book=""
        onClick={(event) => onBook(service.id, event.currentTarget)}
      >
        <BookEditLabel service={service} venueName={venueName} />
        <ArrowRight />
      </button>
    </div>
  );
}

/* ---------- Service row: a native radio and its label ---------- */

type RowProps = {
  service: PublicService;
  no: string;
  checked: boolean;
  venueName: string;
  onSelect: Select;
  onBook: Book;
};

function sameRow(previous: RowProps, next: RowProps) {
  const a = previous.service;
  const b = next.service;
  return (
    previous.no === next.no &&
    previous.checked === next.checked &&
    previous.venueName === next.venueName &&
    previous.onSelect === next.onSelect &&
    previous.onBook === next.onBook &&
    a.id === b.id &&
    a.name === b.name &&
    a.description === b.description &&
    a.duration === b.duration &&
    a.price === b.price &&
    a.total === b.total &&
    a.taxLabel === b.taxLabel &&
    a.category === b.category
  );
}

const Row = memo(function Row({ service, no, checked, venueName, onSelect, onBook }: RowProps) {
  const inputId = `edit-svc-${service.id}`;
  const duration = formatDuration(service.duration);
  const price = priceText(service.price);
  const tax = serviceTax(service);
  return (
    <li id={rowId(service.id)} className={s.row}>
      <input
        id={inputId}
        type="radio"
        name="p4-service"
        value={service.id}
        className={`${ui.srOnly} ${s.rowInput}`}
        checked={checked}
        onChange={(event) => onSelect(service.id, event.currentTarget.closest("li") ?? event.currentTarget)}
      />
      <label htmlFor={inputId} className={s.rowLabel}>
        <span className={s.rowNo} aria-hidden="true">{no}</span>
        <span className={s.rowName}>
          <span className={`${ui.displayS} ${s.rowTitle}`}>{service.name}</span>
          <span className={s.rowMeta} aria-hidden="true">{tax ? `${duration} · ${tax}` : duration}</span>
          {checked ? <span className={s.selectedTag} aria-hidden="true">Selected</span> : null}
        </span>
        <span className={s.rowDur} aria-hidden="true">{duration}</span>
        <span className={s.rowPrice} aria-hidden="true">
          {price ? <span className={s.rowAmount}>{price}</span> : <span className={s.rowConsult}>{CONSULT}</span>}
          {tax ? <span className={s.rowTax}>{tax}</span> : null}
        </span>
        <span className={ui.srOnly}>{`, ${duration}, ${price ?? CONSULT}${spokenTax(tax)}`}</span>
      </label>
      {checked ? <InlineDetail service={service} venueName={venueName} onBook={onBook} /> : null}
    </li>
  );
}, sameRow);

/* ---------- Category group ---------- */

type GroupProps = {
  group: ServiceGroup;
  venue: MenuVenue;
  numbers: ReadonlyMap<string, string>;
  selectedId: string | null;
  onSelect: Select;
  onBook: Book;
};

function Group({ group, venue, numbers, selectedId, onSelect, onBook }: GroupProps) {
  const id = groupId(venue.key, group.slug);
  const prices = group.services.map((service) => service.price).filter((price) => price > 0);
  const from = prices.length ? Math.min(...prices) : null;
  return (
    <div className={s.group} data-menu-group={group.slug}>
      <div className={s.groupHead}>
        <h3 id={id} className={s.groupTitle} tabIndex={-1}>{group.category}</h3>
        <p className={`${s.groupMeta} ${ui.num}`}>
          {servicesLabel(group.services.length)}
          {from !== null ? ` · from ${formatPrice(from)}` : null}
        </p>
      </div>
      <ol className={s.rows} aria-labelledby={id}>
        {group.services.map((service) => (
          <Row
            key={service.id}
            service={service}
            no={numbers.get(service.id) ?? ""}
            checked={service.id === selectedId}
            venueName={venue.name}
            onSelect={onSelect}
            onBook={onBook}
          />
        ))}
      </ol>
    </div>
  );
}

/* ---------- Category chips: jumps, not filters ---------- */

function jumpToGroup(event: ReactMouseEvent<HTMLAnchorElement>, id: string) {
  if (!plainClick(event)) return;
  const target = document.getElementById(id);
  if (!target) return;
  event.preventDefault();
  const margin = parseFloat(getComputedStyle(target).scrollMarginTop) || 0;
  window.scrollTo({ top: Math.max(0, target.getBoundingClientRect().top + window.scrollY - margin), behavior: "instant" });
  target.focus({ preventScroll: true });
}

function Chips({ venue, groups, loading }: { venue: MenuVenue; groups: ServiceGroup[]; loading: boolean }) {
  if (loading) {
    return (
      <div className={s.chips} aria-hidden="true">
        <span className={`${ui.label} ${s.jumpLabel}`}>Jump to</span>
        {SKELETON_CHIPS.map((key) => (
          <span key={key} className={`${ui.skeleton} ${s.chipSkel}`} />
        ))}
      </div>
    );
  }
  return (
    <nav className={s.chips} aria-label={`Categories at ${venue.name}`}>
      <p className={`${ui.label} ${s.jumpLabel}`}>Jump to</p>
      <ul className={s.chipList}>
        {groups.map((group) => {
          const id = groupId(venue.key, group.slug);
          const count = group.services.length;
          return (
            <li key={group.slug}>
              <a href={`#${id}`} className={s.chip} data-jump="" onClick={(event) => jumpToGroup(event, id)}>
                {group.category}
                <span className={ui.srOnly}>, </span>
                <span className={s.chipCount}>
                  {count}
                  <span className={ui.srOnly}>{count === 1 ? " service" : " services"}</span>
                </span>
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/* ---------- Loading ---------- */

function MenuSkeleton({ name }: { name: string }) {
  return (
    <div className={s.skeleton}>
      <p className={ui.srOnly}>{`Loading the menu at ${name}…`}</p>
      <div aria-hidden="true">
        <div className={s.groupHead}>
          <span className={`${ui.skeleton} ${s.skelHead}`} />
        </div>
        <ul className={s.rows}>
          {SKELETON_ROWS.map((key) => (
            <li key={key} className={s.skelRow}>
              <span className={`${ui.skeleton} ${s.skelName}`} />
              <span className={`${ui.skeleton} ${s.skelMeta}`} />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/* ---------- Running head (below 1100px) ---------- */

type RunningHeadProps = { venue: MenuVenue; groups: ServiceGroup[]; listRef: RefObject<HTMLDivElement | null> };

function navOffset(element: HTMLElement) {
  return parseFloat(getComputedStyle(element).top) || 56;
}

function RunningHead({ venue, groups, listRef }: RunningHeadProps) {
  const headRef = useRef<HTMLDivElement>(null);
  const [above, setAbove] = useState(false);
  const [inList, setInList] = useState(false);
  const [current, setCurrent] = useState<string | null>(null);

  // Shown once the studio switch has gone under the masthead while the list is still on screen.
  useEffect(() => {
    const switcher = document.getElementById(EDIT_STUDIOS_ID);
    const list = listRef.current;
    const head = headRef.current;
    if (!switcher || !list || !head) return;
    let observers: IntersectionObserver[] = [];
    const start = () => {
      observers.forEach((observer) => observer.disconnect());
      const nav = navOffset(head);
      const past = new IntersectionObserver((entries) => {
        const entry = entries[entries.length - 1];
        setAbove(!entry.isIntersecting && entry.boundingClientRect.top < nav);
      }, { rootMargin: `-${nav}px 0px 0px 0px` });
      const reading = new IntersectionObserver((entries) => {
        setInList(entries[entries.length - 1].isIntersecting);
      }, { rootMargin: `-${nav + 44}px 0px 0px 0px` });
      past.observe(switcher);
      reading.observe(list);
      observers = [past, reading];
    };
    start();
    const queries = ["(min-width: 760px)", "(min-width: 1100px)"].map((query) => window.matchMedia(query));
    queries.forEach((query) => query.addEventListener("change", start));
    return () => {
      observers.forEach((observer) => observer.disconnect());
      queries.forEach((query) => query.removeEventListener("change", start));
    };
  }, [listRef]);

  // The category is the first group still showing below the running head.
  useEffect(() => {
    const list = listRef.current;
    const head = headRef.current;
    if (!list || !head || !groups.length) return;
    const nodes = Array.from(list.querySelectorAll<HTMLElement>("[data-menu-group]"));
    const visible = new Set<Element>();
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) visible.add(entry.target);
        else visible.delete(entry.target);
      }
      setCurrent(nodes.find((node) => visible.has(node))?.dataset.menuGroup ?? null);
    }, { rootMargin: `-${navOffset(head) + 44}px 0px 0px 0px` });
    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [groups, listRef]);

  const category = (groups.find((group) => group.slug === current) ?? groups[0])?.category;
  return (
    <div ref={headRef} className={s.runningHead} data-shown={above && inList ? "true" : "false"} data-tone="porcelain">
      <p className={s.runningTitle}>{category ? `${venue.short} · ${category}` : venue.short}</p>
      <button type="button" className={`${ui.textBtn} ${s.change}`} onClick={jumpToStudioSwitch}>
        <span>
          Change<span className={ui.srOnly}>{` studio, now showing ${venue.name}`}</span>
        </span>
      </button>
    </div>
  );
}

/* ---------- Desktop detail spread ---------- */

type DetailProps = {
  venue: MenuVenue;
  service: PublicService | null;
  no: string;
  count: number;
  status: Status;
  data: BookingBootstrap | null;
  live: VenueStatus | null;
  onBook: Book;
  onBookStudio: (button: HTMLElement) => void;
  onWarm: () => void;
};

function Detail({ venue, service, no, count, status, data, live, onBook, onBookStudio, onWarm }: DetailProps) {
  const address = street(venue.address);
  let facts: string | null = null;
  if (status === "loading") facts = "Checking the live menu…";
  else if (status === "error") facts = "The live menu isn't loading just now.";
  else facts = factsText(data);

  return (
    <section id="edit-detail" className={s.aside} aria-labelledby="edit-detail-title" data-tone="porcelain">
      {service ? (
        <div key={service.id} className={`${s.detail} ${s.detailIn}`}>
          <p className={ui.label}>
            <span className={ui.num}>{`No. ${no} of ${count}`}</span>
            {` · ${service.category?.trim() || "Other services"}`}
          </p>
          <h3 id="edit-detail-title" className={s.detailTitle}>{service.name}</h3>
          <ServiceFacts service={service} />
          <p className={ui.body}>{serviceDescription(service)}</p>
          <div className={s.detailNotes}>
            <p className={ui.small}>{address ? `At ${venue.name} · ${address}` : `At ${venue.name}`}</p>
            <p className={ui.small}>You pay at the studio, after your appointment.</p>
          </div>
          <button
            type="button"
            className={`${ui.btn} ${ui.btnPrimary} ${ui.btnLg} ${ui.lifted} ${s.detailBook}`}
            data-book=""
            onClick={(event) => onBook(service.id, event.currentTarget)}
            onPointerEnter={onWarm}
            onFocus={onWarm}
          >
            <BookEditLabel service={service} venueName={venue.name} />
            <ArrowRight />
          </button>
          <p className={ui.small}>{`Opens at Day & time in ${venue.name}’s live diary.`}</p>
          {venue.slug ? (
            <div className={s.detailLinks}>
              <AboutLink slug={venue.slug} name={venue.name} />
            </div>
          ) : null}
        </div>
      ) : (
        <div className={s.detail}>
          <p className={ui.label}>Now showing</p>
          <h3 id="edit-detail-title" className={`${ui.displayM} ${s.cardTitle}`}>{venue.name}</h3>
          <p className={ui.small}>{venue.trade ? `${venue.area} · ${venue.trade}` : venue.area}</p>
          <div className={s.cardFacts}>
            {venue.address ? <p className={ui.bodyS}>{venue.address}</p> : null}
            <p className={ui.small}>{venue.hoursLabel}</p>
            {live ? <p className={statusClass(live)}>{live.text}</p> : null}
            {facts ? <p className={`${ui.small} ${ui.num}`}>{facts}</p> : null}
            {venue.note ? <p className={ui.small}>{venue.note}</p> : null}
          </div>
          <button
            type="button"
            className={`${ui.btn} ${ui.btnPrimary} ${ui.block} ${s.cardBook}`}
            data-book=""
            onClick={(event) => onBookStudio(event.currentTarget)}
            onPointerEnter={onWarm}
            onFocus={onWarm}
          >
            {`Book at ${venue.short}`}
            <ArrowRight />
          </button>
          <div className={s.detailLinks}>
            {venue.directionsUrl ? <Directions url={venue.directionsUrl} /> : null}
            {venue.slug ? <AboutLink slug={venue.slug} name={venue.name} /> : null}
          </div>
        </div>
      )}
    </section>
  );
}

/* ---------- The island ---------- */

export function EditLive() {
  const { studios, catalog, currentStudio, setCurrentStudio, defaultStudio, openBooking, prefetchBooking } = usePaloma();
  const lite = useLite();
  const now = useClock();
  const listRef = useRef<HTMLDivElement>(null);

  const liveVenues = catalog.data?.venues;
  const venues = useMemo(() => menuVenues(studios, liveVenues), [studios, liveVenues]);
  const defaultVenueId = catalog.data?.selectedVenueId ?? null;
  const catalogFailed = !catalog.data && !catalog.loading;

  // A live venue outside the four is a local choice; it holds only while the page's studio stays put.
  const [extra, setExtra] = useState<{ key: string; base: StudioSlug | null } | null>(null);
  const venue = (extra && extra.base === currentStudio ? venues.find((item) => item.key === extra.key) : undefined)
    ?? venues.find((item) => item.slug === (currentStudio ?? defaultStudio ?? FALLBACK))
    ?? venues[0];

  const venueId = venue.venueId;
  const isDefault = venueId !== null && venueId === defaultVenueId;
  const entry = useVenueEntry(venueId);
  const data = entry.data ?? (isDefault ? catalog.data : null);
  const status = venueId
    ? statusOf(data, venueId, Boolean(entry.error), entry.loading)
    : statusOf(data, null, true, catalog.loading);

  // On a switch the previous list stays (inert) for up to HOLD_MS, so a quick answer never flashes the skeleton.
  const [hold, setHold] = useState<Hold | null>(null);
  const holding = hold && hold.key === venue.key && status === "loading" ? hold : null;
  useEffect(() => {
    if (!hold) return;
    const timer = window.setTimeout(() => setHold(null), holding ? HOLD_MS : 0);
    return () => window.clearTimeout(timer);
  }, [hold, holding]);

  const listVenue = holding ? holding.venue : venue;
  const listData = holding ? holding.data : data;
  const listStatus: Status = holding ? (holding.data ? "ready" : "loading") : status;

  const groups = useMemo(() => (listData ? groupByCategory(listData.services, categorySlug) : []), [listData]);
  const numbers = useMemo(() => {
    const map = new Map<string, string>();
    let index = 0;
    for (const group of groups) {
      for (const service of group.services) {
        index += 1;
        map.set(service.id, pad(index));
      }
    }
    return map;
  }, [groups]);

  // Selection is keyed by service id; a refreshed menu that drops the service clears it.
  const [selection, setSelection] = useState<{ key: string; id: string } | null>(null);
  const selected = !holding && selection?.key === venue.key
    ? data?.services.find((service) => service.id === selection.id) ?? null
    : null;
  const selectedId = selected?.id ?? null;

  // Rows get stable callbacks, so a refresh or a selection re-renders only the rows that changed.
  const latest = useRef({ venue, openBooking });
  useEffect(() => {
    latest.current = { venue, openBooking };
  }, [venue, openBooking]);

  const anchor = useRef<{ id: string; top: number } | null>(null);
  const onSelect = useCallback<Select>((serviceId, row) => {
    anchor.current = { id: serviceId, top: row.getBoundingClientRect().top };
    setSelection({ key: latest.current.venue.key, id: serviceId });
  }, [setSelection]);

  const onBook = useCallback<Book>((serviceId, button) => {
    const { venue: chosen, openBooking: open } = latest.current;
    open(chosen.slug ? { slug: chosen.slug, serviceId } : { venueId: chosen.venueId, serviceId }, { returnTo: button });
  }, []);

  // The newly checked row stays under the finger when a row above it closes; its Book clears the bottom edge.
  useLayoutEffect(() => {
    const mark = anchor.current;
    anchor.current = null;
    if (!mark || mark.id !== selectedId) return;
    const row = document.getElementById(rowId(mark.id));
    if (!row) return;
    const delta = row.getBoundingClientRect().top - mark.top;
    if (Math.abs(delta) >= 1) window.scrollBy({ top: delta, behavior: "instant" });
    const detail = document.getElementById(`edit-detail-${mark.id}`);
    if (detail?.getClientRects().length) detail.scrollIntoView({ block: "nearest", behavior: "instant" });
  }, [selectedId]);

  // Announced only after the guest switches studio, never on load.
  const [announceKey, setAnnounceKey] = useState<string | null>(null);
  const announcement = announceKey === venue.key && !holding ? announcementFor(status, venue, data) : "";

  const chooseVenue = (next: MenuVenue) => {
    if (next.key === venue.key) return;
    const list = listRef.current;
    if (list) {
      setHold({ key: next.key, venue: listVenue, data: listStatus === "ready" ? listData : null, height: list.offsetHeight });
      const nav = parseFloat(getComputedStyle(list).getPropertyValue("--p4-nav-h")) || 56;
      const offset = nav + (window.matchMedia("(min-width: 1100px)").matches ? 24 : 60);
      const top = list.getBoundingClientRect().top;
      if (top < offset) window.scrollTo({ top: Math.max(0, window.scrollY + top - offset), behavior: "instant" });
    }
    setSelection(null);
    setAnnounceKey(next.key);
    if (next.slug) {
      setExtra(null);
      setCurrentStudio(next.slug);
    } else {
      setExtra({ key: next.key, base: currentStudio });
    }
  };

  const warmVenue = useCallback((item: MenuVenue) => {
    if (!lite && item.venueId) void fetchVenue(item.venueId);
  }, [lite]);

  const warmed = useRef(false);
  const warmBooking = () => {
    if (warmed.current) return;
    warmed.current = true;
    prefetchBooking();
  };

  const bookStudio = (button: HTMLElement) => {
    openBooking(venue.slug ? { slug: venue.slug } : { venueId: venue.venueId }, { returnTo: button });
  };

  const retry = () => {
    if (venueId && !isDefault) void fetchVenue(venueId, true);
    else void catalog.refresh();
  };

  // The chosen studio's menu: fetched when chosen, refreshed when the tab returns (a no-op while fresh).
  useEffect(() => {
    if (!venueId || isDefault) return;
    void fetchVenue(venueId);
    const refresh = () => {
      if (document.visibilityState === "visible") void fetchVenue(venueId);
    };
    document.addEventListener("visibilitychange", refresh);
    return () => document.removeEventListener("visibilitychange", refresh);
  }, [venueId, isDefault]);

  // When the edit comes within a viewport, the other studios' menus load one at a time (never for lite visitors).
  const others = useMemo(
    () => venues.map((item) => item.venueId).filter((id): id is string => Boolean(id) && id !== defaultVenueId),
    [venues, defaultVenueId],
  );
  const prefetched = useRef(false);
  useEffect(() => {
    if (lite || prefetched.current || !defaultVenueId || !others.length) return;
    const section = document.getElementById("edit");
    if (!section) return;
    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((item) => item.isIntersecting)) return;
      observer.disconnect();
      prefetched.current = true;
      void prefetchVenues(others);
    }, { rootMargin: "0px 0px 100% 0px" });
    observer.observe(section);
    return () => observer.disconnect();
  }, [lite, others, defaultVenueId]);

  // Deep link: /brand-home-4#edit-{slug} shows that studio's menu.
  useEffect(() => {
    const follow = () => {
      const hash = decodeURIComponent(window.location.hash.slice(1));
      const slug = hash.startsWith("edit-") ? hash.slice(5) : "";
      if (!isVenueSlug(slug)) return;
      setExtra(null);
      setCurrentStudio(slug);
      window.requestAnimationFrame(() => jumpTo("edit"));
    };
    const frame = window.requestAnimationFrame(follow);
    window.addEventListener("hashchange", follow);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("hashchange", follow);
    };
  }, [setCurrentStudio]);

  const live = now ? venueStatus(venue.hours, data, now) : null;
  const address = street(venue.address);

  return (
    <>
      <fieldset id={EDIT_STUDIOS_ID} className={s.studios}>
        <legend className={`${ui.label} ${s.legend}`}>Showing the menu at</legend>
        <div className={s.tiles}>
          {venues.map((item) => (
            <Tile
              key={item.key}
              venue={item}
              checked={item.key === venue.key}
              fallback={item.venueId && item.venueId === defaultVenueId ? catalog.data : null}
              unbound={Boolean(catalog.data) && !item.venueId}
              catalogFailed={catalogFailed}
              lite={lite}
              onChoose={chooseVenue}
              onWarm={warmVenue}
            />
          ))}
        </div>
      </fieldset>

      <div className={s.menu}>
        <RunningHead venue={listVenue} groups={groups} listRef={listRef} />

        <div className={s.statusRow}>
          <p className={s.statusLine}>
            {live ? (
              <>
                <span>{`Live from ${venue.name}, ${venue.area}`}</span>
                <span className={s.sep}> · </span>
                <span className={statusClass(live)}>{live.text}</span>
                {address ? (
                  <>
                    <span className={s.sep}> · </span>
                    <span>{address}</span>
                  </>
                ) : null}
              </>
            ) : (
              <span>{venue.address ? `${venue.address} · ${venue.hoursLabel}` : venue.hoursLabel}</span>
            )}
            {venue.note ? <span className={s.statusNote}>{venue.note}</span> : null}
          </p>
          <div className={s.statusLinks}>
            {venue.slug ? <AboutLink slug={venue.slug} name={venue.name} /> : null}
            {venue.directionsUrl ? <Directions url={venue.directionsUrl} /> : null}
          </div>
        </div>

        {listStatus === "ready" || listStatus === "loading" ? (
          <Chips venue={listVenue} groups={groups} loading={listStatus === "loading"} />
        ) : null}

        <div
          ref={listRef}
          className={s.list}
          style={holding ? { minHeight: holding.height } : undefined}
          aria-busy={listStatus === "loading" || Boolean(holding)}
          inert={Boolean(holding)}
          onPointerEnter={warmBooking}
          onFocus={warmBooking}
          onTouchStart={warmBooking}
        >
          {listStatus === "loading" ? <MenuSkeleton name={venue.name} /> : null}

          {listStatus === "error" ? (
            <div className={s.state}>
              <p className={ui.h3}>{`The menu at ${venue.name} isn't loading just now.`}</p>
              <p className={ui.bodyS}>The diary is still open — you can book in the window, or try again.</p>
              <div className={s.stateActions}>
                <button type="button" className={`${ui.btn} ${ui.btnLine}`} onClick={retry}>
                  Try again
                </button>
                <button
                  type="button"
                  className={`${ui.btn} ${ui.btnPrimary}`}
                  data-book=""
                  onClick={(event) => bookStudio(event.currentTarget)}
                >
                  {`Book at ${venue.short} anyway`}
                  <ArrowRight />
                </button>
              </div>
            </div>
          ) : null}

          {listStatus === "empty" ? (
            <div className={s.state}>
              <p className={ui.h3}>{`${venue.name} has no services open for online booking at the moment.`}</p>
              <button type="button" className={ui.textBtn} onClick={() => focusCheckedStudio()}>
                <span>Choose another studio</span>
                <ArrowRight />
              </button>
            </div>
          ) : null}

          {listStatus === "ready" ? (
            <fieldset className={s.services}>
              <legend className={ui.srOnly}>{`Choose a service at ${listVenue.name}`}</legend>
              {groups.map((group) => (
                <Group
                  key={`${listVenue.key}:${group.slug}`}
                  group={group}
                  venue={listVenue}
                  numbers={numbers}
                  selectedId={holding ? null : selectedId}
                  onSelect={onSelect}
                  onBook={onBook}
                />
              ))}
            </fieldset>
          ) : null}
        </div>

        <Detail
          venue={venue}
          service={selected}
          no={selectedId ? numbers.get(selectedId) ?? "" : ""}
          count={data?.services.length ?? 0}
          status={status}
          data={data}
          live={live}
          onBook={onBook}
          onBookStudio={bookStudio}
          onWarm={prefetchBooking}
        />

        {status === "ready" || status === "loading" ? (
          <div className={s.foot}>
            <p className={s.footNote}>
              {`Live from ${venue.name}’s diary. Prices are the studio’s menu prices in S$; GST is shown beside a price wherever the studio adds it. You pay at the studio after your appointment. All times are Singapore time (SGT).`}
            </p>
            <button
              type="button"
              className={`${ui.btn} ${ui.btnLine}`}
              data-book=""
              onClick={(event) => bookStudio(event.currentTarget)}
              onPointerEnter={prefetchBooking}
              onFocus={prefetchBooking}
            >
              {`Book at ${venue.short}`}
              <ArrowRight />
            </button>
          </div>
        ) : null}
      </div>

      <p className={ui.srOnly} role="status">{announcement}</p>
    </>
  );
}
