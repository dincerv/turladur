import {
  AGENCY_REVIEWS_PAGE_SIZE_MAX,
  AGENCY_REVIEWS_Q_MAX,
  parseAgencyReviewsQuery,
  type AgencyReviewsQuery,
} from '@turta/shared-validators';

export type ReviewsSearchParams = AgencyReviewsQuery;

export function parseReviewsSearchParams(
  searchParams: URLSearchParams | { get: (key: string) => string | null },
): ReviewsSearchParams {
  const raw = {
    q: searchParams.get('q') ?? '',
    rating: searchParams.get('rating') ?? undefined,
    tourId: searchParams.get('tourId') ?? undefined,
    responseStatus: searchParams.get('responseStatus') ?? 'all',
    sort: searchParams.get('sort') ?? 'newest',
    page: searchParams.get('page') ?? '1',
    pageSize: searchParams.get('pageSize') ?? '20',
  };

  try {
    return parseAgencyReviewsQuery(raw);
  } catch {
    return {
      q: (raw.q ?? '').trim().slice(0, AGENCY_REVIEWS_Q_MAX),
      rating: undefined,
      tourId: undefined,
      responseStatus: 'all',
      sort: 'newest',
      page: 1,
      pageSize: 20,
    };
  }
}

export function reviewsSearchToQueryString(
  params: ReviewsSearchParams,
): string {
  const sp = new URLSearchParams();
  if (params.q) sp.set('q', params.q.slice(0, AGENCY_REVIEWS_Q_MAX));
  if (params.rating) sp.set('rating', String(params.rating));
  if (params.tourId) sp.set('tourId', params.tourId);
  if (params.responseStatus && params.responseStatus !== 'all') {
    sp.set('responseStatus', params.responseStatus);
  }
  if (params.sort && params.sort !== 'newest') sp.set('sort', params.sort);
  if (params.page > 1) sp.set('page', String(params.page));
  if (params.pageSize !== 20) {
    sp.set(
      'pageSize',
      String(Math.min(AGENCY_REVIEWS_PAGE_SIZE_MAX, params.pageSize)),
    );
  }
  return sp.toString();
}
