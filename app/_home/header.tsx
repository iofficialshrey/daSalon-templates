"use client";

import { ArrowDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { DASALON_LOGO } from "../brand-logos";
import styles from "./home.module.css";

/** Transparent over the hero, frosted once the page has scrolled (a sentinel at the very top decides). */
export function HomeHeader() {
  const sentinel = useRef<HTMLSpanElement>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const node = sentinel.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => setScrolled(!entry.isIntersecting));
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <span ref={sentinel} className={styles.sentinel} aria-hidden="true" />
      <header className={styles.header} data-scrolled={scrolled ? "true" : "false"}>
        <div className={styles.headerInner}>
          <a className={styles.lockup} href="#top" aria-label="da Salon Brand Home">
            <DASALON_LOGO aria-hidden="true" focusable="false" />
            <span className={styles.lockupDivider} aria-hidden="true" />
            <span className={styles.lockupProduct}>Brand Home</span>
          </a>
          <nav className={styles.nav} aria-label="Primary">
            <a className={styles.navLink} href="#included">
              What&apos;s included
            </a>
            <a className={`${styles.button} ${styles.buttonDark} ${styles.buttonSmall} ${styles.navCta}`} href="#collection">
              <span className={styles.ctaLabel}>
                Browse<span className={styles.ctaLong}> collection</span>
              </span>
              <span className={`${styles.buttonIcon} ${styles.iconDown}`} aria-hidden="true">
                <ArrowDown />
              </span>
            </a>
          </nav>
        </div>
      </header>
    </>
  );
}
