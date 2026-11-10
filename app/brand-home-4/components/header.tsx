import { ISSUE } from "../data/chapters";
import { HeaderActions, HeaderNav, ReadingProgress } from "./header-actions";
import styles from "./header.module.css";

/**
 * The masthead (server shell). The wordmark, rule and issue line are static;
 * the nav, Contents, Book and the progress fallback are small client islands.
 */
export function Header() {
  return (
    <header className={styles.header} data-tone="porcelain">
      <div className={styles.bar}>
        <div className={styles.brand}>
          <a href="#cover" data-jump="" className={styles.mark} aria-label="Paloma, back to the cover">
            Paloma
          </a>
          <span className={styles.rule} aria-hidden="true" />
          <p className={styles.issue}>{ISSUE.label}</p>
        </div>
        <HeaderNav />
        <HeaderActions />
      </div>
      <ReadingProgress />
    </header>
  );
}
