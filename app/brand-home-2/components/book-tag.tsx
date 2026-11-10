"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { AtelierSlug } from "../data/ateliers";
import { BookButton } from "./book-button";
import { ArrowRight } from "./icons";
import { isAtelierPath } from "./header-links";
import { surfaceFor, watchElements, watchToneAt } from "./header-observe";
import { useAtelier } from "./provider";
import styles from "./book-tag.module.css";
import ui from "./ui.module.css";

const PHONE = "(max-width: 759px)";

/** Inputs that raise the on-screen keyboard; radios, checkboxes and buttons do not. */
const NON_TEXT_INPUTS = new Set(["button", "checkbox", "color", "file", "hidden", "image", "radio", "range", "reset", "submit"]);

function isTextEntry(target: EventTarget | null) {
  if (target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement) return true;
  if (target instanceof HTMLInputElement) return !NON_TEXT_INPUTS.has(target.type);
  return target instanceof HTMLElement && target.isContentEditable;
}

function subscribePhone(onChange: () => void) {
  const query = window.matchMedia(PHONE);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

const readPhone = () => window.matchMedia(PHONE).matches;

/** html[data-at-film="pinned"] is written by the film controller while its stage is pinned. */
function subscribeFilm(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-at-film"] });
  return () => observer.disconnect();
}

const readFilmPinned = () => document.documentElement.dataset.atFilm === "pinned";

const serverFalse = () => false;

/**
 * The floating Book (phones only): one tap to book wherever the page has no
 * Book of its own in view. Its accessible name says which atelier; it takes
 * the colour of the band under its own centre.
 */
export function BookTag() {
  const { currentAtelier, atelierBySlug, layerOpen, bookingOpen, menuOpen } = useAtelier();
  const pathname = usePathname();
  const atelierPage = isAtelierPath(pathname);
  const isPhone = useSyncExternalStore(subscribePhone, readPhone, serverFalse);
  const filmPinned = useSyncExternalStore(subscribeFilm, readFilmPinned, serverFalse);
  const tagRef = useRef<HTMLDivElement>(null);
  // Hidden on each page until its first report says no Book row is on screen.
  const [cover, setCover] = useState<{ path: string; covered: boolean } | null>(null);
  const [typing, setTyping] = useState(false);
  const [dark, setDark] = useState(true);

  const covered = cover?.path === pathname ? cover.covered : true;
  const shown = isPhone && !covered && !filmPinned && !layerOpen && !bookingOpen && !menuOpen && !typing;

  // Hidden while any [data-tag-hide] element (cover and back-cover CTA rows, an atelier
  // page's primary CTA row, the footer) intersects the viewport.
  useEffect(() => {
    if (!isPhone) return;
    const inView = new Set<Element>();
    let tracked = 0;
    let live = true;
    const report = () => setCover({ path: pathname, covered: inView.size > 0 });
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) inView.add(entry.target);
        else inView.delete(entry.target);
      }
      report();
    });
    const stop = watchElements("[data-tag-hide]", (element) => {
      tracked += 1;
      observer.observe(element);
      return () => {
        tracked -= 1;
        observer.unobserve(element);
        if (inView.delete(element) && live) report();
      };
    });
    // Observed rows report on their own; a page with none would never report, so settle it.
    const frame = window.requestAnimationFrame(() => {
      if (!tracked) report();
    });
    return () => {
      live = false;
      window.cancelAnimationFrame(frame);
      stop();
      observer.disconnect();
    };
  }, [isPhone, pathname]);

  // Tone: the band under the tag's own vertical centre (offsetTop ignores the slide transform).
  useEffect(() => {
    const tag = tagRef.current;
    if (!isPhone || !tag) return;
    return watchToneAt(
      () => tag.offsetTop + tag.offsetHeight / 2,
      (tone) => setDark(surfaceFor(tone) !== "light"),
    );
  }, [isPhone, pathname]);

  // Hidden while a text field has focus, so it never rides on the on-screen keyboard.
  useEffect(() => {
    const onFocusIn = (event: FocusEvent) => setTyping(isTextEntry(event.target));
    const onFocusOut = (event: FocusEvent) => setTyping(isTextEntry(event.relatedTarget));
    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("focusout", onFocusOut);
    return () => {
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("focusout", onFocusOut);
    };
  }, []);

  // On an atelier page the tag always books that atelier, whatever was chosen elsewhere.
  const pageAtelier = atelierPage ? atelierBySlug(pathname.split("/").pop() as AtelierSlug) : undefined;
  const atelier = pageAtelier ?? atelierBySlug(currentAtelier);
  const label = pageAtelier ? "Book here" : "Book";
  // The accessible name starts with the visible label (WCAG 2.5.3).
  const context = atelier ? `, ${atelier.name}` : " an appointment";

  return (
    <div
      ref={tagRef}
      className={styles.tag}
      data-state={shown ? "shown" : "hidden"}
      data-shade={dark ? "dark" : "light"}
      inert={!shown}
    >
      <BookButton className={styles.button} slug={pageAtelier?.slug}>
        {label}
        <ArrowRight size={16} />
        <span className={ui.srOnly}>{context}</span>
      </BookButton>
    </div>
  );
}
