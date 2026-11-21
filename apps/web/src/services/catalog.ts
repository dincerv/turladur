import type { CompareToursResponse, Tour } from '@turta/shared-types';
import { parseCompareToursRequest } from '@turta/shared-validators';

import { apiRequest, apiRequestWithMeta } from './api-client';

export type TourSearchParams = {
  q?: string;
  category?: string;
  /** Bucket: 1 | 2-3 | 4-6 | 7+ */
  duration?: string;
  durationDays?: number;
  featured?: boolean;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  sortBy?: 'createdAt' | 'price' | 'rating' | 'durationDays';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
  /** Marketplace agency (seller) filter */
  agencyId?: string;
  stayKind?: 'DAY_TRIP' | 'OVERNIGHT';
  destinationScope?: 'DOMESTIC' | 'INTERNATIONAL';
  departureCity?: string;
};

export async function searchTours(params: TourSearchParams = {}) {
  const query = new URLSearchParams();
  if (params.q) query.set('q', params.q);
  if (params.category) query.set('category', params.category);
  if (params.duration) query.set('duration', params.duration);
  if (params.durationDays != null) {
    query.set('durationDays', String(params.durationDays));
  }
  if (params.featured === true) query.set('featured', 'true');
  if (params.minPrice != null) query.set('minPrice', String(params.minPrice));
  if (params.maxPrice != null) query.set('maxPrice', String(params.maxPrice));
  if (params.minRating != null)
    query.set('minRating', String(params.minRating));
  if (params.sortBy) query.set('sortBy', params.sortBy);
  if (params.sortOrder) query.set('sortOrder', params.sortOrder);
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));
  if (params.agencyId) query.set('agencyId', params.agencyId);
  if (params.stayKind) query.set('stayKind', params.stayKind);
  if (params.destinationScope) {
    query.set('destinationScope', params.destinationScope);
  }
  if (params.departureCity) query.set('departureCity', params.departureCity);

  const qs = query.toString();
  return apiRequestWithMeta<Tour[]>(
    `/catalog/tours/search${qs ? `?${qs}` : ''}`,
    { next: { revalidate: 60 } },
  );
}

export async function getTourById(id: string) {
  return apiRequest<Tour>(`/catalog/tours/${id}`, {
    next: { revalidate: 60 },
  });
}

/** Bulk compare — validated client-side (max 4) before Nest Zod/class-validator. */
export async function getComparedTours(
  ids: string[],
  signal?: AbortSignal,
): Promise<CompareToursResponse> {
  const body = parseCompareToursRequest({ ids });
  return apiRequest<CompareToursResponse>('/catalog/tours/compare', {
    method: 'POST',
    body,
    signal,
    cache: 'no-store',
  });
}

export type TourDateRow = {
  id: string;
  tourId: string;
  startDate: string;
  endDate: string;
  capacity: number;
  remainingCapacity: number;
  priceOverride: string | null;
  isActive: boolean;
};

export async function getTourDates(tourId: string) {
  return apiRequest<TourDateRow[]>(`/catalog/tours/${tourId}/dates`, {
    next: { revalidate: 30 },
  });
}

export type TourPickupPoint = {
  id: string;
  tourId: string;
  city: string;
  location: string;
  time: string;
  description: string | null;
  latitude?: number | null;
  longitude?: number | null;
  order: number;
  isActive: boolean;
};

export async function getTourPickupPoints(tourId: string) {
  return apiRequest<TourPickupPoint[]>(
    `/catalog/tours/${tourId}/pickup-points`,
    { next: { revalidate: 60 } },
  );
}

export type TourRouteStop = {
  id: string;
  tourId: string;
  dayNumber: number;
  order: number;
  name: string;
  description: string | null;
  latitude: number;
  longitude: number;
  kind: 'VISIT' | 'LODGING';
};

export async function getTourRouteStops(tourId: string, signal?: AbortSignal) {
  return apiRequest<TourRouteStop[]>(`/catalog/tours/${tourId}/route-stops`, {
    next: { revalidate: 60 },
    signal,
  });
}

export type GeoPlaceSuggestion = {
  id: string;
  label: string;
  latitude: number;
  longitude: number;
};

export async function searchGeoPlaces(q: string, signal?: AbortSignal) {
  const query = q.trim();
  if (query.length < 2) return [] as GeoPlaceSuggestion[];
  return apiRequest<GeoPlaceSuggestion[]>(
    `/catalog/geo/places?q=${encodeURIComponent(query)}`,
    { cache: 'no-store', signal },
  );
}

