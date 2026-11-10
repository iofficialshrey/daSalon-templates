import assert from "node:assert/strict";
import test from "node:test";
import {
  addMinutes,
  dayPeriod,
  formatDate,
  formatDuration,
  formatPrice,
  formatTime,
  isValidNationalNumber,
  PHONE_COUNTRIES,
  relativeDay,
  singaporeToday,
  splitPhone,
} from "../lib/dasalon/locale.ts";

test("prices are shown in Singapore dollars, with cents only when needed", () => {
  assert.equal(formatPrice(45), "S$45");
  assert.equal(formatPrice(1250), "S$1,250");
  assert.equal(formatPrice(49.05), "S$49.05");
});

test("calendar dates never shift with the visitor's time zone", () => {
  assert.equal(formatDate("2026-10-12"), "Mon, 12 Oct");
  assert.equal(formatTime("13:00"), "1:00 pm");
  assert.equal(formatTime("09:15"), "9:15 am");
});

test("today is computed in Singapore time", () => {
  // 17:30 UTC on 11 Oct is already 01:30 on 12 Oct in Singapore.
  const lateUtc = new Date(Date.UTC(2026, 9, 11, 17, 30));
  assert.equal(singaporeToday(lateUtc), "2026-10-12");
  assert.equal(relativeDay("2026-10-12", lateUtc), "Today");
  assert.equal(relativeDay("2026-10-13", lateUtc), "Tomorrow");
  assert.equal(relativeDay("2026-10-14", lateUtc), null);
});

test("time slots fall into readable parts of the day", () => {
  assert.equal(dayPeriod("00:30"), "early");
  assert.equal(dayPeriod("09:00"), "morning");
  assert.equal(dayPeriod("12:00"), "afternoon");
  assert.equal(dayPeriod("17:45"), "evening");
  assert.equal(dayPeriod("23:30"), "evening");
});

test("appointment end times and durations read naturally", () => {
  assert.equal(addMinutes("13:00", 45), "13:45");
  assert.equal(addMinutes("23:30", 60), "00:30");
  assert.equal(formatDuration(45), "45 min");
  assert.equal(formatDuration(60), "1 hr");
  assert.equal(formatDuration(90), "1 hr 30 min");
});

test("Singapore mobile numbers are validated", () => {
  assert.deepEqual(PHONE_COUNTRIES.map((item) => item.code), ["+65"]);
  assert.equal(isValidNationalNumber("+65", "9123 4567"), true);
  assert.equal(isValidNationalNumber("+65", "8123 4567"), true);
  assert.equal(isValidNationalNumber("+65", "1234567"), false);
  assert.equal(isValidNationalNumber("+65", "1123 4567"), false);
  assert.deepEqual(splitPhone("+6591234567"), { code: "+65", national: "91234567" });
  assert.deepEqual(splitPhone("91234567"), { code: "+65", national: "91234567" });
});
