import {
  parseAgencyReportsQuery,
  REPORT_DATE_RANGE_IDS,
} from '@turta/shared-validators';

export type ReportsSearchParams = {
  period: 'monthly' | 'yearly' | null;
  dateRange: string;
  startDate: string;
  endDate: string;
};

const RANGE_SET = new Set<string>(REPORT_DATE_RANGE_IDS);

export function parseReportsSearchParams(
  searchParams: URLSearchParams | { get: (key: string) => string | null },
): ReportsSearchParams {
  const periodRaw = searchParams.get('period');
  const dateRangeRaw = searchParams.get('dateRange');
  const raw = {
    period:
      periodRaw === 'monthly' || periodRaw === 'yearly' ? periodRaw : undefined,
    dateRange:
      dateRangeRaw && RANGE_SET.has(dateRangeRaw) ? dateRangeRaw : undefined,
    startDate: searchParams.get('startDate') || undefined,
    endDate: searchParams.get('endDate') || undefined,
  };

  try {
    const parsed = parseAgencyReportsQuery(raw);
    return {
      period: parsed.period ?? null,
      dateRange: parsed.dateRange ?? 'thisMonth',
      startDate: parsed.startDate ?? '',
      endDate: parsed.endDate ?? '',
    };
  } catch {
    return {
      period: null,
      dateRange: 'thisMonth',
      startDate: '',
      endDate: '',
    };
  }
}

export function reportsSearchToQueryString(
  params: ReportsSearchParams,
): string {
  const sp = new URLSearchParams();
  if (params.period) sp.set('period', params.period);
  if (params.dateRange && params.dateRange !== 'thisMonth') {
    sp.set('dateRange', params.dateRange);
  }
  if (params.startDate) sp.set('startDate', params.startDate);
  if (params.endDate) sp.set('endDate', params.endDate);
  return sp.toString();
}
