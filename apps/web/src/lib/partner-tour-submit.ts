import type { TourFormData } from '@/components/features/partner-dashboard/tour-form';
import { parseTourSubmitNumbers } from '@/components/features/partner-dashboard/tour-form/tour-form.schemas';
import {
  inferDestinationScope,
  inferStayKind,
  normalizeDepartureCities,
} from '@turta/shared-constants';
import {
  buildTourExtrasFromForm,
  mapAgePricingType,
  mapAgePricingValue,
  mapLegacyTourCategory,
  uploadTourImageFile,
} from '@/lib/partner-tour-helpers';
import { getTourDates } from '@/services/catalog';
import {
  createPartnerTour,
  createTourDate,
  createTourDateAgeRange,
  createTourPickupPoint,
  deleteTourPickupPoint,
  getPresignedUpload,
  listTourPickupPoints,
  updatePartnerTour,
  upsertTourAccommodation,
  type CreatePartnerTourBody,
} from '@/services/partner-admin';

type SubmitPayload = {
  formData: TourFormData;
  title: string;
  description: string;
  duration: number;
  price: number;
  tourDates: Array<{
    startDate: string | null;
    endDate: string | null;
    availableSeats: number;
    ageRanges: Array<{
      minAge: number;
      maxAge: number | null;
      pricingType: string;
      value: number;
    }>;
  }>;
  pickupPoints: Array<{
    city: string;
    location: string;
    time: string;
    description?: string;
    latitude?: number | null;
    longitude?: number | null;
    order?: number;
  }>;
  accommodationName?: string;
  tourType?: string;
  region?: string;
  features?: string[];
  asDraft?: boolean;
};

async function resolveImageUrl(
  file: File | null | undefined,
  url: string | undefined,
  entityId: string,
  token: string,
): Promise<string | undefined> {
  if (url && !url.startsWith('blob:')) return url;
  if (file) {
    return uploadTourImageFile(file, entityId, token, getPresignedUpload);
  }
  return undefined;
}

async function resolveMedia(
  formData: TourFormData,
  uploadEntityId: string,
  token: string,
) {
  const coverUrl =
    (await resolveImageUrl(
      formData.mainImage?.file,
      formData.mainImage?.url,
      uploadEntityId,
      token,
    )) ??
    (await resolveImageUrl(
      formData.images[0]?.file,
      formData.images[0]?.url,
      uploadEntityId,
      token,
    ));

  const galleryUrls: string[] = [];
  for (const img of formData.galleryImages ?? []) {
    const uploaded = await resolveImageUrl(
      img.file,
      img.url,
      uploadEntityId,
      token,
    );
    if (uploaded) galleryUrls.push(uploaded);
  }
  for (const img of formData.images.slice(1)) {
    const uploaded = await resolveImageUrl(
      img.file,
      img.url,
      uploadEntityId,
      token,
    );
    if (uploaded) galleryUrls.push(uploaded);
  }

  return { coverUrl, galleryUrls: [...new Set(galleryUrls)] };
}

