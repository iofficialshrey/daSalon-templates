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

/** Build a simple ICS calendar event when timezone is known. */
export function buildAppointmentIcs(input: {
  title: string;
  description: string;
  location: string;
  date: string;
  startTime: string;
  durationMinutes: number;
  timezone: string;
  uid: string;
}) {
  const [h, m] = input.startTime.split(":").map(Number);
  const start = new Date(`${input.date}T00:00:00`);
  start.setHours(h || 0, m || 0, 0, 0);
  const end = new Date(start.getTime() + input.durationMinutes * 60_000);

  const stamp = (value: Date) => {
    const y = value.getFullYear();
    const mo = String(value.getMonth() + 1).padStart(2, "0");
    const d = String(value.getDate()).padStart(2, "0");
    const hh = String(value.getHours()).padStart(2, "0");
    const mm = String(value.getMinutes()).padStart(2, "0");
    const ss = String(value.getSeconds()).padStart(2, "0");
    return `${y}${mo}${d}T${hh}${mm}${ss}`;
  };

  const escapeText = (value: string) => value.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//STUDIO 07//daSalon//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${input.uid}`,
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART;TZID=${input.timezone}:${stamp(start)}`,
    `DTEND;TZID=${input.timezone}:${stamp(end)}`,
    `SUMMARY:${escapeText(input.title)}`,
    `DESCRIPTION:${escapeText(input.description)}`,
    `LOCATION:${escapeText(input.location)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}
