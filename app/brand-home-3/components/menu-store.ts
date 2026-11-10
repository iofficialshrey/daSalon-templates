"use client";

import { useSyncExternalStore } from "react";
import type { PlaceSlug } from "../data/places";
import type { RitualId } from "../data/rituals";

/*
 * Which ritual row is open and whether "05 · The whole menu" is open, and at
 * which place. A tiny external store, so the journey and the place cards can
 * open them from elsewhere. Nothing here scrolls: callers jumpTo() afterwards.
 */

export type MenuState = { ritual: RitualId; menuOpen: boolean; menuPlace: PlaceSlug | null };

const SERVER_STATE: MenuState = { ritual: "ground", menuOpen: false, menuPlace: null };

let state: MenuState = SERVER_STATE;
const listeners = new Set<() => void>();

function publish(next: Partial<MenuState>) {
  const merged = { ...state, ...next };
  if (merged.ritual === state.ritual && merged.menuOpen === state.menuOpen && merged.menuPlace === state.menuPlace) return;
  state = merged;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useMenuState(): MenuState {
  return useSyncExternalStore(subscribe, () => state, () => SERVER_STATE);
}

/** Opens that accordion row (does not scroll). */
export function showRitual(id: RitualId): void {
  publish({ ritual: id });
}

/** Opens "05 · The whole menu", at `slug` when given (does not scroll). */
export function showMenu(slug?: PlaceSlug): void {
  publish(slug ? { menuOpen: true, menuPlace: slug } : { menuOpen: true });
}

export function setMenuOpen(open: boolean): void {
  publish({ menuOpen: open });
}

export function setMenuPlace(slug: PlaceSlug): void {
  publish({ menuPlace: slug });
}
