import "server-only";

import type {
  PartnerMe,
  PartnerService,
  PartnerTaxSetting,
  PartnerVenue,
  PublicService,
  TaxCalculation,
} from "./types";

type ApiEnvelope<T> = {
  success?: boolean;
  message?: string;
  data?: T;
};

export class DaSalonError extends Error {
  constructor(
    message: string,
    public readonly status = 502,
    public readonly code?: string,
  ) {
    super(message);
    this.name = "DaSalonError";
  }
}

function configuration() {
  const apiKey = process.env.DASALON_PARTNER_API_KEY?.trim();
  const baseUrl = process.env.DASALON_API_BASE_URL?.trim().replace(/\/$/, "");

  if (!apiKey || !baseUrl) {
    throw new DaSalonError("Booking service is not configured yet.", 503, "NOT_CONFIGURED");
  }

  let parsed: URL;
  try {
    parsed = new URL(baseUrl);
  } catch {
    throw new DaSalonError("Booking service configuration is invalid.", 503, "INVALID_CONFIGURATION");
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new DaSalonError("Booking service configuration is invalid.", 503, "INVALID_CONFIGURATION");
  }

  return { apiKey, baseUrl };
}

function safeStatus(status: number) {
  if (status === 400 || status === 401 || status === 403 || status === 404 || status === 409 || status === 429) {
    return status;
  }
  return status >= 500 ? 502 : 500;
}

export async function daSalonRequest<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const { apiKey, baseUrl } = configuration();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20_000);

  try {
    const response = await fetch(`${baseUrl}${path}`, {
      ...init,
      cache: "no-store",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...init.headers,
        "x-partner-api-key": apiKey,
      },
      signal: controller.signal,
    });

    const payload = (await response.json().catch(() => null)) as
      | (ApiEnvelope<T> & { code?: string })
      | null;

    if (!response.ok || payload?.success === false) {
      throw new DaSalonError(
        payload?.message || "The booking service could not complete the request.",
        safeStatus(response.status),
        payload?.code,
      );
    }

    if (!payload || !("data" in payload)) {
      throw new DaSalonError("The booking service returned an invalid response.");
    }

    return payload.data as T;
  } catch (error) {
    if (error instanceof DaSalonError) throw error;
    if (error instanceof Error && error.name === "AbortError") {
      throw new DaSalonError("The booking service timed out. Please try again.", 504, "TIMEOUT");
    }
    throw new DaSalonError("The booking service is temporarily unavailable.");
  } finally {
    clearTimeout(timeout);
  }
}

export function apiErrorResponse(error: unknown) {
  const issue = error instanceof DaSalonError
    ? error
    : new DaSalonError("The booking service is temporarily unavailable.");

  return Response.json(
    { success: false, message: issue.message, code: issue.code },
    { status: issue.status },
  );
}

export function asArray<T>(value: unknown, keys: string[] = []): T[] {
  if (Array.isArray(value)) return value as T[];
  if (!value || typeof value !== "object") return [];

  const record = value as Record<string, unknown>;
  for (const key of [...keys, "items", "data", "results"]) {
    if (Array.isArray(record[key])) return record[key] as T[];
  }
  return [];
}

export function normalizeDates(value: unknown) {
  return asArray<unknown>(value, ["dates", "workingDates"])
    .map((item) => {
      if (typeof item === "string") return item.slice(0, 10);
      if (!item || typeof item !== "object") return null;
      const row = item as Record<string, unknown>;
      if (row.isAvailable === false || row.available === false) return null;
      return typeof row.date === "string" ? row.date.slice(0, 10) : null;
    })
    .filter((date): date is string => typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date));
}

export function normalizeServices(value: unknown) {
  return asArray<PartnerService>(value, ["services"]).filter((service) => (
    typeof service?.id === "string"
    && typeof service?.name === "string"
    && Number(service.duration) > 0
    && Number(service.price ?? service.onlinePrice) >= 0
    && service.isEnabledForOnline !== false
    && service.isOnlineEnabled !== false
  ));
}

export function publicService(service: PartnerService): PublicService {
  return {
    id: service.id,
    name: service.name,
    description: service.description ?? null,
    duration: Number(service.duration),
    price: Number(service.price ?? service.onlinePrice ?? 0),
    category: service.categoryName ?? service.category?.name ?? null,
  };
}

export function ownedVenue(me: PartnerMe, venueId?: string | null): PartnerVenue {
  const venues = Array.isArray(me.venues) ? me.venues : [];
  const venue = venueId ? venues.find((item) => item.id === venueId) : venues[0];
  if (!venue) throw new DaSalonError("No online-bookable venue was found.", venueId ? 404 : 503);
  return venue;
}

function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function addMinutes(startTime: string, minutes: number) {
  const [hours, mins] = startTime.split(":").map(Number);
  const total = hours * 60 + mins + minutes;
  return `${String(Math.floor(total / 60) % 24).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

export function priceLine(
  service: PartnerService,
  startTime: string,
  fallbackTaxCalculation: TaxCalculation = "EXCLUSIVE",
) {
  const price = Number(service.price ?? service.onlinePrice ?? 0);
  const setting: PartnerTaxSetting | null | undefined = service.taxSetting;
  const taxPercentage = Number(setting?.percentage ?? 0);
  const taxType = setting?.partner?.taxCalculation ?? fallbackTaxCalculation;
  const subTotal = price;
  const totalTax = taxType === "INCLUSIVE"
    ? price * (taxPercentage / (100 + taxPercentage))
    : price * (taxPercentage / 100);
  const total = taxType === "INCLUSIVE" ? price : price + totalTax;
  const basePrice = taxType === "INCLUSIVE" ? price - totalTax : price;
  const basePriceWithTax = taxType === "INCLUSIVE" ? price : price + totalTax;

  return {
    itemId: service.id,
    itemType: "SERVICE" as const,
    name: service.name,
    duration: Number(service.duration),
    startTime,
    discount: 0,
    price: roundMoney(price),
    basePrice: roundMoney(basePrice),
    basePriceWithTax: roundMoney(basePriceWithTax),
    subTotal: roundMoney(subTotal),
    tax: roundMoney(totalTax),
    totalTax: roundMoney(totalTax),
    total: roundMoney(total),
    taxPercentage,
    taxType,
    taxDetails: `${setting?.name?.trim() || "Tax"} (${taxPercentage}%) ${taxType}`,
  };
}
