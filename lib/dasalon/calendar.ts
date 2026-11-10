/** Venue time zone when da Salon does not supply one (matches `SINGAPORE.timeZone`). */
const DEFAULT_TIME_ZONE = "Asia/Singapore";

function zoneOffsetMinutes(timeZone: string, instant: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(instant);
  const part = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((item) => item.type === type)?.value ?? 0);
  const asUtc = Date.UTC(part("year"), part("month") - 1, part("day"), part("hour"), part("minute"), part("second"));
  return (asUtc - instant.getTime()) / 60_000;
}

/** Converts a venue-local date and `HH:mm` time into an absolute instant. */
export function venueInstant(date: string, time: string, timeZone: string = DEFAULT_TIME_ZONE) {
  const [year, month, day] = date.split("-").map(Number);
  const [hours, minutes] = time.split(":").map(Number);
  const guess = Date.UTC(year, month - 1, day, hours || 0, minutes || 0);
  return new Date(guess - zoneOffsetMinutes(timeZone, new Date(guess)) * 60_000);
}

function utcStamp(value: Date) {
  return value.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function escapeText(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

/** A standards-compliant single-event calendar file, written in UTC so every calendar app agrees. */
export function buildAppointmentIcs(input: {
  title: string;
  description: string;
  location: string;
  date: string;
  startTime: string;
  durationMinutes: number;
  timezone?: string | null;
  uid: string;
}) {
  const start = venueInstant(input.date, input.startTime, input.timezone || DEFAULT_TIME_ZONE);
  const end = new Date(start.getTime() + input.durationMinutes * 60_000);

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//da Salon//Brand Home//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${input.uid}`,
    `DTSTAMP:${utcStamp(new Date())}`,
    `DTSTART:${utcStamp(start)}`,
    `DTEND:${utcStamp(end)}`,
    `SUMMARY:${escapeText(input.title)}`,
    `DESCRIPTION:${escapeText(input.description)}`,
    `LOCATION:${escapeText(input.location)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

export function downloadIcs(fileName: string, ics: string) {
  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
}
