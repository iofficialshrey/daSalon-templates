import Image from "next/image";
import wallPhoto from "../assets/room-wall.jpg";
import { ROOMS } from "../data/rooms";
import { ClosingBook, FooterNav, ToTop } from "./closing-actions";
import { Mark } from "./icons";
import styles from "./closing.module.css";
import ui from "./ui.module.css";

/** "463 Clementi Road, Singapore 599494" → "463 Clementi Road" */
function street(address: string) {
  return address.split(",")[0];
}

/** The last invitation, then the footer: the four rooms, the sections and the small print. */
export function Closing() {
  return (
    <div className={`${ui.dark} ${styles.closing}`} data-tone="dark">
      <section className={`${ui.container} ${styles.invite}`} aria-labelledby="closing-title">
        <div className={styles.window} aria-hidden="true">
          <Image src={wallPhoto} alt="" fill sizes="(min-width: 760px) 300px, 46vw" quality={75} className={`${styles.windowImg} ${ui.exhale}`} />
        </div>
        <h2 id="closing-title" className={`${ui.h1} ${styles.title} ${ui.rise}`}>
          You have time <em className={ui.accent}>to feel better.</em>
        </h2>
        <ClosingBook />
      </section>

      <footer className={`${ui.container} ${styles.footer}`}>
        <div className={styles.cols}>
          <div>
            <p className={styles.wordmark}>
              <Mark size={30} />
              <span>oru</span>
            </p>
            <p className={styles.tagline}>An urban spa in Singapore.</p>
          </div>
          <ul className={styles.rooms} aria-label="The rooms">
            {ROOMS.map((room) => (
              <li key={room.slug}>
                <span className={styles.roomName}>{room.name}</span>
                <a href={room.directionsUrl} target="_blank" rel="noopener noreferrer" className={styles.address}>
                  {street(room.address)}, {room.area}
                  <span className={ui.srOnly}> (directions, opens in a new tab)</span>
                </a>
              </li>
            ))}
          </ul>
          <FooterNav className={styles.links} linkClassName={styles.footLink} />
        </div>
        <div className={styles.base}>
          <p className={styles.legal}>
            © 2026 Oru Spa, a demonstration by da Salon. Menus, prices and times are live; the photographs and offers
            are illustrative. Prices in S$, Singapore time.
          </p>
          <div className={styles.end}>
            <a href="https://www.dasalon.com" target="_blank" rel="noopener noreferrer" className={styles.footLink}>
              Powered by da Salon
              <span className={ui.srOnly}> (opens in a new tab)</span>
            </a>
            <ToTop className={styles.footLink} />
          </div>
        </div>
      </footer>
    </div>
  );
}
