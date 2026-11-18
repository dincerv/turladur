'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { RefreshCw, Target } from 'lucide-react';

import {
  OccupancyBarChart,
  RevenueTrendChart,
  SatisfactionPieChart,
} from '@/components/features/acente-reports/reports-charts';
import { useAuth } from '@/providers/auth-provider';
import { hasFullPartnerAccess } from '@/lib/partner-permissions';
import { ApiError } from '@/services/api-client';
import {
  getPartnerReports,
  type PartnerReportsData,
  type ReportDateRangeId,
} from '@/services/partner-admin';

import {
  parseReportsSearchParams,
  reportsSearchToQueryString,
  type ReportsSearchParams,
} from './reports-query';

const PRESET_RANGES: Array<{ id: ReportDateRangeId; label: string }> = [
  { id: 'thisMonth', label: 'Bu Ay' },
  { id: 'last3Months', label: 'Son 3 Ay' },
  { id: 'thisYear', label: 'Bu Yıl' },
  { id: 'lastMonth', label: 'Geçen Ay' },
  { id: 'custom', label: 'Özel' },
];

function money(n: number) {
  return n.toLocaleString('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    maximumFractionDigits: 0,
  });
}

function KpiSkeleton() {
  return (
    <div
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
      data-testid="reports-kpi-skeleton"
    >
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="h-28 animate-pulse rounded-xl border border-gray-100 bg-white"
        />
      ))}
    </div>
  );
}

