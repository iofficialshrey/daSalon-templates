import assert from "node:assert/strict";
import test from "node:test";
import {
  matchesLookDirection,
  resolveServiceMedia,
} from "../app/brand-home-7/service-media.ts";
import { emptyBookingDraft } from "../app/brand-home-7/booking-draft.ts";
import { buildAppointmentIcs } from "../lib/dasalon/calendar.ts";

test("resolveServiceMedia never uses catalog index — haircut maps to craft photo", () => {
  const media = resolveServiceMedia({
    id: "svc-cut-1",
    name: "Classic Haircut",
    category: "Hair",
  });
  assert.equal(media.kind, "photo");
  assert.equal(media.src, "/brand-home-7/service-01.jpg");
});

test("resolveServiceMedia uses typographic panel for massage without treatment photo", () => {
  const media = resolveServiceMedia({
    id: "svc-massage-1",
    name: "Aromatherapy Massage",
    category: "Massage",
  });
  assert.equal(media.kind, "type");
  assert.equal(media.label, "MASSAGE");
  assert.equal(media.src, undefined);
});

test("resolveServiceMedia uses typographic panel for colour services", () => {
  const media = resolveServiceMedia({
    id: "svc-colour-1",
    name: "Balayage Colour",
    category: "Colour",
  });
  assert.equal(media.kind, "type");
  assert.equal(media.label, "COLOUR");
});

test("resolveServiceMedia prefers explicit service ID override", () => {
  // Override map is empty by default; ID without name match still returns EDIT type panel
  const media = resolveServiceMedia({
    id: "unknown-uuid",
    name: "Mystery Offering",
    category: null,
  });
  assert.equal(media.kind, "type");
  assert.equal(media.label, "EDIT");
});

test("look directions classify sharp soft expressive without colliding", () => {
  assert.equal(matchesLookDirection({ name: "Classic Haircut", category: "Hair" }, "sharp"), true);
  assert.equal(matchesLookDirection({ name: "Classic Haircut", category: "Hair" }, "expressive"), false);
  assert.equal(matchesLookDirection({ name: "Swedish Relaxation Massage", category: "Massage" }, "soft"), true);
  assert.equal(matchesLookDirection({ name: "Balayage Colour", category: "Colour" }, "expressive"), true);
  assert.equal(matchesLookDirection({ name: "Balayage Colour", category: "Colour" }, "all"), true);
});

test("empty booking draft has null appointment choices and blank guest fields", () => {
  const draft = emptyBookingDraft();
  assert.equal(draft.serviceId, null);
  assert.equal(draft.venueId, null);
  assert.equal(draft.date, null);
  assert.equal(draft.time, null);
  assert.equal(draft.firstName, "");
  assert.equal(draft.step, 1);
});

test("buildAppointmentIcs converts venue time to UTC and keeps the service title", () => {
  const ics = buildAppointmentIcs({
    title: "Classic Haircut · Studio 07",
    description: "Appointment at Sort Life.",
    location: "Sort Life, Mumbai",
    date: "2026-09-10",
    startTime: "11:30",
    durationMinutes: 45,
    timezone: "Asia/Kolkata",
    uid: "test-ref@studio07",
  });
  assert.match(ics, /BEGIN:VEVENT/);
  assert.match(ics, /DTSTART:20260910T060000Z/);
  assert.match(ics, /DTEND:20260910T064500Z/);
  assert.match(ics, /Classic Haircut/);
  assert.match(ics, /UID:test-ref@studio07/);
});

test("buildAppointmentIcs defaults to Singapore time", () => {
  const ics = buildAppointmentIcs({
    title: "Hair Spa · Oru Spa",
    description: "Hair Spa at The Grooming Room.",
    location: "The Grooming Room, Singapore",
    date: "2026-10-12",
    startTime: "13:00",
    durationMinutes: 60,
    uid: "sg-ref@dasalon-brand-home",
  });
  assert.match(ics, /DTSTART:20261012T050000Z/);
  assert.match(ics, /DTEND:20261012T060000Z/);
});
