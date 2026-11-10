export type StudioBookingDraft = {
  serviceId: string | null;
  venueId: string | null;
  date: string | null;
  time: string | null;
  firstName: string;
  phone: string;
  email: string;
  note: string;
  step: 1 | 2 | 3;
  updatedAt: number;
};

export const emptyBookingDraft = (): StudioBookingDraft => ({
  serviceId: null,
  venueId: null,
  date: null,
  time: null,
  firstName: "",
  phone: "",
  email: "",
  note: "",
  step: 1,
  updatedAt: Date.now(),
});

export function readBookingDraft(storageKey: string): StudioBookingDraft | null {
  try {
    const raw = sessionStorage.getItem(storageKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StudioBookingDraft;
    if (!parsed || typeof parsed !== "object") return null;
    return {
      ...emptyBookingDraft(),
      ...parsed,
      updatedAt: typeof parsed.updatedAt === "number" ? parsed.updatedAt : Date.now(),
    };
  } catch {
    return null;
  }
}

export function writeBookingDraft(storageKey: string, draft: StudioBookingDraft) {
  try {
    sessionStorage.setItem(storageKey, JSON.stringify({ ...draft, updatedAt: Date.now() }));
  } catch {
    /* fail open */
  }
}

export function clearBookingDraft(storageKey: string) {
  try {
    sessionStorage.removeItem(storageKey);
  } catch {
    /* fail open */
  }
}
