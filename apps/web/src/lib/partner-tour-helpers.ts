import {
  inferDestinationScope,
  inferStayKind,
  normalizeDepartureCities,
} from '@turta/shared-constants';
import type { TourFormData } from '@/components/features/partner-dashboard/tour-form';

export const IMAGE_PLACEHOLDER = '/brand/mark-on-light.png';

export function normalizeError(
  error: unknown,
  fallback: string,
): { message: string } {
  if (error instanceof Error && error.message) {
    return { message: error.message };
  }
  if (typeof error === 'string' && error.trim()) {
    return { message: error };
  }
  return { message: fallback };
}

export type TourCategoryNest =
  'CULTURAL' | 'ADVENTURE' | 'GASTRONOMY' | 'NATURE' | 'CITY' | 'BEACH';

export function mapLegacyTourCategory(
  tourType?: string,
  region?: string,
  features?: string[],
): TourCategoryNest {
  const haystack = [tourType ?? '', region ?? '', ...(features ?? [])]
    .join(' ')
    .toLowerCase();

  if (/gastronomi|yemek|mutfak|gourmet|food/.test(haystack))
    return 'GASTRONOMY';
  if (/kültür|kultur|müze|tarih|cultural/.test(haystack)) return 'CULTURAL';
  if (/doğa|dogal|nature|trek|yürüyüş/.test(haystack)) return 'NATURE';
  if (/şehir|city|istanbul|ankara|izmir/.test(haystack)) return 'CITY';
  if (/plaj|beach|deniz|kıyı|kiyi|antalya|muğla|mugla/.test(haystack)) {
    return 'BEACH';
  }
  if (/macera|adventure|rafting|dalış|daliş|kayak/.test(haystack)) {
    return 'ADVENTURE';
  }
  return 'ADVENTURE';
}

export function buildTourExtrasFromForm(
  data: TourFormData,
): Record<string, unknown> {
  return {
    includes: data.includes,
    excludes: data.excludes,
    healthPrivileges: data.healthPrivileges ?? [],
    itinerary: data.itinerary,
    destinations: data.destinations,
    features: data.features,
    languages: data.languages,
    tags: data.tags,
    region: data.region,
    transportation: data.transportation,
    period: data.period,
    stayKind: data.stayKind || undefined,
    destinationScope: data.destinationScope || undefined,
    tourType: data.tourType,
    accommodationType: data.accommodationType,
    nights: data.nights,
    maxParticipants: data.maxParticipants,
    departureCity: data.departureCity,
    location: data.location,
    meetingPoint: data.meetingPoint,
    meetingTime: data.meetingTime,
    accommodationName: data.accommodationName,
    ageRestriction: data.ageRestriction,
    discount: data.discount,
    isJointTour: data.isJointTour,
    startDate: data.startDate,
    endDate: data.endDate,
  };
}

export function mapAgePricingType(
  pricingType: 'free' | 'half' | 'percentage' | 'fixed',
): 'FREE' | 'HALF' | 'PERCENTAGE' | 'FIXED' {
  if (pricingType === 'free') return 'FREE';
  if (pricingType === 'half') return 'HALF';
  if (pricingType === 'fixed') return 'FIXED';
  return 'PERCENTAGE';
}

export function mapAgePricingValue(
  pricingType: 'free' | 'half' | 'percentage' | 'fixed',
  value?: string,
): number {
  if (pricingType === 'free') return 0;
  if (pricingType === 'half') return 50;
  return parseFloat(value ?? '0') || 0;
}

export async function uploadTourImageFile(
  file: File,
  entityId: string,
  token: string,
  getPresignedUpload: (
    body: {
      folder: string;
      entityId: string;
      filename: string;
      contentType: string;
    },
    token: string,
  ) => Promise<{
    uploadUrl: string;
    publicUrl: string;
    uploadHeaders?: Record<string, string>;
  }>,
): Promise<string> {
  const { prepareTourImageFile, TOUR_COVER_IMAGE_OPTIONS } =
    await import('@/lib/prepare-tour-image');
  const prepared = await prepareTourImageFile(file, TOUR_COVER_IMAGE_OPTIONS);
  const contentType = (prepared.type || 'image/jpeg') as
    'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif';
  const safeName = prepared.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const presigned = await getPresignedUpload(
    {
      folder: 'tours',
      entityId,
      filename: safeName,
      contentType,
    },
    token,
  );
  const uploadRes = await fetch(presigned.uploadUrl, {
    method: 'PUT',
    headers:
      presigned.uploadHeaders ??
      ({ 'Content-Type': contentType } satisfies Record<string, string>),
    body: prepared,
  });
  if (!uploadRes.ok) {
    throw new Error('Görsel yüklenemedi');
  }
  return presigned.publicUrl;
}

