import {
  AGENCY_RESERVATION_STATUS_FILTERS,
  AGENCY_RESERVATIONS_PAGE_SIZE_MAX,
  AGENCY_RESERVATIONS_Q_MAX,
  parseAgencyReservationsQuery,
  type AgencyReservationStatusFilter,
  type AgencyReservationsQuery,
} from '@turta/shared-validators';

export type ReservationStatusFilter = AgencyReservationStatusFilter;

export type ReservationsSearchParams = {
  q: string;
  status: ReservationStatusFilter | null;
  dateFrom: string;
  dateTo: string;
  page: number;
  pageSize: number;
};

export const RESERVATION_STATUS_FILTERS: ReservationStatusFilter[] = [
  ...AGENCY_RESERVATION_STATUS_FILTERS,
];

export function parseReservationsSearchParams(
  searchParams: URLSearchParams | { get: (key: string) => string | null },
): ReservationsSearchParams {
  const raw = {
    q: searchParams.get('q') ?? '',
    status: searchParams.get('status') ?? undefined,
    dateFrom: searchParams.get('dateFrom') ?? undefined,
    dateTo: searchParams.get('dateTo') ?? undefined,
    page: searchParams.get('page') ?? '1',
    pageSize: searchParams.get('pageSize') ?? '20',
  };

  try {
    const parsed: AgencyReservationsQuery = parseAgencyReservationsQuery(raw);
    return {
      q: parsed.q,
      status: parsed.status ?? null,
      dateFrom: parsed.dateFrom ?? '',
      dateTo: parsed.dateTo ?? '',
      page: parsed.page,
      pageSize: parsed.pageSize,
    };
  } catch {
    return {
      q: (raw.q ?? '').trim().slice(0, AGENCY_RESERVATIONS_Q_MAX),
      status: null,
      dateFrom: '',
      dateTo: '',
      page: 1,
      pageSize: 20,
    };
  }
}

export function reservationsSearchToQueryString(
  params: ReservationsSearchParams,
): string {
  const sp = new URLSearchParams();
  if (params.q) sp.set('q', params.q.slice(0, AGENCY_RESERVATIONS_Q_MAX));
  if (params.status) sp.set('status', params.status);
  if (params.dateFrom) sp.set('dateFrom', params.dateFrom);
  if (params.dateTo) sp.set('dateTo', params.dateTo);
  if (params.page > 1) sp.set('page', String(params.page));
  if (params.pageSize !== 20) {
    sp.set(
      'pageSize',
      String(Math.min(AGENCY_RESERVATIONS_PAGE_SIZE_MAX, params.pageSize)),
    );
  }
  return sp.toString();
}
