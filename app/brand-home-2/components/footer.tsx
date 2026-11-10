import { ATELIERS, atelierHref } from "../data/ateliers";
import { BackToTop, FooterNav } from "./footer-actions";
import { IntentLink } from "./header-links";
import { ArrowUpRight } from "./icons";
import styles from "./footer.module.css";
import ui from "./ui.module.css";

/** "463 Clementi Road, Singapore 599494" → "463 Clementi Road". */
function street(address: string) {
  return address.split(",")[0]?.trim() ?? address;
}

/**
 * The close of every page: the wordmark and the four ateliers, the page
 * links, Powered by da Salon and Back to top, then one line of small print.
 * Shared by the home page and the atelier pages.
 */
export function Footer() {
  return (
    <footer id="footer" data-tone="noir" data-tag-hide="" className={`${ui.noir} ${styles.footer}`}>
      <div className={`${ui.wide} ${styles.inner}`}>
        <div className={styles.brand}>
          <p className={styles.mark}>Atelier</p>
          <p className={styles.tagline}>A private beauty house in Singapore.</p>
        </div>

        <ul className={styles.houses} aria-label="The ateliers">
          {ATELIERS.map((atelier) => (
            <li key={atelier.slug}>
              <IntentLink href={atelierHref(atelier.slug)} className={styles.house}>
                {atelier.name}
              </IntentLink>
              <span className={styles.street}>
                {atelier.area}, {street(atelier.address)}
              </span>
            </li>
          ))}
        </ul>

        <div className={styles.side}>
          <FooterNav titleClassName={styles.navTitle} listClassName={styles.links} linkClassName={styles.link} />
        </div>
      </div>

      <div className={`${ui.wide} ${styles.base}`}>
        <p className={styles.legal}>
          © 2026 Atelier, a demonstration by da Salon. Menus, prices and times are live; the film, photographs and
          offers are illustrative. Prices in S$, Singapore time.
        </p>
        <div className={styles.end}>
          <a href="https://www.dasalon.com" target="_blank" rel="noopener noreferrer" className={styles.powered}>
            Powered by da Salon
            <ArrowUpRight size={14} />
            <span className={ui.srOnly}> (opens in a new tab)</span>
          </a>
          <BackToTop className={`${ui.btn} ${ui.textBtn} ${styles.top}`} labelClassName={ui.underline} />
        </div>
      </div>
    </footer>
  );
}
