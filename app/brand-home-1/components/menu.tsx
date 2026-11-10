"use client";

import {
  memo,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent,
} from "react";
import { serviceDescription } from "@/lib/dasalon/client";
import { formatDuration, formatPrice } from "@/lib/dasalon/locale";
import type { BookingBootstrap, PublicService } from "@/lib/dasalon/types";
import type { HouseSlug } from "../data/houses";
import { fetchVenue, useVenueEntry } from "@/lib/dasalon/venue-cache";
import { groupByCategory, type ServiceGroup } from "@/lib/dasalon/venue-status";
import { categorySlug } from "@/lib/dasalon/slug";
import { ArrowDown, ArrowRight, ArrowUp, Refresh } from "./icons";
import { useMaison } from "./provider";
import styles from "./menu.module.css";
import ui from "./ui.module.css";

/** Rows shown per category before "Show {k} more". */
const VISIBLE_ROWS = 6;
/** Longest time the list keeps its previous height while another house loads. */
const HOLD_MS = 600;
const NO_GROUPS: ReadonlySet<string> = new Set();
const SKELETON_ROWS = ["s1", "s2", "s3", "s4", "s5", "s6"] as const;
const SKELETON_LINKS = ["l1", "l2", "l3", "l4"] as const;
const SKELETON_CHIPS = ["c1", "c2", "c3"] as const;

type Status = "loading" | "error" | "empty" | "ready";
type BookService = (house: HouseSlug, serviceId: string) => void;
type ToggleGroup = (house: HouseSlug, group: string) => void;
type JumpHandler = (event: MouseEvent<HTMLAnchorElement>, id: string) => void;

function groupAnchor(house: HouseSlug, group: string) {
  return `menu-${house}-${group}`;
}

function servicesLabel(count: number) {
  return `${count} ${count === 1 ? "service" : "services"}`;
}

function announcementFor(status: Status, house: string, count: number) {
  if (status === "loading") return `Loading the menu at ${house}…`;
  if (status === "error") return `The menu at ${house} isn't loading just now.`;
  if (status === "empty") return `${house} has no services open for online booking at the moment.`;
  return `Showing ${servicesLabel(count)} at ${house}`;
}

/* ---------- Service row ---------- */

type RowProps = {
  service: PublicService;
  house: HouseSlug;
  houseName: string;
  onBook: BookService;
};

