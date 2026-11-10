import styles from "./skip-links.module.css";

/** First in the DOM: off-screen until focused. */
export function SkipLinks() {
  return (
    <div className={styles.links}>
      <a className={styles.link} href="#main" data-jump="">
        Skip to content
      </a>
      <a className={styles.link} href="#edit" data-jump="">
        Skip to the live menu
      </a>
    </div>
  );
}