export type TourPaidExtra = {
  id: string;
  tourId: string;
  title: string;
  description: string | null;
  dayNumber: number | null;
  price: string;
  currency: string;
  isRequired: boolean;
  isActive: boolean;
  sortOrder: number;
};

export async function getTourPaidExtras(tourId: string) {
  return apiRequest<TourPaidExtra[]>(`/catalog/tours/${tourId}/extras`, {
    cache: 'no-store',
  });
}

export type TourAccommodation = {
  name: string;
  image: string;
  location: string;
  type: string;
  rating?: number;
  features?: string[];
};

export async function getTourAccommodation(tourId: string) {
  return apiRequest<TourAccommodation | null>(
    `/catalog/tours/${tourId}/accommodation`,
    { cache: 'no-store' },
  );
}

export type TourDateAgeRange = {
  id: string;
  minAge: number;
  maxAge: number | null;
  pricingType: string;
  value: number;
};

export async function getTourDateAgeRanges(tourId: string, dateId: string) {
  return apiRequest<TourDateAgeRange[]>(
    `/catalog/tours/${tourId}/dates/${dateId}/age-ranges`,
    { cache: 'no-store' },
  );
}

/** Client-side search (supports AbortSignal for debounce). */
export async function searchToursClient(
  params: TourSearchParams & { signal?: AbortSignal } = {},
) {
  const { signal, ...rest } = params;
  const query = new URLSearchParams();
  if (rest.q) query.set('q', rest.q);
  if (rest.category) query.set('category', rest.category);
  if (rest.duration) query.set('duration', rest.duration);
  if (rest.durationDays != null) {
    query.set('durationDays', String(rest.durationDays));
  }
  if (rest.featured === true) query.set('featured', 'true');
  if (rest.minPrice != null) query.set('minPrice', String(rest.minPrice));
  if (rest.maxPrice != null) query.set('maxPrice', String(rest.maxPrice));
  if (rest.minRating != null) query.set('minRating', String(rest.minRating));
  if (rest.sortBy) query.set('sortBy', rest.sortBy);
  if (rest.sortOrder) query.set('sortOrder', rest.sortOrder);
  if (rest.page) query.set('page', String(rest.page));
  if (rest.limit) query.set('limit', String(rest.limit));
  if (rest.agencyId) query.set('agencyId', rest.agencyId);
  if (rest.stayKind) query.set('stayKind', rest.stayKind);
  if (rest.destinationScope) {
    query.set('destinationScope', rest.destinationScope);
  }
  if (rest.departureCity) query.set('departureCity', rest.departureCity);

  const qs = query.toString();
  return searchToursByQueryString(qs, signal);
}

export async function searchToursByQueryString(
  qs: string,
  signal?: AbortSignal,
) {
  return apiRequestWithMeta<Tour[]>(
    `/catalog/tours/search${qs ? `?${qs}` : ''}`,
    { signal, cache: 'no-store' },
  );
}

/** Soft-fail helper for optional detail fields (accommodation may be null). */
export async function tryGetTourDetailBundle(
  tourId: string,
  signal?: AbortSignal,
) {
  const soft = async <T>(fn: () => Promise<T>): Promise<T | null> => {
    try {
      return await fn();
    } catch (err) {
      if (
        signal?.aborted ||
        (err instanceof Error &&
          (err.name === 'AbortError' || err.name === 'TimeoutError'))
      ) {
        return null;
      }
      return null;
    }
  };

  return Promise.all([
    soft(() =>
      apiRequest<Tour>(`/catalog/tours/${tourId}`, {
        signal,
        cache: 'no-store',
      }),
    ),
    soft(() =>
      apiRequest<TourDateRow[]>(`/catalog/tours/${tourId}/dates`, {
        signal,
        cache: 'no-store',
      }),
    ),
    soft(() =>
      apiRequest<TourAccommodation | null>(
        `/catalog/tours/${tourId}/accommodation`,
        { signal, cache: 'no-store' },
      ),
    ),
    soft(() =>
      apiRequest<TourPickupPoint[]>(`/catalog/tours/${tourId}/pickup-points`, {
        signal,
        cache: 'no-store',
      }),
    ),
    soft(() =>
      apiRequest<TourRouteStop[]>(`/catalog/tours/${tourId}/route-stops`, {
        signal,
        cache: 'no-store',
      }),
    ),
  ]);
}

export async function tryGetTourDateAgeRanges(
  tourId: string,
  dateId: string,
  signal?: AbortSignal,
) {
  try {
    return await apiRequest<TourDateAgeRange[]>(
      `/catalog/tours/${tourId}/dates/${dateId}/age-ranges`,
      { signal, cache: 'no-store' },
    );
  } catch {
    return null;
  }
}
