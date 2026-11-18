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
  Download,
  FileText,
  RefreshCw,
  Search,
  Wallet,
} from 'lucide-react';
import { FINANCIAL_PAYMENT_STATUSES } from '@turta/shared-validators';

import { useDebouncedInput } from '@/components/features/activity/activities-page/use-debounced-input';
import { useAuth } from '@/providers/auth-provider';
import { ApiError } from '@/services/api-client';
import {
  exportPartnerFinancials,
  getPartnerFinancials,
  listPartnerFinancialTransactions,
  type PartnerFinancialKpis,
  type PartnerFinancialTransaction,
  type PartnerFinancialsOverview,
} from '@/services/partner-admin';

import {
  financialsSearchToQueryString,
  parseFinancialsSearchParams,
  type FinancialsSearchParams,
} from './financials-query';

const SAFE_ERROR = 'Finansal veriler yüklenemedi. Lütfen tekrar deneyin.';

const STATUS_LABELS: Record<string, string> = {
  PAID: 'Ödendi',
  PENDING: 'Bekliyor',
  OVERDUE: 'Gecikmiş',
  REFUNDED: 'İade',
};

function statusClass(status: string) {
  if (status === 'PAID')
    return 'bg-emerald-50 text-emerald-800 border-emerald-200';
  if (status === 'PENDING')
    return 'bg-amber-50 text-amber-800 border-amber-200';
  if (status === 'OVERDUE') return 'bg-red-50 text-red-700 border-red-200';
  if (status === 'REFUNDED')
    return 'bg-slate-100 text-slate-700 border-slate-200';
  return 'bg-gray-50 text-gray-700 border-gray-200';
}

function money(value: string | number, currency: string) {
  return `${Number(value).toLocaleString('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ${currency}`;
}

