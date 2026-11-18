import {
  AGENCY_FINANCIALS_PAGE_SIZE_MAX,
  AGENCY_FINANCIALS_Q_MAX,
  FINANCIAL_PAYMENT_STATUSES,
  parseAgencyFinancialsQuery,
  type FinancialPaymentStatus,
} from '@turta/shared-validators';

export type FinancialsSearchParams = {
  q: string;
  status: FinancialPaymentStatus | null;
  startDate: string;
  endDate: string;
  page: number;
  pageSize: number;
};

const STATUS_SET = new Set<string>(FINANCIAL_PAYMENT_STATUSES);

export function parseFinancialsSearchParams(
  searchParams: URLSearchParams | { get: (key: string) => string | null },
): FinancialsSearchParams {
  const statusRaw = searchParams.get('status');
  const raw = {
    q: searchParams.get('q') ?? '',
    status:
      statusRaw && STATUS_SET.has(statusRaw)
        ? (statusRaw as FinancialPaymentStatus)
        : undefined,
    startDate: searchParams.get('startDate') ?? undefined,
    endDate: searchParams.get('endDate') ?? undefined,
    page: searchParams.get('page') ?? '1',
    pageSize: searchParams.get('pageSize') ?? '20',
  };

  try {
    const parsed = parseAgencyFinancialsQuery(raw);
    return {
      q: parsed.q,
      status: parsed.status ?? null,
      startDate: parsed.startDate ?? '',
      endDate: parsed.endDate ?? '',
      page: parsed.page,
      pageSize: parsed.pageSize,
    };
  } catch {
    return {
      q: (raw.q ?? '').trim().slice(0, AGENCY_FINANCIALS_Q_MAX),
      status:
        statusRaw && STATUS_SET.has(statusRaw)
          ? (statusRaw as FinancialPaymentStatus)
          : null,
      startDate: '',
      endDate: '',
      page: 1,
      pageSize: 20,
    };
  }
}

export function financialsSearchToQueryString(
  params: FinancialsSearchParams,
): string {
  const sp = new URLSearchParams();
  if (params.q) sp.set('q', params.q.slice(0, AGENCY_FINANCIALS_Q_MAX));
  if (params.status) sp.set('status', params.status);
  if (params.startDate) sp.set('startDate', params.startDate);
  if (params.endDate) sp.set('endDate', params.endDate);
  if (params.page > 1) sp.set('page', String(params.page));
  if (params.pageSize !== 20) {
    sp.set(
      'pageSize',
      String(Math.min(AGENCY_FINANCIALS_PAGE_SIZE_MAX, params.pageSize)),
    );
  }
  return sp.toString();
}
