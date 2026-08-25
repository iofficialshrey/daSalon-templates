import { apiErrorResponse, asArray, daSalonRequest, normalizeDates, normalizeServices, ownedVenue, publicService } from "@/lib/dasalon/server";
import type { BookingBootstrap, PartnerMe, PartnerVenue } from "@/lib/dasalon/types";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const requestedVenueId = new URL(request.url).searchParams.get("venueId");
    const me = await daSalonRequest<PartnerMe>("/me");
    const venue = ownedVenue(me, requestedVenueId);
    const [servicesPayload, datesPayload] = await Promise.all([
      daSalonRequest<unknown>(`/venues/${encodeURIComponent(venue.id)}/services`),
      daSalonRequest<unknown>(`/venues/${encodeURIComponent(venue.id)}/working-dates`),
    ]);

    const venues = asArray<PartnerVenue>(me.venues, ["venues"]);
    const result: BookingBootstrap = {
      brand: me.businessName || me.name || me.brandName || "Salon",
      currency: me.currency || me.country?.currencyCode || venue.country?.currencyCode || "INR",
      phoneCode: me.country?.phoneCode || venue.country?.phoneCode || "+91",
      venues: venues.map((item) => ({
        id: item.id,
        name: item.name,
        city: item.city ?? null,
        timezone: item.timezone ?? item.country?.timeZone ?? null,
      })),
      selectedVenueId: venue.id,
      services: normalizeServices(servicesPayload).map(publicService),
      dates: normalizeDates(datesPayload),
    };

    return Response.json({ success: true, data: result });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
