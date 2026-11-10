import { NAV } from "../data/nav";
import { HeaderActions, HeaderBar } from "./header-actions";
import styles from "./header.module.css";
import ui from "./ui.module.css";

/**
 * The fixed header (spec §4.0), a server shell around two client islands:
 * HeaderBar owns the film/solid state (the #film-end observer) and
 * HeaderActions holds Book and the menu button. The mark and the Primary nav
 * are static links that the provider's delegated handler turns into jumps.
 */
export function Header() {
  return (
    <HeaderBar>
      <a href="#top" data-jump="" className={styles.mark} aria-label="Serein House, back to the top">
        <span className={styles.symbol} aria-hidden="true">
          S
        </span>
        <span className={`${ui.serif} ${styles.wordmark}`} aria-hidden="true">
          Serein <em>House</em>
        </span>
      </a>

      <nav aria-label="Primary" className={styles.nav}>
        <ul className={styles.navList}>
          {NAV.map(([id, label]) => (
            <li key={id}>
              <a href={`#${id}`} data-jump="" className={`${ui.nav} ${styles.navLink}`}>
                {label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <HeaderActions />
    </HeaderBar>
  );
}
