export type TaxCalculation = "INCLUSIVE" | "EXCLUSIVE";

export type PartnerTaxSetting = {
  name?: string | null;
  percentage?: number | null;
  partner?: { taxCalculation?: TaxCalculation | null } | null;
};

export type PartnerVenue = {
  id: string;
  name: string;
  city?: string | null;
  timezone?: string | null;
  country?: {
    currencyCode?: string | null;
    phoneCode?: string | null;
    timeZone?: string | null;
  } | null;
};

export type PartnerMe = {
  businessName?: string | null;
  name?: string | null;
  brandName?: string | null;
  currency?: string | null;
  taxCalculation?: TaxCalculation | null;
  country?: {
    currencyCode?: string | null;
    phoneCode?: string | null;
  } | null;
  venues?: PartnerVenue[];
};

export type PartnerService = {
  id: string;
  name: string;
  description?: string | null;
  duration: number;
  price?: number | null;
  onlinePrice?: number | null;
  isEnabledForOnline?: boolean;
  isOnlineEnabled?: boolean;
  categoryName?: string | null;
  category?: { name?: string | null } | null;
  taxSetting?: PartnerTaxSetting | null;
};

export type PublicVenue = {
  id: string;
  name: string;
  city: string | null;
  timezone: string | null;
};

export type PublicService = {
  id: string;
  name: string;
  description: string | null;
  duration: number;
  price: number;
  category: string | null;
};

export type BookingBootstrap = {
  brand: string;
  currency: string;
  phoneCode: string;
  venues: PublicVenue[];
  selectedVenueId: string;
  services: PublicService[];
  dates: string[];
};

export type TimeSlot = {
  time: string;
  staffIds: string[];
};

export type AppointmentInput = {
  venueId: string;
  serviceId: string;
  date: string;
  startTime: string;
  client: {
    name: string;
    phone: string;
    email?: string;
  };
  note?: string;
};