function buildCreateBody(
  payload: SubmitPayload,
  coverUrl: string | undefined,
  galleryUrls: string[],
): CreatePartnerTourBody {
  const { formData } = payload;
  const parsed = parseTourSubmitNumbers({
    price: payload.price,
    duration: payload.duration,
    tourDates: payload.tourDates,
  });

  const category = mapLegacyTourCategory(
    payload.tourType ?? formData.tourType,
    payload.region ?? formData.region,
    payload.features ?? formData.features,
  );

  const extras = buildTourExtrasFromForm(formData);
  const stayKind = inferStayKind({
    stayKind: formData.stayKind,
    durationDays: parsed.duration,
    tourType: formData.tourType,
  });
  const destinationScope = inferDestinationScope({
    destinationScope: formData.destinationScope,
    tourType: formData.tourType,
    region: formData.region,
  });
  const departureCities = normalizeDepartureCities(formData.departureCity);

  const dates = parsed.tourDates
    .filter((d) => d.startDate && d.endDate)
    .map((date) => ({
      startDate: date.startDate as string,
      endDate: date.endDate as string,
      capacity: date.availableSeats || 1,
      priceOverride: parsed.price,
      ageRanges: (date.ageRanges ?? []).map((range) => ({
        minAge: range.minAge,
        maxAge: range.maxAge,
        pricingType: mapAgePricingType(
          range.pricingType as 'free' | 'half' | 'percentage' | 'fixed',
        ),
        value: mapAgePricingValue(
          range.pricingType as 'free' | 'half' | 'percentage' | 'fixed',
          String(range.value),
        ),
      })),
    }));

  const accommodationName =
    payload.accommodationName || formData.accommodationName;

  return {
    title: payload.title,
    description: payload.description,
    price: parsed.price,
    category,
    durationDays: stayKind === 'DAY_TRIP' ? 1 : parsed.duration || 1,
    stayKind,
    destinationScope,
    departureCities,
    coverUrl,
    galleryUrls,
    extras,
    asDraft: payload.asDraft === true,
    dates,
    pickupPoints: payload.pickupPoints.map((point, index) => ({
      city: point.city,
      location: point.location,
      time: point.time,
      description: point.description,
      latitude: point.latitude,
      longitude: point.longitude,
      order: point.order ?? index,
    })),
    accommodation: accommodationName
      ? {
          name: accommodationName,
          image: coverUrl ?? '/brand/mark-on-light.png',
          location:
            formData.destinations[0]?.city || formData.location || 'Türkiye',
          type: formData.accommodationType || 'Otel',
        }
      : undefined,
  };
}

/**
 * Atomic create: uploads media first, then single POST with nested
 * dates / pickups / accommodation (server $transaction).
 * agencyId is NEVER sent — JWT session binds ownership.
 */
export async function persistNewPartnerTour(
  payload: SubmitPayload,
  token: string,
  uploadEntityId: string,
) {
  const { coverUrl, galleryUrls } = await resolveMedia(
    payload.formData,
    uploadEntityId,
    token,
  );

  const body = buildCreateBody(payload, coverUrl, galleryUrls);
  const tour = await createPartnerTour(body, token);
  return tour.id;
}

export async function persistPartnerTourUpdate(
  tourId: string,
  payload: SubmitPayload,
  token: string,
  uploadEntityId: string,
) {
  const { formData } = payload;
  const { coverUrl, galleryUrls } = await resolveMedia(
    formData,
    uploadEntityId,
    token,
  );

  const body = buildCreateBody(payload, coverUrl, galleryUrls);

  await updatePartnerTour(
    tourId,
    {
      title: body.title,
      description: body.description,
      price: body.price,
      category: body.category,
      durationDays: body.durationDays,
      stayKind: body.stayKind,
      destinationScope: body.destinationScope,
      departureCities: body.departureCities,
      coverUrl: body.coverUrl,
      galleryUrls: body.galleryUrls?.length ? body.galleryUrls : undefined,
      extras: body.extras,
    },
    token,
  );

  // Dates: only create NEW windows (avoid duplicating booked dates).
  const existingDates = await getTourDates(tourId).catch(() => []);
  const existingRangeKeys = new Set(
    existingDates.map(
      (date) =>
        `${String(date.startDate).slice(0, 10)}|${String(date.endDate).slice(0, 10)}`,
    ),
  );

  for (const date of body.dates ?? []) {
    const rangeKey = `${date.startDate}|${date.endDate}`;
    if (existingRangeKeys.has(rangeKey)) continue;

    const created = await createTourDate(
      tourId,
      {
        startDate: date.startDate,
        endDate: date.endDate,
        capacity: date.capacity,
        priceOverride: date.priceOverride,
      },
      token,
    );
    existingRangeKeys.add(rangeKey);

    for (const range of date.ageRanges ?? []) {
      await createTourDateAgeRange(tourId, created.id, range, token);
    }
  }

  const existingPickups = await listTourPickupPoints(tourId, token).catch(
    () => [],
  );
  for (const existing of existingPickups) {
    await deleteTourPickupPoint(tourId, existing.id, token);
  }
  for (const point of body.pickupPoints ?? []) {
    await createTourPickupPoint(tourId, point, token);
  }

  if (body.accommodation) {
    await upsertTourAccommodation(tourId, body.accommodation, token);
  }
}

export function isTourSubmitPayload(
  data: TourFormData | Record<string, unknown>,
): data is Record<string, unknown> & { formData: TourFormData } {
  return typeof data === 'object' && data !== null && 'formData' in data;
}
