'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Search,
  Users,
} from 'lucide-react';

import { useDebouncedInput } from '@/components/features/activity/activities-page/use-debounced-input';
import { useAuth } from '@/providers/auth-provider';
import { ApiError } from '@/services/api-client';
import {
  listPartnerCustomers,
  type PartnerCustomerListItem,
  type PartnerCustomerListMeta,
} from '@/services/partner-admin';

import { CustomerDetailDrawer } from './customer-detail-drawer';
import {
  customersSearchToQueryString,
  parseCustomersSearchParams,
  type CustomersSearchParams,
} from './customers-query';

const SAFE_ERROR = 'Müşteri listesi yüklenemedi. Lütfen tekrar deneyin.';

function CustomersSkeleton() {
  return (
    <div className="animate-pulse space-y-2" data-testid="customers-skeleton">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="h-12 rounded-lg border border-neutral-100 bg-white"
        />
      ))}
    </div>
  );
}

export function AcenteCustomersPage() {
  const { accessToken } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const filters = useMemo(
    () => parseCustomersSearchParams(searchParams),
    [searchParams],
  );

  const [rows, setRows] = useState<PartnerCustomerListItem[]>([]);
  const [meta, setMeta] = useState<PartnerCustomerListMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const replaceFilters = useCallback(
    (next: CustomersSearchParams) => {
      const qs = customersSearchToQueryString(next);
      startTransition(() => {
        router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
      });
    },
    [pathname, router],
  );

  const { draft, setDraft, flush } = useDebouncedInput(filters.q, (value) => {
    replaceFilters({ ...filters, q: value.trim(), page: 1 });
  });

  const load = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const result = await listPartnerCustomers(accessToken, {
        q: filters.q || undefined,
        page: filters.page,
        pageSize: filters.pageSize,
      });
      setRows(result.items);
      setMeta(result.meta);
    } catch (err) {
      setRows([]);
      setMeta(null);
      setError(err instanceof ApiError ? err.message : SAFE_ERROR);
    } finally {
      setLoading(false);
    }
  }, [accessToken, filters.q, filters.page, filters.pageSize]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-6" data-testid="acente-customers-page">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Müşteriler</h1>
          <p className="mt-1 text-sm text-gray-600">
            Acentenize ait rezervasyonlardan derlenen müşteri listesi. İletişim
            bilgileri maskelenir; detay için satıra tıklayın.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
          data-testid="customers-refresh-btn"
        >
          <RefreshCw className="h-4 w-4" />
          Yenile
        </button>
      </div>

      <div
        className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm"
        data-testid="customers-filters"
      >
        <div className="relative max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={() => flush()}
            placeholder="Ad, e-posta veya telefon ara…"
            className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            data-testid="customers-search-input"
          />
        </div>
      </div>

      {error ? (
        <p
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
          data-testid="customers-error"
        >
          {error}
        </p>
      ) : null}

      {loading || isPending ? <CustomersSkeleton /> : null}

      {!loading && !isPending && rows.length === 0 ? (
        <div
          className="rounded-xl border border-dashed border-gray-200 bg-white px-6 py-16 text-center"
          data-testid="customers-empty"
        >
          <Users className="mx-auto h-8 w-8 text-gray-400" />
          <p className="mt-3 text-lg font-semibold text-gray-700">
            Müşteri bulunamadı
          </p>
          <p className="mt-1 text-sm text-gray-500">
            {filters.q
              ? 'Arama kriterlerinizi değiştirmeyi deneyin.'
              : 'Henüz rezervasyonlu müşteri yok.'}
          </p>
        </div>
      ) : null}

      {!loading && !isPending && rows.length > 0 ? (
        <div
          className="overflow-x-auto rounded-xl border border-gray-100 bg-white shadow-sm"
          data-testid="customers-table"
        >
          <table className="min-w-full divide-y divide-gray-100 text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3 font-medium">Müşteri</th>
                <th className="px-4 py-3 font-medium">E-posta</th>
                <th className="px-4 py-3 font-medium">Telefon</th>
                <th className="px-4 py-3 font-medium">Rezervasyon</th>
                <th className="px-4 py-3 font-medium">Son tur</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((row) => (
                <tr
                  key={row.id}
                  data-testid={`customer-row-${row.id}`}
                  className="cursor-pointer hover:bg-blue-50/40"
                  onClick={() => setSelectedKey(row.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedKey(row.id);
                    }
                  }}
                  tabIndex={0}
                  role="button"
                >
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {row.displayName}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{row.emailMasked}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {row.phoneMasked ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-900">
                    {row.reservationCount}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {row.lastTourDate
                      ? new Date(row.lastTourDate).toLocaleDateString('tr-TR')
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {meta && meta.totalPages > 1 ? (
        <div
          className="flex items-center justify-between gap-3"
          data-testid="customers-pagination"
        >
          <p className="text-xs text-gray-500">
            Toplam {meta.total} müşteri · Sayfa {meta.page}/{meta.totalPages}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={meta.page <= 1}
              data-testid="customers-page-prev"
              onClick={() =>
                replaceFilters({ ...filters, page: Math.max(1, meta.page - 1) })
              }
              className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
              Önceki
            </button>
            <button
              type="button"
              disabled={meta.page >= meta.totalPages}
              data-testid="customers-page-next"
              onClick={() =>
                replaceFilters({
                  ...filters,
                  page: Math.min(meta.totalPages, meta.page + 1),
                })
              }
              className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40"
            >
              Sonraki
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : null}

      <CustomerDetailDrawer
        customerKey={selectedKey}
        onClose={() => setSelectedKey(null)}
      />
    </div>
  );
}
