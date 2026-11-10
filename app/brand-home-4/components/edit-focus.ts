/* Shared by the edit and the studio files: where the menu's studio switch lives and how to reach it. */

export const EDIT_STUDIOS_ID = "edit-studios";

/** Focus the checked studio tile in the menu switch (or the first one that can be chosen). */
export function focusCheckedStudio(options?: FocusOptions) {
  const field = document.getElementById(EDIT_STUDIOS_ID);
  const radio = field?.querySelector<HTMLInputElement>("input:checked")
    ?? field?.querySelector<HTMLInputElement>("input:not(:disabled)");
  radio?.focus(options);
}

/** Scroll the switch under the masthead at once (it clears the running head) and focus the checked tile. */
export function jumpToStudioSwitch() {
  const field = document.getElementById(EDIT_STUDIOS_ID);
  if (!field) return;
  const margin = parseFloat(getComputedStyle(field).scrollMarginTop) || 0;
  const top = field.getBoundingClientRect().top + window.scrollY - margin;
  window.scrollTo({ top: Math.max(0, top), behavior: "instant" });
  focusCheckedStudio({ preventScroll: true });
}
