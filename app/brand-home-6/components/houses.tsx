"use client";

import Image from "next/image";
import { useState } from "react";
import { jumpTo } from "@/lib/page/jump";
import { useVenueEntry } from "@/lib/dasalon/venue-cache";
import { factsLine, menuFacts, venueStatus } from "@/lib/dasalon/venue-status";
import { useClock } from "@/lib/page/use-clock";
import type { HouseSlug } from "../data/houses";
import { ArrowRight } from "./icons";
import { useNeroli, type LiveHouse } from "./provider";
import { STATUS_WORDS } from "./treatments";
import drop from "./drop.module.css";
import styles from "./houses.module.css";
import ui from "./ui.module.css";

function HouseRow({ house, active, onActive }: { house: LiveHouse; active: boolean; onActive: (slug: HouseSlug) => void }) {
  const { catalog, openBooking, warmBooking, setHouse } = useNeroli();
  const entry = useVenueEntry(house.venueId);
  const data = entry.data ?? (house.venueId && catalog.data?.selectedVenueId === house.venueId ? catalog.data : null);
  const now = useClock();
  const status = now ? venueStatus(house.hours, data, now, STATUS_WORDS) : null;
  const facts = data ? factsLine(menuFacts(data)) : null;

  const seeMenu = () => {
    setHouse(house.slug);
    jumpTo("treatments");
  };

  return (
    <li
      className={styles.row}
      data-active={active ? "" : undefined}
      onPointerEnter={() => onActive(house.slug)}
      onFocusCapture={() => onActive(house.slug)}
    >
      <span className={`${drop.slot} ${styles.slot}`} data-drop-slot={active ? "on" : "off"} aria-hidden="true" />
      <div className={styles.thumb} aria-hidden="true">
        <Image src={house.photo} alt="" fill sizes="96px" quality={60} className={styles.thumbImg} />
      </div>
      <div className={styles.main}>
        <h3 className={`${ui.h3} ${styles.name}`}>{house.name}</h3>
        <p className={styles.trade}>{house.trade}</p>
      </div>
      <div className={styles.live}>
        <p className={styles.status}>
          {status?.tone === "open" ? <span className={styles.dot} aria-hidden="true" /> : null}
          {status?.text ?? house.hoursLabel}
        </p>
        <p className={styles.facts}>{facts ? `${house.area} · ${facts}` : house.address}</p>
      </div>
      <div className={styles.actions}>
        <button type="button" className={ui.link} onClick={seeMenu} aria-label={`See the menu at ${house.name}`}>
          <span>Menu</span>
        </button>
        <button
          type="button"
          className={`${ui.btn} ${ui.primary} ${ui.sm}`}
          aria-label={`Book at ${house.name}`}
          onClick={() => openBooking({ slug: house.slug })}
          onPointerEnter={warmBooking}
          onFocus={warmBooking}
        >
          Book
          <ArrowRight size={16} />
        </button>
      </div>
    </li>
  );
}

/**
 * The four houses as rows. Wide screens: the house you point at shows its
 * room in a round lens beside the list, and the drop moves to its row.
 */
export function Houses() {
  const { houses } = useNeroli();
  const [active, setActive] = useState<HouseSlug>(houses[0].slug);
  const shown = houses.find((house) => house.slug === active) ?? houses[0];

  return (
    <section id="houses" data-tone="light" data-drop-zone="light" aria-labelledby="houses-title" className={`${ui.section} ${ui.light} ${styles.houses}`}>
      <div className={`${ui.container} ${styles.grid}`}>
        <div className={styles.side}>
          <h2 id="houses-title" className={`${ui.h2} ${ui.surface}`} tabIndex={-1} data-jump-focus="">
            Find your water.
          </h2>
          <p className={`${ui.lead} ${ui.surface} ${ui.surface2}`}>
            Four houses across Singapore, each with its own menu and its own diary.
          </p>
          <div className={styles.lens} aria-hidden="true">
            {houses.map((house) => (
              <div key={house.slug} className={styles.lensImg} data-on={house.slug === shown.slug ? "" : undefined}>
                <Image src={house.photo} alt="" fill sizes="(min-width: 1000px) 30vw, 1px" quality={75} className={styles.img} />
              </div>
            ))}
          </div>
        </div>
        <ul className={styles.list}>
          {houses.map((house) => (
            <HouseRow key={house.slug} house={house} active={house.slug === active} onActive={setActive} />
          ))}
        </ul>
      </div>
    </section>
  );
}
