"use client";

import { useReducedMotion } from "@/lib/page/lite";
import { Pause, Play } from "./icons";
import { usePaloma } from "./provider";
import ui from "./ui.module.css";

type MotionToggleProps = {
  className?: string;
  /** Show "Pause motion" as visible text (otherwise it is screen-reader only). */
  showLabel?: boolean;
  labelClassName?: string;
};

/** One global Pause for the cover film and every marquee (WCAG 2.2.2). */
export function MotionToggle({ className, showLabel = false, labelClassName }: MotionToggleProps) {
  const { motion, toggleMotion } = usePaloma();
  // Under reduced motion the film never plays and the marquees stand still: nothing to pause.
  const reduced = useReducedMotion();
  if (reduced) return null;
  const label = motion === "on" ? "Pause motion" : "Play motion";
  return (
    <button type="button" className={className} onClick={toggleMotion} data-motion-toggle="">
      {motion === "on" ? <Pause /> : <Play />}
      <span className={showLabel ? labelClassName : ui.srOnly}>{label}</span>
    </button>
  );
}
