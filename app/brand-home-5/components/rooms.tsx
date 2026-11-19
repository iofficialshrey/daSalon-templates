"use client";

import Image from "next/image";
import { jumpTo } from "@/lib/page/jump";
import { useVenueEntry } from "@/lib/dasalon/venue-cache";
import { factsLine, menuFacts, venueStatus, type StatusWords } from "@/lib/dasalon/venue-status";
import { useClock } from "@/lib/page/use-clock";
import { ArrowRight } from "./icons";
import { useOru, type LiveRoom } from "./provider";
import styles from "./rooms.module.css";
import ui from "./ui.module.css";

/** Dates are working days, never free slots. */
const STATUS_WORDS: StatusWords = {
  today: "Bookable today",
  next: (day) => `Next bookable day: ${day}`,
};

function RoomCard({ room }: { room: LiveRoom }) {
  const { catalog, openBooking, warmBooking, setRoom, setBudget } = useOru();
  const entry = useVenueEntry(room.venueId);
  const data = entry.data ?? (room.venueId && catalog.data?.selectedVenueId === room.venueId ? catalog.data : null);
  const now = useClock();
  const status = now ? venueStatus(room.hours, data, now, STATUS_WORDS) : null;
  const facts = data ? factsLine(menuFacts(data)) : null;

  const seeTreatments = () => {
    setRoom(room.slug);
    setBudget(null);
    jumpTo("treatments");
  };

  return (
    <li className={`${styles.card} ${ui.rise}`}>
      <div className={styles.photo}>
        <Image
          src={room.photo}
          alt={room.photoAlt}
          fill
          sizes="(min-width: 1100px) 30vw, (min-width: 700px) 60vw, 100vw"
          quality={75}
          className={styles.img}
          style={{ objectPosition: room.focus }}
        />
      </div>
      <div className={styles.body}>
        <h3 className={ui.h3}>{room.name}</h3>
        <p className={styles.trade}>{room.trade}</p>
        <p className={styles.status}>
          {status?.tone === "open" ? <span className={styles.dot} aria-hidden="true" /> : null}
          <span>{status?.text ?? room.hoursLabel}</span>
        </p>
        <p className={styles.facts}>
          {room.area}
          {facts ? ` · ${facts}` : ""}
        </p>
        <div className={styles.actions}>
          <button
            type="button"
            className={`${ui.btn} ${ui.primary} ${ui.sm}`}
            aria-label={`Book at ${room.name}`}
            onClick={() => openBooking({ slug: room.slug })}
            onPointerEnter={warmBooking}
            onFocus={warmBooking}
          >
            Book
            <ArrowRight size={16} />
          </button>
          <button type="button" className={ui.link} onClick={seeTreatments} aria-label={`See the treatments at ${room.name}`}>
            <span>Treatments</span>
          </button>
        </div>
      </div>
    </li>
  );
}

/** The four rooms: each a live venue, with its status, its menu in one line and two ways in. */
export function Rooms() {
  const { rooms } = useOru();
  return (
    <section id="rooms" data-tone="light" aria-labelledby="rooms-title" className={`${ui.section} ${ui.light}`}>
      <div className={ui.container}>
        <div className={styles.head}>
          <h2 id="rooms-title" className={`${ui.h2} ${ui.rise}`} tabIndex={-1} data-jump-focus="">
            Four rooms. <em className={ui.accent}>One slower rhythm.</em>
          </h2>
          <p className={`${ui.lead} ${ui.rise} ${ui.rise2}`}>
            Each room keeps its own menu and its own diary. Book any of them from here.
          </p>
        </div>
        <ul className={styles.list}>
          {rooms.map((room) => (
            <RoomCard key={room.slug} room={room} />
          ))}
        </ul>
      </div>
    </section>
  );
}
