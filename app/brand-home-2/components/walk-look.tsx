"use client";

import type { MouseEvent, ReactNode } from "react";
import { jumpTo } from "@/lib/page/jump";
import { WALK_COPY, type Beat } from "../data/walk";
import { BookButton } from "./book-button";
import { ArrowRight } from "./icons";
import ui from "./ui.module.css";
import styles from "./walk.module.css";

/** One line of the film: a serif headline and a sentence beneath it. */
export function Caption({
  beat,
  heading: Heading = "h3",
  large = false,
  className,
  children,
}: {
  beat: Beat;
  heading?: "h2" | "h3";
  large?: boolean;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div className={className ? `${styles.text} ${className}` : styles.text}>
      <Heading className={large ? `${styles.title} ${styles.titleLarge}` : styles.title}>{beat.title}</Heading>
      <p className={styles.body}>{beat.body}</p>
      {children}
    </div>
  );
}

/** The film's last beat: book, or walk on to the four ateliers. */
export function FinalActions({ block = false }: { block?: boolean }) {
  const toAteliers = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    jumpTo("ateliers");
  };

  return (
    <div className={styles.actions}>
      <BookButton className={`${ui.btn} ${ui.lg} ${ui.primary} ${styles.cta}${block ? ` ${ui.block}` : ""}`}>
        Book an appointment
        <ArrowRight />
      </BookButton>
      <a href="#ateliers" className={`${ui.btn} ${ui.textBtn} ${styles.onward}`} onClick={toAteliers}>
        <span className={ui.underline}>{WALK_COPY.ateliersLink}</span>
        <ArrowRight />
      </a>
    </div>
  );
}
