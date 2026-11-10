"use client";

import { Pause, Play } from "lucide-react";
import { useState } from "react";
import styles from "./home.module.css";

/** Pauses and resumes the hero's storefront cycle (WCAG 2.2.2); hidden when motion is reduced. */
export function StageControl() {
  const [paused, setPaused] = useState(false);

  return (
    <button
      type="button"
      className={styles.stageControl}
      onClick={(event) => {
        const next = !paused;
        setPaused(next);
        const stage = event.currentTarget.closest<HTMLElement>("[data-stage]");
        if (stage) stage.dataset.paused = String(next);
      }}
    >
      {paused ? <Play aria-hidden="true" /> : <Pause aria-hidden="true" />}
      <span className={styles.srOnly}>{paused ? "Play the storefront previews" : "Pause the storefront previews"}</span>
    </button>
  );
}
