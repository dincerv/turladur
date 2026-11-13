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

export interface CuratedRouteStop {
  name: string;
  latitude: number;
  longitude: number;
}

/** Ordered stops for curated routes, keyed by route definition id. */
export const CURATED_ROUTE_STOPS: Readonly<
  Record<string, readonly CuratedRouteStop[]>
> = {
  kapadokya: [
    { name: 'Uçhisar Kalesi', latitude: 38.6301, longitude: 34.8053 },
    { name: 'Göreme Açık Hava Müzesi', latitude: 38.6398, longitude: 34.8448 },
    { name: 'Avanos', latitude: 38.715, longitude: 34.8467 },
    { name: 'Ürgüp', latitude: 38.6316, longitude: 34.911 },
    { name: 'Derinkuyu Yeraltı Şehri', latitude: 38.3736, longitude: 34.7345 },
  ],
  'likya-yolu': [
    { name: 'Ovacık (Başlangıç)', latitude: 36.5723, longitude: 29.1585 },
    { name: 'Patara', latitude: 36.2611, longitude: 29.3149 },
    { name: 'Kalkan', latitude: 36.2652, longitude: 29.414 },
    { name: 'Kaş', latitude: 36.2018, longitude: 29.6377 },
    { name: 'Demre (Myra)', latitude: 36.2591, longitude: 29.985 },
    { name: 'Olimpos', latitude: 36.3962, longitude: 30.473 },
  ],
  pamukkale: [
    { name: 'Pamukkale Travertenleri', latitude: 37.9215, longitude: 29.1206 },
    { name: 'Kleopatra Havuzu', latitude: 37.9257, longitude: 29.1262 },
    { name: 'Hierapolis Tiyatrosu', latitude: 37.9277, longitude: 29.1288 },
  ],
  efes: [
    { name: 'Devlet Agorası', latitude: 37.9373, longitude: 27.3433 },
    { name: 'Hadrian Tapınağı', latitude: 37.9386, longitude: 27.3415 },
    { name: 'Celsus Kütüphanesi', latitude: 37.9393, longitude: 27.3403 },
    { name: 'Büyük Tiyatro', latitude: 37.9412, longitude: 27.3419 },
    { name: 'Artemis Tapınağı', latitude: 37.9497, longitude: 27.3639 },
  ],
  'fethiye-oludeniz': [
    { name: 'Fethiye Limanı', latitude: 36.623, longitude: 29.108 },
    { name: 'Babadağ', latitude: 36.533, longitude: 29.185 },
    { name: 'Ölüdeniz Plajı', latitude: 36.549, longitude: 29.115 },
    { name: 'Kelebekler Vadisi', latitude: 36.5236, longitude: 29.1015 },
  ],
  istanbul: [
    { name: 'Ayasofya', latitude: 41.0086, longitude: 28.9802 },
    { name: 'Topkapı Sarayı', latitude: 41.0115, longitude: 28.9834 },
    { name: 'Kapalıçarşı', latitude: 41.0107, longitude: 28.9681 },
    { name: 'Eminönü İskelesi', latitude: 41.017, longitude: 28.974 },
    { name: 'Ortaköy', latitude: 41.0475, longitude: 29.027 },
  ],
};

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