export function AcenteReportsPage() {
  const { accessToken, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const allowed = hasFullPartnerAccess(user?.role);
  const filters = useMemo(
    () => parseReportsSearchParams(searchParams),
    [searchParams],
  );

  const [data, setData] = useState<PartnerReportsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const replaceFilters = useCallback(
    (next: ReportsSearchParams) => {
      const qs = reportsSearchToQueryString(next);
      startTransition(() => {
        router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
      });
    },
    [pathname, router],
  );

  const load = useCallback(async () => {
    if (!accessToken || !allowed) return;
    setLoading(true);
    setError(null);
    try {
      const result = await getPartnerReports(accessToken, {
        period: filters.period ?? undefined,
        dateRange: filters.dateRange as ReportDateRangeId,
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
      });
      setData(result);
    } catch (err) {
      setData(null);
      setError(err instanceof ApiError ? err.message : 'Raporlar yüklenemedi');
    } finally {
      setLoading(false);
    }
  }, [accessToken, allowed, filters]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!allowed) {
    return (
      <div
        className="rounded-xl border border-amber-200 bg-amber-50 px-6 py-12 text-center"
        data-testid="reports-forbidden"
      >
        <h1 className="text-lg font-semibold text-amber-900">Erişim yok</h1>
        <p className="mt-2 text-sm text-amber-800">
          Raporlar yalnızca acente sahibi (OWNER) veya yönetici (MANAGER)
          rollerine açıktır.
        </p>
      </div>
    );
  }

  const kpis = data
    ? [
        {
          key: 'revenue',
          label: 'Toplam ciro',
          value: money(data.sales.summary.totalRevenue),
        },
        {
          key: 'sales',
          label: 'Satış adedi',
          value: String(data.sales.summary.totalSales),
        },
        {
          key: 'occupancy',
          label: 'Doluluk',
          value: `%${data.sales.occupancy?.occupancyRate ?? data.performance.summary.occupancyRate ?? 0}`,
        },
        {
          key: 'completion',
          label: 'Tamamlanma',
          value: `%${data.performance.summary.completionRate}`,
        },
      ]
    : [];

  return (
    <div className="space-y-6" data-testid="acente-reports-page">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Raporlar</h1>
          <p className="mt-1 text-sm text-gray-600">
            Ciro trendi, tur dolulukları ve dönemsel hedef takibi — yalnızca
            acentenize ait veriler.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
          data-testid="reports-refresh-btn"
        >
          <RefreshCw className="h-4 w-4" />
          Yenile
        </button>
      </div>

      <div
        className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm"
        data-testid="reports-filters"
      >
        <div className="flex flex-wrap gap-2" data-testid="reports-period-tabs">
          <button
            type="button"
            data-testid="reports-period-monthly"
            onClick={() =>
              replaceFilters({
                ...filters,
                period: 'monthly',
                dateRange: 'thisMonth',
                startDate: '',
                endDate: '',
              })
            }
            className={`rounded-lg border px-3 py-1.5 text-xs font-medium ${
              filters.period === 'monthly' ||
              (!filters.period && filters.dateRange === 'thisMonth')
                ? 'border-blue-200 bg-blue-50 text-blue-800'
                : 'border-gray-200 text-gray-600'
            }`}
          >
            Aylık
          </button>
          <button
            type="button"
            data-testid="reports-period-yearly"
            onClick={() =>
              replaceFilters({
                ...filters,
                period: 'yearly',
                dateRange: 'thisYear',
                startDate: '',
                endDate: '',
              })
            }
            className={`rounded-lg border px-3 py-1.5 text-xs font-medium ${
              filters.period === 'yearly' || filters.dateRange === 'thisYear'
                ? 'border-blue-200 bg-blue-50 text-blue-800'
                : 'border-gray-200 text-gray-600'
            }`}
          >
            Yıllık
          </button>
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {PRESET_RANGES.map((r) => (
            <button
              key={r.id}
              type="button"
              data-testid={`reports-range-${r.id}`}
              onClick={() =>
                replaceFilters({
                  ...filters,
                  dateRange: r.id,
                  period:
                    r.id === 'thisYear'
                      ? 'yearly'
                      : r.id === 'custom'
                        ? filters.period
                        : 'monthly',
                  startDate: r.id === 'custom' ? filters.startDate : '',
                  endDate: r.id === 'custom' ? filters.endDate : '',
                })
              }
              className={`rounded-full border px-3 py-1 text-xs font-medium ${
                filters.dateRange === r.id
                  ? 'border-blue-200 bg-blue-50 text-blue-700'
                  : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        {filters.dateRange === 'custom' ? (
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <input
              type="date"
              value={filters.startDate}
              data-testid="reports-start-date"
              onChange={(e) =>
                replaceFilters({ ...filters, startDate: e.target.value })
              }
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
            <input
              type="date"
              value={filters.endDate}
              data-testid="reports-end-date"
              onChange={(e) =>
                replaceFilters({ ...filters, endDate: e.target.value })
              }
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
        ) : null}

        {data ? (
          <p
            className="mt-3 text-xs text-gray-500"
            data-testid="reports-range-label"
          >
            {data.dateRange.label}: {data.sales.periodRangeText}
          </p>
        ) : null}
      </div>

      {error ? (
        <p
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
          data-testid="reports-error"
        >
          {error}
        </p>
      ) : null}

      {loading || isPending ? <KpiSkeleton /> : null}

      {!loading && !isPending && data ? (
        <>
          <div
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
            data-testid="reports-kpi-grid"
          >
            {kpis.map((k) => (
              <div
                key={k.key}
                className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm"
                data-testid={`reports-kpi-${k.key}`}
              >
                <p className="text-sm font-medium text-gray-600">{k.label}</p>
                <p className="mt-2 text-2xl font-semibold text-gray-900">
                  {k.value}
                </p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <RevenueTrendChart data={data.sales.trend} />
            <OccupancyBarChart data={data.sales.occupancy?.byTour ?? []} />
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <SatisfactionPieChart
              data={data.customer.satisfactionDistribution}
            />
            <div
              className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm"
              data-testid="reports-goals"
            >
              <div className="mb-4 flex items-center gap-2">
                <Target className="h-4 w-4 text-blue-600" />
                <h3 className="text-sm font-semibold text-gray-900">
                  Hedef takibi
                </h3>
              </div>
              <div className="space-y-4">
                {data.performance.goals.map((goal) => (
                  <div
                    key={goal.metric ?? goal.name}
                    data-testid={`reports-goal-${goal.metric ?? 'item'}`}
                  >
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="font-medium text-gray-700">
                        {goal.name}
                      </span>
                      <span className="text-gray-900">
                        {goal.metric === 'revenue'
                          ? `${money(goal.current)} / ${money(goal.target)}`
                          : `${goal.current} / ${goal.target}`}
                      </span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-gray-100">
                      <div
                        className={`h-full rounded-full ${
                          goal.percentage >= 90
                            ? 'bg-emerald-500'
                            : goal.percentage >= 70
                              ? 'bg-amber-400'
                              : 'bg-red-400'
                        }`}
                        style={{ width: `${goal.percentage}%` }}
                      />
                    </div>
                    <p className="mt-1 text-right text-xs text-gray-500">
                      %{goal.percentage}
                      {goal.source === 'baseline' ? ' · baz hedef' : ''}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
