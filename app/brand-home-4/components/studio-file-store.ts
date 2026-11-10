import { useSyncExternalStore } from "react";
import type { StudioSlug } from "../data/studios";

/*
 * Which studio file (the gatefold under a 07 row) is open. One at a time, in
 * memory only, never in the URL. Shared by the row toggles, the files, the
 * menu's "About this studio" links and #studio-{slug} deep links.
 */

export type StudioFiles = {
  open: StudioSlug | null;
  /** The file the guest just closed: it folds shut, then takes the hidden attribute. */
  closing: StudioSlug | null;
  /** A request to scroll the open file's row under the header and focus its name. */
  jump: { slug: StudioSlug; seq: number } | null;
};

const FOLD_MS = 360;
const INITIAL: StudioFiles = { open: null, closing: null, jump: null };
let state = INITIAL;
let seq = 0;
let foldTimer = 0;
const listeners = new Set<() => void>();

function emit(next: StudioFiles) {
  state = next;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function settle() {
  window.clearTimeout(foldTimer);
  foldTimer = 0;
}

export function useStudioFiles(): StudioFiles {
  return useSyncExternalStore(subscribe, () => state, () => INITIAL);
}

/** Open a file. Any other open or folding file closes at once, so the rows above do not drift. */
export function openStudioFile(slug: StudioSlug, options: { jump?: boolean } = {}) {
  settle();
  seq += 1;
  emit({ open: slug, closing: null, jump: options.jump ? { slug, seq } : state.jump });
}

export function closeStudioFile(slug: StudioSlug) {
  if (state.open !== slug) return;
  settle();
  const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  emit({ open: null, closing: still ? null : slug, jump: state.jump });
  if (still) return;
  foldTimer = window.setTimeout(() => {
    foldTimer = 0;
    if (state.closing === slug) emit({ ...state, closing: null });
  }, FOLD_MS);
}

export function toggleStudioFile(slug: StudioSlug) {
  if (state.open === slug) closeStudioFile(slug);
  else openStudioFile(slug);
}
