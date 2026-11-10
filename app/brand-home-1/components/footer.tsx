import { HOUSES } from "../data/houses";
import { BookButton, HouseButton, JumpLink, TopButton } from "./actions";
import styles from "./footer.module.css";
import { ArrowUp, ArrowUpRight } from "./icons";
import { InertScope } from "./provider";
import ui from "./ui.module.css";

const LINKS = [
  { to: "menu", label: "Services" },
  { to: "memberships", label: "Membership" },
  { to: "packages", label: "Packages" },
  { to: "gift-cards", label: "Gift cards" },
  { to: "visit", label: "Before you visit" },
] as const;

/**
 * The walnut footer: wordmark, the four houses with Book and Directions, quick
 * links, the demo disclosure and Back to top. Server-rendered apart from the
 * small action islands; it becomes inert while a layer or booking is open.
 */
export function Footer() {
  return (
    <InertScope as="footer" id="footer" className={`${styles.footer} ${ui.onDark}`}>
      <div className={ui.containerWide}>
        <div className={styles.brand}>
          <p className={styles.wordmark}>Maison Élan</p>
          <p className={styles.descriptor}>Four houses of care · Singapore</p>
        </div>

        <div className={styles.grid}>
          <ul className={styles.houses} aria-label="Our houses">
            {HOUSES.map((house) => (
              <li key={house.slug} className={styles.house}>
                <HouseButton house={house.slug} className={styles.houseName} aria-label={`${house.name}, view the house`}>
                  {house.name}
                </HouseButton>
                <p className={`${ui.label} ${ui.labelOnDark}`}>{house.specialty}</p>
                <p className={`${styles.line} ${styles.address}`}>{house.address}</p>
                <p className={`${styles.line} ${ui.num}`}>{house.hoursLabel}</p>
                <div className={styles.links}>
                  <BookButton house={house.slug} className={`${ui.btn} ${ui.textBtn}`} aria-label={`Book at ${house.name}`}>
                    <span className={ui.underline}>Book</span>
                  </BookButton>
                  <a
                    className={`${ui.btn} ${ui.textBtn}`}
                    href={house.directionsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span className={ui.underline}>Directions</span>
                    <ArrowUpRight />
                    <span className={ui.srOnly}> to {house.name} (opens Google Maps)</span>
                  </a>
                </div>
              </li>
            ))}
          </ul>

          <nav className={styles.nav} aria-label="Footer">
            <ul className={styles.navList}>
              {LINKS.map((link) => (
                <li key={link.to}>
                  <JumpLink to={link.to} className={styles.navLink}>
                    {link.label}
                  </JumpLink>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className={styles.bottom}>
          <p className={`${styles.legal} ${ui.num}`}>
            © 2026 Maison Élan, a demonstration brand by da Salon. Photographs are illustrative; offers on this page are
            demonstrations. Prices in S$ · Singapore time (SGT).
          </p>
          <div className={styles.meta}>
            <a className={styles.powered} href="https://www.dasalon.com" target="_blank" rel="noopener noreferrer">
              Powered by da Salon
              <ArrowUpRight size={14} />
              <span className={ui.srOnly}> (opens in a new tab)</span>
            </a>
            <TopButton className={`${ui.btn} ${ui.textBtn} ${styles.top}`}>
              <span className={ui.underline}>Back to top</span>
              <ArrowUp />
            </TopButton>
          </div>
        </div>
      </div>
    </InertScope>
  );
}
