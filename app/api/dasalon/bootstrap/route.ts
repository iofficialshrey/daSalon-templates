import {
  apiErrorResponse,
  asArray,
  cachedDaSalonRequest,
  daSalonRequest,
  normalizeDates,
  normalizeServices,
  ownedVenue,
  publicService,
} from "@/lib/dasalon/server";
import { SINGAPORE } from "@/lib/dasalon/locale";
import type { BookingBootstrap, PartnerMe, PartnerVenue } from "@/lib/dasalon/types";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const requestedVenueId = new URL(request.url).searchParams.get("venueId");
    const me = await cachedDaSalonRequest<PartnerMe>("/me");
    const venue = ownedVenue(me, requestedVenueId);
    const [servicesPayload, datesPayload] = await Promise.all([
      cachedDaSalonRequest<unknown>(`/venues/${encodeURIComponent(venue.id)}/services`),
      daSalonRequest<unknown>(`/venues/${encodeURIComponent(venue.id)}/working-dates`),
    ]);

    const venues = asArray<PartnerVenue>(me.venues, ["venues"]);
    const result: BookingBootstrap = {
      brand: me.businessName || me.name || me.brandName || "Salon",
      currency: SINGAPORE.currency,
      phoneCode: me.country?.phoneCode || venue.country?.phoneCode || SINGAPORE.phoneCode,
      venues: venues.map((item) => ({
        id: item.id,
        name: item.name,
        city: item.city ?? null,
        timezone: item.timezone ?? item.country?.timeZone ?? SINGAPORE.timeZone,
      })),
      selectedVenueId: venue.id,
      services: normalizeServices(servicesPayload).map((service) => publicService(service, me.taxCalculation ?? "EXCLUSIVE")),
      dates: normalizeDates(datesPayload),
    };

    return Response.json({ success: true, data: result });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