function KpiSkeleton() {
  return (
    <div
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
      data-testid="financials-kpi-skeleton"
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

function downloadBlob(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function buildPdfHtml(
  overview: PartnerFinancialsOverview | null,
  rows: PartnerFinancialTransaction[],
) {
  const currency = overview?.currency ?? 'TRY';
  const kpis = overview?.kpis;
  const kpiBlock = kpis
    ? `<p>Ciro: ${money(kpis.grossRevenue, currency)} · Bekleyen: ${money(kpis.pendingReceivables, currency)} · Net: ${money(kpis.netEarnings, currency)} · Komisyon: ${money(kpis.platformCommission, currency)}</p>`
    : '';
  const tr = rows
    .map(
      (r) =>
        `<tr><td>${r.bookingNumber}</td><td>${STATUS_LABELS[r.status] ?? r.status}</td><td>${r.grossAmount}</td><td>${r.commissionAmount}</td><td>${r.netAmount}</td><td>${r.createdAt.slice(0, 10)}</td></tr>`,
    )
    .join('');
  return `<!DOCTYPE html><html lang="tr"><head><meta charset="utf-8"/><title>Finansal Rapor</title>
  <style>body{font-family:system-ui,sans-serif;padding:24px;color:#111}table{width:100%;border-collapse:collapse;margin-top:16px}th,td{border:1px solid #ddd;padding:8px;text-align:left;font-size:12px}th{background:#f5f5f5}</style>
  </head><body><h1>Finansal Rapor</h1>${kpiBlock}
  <table><thead><tr><th>Rezervasyon</th><th>Durum</th><th>Brüt</th><th>Komisyon</th><th>Net</th><th>Tarih</th></tr></thead><tbody>${tr}</tbody></table>
  </body></html>`;
}

export function AcenteFinancialsPage() {
  const { accessToken } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const filters = useMemo(
    () => parseFinancialsSearchParams(searchParams),
    [searchParams],
  );

  const [overview, setOverview] = useState<PartnerFinancialsOverview | null>(
    null,
  );
  const [rows, setRows] = useState<PartnerFinancialTransaction[]>([]);
  const [meta, setMeta] = useState<{
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exportBusy, setExportBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const replaceFilters = useCallback(
    (next: FinancialsSearchParams) => {
      const qs = financialsSearchToQueryString(next);
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
      const dateParams = {
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
      };
      const [ov, list] = await Promise.all([
        getPartnerFinancials(accessToken, dateParams),
        listPartnerFinancialTransactions(accessToken, {
          ...dateParams,
          status: filters.status ?? undefined,
          q: filters.q || undefined,
          page: filters.page,
          pageSize: filters.pageSize,
        }),
      ]);
      setOverview(ov);
      setRows(list.items);
      setMeta(list.meta);
    } catch (err) {
      setOverview(null);
      setRows([]);
      setMeta(null);
      setError(err instanceof ApiError ? err.message : SAFE_ERROR);
    } finally {
      setLoading(false);
    }
  }, [
    accessToken,
    filters.startDate,
    filters.endDate,
    filters.status,
    filters.q,
    filters.page,
    filters.pageSize,
  ]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleExportCsv() {
    if (!accessToken) return;
    setExportBusy(true);
    try {
      const data = await exportPartnerFinancials(accessToken, {
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
        status: filters.status ?? undefined,
        q: filters.q || undefined,
        format: 'csv',
      });
      downloadBlob(data.filename, data.csv, data.contentType);
      setToast(`${data.rowCount} satır CSV indirildi`);
      window.setTimeout(() => setToast(null), 3000);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'CSV dışa aktarım başarısız',
      );
    } finally {
      setExportBusy(false);
    }
  }

  function handleExportPdf() {
    const html = buildPdfHtml(overview, rows);
    downloadBlob(
      `acente-finans-${new Date().toISOString().slice(0, 10)}.html`,
      html,
      'text/html;charset=utf-8',
    );
    const w = window.open('', '_blank');
    if (w) {
      w.document.write(html);
      w.document.close();
      w.focus();
      w.print();
    }
    setToast('PDF yazdırma penceresi açıldı');
    window.setTimeout(() => setToast(null), 3000);
  }

  const kpis: PartnerFinancialKpis | null = overview?.kpis ?? null;
  const currency = overview?.currency ?? 'TRY';

  return (
    <div className="space-y-6" data-testid="acente-financials-page">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Finansal Durum</h1>
          <p className="mt-1 text-sm text-gray-600">
            Gelir, komisyon, bekleyen alacaklar ve ödeme defteri — yalnızca
            acentenize ait kayıtlar.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void load()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
            data-testid="financials-refresh-btn"
          >
            <RefreshCw className="h-4 w-4" />
            Yenile
          </button>
          <button
            type="button"
            disabled={exportBusy}
            onClick={() => void handleExportCsv()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            data-testid="financials-export-csv-btn"
          >
            <Download className="h-4 w-4" />
            CSV
          </button>
          <button
            type="button"
            onClick={handleExportPdf}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-xs font-medium text-white hover:bg-blue-700"
            data-testid="financials-export-pdf-btn"
          >
            <FileText className="h-4 w-4" />
            PDF
          </button>
        </div>
      </div>

      {loading || isPending ? <KpiSkeleton /> : null}

      {!loading && !isPending && kpis ? (
        <div
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
          data-testid="financials-kpi-grid"
        >
          {(
            [
              ['Toplam ciro', kpis.grossRevenue, 'gross'],
              ['Bekleyen alacak', kpis.pendingReceivables, 'pending'],
              ['Tamamlanan ödemeler', kpis.completedPayouts, 'paid'],
              ['Platform komisyonu', kpis.platformCommission, 'commission'],
            ] as const
          ).map(([label, value, key]) => (
            <div
              key={key}
              className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm"
              data-testid={`financials-kpi-${key}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-gray-600">{label}</p>
                  <p className="mt-2 text-2xl font-semibold text-gray-900">
                    {money(value, currency)}
                  </p>
                </div>
                <div className="rounded-lg bg-amber-50 p-2.5 text-amber-700">
                  <Wallet className="h-5 w-5" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      <div
        className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm"
        data-testid="financials-filters"
      >
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <label className="block text-sm xl:col-span-2">
            <span className="mb-1 block text-xs font-medium text-gray-600">
              Arama
            </span>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onBlur={() => flush()}
                placeholder="Rezervasyon no / e-posta…"
                className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm"
                data-testid="financials-search-input"
              />
            </div>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-xs font-medium text-gray-600">
              Başlangıç
            </span>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) =>
                replaceFilters({
                  ...filters,
                  startDate: e.target.value,
                  page: 1,
                })
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              data-testid="financials-start-date"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-xs font-medium text-gray-600">
              Bitiş
            </span>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) =>
                replaceFilters({
                  ...filters,
                  endDate: e.target.value,
                  page: 1,
                })
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              data-testid="financials-end-date"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-xs font-medium text-gray-600">
              Durum
            </span>
            <select
              value={filters.status ?? ''}
              onChange={(e) =>
                replaceFilters({
                  ...filters,
                  status: (e.target.value ||
                    null) as FinancialsSearchParams['status'],
                  page: 1,
                })
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              data-testid="financials-status-select"
            >
              <option value="">Tümü</option>
              {FINANCIAL_PAYMENT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {FINANCIAL_PAYMENT_STATUSES.map((s) => (
            <button
              key={s}
              type="button"
              data-testid={`financials-status-chip-${s}`}
              onClick={() =>
                replaceFilters({
                  ...filters,
                  status: filters.status === s ? null : s,
                  page: 1,
                })
              }
              className={`rounded-full border px-3 py-1 text-xs font-medium ${
                filters.status === s
                  ? 'border-blue-200 bg-blue-50 text-blue-700'
                  : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              {STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      {toast ? (
        <p
          role="status"
          data-testid="financials-toast"
          className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800"
        >
          {toast}
        </p>
      ) : null}

      {error ? (
        <p
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
          data-testid="financials-error"
        >
          {error}
        </p>
      ) : null}

      {!loading && !isPending && rows.length === 0 ? (
        <div
          className="rounded-xl border border-dashed border-gray-200 bg-white px-6 py-16 text-center text-sm text-gray-500"
          data-testid="financials-empty"
        >
          Bu filtrelere uygun işlem bulunamadı.
        </div>
      ) : null}

      {!loading && !isPending && rows.length > 0 ? (
        <div
          className="overflow-x-auto rounded-xl border border-gray-100 bg-white shadow-sm"
          data-testid="financials-table"
        >
          <table className="min-w-full divide-y divide-gray-100 text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3 font-medium">Rezervasyon</th>
                <th className="px-4 py-3 font-medium">Müşteri</th>
                <th className="px-4 py-3 font-medium">Brüt</th>
                <th className="px-4 py-3 font-medium">Komisyon</th>
                <th className="px-4 py-3 font-medium">Net</th>
                <th className="px-4 py-3 font-medium">Durum</th>
                <th className="px-4 py-3 font-medium">Tarih</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((row) => (
                <tr key={row.id} data-testid={`financials-row-${row.id}`}>
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {row.bookingNumber}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {row.contactEmailMasked}
                  </td>
                  <td className="px-4 py-3 text-gray-900">
                    {money(row.grossAmount, row.currency)}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {money(row.commissionAmount, row.currency)}
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {money(row.netAmount, row.currency)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusClass(row.status)}`}
                    >
                      {STATUS_LABELS[row.status] ?? row.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {new Date(row.createdAt).toLocaleDateString('tr-TR')}
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
          data-testid="financials-pagination"
        >
          <p className="text-xs text-gray-500">
            Toplam {meta.total} işlem · Sayfa {meta.page}/{meta.totalPages}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={meta.page <= 1}
              data-testid="financials-page-prev"
              onClick={() =>
                replaceFilters({ ...filters, page: Math.max(1, meta.page - 1) })
              }
              className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
              Önceki
            </button>
            <button
              type="button"
              disabled={meta.page >= meta.totalPages}
              data-testid="financials-page-next"
              onClick={() =>
                replaceFilters({
                  ...filters,
                  page: Math.min(meta.totalPages, meta.page + 1),
                })
              }
              className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium disabled:opacity-40"
            >
              Sonraki
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : null}

      {!loading && overview && overview.months.length > 0 ? (
        <div
          className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm"
          data-testid="financials-monthly-chart"
        >
          <h3 className="mb-4 text-lg font-semibold text-gray-900">
            Aylık ciro dağılımı
          </h3>
          <div className="space-y-3">
            {(() => {
              const max = Math.max(
                1,
                ...overview.months.map((m) => Number(m.total)),
              );
              return overview.months.map((m) => {
                const value = Number(m.total);
                const width = `${Math.round((value / max) * 100)}%`;
                return (
                  <div key={m.month}>
                    <div className="mb-1 flex justify-between text-xs text-gray-600">
                      <span>{m.month}</span>
                      <span>{money(value, currency)}</span>
                    </div>
                    <div className="h-3 overflow-hidden rounded-full bg-gray-100">
                      <div
                        className="h-full rounded-full bg-blue-500"
                        style={{ width }}
                      />
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      ) : null}
    </div>
  );
}
