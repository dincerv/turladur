export enum Role {
  CUSTOMER = 'CUSTOMER',
  PARTNER = 'PARTNER',
  PARTNER_STAFF = 'PARTNER_STAFF',
  ADMIN = 'ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN',
  PLATFORM_ADMIN = 'PLATFORM_ADMIN',
  PLATFORM_SUPER_ADMIN = 'PLATFORM_SUPER_ADMIN',
  /** Marketplace acente personeli (AgencyStaff). */
  AGENCY_OWNER = 'AGENCY_OWNER',
  AGENCY_ADMIN = 'AGENCY_ADMIN',
  AGENCY_STAFF = 'AGENCY_STAFF',
  /** Rehber / otobüs firması aktörleri. */
  GUIDE = 'GUIDE',
  BUS_COMPANY = 'BUS_COMPANY',
}

export enum BookingStatus {
  PENDING = 'PENDING',
  PENDING_PAYMENT = 'PENDING_PAYMENT',
  CONFIRMED = 'CONFIRMED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  SUSPENDED = 'SUSPENDED',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  EXPIRED = 'EXPIRED',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  AWAITING_3DS = 'AWAITING_3DS',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

export enum TourCategory {
  CULTURAL = 'CULTURAL',
  ADVENTURE = 'ADVENTURE',
  GASTRONOMY = 'GASTRONOMY',
  NATURE = 'NATURE',
  CITY = 'CITY',
  BEACH = 'BEACH',
}

export const TOUR_CATEGORY_LABELS: Record<TourCategory, string> = {
  [TourCategory.CULTURAL]: 'Kültür',
  [TourCategory.ADVENTURE]: 'Macera',
  [TourCategory.GASTRONOMY]: 'Gastronomi',
  [TourCategory.NATURE]: 'Doğa',
  [TourCategory.CITY]: 'Şehir',
  [TourCategory.BEACH]: 'Deniz & Plaj',
};

export function tourCategoryLabel(category?: string | null): string {
  if (!category) return '';
  return TOUR_CATEGORY_LABELS[category as TourCategory] ?? category;
}

export enum TourStatus {
  DRAFT = 'DRAFT',
  PENDING_REVIEW = 'PENDING_REVIEW',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
}

/** Günübirlik / konaklamalı — tur formu ilk sorusu ve public filtre. */
export enum TourStayKind {
  DAY_TRIP = 'DAY_TRIP',
  OVERNIGHT = 'OVERNIGHT',
}

/** Yurtiçi / yurtdışı — stayKind sonrası ikinci soru ve public filtre. */
export enum TourDestinationScope {
  DOMESTIC = 'DOMESTIC',
  INTERNATIONAL = 'INTERNATIONAL',
}

export const TOUR_STAY_KIND_LABELS: Record<TourStayKind, string> = {
  [TourStayKind.DAY_TRIP]: 'Günübirlik',
  [TourStayKind.OVERNIGHT]: 'Konaklamalı',
};

export const TOUR_DESTINATION_SCOPE_LABELS: Record<
  TourDestinationScope,
  string
> = {
  [TourDestinationScope.DOMESTIC]: 'Yurtiçi',
  [TourDestinationScope.INTERNATIONAL]: 'Yurtdışı',
};

/** Geographic regions for Tour.region / /tours Bölge filter (not curated routes). */
export const TOUR_GEO_REGIONS = [
  'Marmara',
  'Ege',
  'Akdeniz',
  'İç Anadolu',
  'Karadeniz',
  'Doğu Anadolu',
  'Güneydoğu Anadolu',
] as const;

export type TourGeoRegion = (typeof TOUR_GEO_REGIONS)[number];

export const TOUR_GEO_REGION_CITIES: Record<TourGeoRegion, readonly string[]> =
  {
    Marmara: [
      'İstanbul',
      'Bursa',
      'Kocaeli',
      'Sakarya',
      'Tekirdağ',
      'Edirne',
      'Kırklareli',
      'Balıkesir',
      'Çanakkale',
      'Yalova',
      'Bilecik',
    ],
    Ege: [
      'İzmir',
      'Aydın',
      'Muğla',
      'Denizli',
      'Manisa',
      'Afyonkarahisar',
      'Kütahya',
      'Uşak',
    ],
    Akdeniz: [
      'Antalya',
      'Mersin',
      'Adana',
      'Hatay',
      'Osmaniye',
      'Isparta',
      'Burdur',
      'Kahramanmaraş',
    ],
    'İç Anadolu': [
      'Ankara',
      'Konya',
      'Kayseri',
      'Eskişehir',
      'Sivas',
      'Aksaray',
      'Karaman',
      'Kırıkkale',
      'Kırşehir',
      'Nevşehir',
      'Niğde',
      'Yozgat',
    ],
    Karadeniz: [
      'Trabzon',
      'Rize',
      'Artvin',
      'Giresun',
      'Ordu',
      'Samsun',
      'Sinop',
      'Kastamonu',
      'Zonguldak',
      'Bartın',
      'Düzce',
      'Bolu',
      'Amasya',
      'Tokat',
      'Gümüşhane',
      'Bayburt',
    ],
    'Doğu Anadolu': [
      'Erzurum',
      'Erzincan',
      'Kars',
      'Ağrı',
      'Iğdır',
      'Ardahan',
      'Malatya',
      'Elazığ',
      'Bingöl',
      'Tunceli',
      'Van',
      'Bitlis',
      'Muş',
      'Hakkari',
    ],
    'Güneydoğu Anadolu': [
      'Diyarbakır',
      'Şanlıurfa',
      'Mardin',
      'Batman',
      'Siirt',
      'Şırnak',
      'Adıyaman',
      'Gaziantep',
      'Kilis',
    ],
  };

/** Map a TR city name to geographic region, or null if unknown. */
export function resolveRegionFromCity(
  city?: string | null,
): TourGeoRegion | null {
  const trimmed = city?.trim();
  if (!trimmed) return null;
  const folded = trimmed.toLocaleLowerCase('tr-TR');
  for (const region of TOUR_GEO_REGIONS) {
    if (
      TOUR_GEO_REGION_CITIES[region].some(
        (c) => c.toLocaleLowerCase('tr-TR') === folded,
      )
    ) {
      return region;
    }
  }
  return null;
}

/** Accept known region label or resolve from city; empty → null. */
export function normalizeTourRegion(raw?: string | null): TourGeoRegion | null {
  const trimmed = raw?.trim();
  if (!trimmed) return null;
  const folded = trimmed.toLocaleLowerCase('tr-TR');
  const exact = TOUR_GEO_REGIONS.find(
    (r) => r.toLocaleLowerCase('tr-TR') === folded,
  );
  if (exact) return exact;
  return resolveRegionFromCity(trimmed);
}

export const CANONICAL_DEPARTURE_CITIES = [
  'İstanbul',
  'Ankara',
  'İzmir',
  'Antalya',
  'Bursa',
  'Adana',
  'Trabzon',
  'Nevşehir',
  'Denizli',
  'Mardin',
  'Van',
  'Gaziantep',
  'Konya',
  'Çanakkale',
  'Muğla',
  'Aydın',
  'Rize',
  'Karabük',
  'Adıyaman',
  'Şanlıurfa',
] as const;

export type CanonicalDepartureCity =
  (typeof CANONICAL_DEPARTURE_CITIES)[number];

function foldDepartureText(value: string): string {
  return value.trim().toLocaleLowerCase('tr-TR');
}

/** Canonical TR city name, or trimmed original if unknown. Empty → null. */
export function normalizeDepartureCity(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const folded = foldDepartureText(trimmed);
  const exact = CANONICAL_DEPARTURE_CITIES.find(
    (city) => foldDepartureText(city) === folded,
  );
  if (exact) return exact;

  const contained = CANONICAL_DEPARTURE_CITIES.find((city) =>
    folded.includes(foldDepartureText(city)),
  );
  return contained ?? trimmed;
}

export function normalizeDepartureCities(values: unknown): string[] {
  const raw = Array.isArray(values) ? values : values != null ? [values] : [];
  const normalized: string[] = [];
  const seen = new Set<string>();
  for (const item of raw) {
    const city = normalizeDepartureCity(String(item));
    if (!city) continue;
    const key = foldDepartureText(city);
    if (seen.has(key)) continue;
    seen.add(key);
    normalized.push(city);
  }
  return normalized;
}

export function inferStayKind(input: {
  stayKind?: string | null;
  durationDays?: number | null;
  tourType?: string | null;
}): TourStayKind {
  if (
    input.stayKind === TourStayKind.DAY_TRIP ||
    input.stayKind === TourStayKind.OVERNIGHT
  ) {
    return input.stayKind;
  }
  const tourType = foldDepartureText(input.tourType ?? '');
  if (tourType.includes('günübirlik') || tourType.includes('gunubirlik')) {
    return TourStayKind.DAY_TRIP;
  }
  if (input.durationDays === 1) return TourStayKind.DAY_TRIP;
  return TourStayKind.OVERNIGHT;
}

export function inferDestinationScope(input: {
  destinationScope?: string | null;
  tourType?: string | null;
  region?: string | null;
}): TourDestinationScope {
  if (
    input.destinationScope === TourDestinationScope.DOMESTIC ||
    input.destinationScope === TourDestinationScope.INTERNATIONAL
  ) {
    return input.destinationScope;
  }
  const haystack = foldDepartureText(
    `${input.tourType ?? ''} ${input.region ?? ''}`,
  );
  if (
    haystack.includes('yurtdışı') ||
    haystack.includes('yurtdisi') ||
    haystack.includes('international')
  ) {
    return TourDestinationScope.INTERNATIONAL;
  }
  return TourDestinationScope.DOMESTIC;
}

/** Partner cancels an entire tour (delists) — shown in UI + emails. */
export enum TourCancelReason {
  OPERATIONAL = 'OPERATIONAL',
  LOW_PARTICIPANTS = 'LOW_PARTICIPANTS',
  WEATHER = 'WEATHER',
}

export const TOUR_CANCEL_REASON_LABELS: Record<TourCancelReason, string> = {
  [TourCancelReason.OPERATIONAL]: 'Operasyonel nedenler',
  [TourCancelReason.LOW_PARTICIPANTS]: 'Yetersiz katılımcı sayısı',
  [TourCancelReason.WEATHER]: 'Hava koşulları',
};

export const DEFAULT_PAGE = 1;
export const DEFAULT_PAGE_LIMIT = 20;

/** Public /activities listing cover — admin toggle. Missing row = off. */
export const ACTIVITIES_LISTING_COVER_KEY = 'activities_listing';
export const MAX_PAGE_LIMIT = 100;
export const DEFAULT_CURRENCY = 'TRY';

/** Tour operator declares which health conditions the tour can accommodate. */
export const HEALTH_PRIVILEGE_OPTIONS = [
  'Tip 1 Diyabet',
  'Tip 2 Diyabet',
  'Çölyak (Glütensiz)',
  'Laktoz intoleransı',
  'Fındık / fıstık alerjisi',
  'Deniz ürünü alerjisi',
  'Astım',
  'Epilepsi',
  'Kalp rahatsızlığı',
  'Hareket kısıtlılığı',
  'Görme engeli desteği',
  'İşitme engeli desteği',
  'Hamilelik',
] as const;

export function isValidGeoCoordinate(
  latitude: unknown,
  longitude: unknown,
): latitude is number {
  return (
    typeof latitude === 'number' &&
    typeof longitude === 'number' &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
}

/** Email-safe map link. Do not embed Leaflet in Resend HTML. */
export function buildOsmMapsUrl(latitude: number, longitude: number): string {
  return `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=16/${latitude}/${longitude}`;
}

export function isGoogleMapsShortUrl(raw: string): boolean {
  try {
    const host = new URL(raw.trim()).hostname
      .replace(/^www\./, '')
      .toLowerCase();
    return host === 'maps.app.goo.gl' || host === 'goo.gl' || host === 'g.co';
  } catch {
    return false;
  }
}

/**
 * Extract lat/lng from a full Google Maps URL.
 * Short links (maps.app.goo.gl) are not resolved — no Google API / redirect proxy.
 */
export function parseGoogleMapsUrl(
  raw: string,
): { latitude: number; longitude: number } | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(trimmed);
  } catch {
    return null;
  }

