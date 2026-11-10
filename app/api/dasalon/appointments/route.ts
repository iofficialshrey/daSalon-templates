import {
  addMinutes,
  apiErrorResponse,
  cachedDaSalonRequest,
  daSalonRequest,
  DaSalonError,
  normalizeServices,
  normalizeSlots,
  ownedVenue,
  priceLine,
} from "@/lib/dasalon/server";
import type { AppointmentInput, PartnerMe } from "@/lib/dasalon/types";

export const dynamic = "force-dynamic";

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
/** International format: a plus sign, then 8–15 digits. */
const PHONE = /^\+\d{8,15}$/;

/**
 * Attempt keys this instance has already sent to da Salon. A retry of the same
 * attempt must reach da Salon's idempotency handling rather than fail the
 * availability check against the slot it may already hold.
 */
const sentAttempts = new Map<string, number>();
const ATTEMPT_MEMORY_MS = 15 * 60_000;

function rememberAttempt(key: string) {
  const now = Date.now();
  for (const [stored, at] of sentAttempts) {
    if (now - at > ATTEMPT_MEMORY_MS) sentAttempts.delete(stored);
  }
  sentAttempts.set(key, now);
}

function compactPhone(value: string | undefined) {
  return value?.replace(/[\s()-]/g, "") ?? "";
}

function validInput(value: unknown): value is AppointmentInput {
  if (!value || typeof value !== "object") return false;
  const input = value as Partial<AppointmentInput>;
  const name = input.client?.name?.trim() ?? "";
  const email = input.client?.email?.trim() ?? "";
  return Boolean(
    input.venueId?.trim() && input.venueId.length <= 128
    && input.serviceId?.trim() && input.serviceId.length <= 128
    && input.date && DATE.test(input.date)
    && input.startTime && TIME.test(input.startTime)
    && name.length >= 2 && name.length <= 100
    && PHONE.test(compactPhone(input.client?.phone))
    && (!email || (email.length <= 254 && EMAIL.test(email)))
    && (input.note?.length ?? 0) <= 1000,
  );
}

export async function POST(request: Request) {
  try {
    const input = await request.json().catch(() => null);
    if (!validInput(input)) {
      return Response.json({ success: false, message: "Please complete all required booking details." }, { status: 400 });
    }

    const requestKey = request.headers.get("Idempotency-Key")?.trim();
    if (!requestKey || requestKey.length > 128) {
      return Response.json({ success: false, message: "A valid booking attempt key is required." }, { status: 400 });
    }

    const me = await cachedDaSalonRequest<PartnerMe>("/me");
    const venue = ownedVenue(me, input.venueId);
    const venuePath = `/venues/${encodeURIComponent(venue.id)}`;
    const slotQuery = new URLSearchParams({ date: input.date, serviceIds: input.serviceId });
    // Price and availability are read fresh so a booking never relies on a stale menu or a taken hour.
    const [servicesPayload, slotsPayload] = await Promise.all([
      daSalonRequest<unknown>(`${venuePath}/services`),
      daSalonRequest<unknown>(`${venuePath}/time-slots?${slotQuery}`),
    ]);
    const service = normalizeServices(servicesPayload).find((item) => item.id === input.serviceId);
    if (!service) throw new DaSalonError("That service is no longer available online.", 400, "SERVICE_UNAVAILABLE");
    const isRetry = sentAttempts.has(requestKey);
    if (!isRetry && !normalizeSlots(slotsPayload).some((slot) => slot.time === input.startTime)) {
      throw new DaSalonError("That time was just taken. Please choose another time.", 409, "SLOT_TAKEN");
    }

    const line = priceLine(service, input.startTime, me.taxCalculation ?? "EXCLUSIVE");
    const body = {
      venueId: venue.id,
      date: input.date,
      startTime: input.startTime,
      endTime: addMinutes(input.startTime, line.duration),
      totalDuration: line.duration,
      note: input.note?.trim() || null,
      paymentType: "AT_VENUE",
      status: "NEW",
      subTotal: line.subTotal,
      tax: line.totalTax,
      total: line.total,
      items: [line],
      client: {
        name: input.client.name.trim(),
        phone: compactPhone(input.client.phone),
        email: input.client.email?.trim() || null,
      },
    };

    rememberAttempt(requestKey);
    const appointment = await daSalonRequest<Record<string, unknown>>("/appointments", {
      method: "POST",
      headers: { "Idempotency-Key": requestKey },
      body: JSON.stringify(body),
    });

    return Response.json({
      success: true,
      data: {
        id: typeof appointment.id === "string" ? appointment.id : null,
        appointmentId: typeof appointment.appointmentId === "string" ? appointment.appointmentId : null,
        status: typeof appointment.status === "string" ? appointment.status : "NEW",
        date: typeof appointment.date === "string" ? appointment.date.slice(0, 10) : input.date,
        startTime: typeof appointment.startTime === "string" ? appointment.startTime.slice(0, 5) : input.startTime,
        total: line.total,
      },
    }, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