function sameRow(previous: RowProps, next: RowProps) {
  const a = previous.service;
  const b = next.service;
  return (
    previous.house === next.house &&
    previous.houseName === next.houseName &&
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

/** One bookable service. The name is a button stretched over the whole row. */
const ServiceRow = memo(function ServiceRow({ service, house, houseName, onBook }: RowProps) {
  const descriptionId = useId();
  const duration = formatDuration(service.duration);
  const price = formatPrice(service.price);
  const tax = service.taxLabel;
  const due = service.total !== service.price ? `, ${formatPrice(service.total)} due at the house` : "";

  return (
    <li className={styles.row}>
      <button
        type="button"
        className={styles.name}
        aria-describedby={descriptionId}
        onClick={() => onBook(house, service.id)}
      >
        <span className={ui.srOnly}>Book </span>
        {service.name}
        <span className={ui.srOnly}>{`, ${houseName}, ${duration}, ${price}${tax ? ` ${tax}` : ""}${due}`}</span>
      </button>
      <p id={descriptionId} className={styles.desc}>{serviceDescription(service)}</p>
      <span className={`${styles.dur} ${ui.num}`} aria-hidden="true">{duration}</span>
      <span className={styles.price} aria-hidden="true">
        <span className={`${styles.amount} ${ui.num}`}>{price}</span>
        {tax ? <span className={`${styles.tax} ${ui.num}`}>{tax}</span> : null}
      </span>
      <span className={`${styles.phoneMeta} ${ui.num}`} aria-hidden="true">
        {tax ? `${duration} · ${tax}` : duration}
      </span>
      <span className={styles.book} aria-hidden="true">
        Book
        <ArrowRight className={styles.bookArrow} />
      </span>
    </li>
  );
}, sameRow);

/* ---------- Category group ---------- */

type GroupProps = {
  group: ServiceGroup;
  house: HouseSlug;
  houseName: string;
  expanded: boolean;
  onToggle: ToggleGroup;
  onBook: BookService;
};

const CategoryGroup = memo(function CategoryGroup({ group, house, houseName, expanded, onToggle, onBook }: GroupProps) {
  const headingId = useId();
  const listId = useId();
  const toggleRef = useRef<HTMLButtonElement>(null);
  const toggleTop = useRef<number | null>(null);
  const count = group.services.length;
  const hidden = count - VISIBLE_ROWS;
  const shown = hidden > 0 && !expanded ? group.services.slice(0, VISIBLE_ROWS) : group.services;

  // Collapsing removes rows above the toggle; keep the toggle where the visitor left it.
  useLayoutEffect(() => {
    const before = toggleTop.current;
    toggleTop.current = null;
    const toggle = toggleRef.current;
    if (before === null || !toggle) return;
    const delta = toggle.getBoundingClientRect().top - before;
    if (delta) window.scrollBy({ top: delta, behavior: "instant" });
  }, [expanded]);

  const toggle = () => {
    if (expanded && toggleRef.current) toggleTop.current = toggleRef.current.getBoundingClientRect().top;
    onToggle(house, group.slug);
  };

  return (
    <div id={groupAnchor(house, group.slug)} className={styles.group}>
      <div className={styles.groupHead}>
        <h3 id={headingId} className={`${ui.h4} ${styles.groupTitle}`} tabIndex={-1}>
          {group.category}
        </h3>
        <p className={`${ui.label} ${ui.num} ${styles.groupCount}`}>{servicesLabel(count)}</p>
      </div>
      <ul id={listId} className={styles.rows} aria-labelledby={headingId}>
        {shown.map((service) => (
          <ServiceRow key={service.id} service={service} house={house} houseName={houseName} onBook={onBook} />
        ))}
      </ul>
      {hidden > 0 ? (
        <button
          ref={toggleRef}
          type="button"
          className={`${ui.btn} ${ui.textBtn} ${styles.more}`}
          aria-expanded={expanded}
          aria-controls={listId}
          onClick={toggle}
        >
          {expanded ? (
            <>
              <span className={ui.underline}>
                Show fewer<span className={ui.srOnly}> {group.category}</span>
              </span>
              <ArrowUp />
            </>
          ) : (
            <>
              <span className={ui.underline}>{`Show ${hidden} more ${group.category}`}</span>
              <ArrowDown />
            </>
          )}
        </button>
      ) : null}
    </div>
  );
});

/* ---------- Loading placeholder ---------- */

function MenuSkeleton({ houseName }: { houseName: string }) {
  return (
    <div>
      <p className={ui.srOnly}>{`Loading the menu at ${houseName}…`}</p>
      <div className={styles.groupHead} aria-hidden="true">
        <span className={`${ui.skeleton} ${styles.skelHead}`} />
      </div>
      <ul className={styles.rows} aria-hidden="true">
        {SKELETON_ROWS.map((key) => (
          <li key={key} className={styles.skelRow}>
            <span className={`${ui.skeleton} ${styles.skelTitle}`} />
            <span className={`${ui.skeleton} ${styles.skelMeta}`} />
            <span className={`${ui.skeleton} ${styles.skelPrice}`} />
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------- Section ---------- */

/** Services: every house's live menu, switchable by house; each row books that service at the time step. */
export function Menu() {
  const {
    houses,
    catalog,
    currentHouse,
    setCurrentHouse,
    openBooking,
    prefetchBooking,
    openHouse,
    prefetchHouseSheet,
  } = useMaison();

  const titleId = useId();
  const jumpLabelId = useId();
  const radioName = useId();
  const sectionRef = useRef<HTMLElement>(null);
  const railFieldRef = useRef<HTMLFieldSetElement>(null);
  const chipFieldRef = useRef<HTMLFieldSetElement>(null);
  const chipRowRef = useRef<HTMLDivElement>(null);
  const categoryRowRef = useRef<HTMLElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const warmed = useRef(false);

  const defaultVenueId = catalog.data?.selectedVenueId ?? null;
  const selected = useMemo(
    () =>
      houses.find((house) => house.slug === currentHouse) ??
      houses.find((house) => house.venueId !== null && house.venueId === defaultVenueId) ??
      houses[0],
    [houses, currentHouse, defaultVenueId],
  );

  const venueId = selected.venueId;
  const isDefault = venueId !== null && venueId === defaultVenueId;
  const entry = useVenueEntry(venueId);
  const data: BookingBootstrap | null = entry.data ?? (isDefault ? catalog.data : null);

  let status: Status;
  if (data) status = data.services.length ? "ready" : "empty";
  else if (venueId) status = entry.error && !entry.loading ? "error" : "loading";
  else status = catalog.loading || (!catalog.data && !catalog.error) ? "loading" : "error";

  const groups = useMemo(() => (data ? groupByCategory(data.services, categorySlug) : []), [data]);
  const serviceCount = data?.services.length ?? 0;

  // The default house arrives with the shared catalog; any other house is fetched (or refreshed when stale) on demand.
  useEffect(() => {
    if (!venueId || isDefault) return;
    void fetchVenue(venueId);
    // fetchVenue is a no-op while the entry is fresh; this keeps a long-open menu from going stale.
    const timer = window.setInterval(() => void fetchVenue(venueId), 60_000);
    return () => window.clearInterval(timer);
  }, [venueId, isDefault]);

  // Rows get one stable booking callback, so the catalog's 30-second refresh never re-renders unchanged rows.
  const openBookingRef = useRef(openBooking);
  useEffect(() => {
    openBookingRef.current = openBooking;
  }, [openBooking]);
  const bookService = useCallback<BookService>((house, serviceId) => {
    openBookingRef.current({ house, serviceId });
  }, []);

  const warmBooking = useCallback(() => {
    if (warmed.current) return;
    warmed.current = true;
    prefetchBooking();
  }, [prefetchBooking]);

  // "Show more" state belongs to one house; switching house starts every group collapsed.
  const [openGroups, setOpenGroups] = useState<{ house: HouseSlug | null; groups: ReadonlySet<string> }>({
    house: null,
    groups: NO_GROUPS,
  });
  const expanded = openGroups.house === selected.slug ? openGroups.groups : NO_GROUPS;
  const toggleGroup = useCallback<ToggleGroup>((house, group) => {
    setOpenGroups((previous) => {
      const next = new Set(previous.house === house ? previous.groups : NO_GROUPS);
      if (next.has(group)) next.delete(group);
      else next.add(group);
      return { house, groups: next };
    });
  }, [setOpenGroups]);

  // While another house loads, the list keeps its previous height (at most HOLD_MS) so the page does not jump.
  const [hold, setHold] = useState<number | null>(null);
  useEffect(() => {
    if (hold === null) return;
    const timer = window.setTimeout(() => setHold(null), status === "loading" ? HOLD_MS : 0);
    return () => window.clearTimeout(timer);
  }, [hold, status]);

  // Announced only after the visitor switches house, never on page load.
  const [announceFor, setAnnounceFor] = useState<HouseSlug | null>(null);
  const announcement = announceFor === selected.slug ? announcementFor(status, selected.name, serviceCount) : "";

  /** Distance from the viewport top to where content sits clear of the header and the sticky controls. */
  const stickyOffset = useCallback(() => {
    const section = sectionRef.current;
    if (!section) return 0;
    const header = parseFloat(getComputedStyle(section).getPropertyValue("--mx-header")) || 0;
    const bar = barRef.current;
    if (bar && bar.getClientRects().length) {
      const style = getComputedStyle(bar);
      if (style.position === "sticky") return (parseFloat(style.top) || header) + bar.offsetHeight + 16;
      return header + 16;
    }
    return header + 32;
  }, []);

  const selectHouse = (slug: HouseSlug) => {
    const list = listRef.current;
    if (list) {
      setHold(list.offsetHeight);
      const offset = stickyOffset();
      const top = list.getBoundingClientRect().top;
      if (top < offset) window.scrollTo({ top: Math.max(0, window.scrollY + top - offset), behavior: "instant" });
    }
    setOpenGroups({ house: null, groups: NO_GROUPS });
    setAnnounceFor(slug);
    setCurrentHouse(slug);
  };

  /** Category links are not filters: they jump instantly to the group and focus its heading. */
  const jumpToGroup = useCallback<JumpHandler>((event, id) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const target = document.getElementById(id);
    if (!target) return;
    event.preventDefault();
    const top = target.getBoundingClientRect().top + window.scrollY - stickyOffset();
    window.scrollTo({ top: Math.max(0, top), behavior: "instant" });
    target.querySelector<HTMLElement>("h3")?.focus({ preventScroll: true });
  }, [stickyOffset]);

  /** "Choose another house" focuses the visible switcher's checked option. */
  const focusSwitcher = useCallback(() => {
    const field = [railFieldRef.current, chipFieldRef.current].find((item) => item && item.getClientRects().length);
    field?.querySelector<HTMLInputElement>("input:checked")?.focus();
  }, []);

  const retry = () => {
    if (venueId && !isDefault) void fetchVenue(venueId, true);
    else void catalog.refresh();
  };

  // Phone and tablet: a hairline appears under the control bar once it sticks.
  useEffect(() => {
    const sentinel = sentinelRef.current;
    const bar = barRef.current;
    if (!sentinel || !bar || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(([item]) => {
      bar.toggleAttribute("data-stuck", !item.isIntersecting && item.boundingClientRect.top < 0);
    });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  // Keep the chosen house chip in view inside its scrolling row, and start the category row from the left.
  useEffect(() => {
    const row = chipRowRef.current;
    if (categoryRowRef.current) categoryRowRef.current.scrollLeft = 0;
    if (!row || !row.getClientRects().length) return;
    const chip = row.querySelector<HTMLInputElement>("input:checked")?.closest("label");
    if (!chip) return;
    const padding = parseFloat(getComputedStyle(row).paddingLeft) || 0;
    const start = chip.offsetLeft - padding;
    const end = chip.offsetLeft + chip.offsetWidth + padding - row.clientWidth;
    if (row.scrollLeft > start) row.scrollLeft = start;
    else if (row.scrollLeft < end) row.scrollLeft = end;
  }, [selected.slug]);

  const showHouse = () => openHouse(selected.slug);
  const bookHouse = () => openBooking({ house: selected.slug });

  return (
    <section id="menu" ref={sectionRef} className={`${ui.section} ${styles.menu}`} aria-labelledby={titleId}>
      <div className={ui.container}>
        <div className={`${ui.head} ${styles.head}`}>
          <h2 id={titleId} className={ui.h2} tabIndex={-1}>
            The menu, house by house.
          </h2>
          <div className={`${ui.headText} ${ui.reveal2}`}>
            <p className={ui.lead}>
              Live from each house&apos;s own book, in Singapore dollars, with GST shown on every price. Tap any
              service to choose a time.
            </p>
          </div>
        </div>

        <div className={styles.layout}>
          {/* Desktop: sticky rail with the house switcher and category links. */}
          <div className={styles.rail}>
            <p className={styles.railLabel}>Choose a house</p>
            <fieldset ref={railFieldRef} className={styles.railHouses}>
              <legend className={ui.srOnly}>Choose a house</legend>
              {houses.map((house) => (
                <label key={house.slug} className={styles.railHouse}>
                  <input
                    type="radio"
                    name={`${radioName}-rail`}
                    value={house.slug}
                    checked={house.slug === selected.slug}
                    onChange={() => selectHouse(house.slug)}
                  />
                  <span className={styles.railName}>{house.name}</span>
                  <span className={ui.srOnly}>, </span>
                  <span className={styles.railSpec}>{house.specialty}</span>
                </label>
              ))}
            </fieldset>
            <div className={styles.railInfo}>
              <p className={ui.small}>{selected.address}</p>
              <button
                type="button"
                className={`${ui.btn} ${ui.textBtn}`}
                onClick={showHouse}
                onPointerEnter={prefetchHouseSheet}
                onFocus={prefetchHouseSheet}
                onTouchStart={prefetchHouseSheet}
              >
                <span className={ui.underline}>
                  About this house<span className={ui.srOnly}>{`, ${selected.name}`}</span>
                </span>
                <ArrowRight />
              </button>
            </div>
            {status === "ready" || status === "loading" ? (
              <nav className={styles.railJump} aria-labelledby={jumpLabelId}>
                <p id={jumpLabelId} className={ui.label}>Jump to</p>
                {status === "ready" ? (
                  <ul className={styles.railLinks}>
                    {groups.map((group) => {
                      const id = groupAnchor(selected.slug, group.slug);
                      return (
                        <li key={group.category}>
                          <a href={`#${id}`} className={styles.railLink} onClick={(event) => jumpToGroup(event, id)}>
                            <span>{group.category}</span>
                            <span className={ui.srOnly}>, </span>
                            <span className={`${styles.railCount} ${ui.num}`}>
                              {group.services.length}
                              <span className={ui.srOnly}> {group.services.length === 1 ? "service" : "services"}</span>
                            </span>
                          </a>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <div className={styles.railLinks} aria-hidden="true">
                    {SKELETON_LINKS.map((key) => (
                      <span key={key} className={`${ui.skeleton} ${styles.railSkel}`} />
                    ))}
                  </div>
                )}
              </nav>
            ) : null}
          </div>

          {/* Phone and tablet: sticky control bar with house chips and category link chips. */}
          <div ref={sentinelRef} className={styles.sentinel} aria-hidden="true" />
          <div ref={barRef} className={styles.bar}>
            <fieldset ref={chipFieldRef} className={styles.chipField}>
              <legend className={ui.srOnly}>Choose a house</legend>
              <div ref={chipRowRef} className={styles.chipRow}>
                {houses.map((house) => (
                  <label key={house.slug} className={ui.chip}>
                    <input
                      type="radio"
                      name={`${radioName}-chips`}
                      value={house.slug}
                      checked={house.slug === selected.slug}
                      onChange={() => selectHouse(house.slug)}
                    />
                    {house.name}
                    <span className={ui.srOnly}>{`, ${house.specialty}`}</span>
                  </label>
                ))}
              </div>
            </fieldset>
            {status === "ready" || status === "loading" ? (
              <nav
                ref={categoryRowRef}
                className={`${styles.chipRow} ${styles.categoryRow}`}
                aria-label={`Categories at ${selected.name}`}
              >
                {status === "ready"
                  ? groups.map((group) => {
                    const id = groupAnchor(selected.slug, group.slug);
                    return (
                      <a
                        key={group.category}
                        href={`#${id}`}
                        className={`${ui.chip} ${styles.categoryChip}`}
                        onClick={(event) => jumpToGroup(event, id)}
                      >
                        {group.category}
                        <span className={`${ui.chipCount} ${ui.num}`}>
                          {group.services.length}
                          <span className={ui.srOnly}> {group.services.length === 1 ? "service" : "services"}</span>
                        </span>
                      </a>
                    );
                  })
                  : SKELETON_CHIPS.map((key) => (
                    <span key={key} className={`${ui.skeleton} ${styles.chipSkel}`} aria-hidden="true" />
                  ))}
              </nav>
            ) : null}
          </div>

          <div
            ref={listRef}
            className={styles.list}
            style={hold !== null ? { minHeight: hold } : undefined}
            aria-busy={status === "loading"}
            onPointerEnter={warmBooking}
            onFocus={warmBooking}
            onTouchStart={warmBooking}
          >
            {status === "loading" ? <MenuSkeleton houseName={selected.name} /> : null}

            {status === "error" ? (
              <div className={`${styles.state} ${styles.stateCard}`}>
                <span className={styles.stateArch} aria-hidden="true" />
                <div className={styles.stateCopy}>
                  <p className={`${ui.h4} ${styles.stateText}`}>{`The menu at ${selected.name} isn't loading just now.`}</p>
                  <p className={styles.stateHint}>Try again in a moment, or open the booking window to choose a time.</p>
                </div>
                <div className={styles.stateActions}>
                  <button type="button" className={`${ui.btn} ${ui.secondary}`} onClick={retry}>
                    <Refresh />
                    Try again
                  </button>
                  <button
                    type="button"
                    className={`${ui.btn} ${ui.primary}`}
                    data-book=""
                    onClick={bookHouse}
                  >
                    Book anyway
                  </button>
                </div>
              </div>
            ) : null}

            {status === "empty" ? (
              <div className={styles.state}>
                <p className={`${ui.h4} ${styles.stateText}`}>
                  {`${selected.name} has no services open for online booking at the moment.`}
                </p>
                <button type="button" className={`${ui.btn} ${ui.textBtn}`} onClick={focusSwitcher}>
                  <span className={ui.underline}>Choose another house</span>
                  <ArrowRight />
                </button>
              </div>
            ) : null}

            {status === "ready" ? (
              <>
                {groups.map((group) => (
                  <CategoryGroup
                    key={`${selected.slug}:${group.category}`}
                    group={group}
                    house={selected.slug}
                    houseName={selected.name}
                    expanded={expanded.has(group.slug)}
                    onToggle={toggleGroup}
                    onBook={bookService}
                  />
                ))}
                <div className={styles.listFoot}>
                  <p className={`${ui.meta} ${styles.note}`}>
                    {`Prices and durations come live from ${selected.name}. Payment is taken at the house, after your visit. All times are Singapore time (SGT).`}
                  </p>
                  <button
                    type="button"
                    className={`${ui.btn} ${ui.secondary} ${styles.footBtn}`}
                    data-book=""
                    onClick={bookHouse}
                  >
                    {`Book at ${selected.name}`}
                  </button>
                </div>
              </>
            ) : null}
          </div>
        </div>
      </div>
      <p className={ui.srOnly} aria-live="polite">{announcement}</p>
    </section>
  );
}
