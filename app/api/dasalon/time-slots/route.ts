import {
  apiErrorResponse,
  cachedDaSalonRequest,
  daSalonRequest,
  normalizeServices,
  normalizeSlots,
  ownedVenue,
} from "@/lib/dasalon/server";
import type { PartnerMe } from "@/lib/dasalon/types";

export const dynamic = "force-dynamic";

const DATE = /^\d{4}-\d{2}-\d{2}$/;

export async function GET(request: Request) {
  try {
    const params = new URL(request.url).searchParams;
    const venueId = params.get("venueId")?.trim();
    const date = params.get("date")?.trim();
    const serviceIds = params.get("serviceIds")?.split(",").map((id) => id.trim()).filter(Boolean) ?? [];

    if (!venueId || !date || !DATE.test(date) || serviceIds.length === 0 || serviceIds.length > 10) {
      return Response.json({ success: false, message: "Venue, date, and service are required." }, { status: 400 });
    }

    const me = await cachedDaSalonRequest<PartnerMe>("/me");
    const venue = ownedVenue(me, venueId);
    const servicesPayload = await cachedDaSalonRequest<unknown>(
      `/venues/${encodeURIComponent(venue.id)}/services`,
    );
    const allowedServices = new Set(normalizeServices(servicesPayload).map((service) => service.id));
    if (serviceIds.some((serviceId) => !allowedServices.has(serviceId))) {
      return Response.json({ success: false, message: "That service is no longer available online." }, { status: 400 });
    }

    const query = new URLSearchParams({ date, serviceIds: serviceIds.join(",") });
    const payload = await daSalonRequest<unknown>(
      `/venues/${encodeURIComponent(venue.id)}/time-slots?${query}`,
    );

    return Response.json({ success: true, data: { date, timeSlots: normalizeSlots(payload) } });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
