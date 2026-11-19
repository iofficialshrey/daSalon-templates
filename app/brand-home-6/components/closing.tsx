import { HOUSES } from "../data/houses";
import { ClosingBook, FooterNav, ToTop } from "./closing-actions";
import { Mark } from "./icons";
import drop from "./drop.module.css";
import styles from "./closing.module.css";
import ui from "./ui.module.css";

/** "463 Clementi Road, Singapore 599494" → "463 Clementi Road" */
function street(address: string) {
  return address.split(",")[0];
}

/**
 * The deep. The drop falls into the water here: it sinks, the ripples open
 * around the invitation, and the footer rests below.
 */
export function Closing() {
  return (
    <div className={`${ui.dark} ${styles.closing}`} data-tone="dark">
      <section className={`${ui.container} ${styles.invite}`} data-drop-zone="dark" data-drop-merge="" aria-labelledby="closing-title">
        <div className={styles.pool} aria-hidden="true">
          <span className={styles.ring} />
          <span className={styles.ring} />
          <span className={styles.ring} />
          <span className={`${drop.slot} ${styles.slot}`} data-drop-slot="on" />
        </div>
        <h2 id="closing-title" className={`${ui.h1} ${styles.title}`}>
          Leave room <span className={ui.soft}>for yourself.</span>
        </h2>
        <ClosingBook />
      </section>

      <footer className={`${ui.container} ${styles.footer}`}>
        <div className={styles.cols}>
          <div>
            <p className={styles.wordmark}>
              <Mark size={28} />
              <span>Néroli</span>
            </p>
            <p className={styles.tagline}>A mineral-water spa in Singapore.</p>
          </div>
          <ul className={styles.houses} aria-label="The houses">
            {HOUSES.map((house) => (
              <li key={house.slug}>
                <span className={styles.houseName}>{house.name}</span>
                <a href={house.directionsUrl} target="_blank" rel="noopener noreferrer" className={styles.address}>
                  {street(house.address)}, {house.area}
                  <span className={ui.srOnly}> (directions, opens in a new tab)</span>
                </a>
              </li>
            ))}
          </ul>
          <FooterNav className={styles.links} linkClassName={styles.footLink} />
        </div>
        <div className={styles.base}>
          <p className={styles.legal}>
            © 2026 Néroli House, a demonstration by da Salon. Menus, prices and times are live; the photographs and
            offers are illustrative. Prices in S$, Singapore time.
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
