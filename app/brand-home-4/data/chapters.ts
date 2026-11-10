/*
 * Issue 04's contents. One list drives the header nav, the issue rail, the
 * Contents sheet, the cover lines and every chapter's running foot.
 */

export type ChapterId =
  | "cover"
  | "point-of-view"
  | "edit"
  | "circle"
  | "sets"
  | "gifts"
  | "method"
  | "studios"
  | "note"
  | "back-cover";

export type Chapter = {
  id: ChapterId;
  /** "02" */
  no: string;
  label: string;
  dek: string;
};

export const CHAPTERS: readonly Chapter[] = [
  { id: "cover", no: "00", label: "Cover", dek: "Form follows feeling." },
  { id: "point-of-view", no: "01", label: "Point of view", dek: "Not a makeover. A clearer version." },
  { id: "edit", no: "02", label: "The edit", dek: "Live menus from four studios, in S$." },
  { id: "circle", no: "03", label: "The Circle", dek: "Memberships: wallet credit or a standing discount." },
  { id: "sets", no: "04", label: "Seasonal sets", dek: "Three sets, priced from the live menus." },
  { id: "gifts", no: "05", label: "The gift issue", dek: "Gift cards from S$80, for any studio." },
  { id: "method", no: "06", label: "Method", dek: "Look. Listen. Then edit." },
  { id: "studios", no: "07", label: "Studios", dek: "Clementi, Changi, Sentosa." },
  { id: "note", no: "08", label: "Editor's note", dek: "Considered, not corrected." },
  { id: "back-cover", no: "09", label: "Back cover", dek: "Ready for your next shape?" },
];

export const CHAPTER_BY_ID = new Map(CHAPTERS.map((chapter) => [chapter.id, chapter]));

export function chapterById(id: ChapterId): Chapter {
  return CHAPTER_BY_ID.get(id) as Chapter;
}

/** The chapter after this one, for running feet. */
export function nextChapter(id: ChapterId): Chapter | undefined {
  const index = CHAPTERS.findIndex((chapter) => chapter.id === id);
  return CHAPTERS[index + 1];
}

/** Desktop header nav (a subset of the contents). */
export const NAV: ReadonlyArray<{ id: ChapterId; label: string }> = [
  { id: "edit", label: "The edit" },
  { id: "circle", label: "Circle" },
  { id: "sets", label: "Sets" },
  { id: "gifts", label: "Gifts" },
  { id: "studios", label: "Studios" },
];

export const ISSUE = { number: "04", label: "Issue 04", edition: "Singapore edition" } as const;

/** Marquee copy: each band repeats its phrases until one half is at least 2,000px wide. */
export const BANDS = {
  ticker: {
    phrases: ["Hair is material", "Style is personal", "Change is welcome", "Care is a craft"],
    repeat: 3,
    sr: "Paloma principles: hair is material, style is personal, change is welcome, care is a craft.",
  },
  interludeOne: {
    phrases: ["Shape with intention", "Colour with memory", "Style that moves"],
    repeat: 2,
    sr: "Shape with intention, colour with memory, style that moves.",
  },
  interludeTwo: {
    phrases: ["Look", "Listen", "Then edit"],
    /** Indexes shown in wash on the cobalt band. */
    accent: [1, 2],
    repeat: 4,
    sr: "Look, listen, then edit.",
  },
} as const;
