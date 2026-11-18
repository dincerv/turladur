import {
  AGENCY_CUSTOMERS_PAGE_SIZE_MAX,
  AGENCY_CUSTOMERS_Q_MAX,
  parseAgencyCustomersQuery,
} from '@turta/shared-validators';

export type CustomersSearchParams = {
  q: string;
  page: number;
  pageSize: number;
};

export function parseCustomersSearchParams(
  searchParams: URLSearchParams | { get: (key: string) => string | null },
): CustomersSearchParams {
  const raw = {
    q: searchParams.get('q') ?? '',
    page: searchParams.get('page') ?? '1',
    pageSize: searchParams.get('pageSize') ?? '20',
  };

  try {
    return parseAgencyCustomersQuery(raw);
  } catch {
    return {
      q: (raw.q ?? '').trim().slice(0, AGENCY_CUSTOMERS_Q_MAX),
      page: 1,
      pageSize: 20,
    };
  }
}

export function customersSearchToQueryString(
  params: CustomersSearchParams,
): string {
  const sp = new URLSearchParams();
  if (params.q) sp.set('q', params.q.slice(0, AGENCY_CUSTOMERS_Q_MAX));
  if (params.page > 1) sp.set('page', String(params.page));
  if (params.pageSize !== 20) {
    sp.set(
      'pageSize',
      String(Math.min(AGENCY_CUSTOMERS_PAGE_SIZE_MAX, params.pageSize)),
    );
  }
  return sp.toString();
}
