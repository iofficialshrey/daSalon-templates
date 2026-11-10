/** "Bride & Groom" → "bride-groom"; matches API venue names to static venue data. */
export function venueSlug(name: string) {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** "singapore" → "Singapore" (the API stores some cities in lower case). */
export function titleCase(value: string) {
  return value.replace(/\b\p{L}/gu, (letter) => letter.toUpperCase());
}

/** Category name → anchor-safe slug. */
export function categorySlug(value: string) {
  return venueSlug(value) || "other";
}
