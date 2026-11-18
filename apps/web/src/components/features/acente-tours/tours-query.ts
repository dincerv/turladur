import {
  AGENCY_TOUR_CATEGORIES,
  AGENCY_TOUR_STATUS_FILTERS,
  AGENCY_TOURS_Q_MAX,
  parseAgencyToursQuery,
  type AgencyTourCategory,
  type AgencyTourStatusFilter,
  type AgencyToursQuery,
} from '@turta/shared-validators';

export const TOUR_STATUS_FILTERS = AGENCY_TOUR_STATUS_FILTERS;
export const TOUR_CATEGORIES = AGENCY_TOUR_CATEGORIES;
export type TourStatusFilter = AgencyTourStatusFilter;
export type TourCategoryFilter = AgencyTourCategory;
export type ToursSearchParams = AgencyToursQuery;

export function parseToursSearchParams(
  input: URLSearchParams | Record<string, string | string[] | undefined>,
): ToursSearchParams {
  const raw =
    input instanceof URLSearchParams
      ? {
          q: input.get('q') ?? '',
          status: input.get('status') ?? undefined,
          category: input.get('category') ?? undefined,
          page: input.get('page') ?? '1',
          view: input.get('view') ?? 'list',
        }
      : {
          q: Array.isArray(input.q) ? input.q[0] : (input.q ?? ''),
          status: Array.isArray(input.status) ? input.status[0] : input.status,
          category: Array.isArray(input.category)
            ? input.category[0]
            : input.category,
          page: Array.isArray(input.page) ? input.page[0] : (input.page ?? '1'),
          view: Array.isArray(input.view)
            ? input.view[0]
            : (input.view ?? 'list'),
        };

  try {
    return parseAgencyToursQuery(raw);
  } catch {
    return parseAgencyToursQuery({});
  }
}

export function toursSearchToQueryString(params: ToursSearchParams): string {
  const sp = new URLSearchParams();
  if (params.q) sp.set('q', params.q.slice(0, AGENCY_TOURS_Q_MAX));
  if (params.status) sp.set('status', params.status);
  if (params.category) sp.set('category', params.category);
  if (params.page > 1) sp.set('page', String(params.page));
  if (params.view === 'grid') sp.set('view', 'grid');
  return sp.toString();
}

export function sanitizeTourText(raw: string, max = 120): string {
  return raw
    .replace(/<[^>]*>/g, '')
    .replace(/[\u0000-\u001F\u007F]/g, '')
    .trim()
    .slice(0, max);
}

export function isTourLive(status: string): boolean {
  return status === 'PUBLISHED' || status === 'ACTIVE';
}

export function nextTourToggleStatus(status: string): 'PUBLISHED' | 'ARCHIVED' {
  return isTourLive(status) ? 'ARCHIVED' : 'PUBLISHED';
}
