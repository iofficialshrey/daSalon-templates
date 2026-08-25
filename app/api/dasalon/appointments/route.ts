import {
  addMinutes,
  apiErrorResponse,
  daSalonRequest,
  DaSalonError,
  normalizeServices,
  ownedVenue,
  priceLine,
} from "@/lib/dasalon/server";
import type { AppointmentInput, PartnerMe } from "@/lib/dasalon/types";

export const dynamic = "force-dynamic";

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validInput(value: unknown): value is AppointmentInput {
  if (!value || typeof value !== "object") return false;
  const input = value as Partial<AppointmentInput>;
  const name = input.client?.name?.trim() ?? "";
  const phone = input.client?.phone?.trim() ?? "";
  const email = input.client?.email?.trim() ?? "";
  return Boolean(
    input.venueId?.trim() && input.venueId.length <= 128
    && input.serviceId?.trim() && input.serviceId.length <= 128
    && input.date && DATE.test(input.date)
    && input.startTime && TIME.test(input.startTime)
    && name.length >= 2 && name.length <= 100
    && phone.length >= 5 && phone.length <= 32
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

    const me = await daSalonRequest<PartnerMe>("/me");
    const venue = ownedVenue(me, input.venueId);
    const servicesPayload = await daSalonRequest<unknown>(
      `/venues/${encodeURIComponent(venue.id)}/services`,
    );
    const service = normalizeServices(servicesPayload).find((item) => item.id === input.serviceId);
    if (!service) throw new DaSalonError("That service is no longer available online.", 400, "SERVICE_UNAVAILABLE");

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
        phone: input.client.phone.trim(),
        email: input.client.email?.trim() || null,
      },
    };

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
      },
    }, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
