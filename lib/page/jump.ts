/*
 * In-page navigation for Brand Homes with a scroll-scrubbed film. Long jumps, and
 * any jump that would cross an element marked [data-scrub-film], are instant so a
 * film never scrubs at high speed; short hops glide. The target section's heading
 * then takes focus for keyboard and screen-reader users.
 */

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function crossesFilm(from: number, to: number) {
  const low = Math.min(from, to);
  const high = Math.max(from, to);
  return Array.from(document.querySelectorAll<HTMLElement>("[data-scrub-film]")).some((film) => {
    const top = film.getBoundingClientRect().top + window.scrollY;
    return low < top + film.offsetHeight && high > top;
  });
}

/**
 * Fired on the target, bubbling, just before a jump measures it. A page can listen to reveal
 * the target first (for example, select the tab that holds it) or to settle a smooth scroller.
 */
export const JUMP_EVENT = "brandhome:jump";

export function jumpTo(id: string, options: { focus?: boolean } = {}) {
  const target = document.getElementById(id);
  if (!target) return;
  target.dispatchEvent(new CustomEvent(JUMP_EVENT, { bubbles: true, detail: { id } }));

  const margin = parseFloat(getComputedStyle(target).scrollMarginTop) || 0;
  const top = Math.max(0, target.getBoundingClientRect().top + window.scrollY - margin);
  const from = window.scrollY;
  const far = Math.abs(top - from) > window.innerHeight * 1.5;

  window.scrollTo({ top, behavior: far || crossesFilm(from, top) || prefersReducedMotion() ? "instant" : "smooth" });

  if (options.focus !== false) {
    const heading = target.querySelector<HTMLElement>("[data-jump-focus]") ?? target.querySelector<HTMLElement>("h2");
    if (heading) {
      if (!heading.hasAttribute("tabindex")) heading.setAttribute("tabindex", "-1");
      heading.focus({ preventScroll: true });
    }
  }
}

export function scrollToTop() {
  window.scrollTo({ top: 0, behavior: "instant" });
}
