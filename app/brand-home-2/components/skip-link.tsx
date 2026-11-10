"use client";

import { usePathname } from "next/navigation";
import styles from "../layout.module.css";

/** The first focusable element on every Atelier page. */
export function SkipLink() {
  const pathname = usePathname();
  const atelierPage = pathname?.startsWith("/brand-home-2/ateliers/");
  return (
    <a className={styles.skip} href={atelierPage ? "#collection" : "#ateliers"}>
      {atelierPage ? "Skip to the collection" : "Skip to the ateliers"}
    </a>
  );
}
