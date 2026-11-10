/*
 * DOM watchers shared by the header and the floating Book tag. Both read the
 * band under a 1px line (the header at its own vertical centre, the tag at
 * its own), so the page needs exactly one convention: every band root carries
 * data-tone. No scroll listeners; IntersectionObservers only.
 */

export type Tone = "cover" | "noir" | "bordeaux" | "paper" | "chalk" | "blush" | "nude";
export type Surface = "cover" | "dark" | "light";

const TONES: ReadonlySet<string> = new Set(["cover", "noir", "bordeaux", "paper", "chalk", "blush", "nude"]);

/** Band roots: sections inside <main> and the footer. Overlays never count. */
export const TONE_ROOTS = "#main [data-tone], #footer[data-tone]";

export function surfaceFor(tone: Tone): Surface {
  if (tone === "cover") return "cover";
  return tone === "noir" || tone === "bordeaux" ? "dark" : "light";
}

/**
 * The element latest in document order. For nested bands that is the
 * innermost one; for two neighbours touching the line it is the lower one.
 */
export function lastInOrder<T extends Element>(elements: Iterable<T>): T | null {
  let pick: T | null = null;
  for (const element of elements) {
    if (!pick || pick.compareDocumentPosition(element) & Node.DOCUMENT_POSITION_FOLLOWING) pick = element;
  }
  return pick;
}

/**
 * Calls attach for every element matching the selector, now and whenever one
 * appears later (route changes, the film swapping to static mode), and runs
 * its detach when it leaves the document. Text-only mutations (the film's
 * timecode) are ignored cheaply.
 */
export function watchElements(selector: string, attach: (element: HTMLElement) => () => void) {
  const attached = new Map<HTMLElement, () => void>();

  const sync = () => {
    const found = new Set(document.querySelectorAll<HTMLElement>(selector));
    attached.forEach((detach, element) => {
      if (found.has(element)) return;
      detach();
      attached.delete(element);
    });
    found.forEach((element) => {
      if (!attached.has(element)) attached.set(element, attach(element));
    });
  };

  let frame = 0;
  const schedule = () => {
    if (frame) return;
    frame = window.requestAnimationFrame(() => {
      frame = 0;
      sync();
    });
  };

  const mutations = new MutationObserver((records) => {
    for (const record of records) {
      for (const node of record.addedNodes) {
        if (node.nodeType === Node.ELEMENT_NODE) return schedule();
      }
      for (const node of record.removedNodes) {
        if (node.nodeType === Node.ELEMENT_NODE) return schedule();
      }
    }
  });

  sync();
  mutations.observe(document.body, { childList: true, subtree: true });

  return () => {
    window.cancelAnimationFrame(frame);
    mutations.disconnect();
    attached.forEach((detach) => detach());
    attached.clear();
  };
}

/**
 * Reports the tone of the band under a horizontal 1px line at lineY() px from
 * the top of the viewport. The observer is rebuilt when the line or the
 * viewport height changes (resize, toolbars), never on scroll.
 */
export function watchToneAt(lineY: () => number, onTone: (tone: Tone) => void) {
  const tracked = new Set<HTMLElement>();
  const onLine = new Set<HTMLElement>();
  let observer: IntersectionObserver | null = null;
  let line = Number.NaN;
  let height = Number.NaN;

  const report = () => {
    const tone = lastInOrder(onLine)?.dataset.tone;
    if (tone && TONES.has(tone)) onTone(tone as Tone);
  };

  const build = () => {
    const nextLine = Math.max(0, Math.round(lineY()));
    const nextHeight = window.innerHeight;
    if (observer && nextLine === line && nextHeight === height) return;
    line = nextLine;
    height = nextHeight;
    observer?.disconnect();
    onLine.clear();
    observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const element = entry.target as HTMLElement;
          if (entry.isIntersecting) onLine.add(element);
          else onLine.delete(element);
        }
        report();
      },
      { rootMargin: `-${line}px 0px -${Math.max(0, height - line - 1)}px 0px` },
    );
    tracked.forEach((element) => observer?.observe(element));
  };

  build();

  const stop = watchElements(TONE_ROOTS, (element) => {
    tracked.add(element);
    observer?.observe(element);
    return () => {
      tracked.delete(element);
      onLine.delete(element);
      observer?.unobserve(element);
    };
  });

  // The observer reports a frame or two later; read the bands' boxes now so a reload or a
  // route change never shows the wrong surface first.
  const y = Math.max(0, Math.round(lineY()));
  const under = Array.from(tracked).filter((element) => {
    const rect = element.getBoundingClientRect();
    return rect.top <= y && rect.bottom > y;
  });
  const seeded = lastInOrder(under)?.dataset.tone;
  if (seeded && TONES.has(seeded)) onTone(seeded as Tone);

  let frame = 0;
  const onResize = () => {
    if (frame) return;
    frame = window.requestAnimationFrame(() => {
      frame = 0;
      build();
    });
  };
  window.addEventListener("resize", onResize);

  return () => {
    window.removeEventListener("resize", onResize);
    window.cancelAnimationFrame(frame);
    stop();
    observer?.disconnect();
    observer = null;
  };
}
