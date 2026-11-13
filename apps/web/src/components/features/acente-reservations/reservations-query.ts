export type ReservationStatusFilter =
  'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'SUSPENDED';

export type ReservationsSearchParams = {
  q: string;
  status: ReservationStatusFilter | null;
  dateFrom: string;
  dateTo: string;
  page: number;
};

export const RESERVATION_STATUS_FILTERS: ReservationStatusFilter[] = [
  'PENDING',
  'CONFIRMED',
  'COMPLETED',
  'CANCELLED',
  'SUSPENDED',
];

const STATUS_SET = new Set<string>(RESERVATION_STATUS_FILTERS);

function parsePage(raw: string | null): number {
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.floor(n);
}

function parseDate(raw: string | null): string {
  if (!raw) return '';
  return /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : '';
}

export function parseReservationsSearchParams(
  searchParams: URLSearchParams | { get: (key: string) => string | null },
): ReservationsSearchParams {
  const statusRaw = searchParams.get('status');
  const status =
    statusRaw && STATUS_SET.has(statusRaw)
      ? (statusRaw as ReservationStatusFilter)
      : null;

  return {
    q: (searchParams.get('q') ?? '').trim().slice(0, 80),
    status,
    dateFrom: parseDate(searchParams.get('dateFrom')),
    dateTo: parseDate(searchParams.get('dateTo')),
    page: parsePage(searchParams.get('page')),
  };
}

export function reservationsSearchToQueryString(
  params: ReservationsSearchParams,
): string {
  const sp = new URLSearchParams();
  if (params.q) sp.set('q', params.q);
  if (params.status) sp.set('status', params.status);
  if (params.dateFrom) sp.set('dateFrom', params.dateFrom);
  if (params.dateTo) sp.set('dateTo', params.dateTo);
  if (params.page > 1) sp.set('page', String(params.page));
  return sp.toString();
}
