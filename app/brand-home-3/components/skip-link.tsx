import layout from "../layout.module.css";
import { BookButton } from "./book-button";

/**
 * The skip links, first in the DOM (spec §4.0): paper-soft pills fixed at the
 * top left, off-screen until focused. The first jumps past the film to the
 * intro heading; the second opens booking at the current place and gets focus
 * back when the booking window closes.
 */
export function SkipLink() {
  return (
    <>
      <a className={layout.skip} href="#serein" data-jump="">
        Skip the entrance
      </a>
      <BookButton autoPlaceSuffix className={layout.skip}>
        Skip to booking
      </BookButton>
    </>
  );
}
