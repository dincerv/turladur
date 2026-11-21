import { apiRequest } from './api-client';

/** Curated destination route label (Kapadokya vs interest filter). */
export type RouteCategory =
  'historical' | 'nature' | 'beach' | 'gastronomy' | 'family';

/** Partner Tur Tipi → Tour.category interest card keys (+ legacy query aliases). */
export type InterestCategoryKey =
  | 'CULTURAL'
  | 'NATURE'
  | 'BEACH'
  | 'GASTRONOMY'
  | 'ADVENTURE'
  | 'CITY'
  | RouteCategory;

export type RouteDefinition = {
  id: string;
  name: string;
  description: string;
  longDescription: string;
  image: string;
  location: string;
  clusterLabel?: string;
  bestTimeToVisit: string;
  weather: string;
  transportation: string;
  duration: string;
  highlights: string[];
  category: RouteCategory;
  matchKeywords: string[];
};

export type RouteWithStats = RouteDefinition & {
  tourCount: number;
  /** Present when catalog API aggregates reviews; older payloads omit it. */
  reviewCount?: number;
  priceRange: string | null;
  avgRating: number | null;
  computedDuration: string | null;
};

export type RoutesListResponse = {
  routes: RouteWithStats[];
  categories: Array<{
    key: InterestCategoryKey | string;
    name: string;
    description: string;
    color: string;
    count: number;
  }>;
  stats: {
    routeCount: number;
    tourCount: number;
    operatorCount: number;
    avgRating: number | null;
  };
};

export type RouteDetailResponse = {
  route: RouteWithStats;
  tours: Array<{
    id: string;
    title: string;
    description: string;
    category: string;
    durationDays: number;
    price: string;
    averageRating: string;
    partnerId: string;
  }>;
};

export type RouteSearchParams = {
  q?: string;
  /** Legacy query key used by some UI pages — mapped to `q`. */
  search?: string;
  category?: string;
  duration?: string;
  season?: string;
};

export async function listRoutes(
  params: RouteSearchParams & { fresh?: boolean } = {},
) {
  const query = new URLSearchParams();
  const q = params.q ?? params.search;
  if (q) query.set('q', q);
  if (params.category) query.set('category', params.category);
  if (params.duration) query.set('duration', params.duration);
  if (params.season) query.set('season', params.season);
  const qs = query.toString();
  return apiRequest<RoutesListResponse>(
    `/catalog/routes${qs ? `?${qs}` : ''}`,
    params.fresh ? { cache: 'no-store' } : { next: { revalidate: 60 } },
  );
}

export async function getRouteById(id: string, params: RouteSearchParams = {}) {
  const query = new URLSearchParams();
  const q = params.q ?? params.search;
  if (q) query.set('q', q);
  if (params.category) query.set('category', params.category);
  if (params.duration) query.set('duration', params.duration);
  if (params.season) query.set('season', params.season);
  const qs = query.toString();
  return apiRequest<RouteDetailResponse>(
    `/catalog/routes/${id}${qs ? `?${qs}` : ''}`,
    { next: { revalidate: 120 } },
  );
}