  const host = parsedUrl.hostname.replace(/^www\./, '').toLowerCase();
  const isGoogleHost =
    host === 'google.com' ||
    host.endsWith('.google.com') ||
    host === 'maps.google.com';
  if (!isGoogleHost) {
    return null;
  }

  const bang = trimmed.match(/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/);
  if (bang) {
    const latitude = Number(bang[1]);
    const longitude = Number(bang[2]);
    if (isValidGeoCoordinate(latitude, longitude)) {
      return { latitude, longitude };
    }
  }

  const atMatch = trimmed.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
  if (atMatch) {
    const latitude = Number(atMatch[1]);
    const longitude = Number(atMatch[2]);
    if (isValidGeoCoordinate(latitude, longitude)) {
      return { latitude, longitude };
    }
  }

  for (const key of ['q', 'query', 'll', 'center', 'destination']) {
    const value = parsedUrl.searchParams.get(key);
    if (!value) continue;
    const pair = value.match(/(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)/);
    if (!pair) continue;
    const latitude = Number(pair[1]);
    const longitude = Number(pair[2]);
    if (isValidGeoCoordinate(latitude, longitude)) {
      return { latitude, longitude };
    }
  }

  return null;
}

/** Partner form “Tur Tipi” labels (UI). */
export const PARTNER_TOUR_TYPE_OPTIONS = [
  'Kültür Turu',
  'Doğa Turu',
  'Balayı Turu',
  'Yemek Turu',
  'Macera Turu',
  'Günübirlik Tur',
] as const;