export function transformNestTourToFormData(input: {
  title: string;
  description: string;
  price: string;
  durationDays: number;
  stayKind?: string;
  destinationScope?: string;
  departureCities?: string[];
  coverUrl: string | null;
  galleryUrls?: string[];
  extras?: Record<string, unknown>;
  accommodation?: { name: string } | null;
  dates?: Array<{
    id: string;
    startDate: string;
    endDate: string;
    capacity: number;
    ageRanges?: Array<{
      minAge: number;
      maxAge: number | null;
      pricingType: string;
      value: string;
    }>;
  }>;
  pickupPoints?: Array<{
    id: string;
    city: string;
    location: string;
    time: string;
    description: string | null;
    latitude?: number | null;
    longitude?: number | null;
    order: number;
  }>;
}): TourFormData {
  const extras = input.extras ?? {};
  const str = (key: string) =>
    typeof extras[key] === 'string' ? (extras[key] as string) : '';
  const arr = (key: string) =>
    Array.isArray(extras[key]) ? (extras[key] as string[]) : [];

  const galleryUrls = input.galleryUrls ?? [];
  const images = [
    ...(input.coverUrl ? [{ url: input.coverUrl, file: null }] : []),
    ...galleryUrls.map((url) => ({ url, file: null })),
  ];

  return {
    title: input.title,
    description: input.description,
    price: input.price,
    location: str('location'),
    duration: String(input.durationDays ?? extras.nights ?? ''),
    nights: str('nights'),
    maxParticipants: Number(extras.maxParticipants ?? 0),
    currentParticipants: 0,
    images,
    includes: arr('includes'),
    excludes: arr('excludes'),
    healthPrivileges: arr('healthPrivileges'),
    itinerary: Array.isArray(extras.itinerary)
      ? (extras.itinerary as TourFormData['itinerary'])
      : [],
    status: 'draft',
    departureCity: (() => {
      const fromColumn = normalizeDepartureCities(input.departureCities);
      if (fromColumn.length > 0) return fromColumn;
      return Array.isArray(extras.departureCity)
        ? (extras.departureCity as string[])
        : [''];
    })(),
    region: str('region'),
    transportation: str('transportation'),
    period: str('period'),
    stayKind: inferStayKind({
      stayKind: input.stayKind,
      durationDays: input.durationDays,
      tourType: str('tourType'),
    }),
    destinationScope: inferDestinationScope({
      destinationScope: input.destinationScope,
      tourType: str('tourType'),
      region: str('region'),
    }),
    tourType: str('tourType'),
    accommodationType: str('accommodationType'),
    ageRestriction: str('ageRestriction'),
    languages: arr('languages'),
    tags: arr('tags'),
    tourDates: (input.dates ?? []).map((date) => ({
      startDate: date.startDate.slice(0, 10),
      endDate: date.endDate.slice(0, 10),
      price: input.price,
      availableSeats: String(date.capacity),
      soldSeats: '0',
      minParticipants: '',
      maxParticipants: String(date.capacity),
      earlyBirdDiscount: '',
      lastMinuteDiscount: '',
      earlyBirdDeadline: '',
      lastMinuteStart: '',
      notes: '',
      status: 'ACTIVE',
      ageRanges: (date.ageRanges ?? []).map((range) => ({
        minAge: range.minAge,
        maxAge: range.maxAge,
        pricingType:
          range.pricingType === 'FREE'
            ? 'free'
            : range.pricingType === 'FIXED'
              ? 'fixed'
              : range.pricingType === 'HALF'
                ? 'half'
                : 'percentage',
        value: range.value,
      })),
      earlyBirdDeadlineStart: '',
      earlyBirdDeadlineEnd: '',
      lastMinuteStartStart: '',
      lastMinuteStartEnd: '',
      isExpanded: false,
      waitingList: '0',
      discount: '0',
    })),
    discount: Number(extras.discount ?? 0),
    destinations: Array.isArray(extras.destinations)
      ? (extras.destinations as TourFormData['destinations'])
      : [{ city: '', description: '' }],
    reviews: 0,
    isJointTour: Boolean(extras.isJointTour),
    features: arr('features'),
    startDate: str('startDate'),
    endDate: str('endDate'),
    accommodationName: input.accommodation?.name ?? str('accommodationName'),
    meetingPoint: str('meetingPoint'),
    meetingTime: str('meetingTime'),
    pickupPoints: (input.pickupPoints ?? []).map((point) => ({
      id: point.id,
      city: point.city,
      location: point.location,
      time: point.time,
      description: point.description ?? '',
      latitude: point.latitude ?? null,
      longitude: point.longitude ?? null,
      order: point.order,
      isActive: true,
    })),
    mainImage: input.coverUrl ? { url: input.coverUrl, file: null } : null,
    galleryImages: galleryUrls.map((url) => ({ url, file: null })),
  };
}