export type PartnerTourTypeOption = (typeof PARTNER_TOUR_TYPE_OPTIONS)[number];

/**
 * Acente Tur Tipi / serbest metin → Tour.category.
 * Feeds /routes interest cards and catalog filters.
 */
export function mapTourTypeToCategory(
  tourType?: string | null,
  region?: string | null,
  features?: string[] | null,
): TourCategory {
  const haystack = [tourType ?? '', region ?? '', ...(features ?? [])]
    .join(' ')
    .toLocaleLowerCase('tr-TR');

  if (/gastronomi|yemek|mutfak|gourmet|food/.test(haystack)) {
    return TourCategory.GASTRONOMY;
  }
  if (/kültür|kultur|müze|muze|tarih|cultural/.test(haystack)) {
    return TourCategory.CULTURAL;
  }
  if (/doğa|doga|nature|trek|yürüyüş|yuruyus/.test(haystack)) {
    return TourCategory.NATURE;
  }
  if (/balayı|balayi|şehir|sehir|city|istanbul|ankara|izmir/.test(haystack)) {
    return TourCategory.CITY;
  }
  if (/plaj|beach|deniz|kıyı|kiyi|antalya|muğla|mugla/.test(haystack)) {
    return TourCategory.BEACH;
  }
  if (/macera|adventure|rafting|dalış|dalis|kayak/.test(haystack)) {
    return TourCategory.ADVENTURE;
  }
  return TourCategory.ADVENTURE;
}
