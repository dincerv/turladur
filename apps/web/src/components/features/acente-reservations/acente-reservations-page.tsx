'use client';

import Link from 'next/link';
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  Armchair,
  Calendar,
  ChevronLeft,
  ChevronRight,
  FileDown,
  RefreshCw,
  Search,
  Users,
  X,
} from 'lucide-react';

import { revalidatePartnerReservationPaths } from '@/app/(agency)/acente/reservations/actions';
import { useDebouncedInput } from '@/components/features/activity/activities-page/use-debounced-input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ACENTE_ROUTES } from '@/lib/panel-routes';
import { useAuth } from '@/providers/auth-provider';
import { ApiError } from '@/services/api-client';
import { downloadVoucherHtml, getReservationVoucher } from '@/services/booking';
import {
  listPartnerReservations,
  updatePartnerReservation,
  type PartnerReservation,
  type PartnerReservationListMeta,
} from '@/services/partner-admin';

import {
  parseReservationsSearchParams,
  reservationsSearchToQueryString,
  type ReservationStatusFilter,
  type ReservationsSearchParams,
} from './reservations-query';

const PAGE_SIZE = 20;
const SAFE_ERROR = 'Rezervasyon listesi yüklenemedi. Lütfen tekrar deneyin.';

type StatusAction = 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'SUSPENDED';

const STATUS_LABELS: Record<string, string> = {
  CONFIRMED: 'Onaylandı',
  PENDING: 'Bekliyor',
  PENDING_PAYMENT: 'Ödeme bekliyor',
  PAYMENT_FAILED: 'Ödeme başarısız',
  CANCELLED: 'İptal',
  COMPLETED: 'Tamamlandı',
  SUSPENDED: 'Askıda',
  EXPIRED: 'Süresi doldu',
};

function statusBadgeClass(status: string) {
  if (status === 'CONFIRMED') return 'bg-emerald-50 text-emerald-700';
  if (status === 'COMPLETED') return 'bg-blue-50 text-blue-700';
  if (status === 'CANCELLED' || status === 'EXPIRED')
    return 'bg-red-50 text-red-700';
  if (status === 'SUSPENDED') return 'bg-orange-50 text-orange-800';
  if (
    status === 'PENDING' ||
    status === 'PENDING_PAYMENT' ||
    status === 'PAYMENT_FAILED'
  ) {
    return 'bg-amber-50 text-amber-800';
  }
  return 'bg-neutral-100 text-neutral-700';
}

function paymentLabel(paymentStatus?: string, bookingStatus?: string) {
  if (
    paymentStatus === 'PAID' ||
    bookingStatus === 'CONFIRMED' ||
    bookingStatus === 'COMPLETED'
  ) {
    return 'Ödendi';
  }
  if (paymentStatus === 'REFUNDED') return 'İade';
  if (paymentStatus === 'PARTIALLY_PAID') return 'Kısmi';
  return 'Ödenmedi';
}

function ReservationsSkeleton() {
  return (
    <div
      className="animate-pulse space-y-3"
      data-testid="reservations-skeleton"
    >
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="h-24 rounded-xl border border-neutral-100 bg-white"
        />
      ))}
    </div>
  );
}

export function AcenteReservationsPage() {
  const { accessToken } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const filters = useMemo(
    () => parseReservationsSearchParams(searchParams),
    [searchParams],
  );

  const [items, setItems] = useState<PartnerReservation[]>([]);
  const [meta, setMeta] = useState<PartnerReservationListMeta>({
    page: 1,
    pageSize: PAGE_SIZE,
    total: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [selected, setSelected] = useState<PartnerReservation | null>(null);
  const [confirmAction, setConfirmAction] = useState<{
    id: string;
    status: StatusAction;
    label: string;
  } | null>(null);

  const replaceFilters = useCallback(
    (next: Partial<ReservationsSearchParams>) => {
      const merged: ReservationsSearchParams = {
        q: next.q ?? filters.q,
        status: 'status' in next ? (next.status ?? null) : filters.status,
        dateFrom: 'dateFrom' in next ? (next.dateFrom ?? '') : filters.dateFrom,
        dateTo: 'dateTo' in next ? (next.dateTo ?? '') : filters.dateTo,
        page: next.page ?? filters.page,
      };
      if (
        next.q !== undefined ||
        'status' in next ||
        'dateFrom' in next ||
        'dateTo' in next
      ) {
        merged.page = next.page ?? 1;
      }
      const qs = reservationsSearchToQueryString(merged);
      startTransition(() => {
        router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
      });
    },
    [filters, pathname, router],
  );

  const { draft, setDraft } = useDebouncedInput(
    filters.q,
    (value) => replaceFilters({ q: value.trim().slice(0, 80), page: 1 }),
    { delay: 400 },
  );

  const load = useCallback(async () => {
    if (!accessToken) return;
    setError(null);
    try {
      const result = await listPartnerReservations(accessToken, {
        q: filters.q || undefined,
        status: filters.status ?? undefined,
        dateFrom: filters.dateFrom || undefined,
        dateTo: filters.dateTo || undefined,
        page: filters.page,
        pageSize: PAGE_SIZE,
      });
      setItems(result.items);
      setMeta(result.meta);
    } catch (err) {
      console.error('[acente-reservations] load failed', {
        code: err instanceof ApiError ? err.code : 'UNKNOWN',
      });
      setError(SAFE_ERROR);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [accessToken, filters]);

  useEffect(() => {
    setLoading(true);
    void load();
  }, [load]);

  async function applyStatus(id: string, status: StatusAction) {
    if (!accessToken) return;
    setBusyId(id);
    setError(null);
    try {
      const updated = await updatePartnerReservation(
        id,
        { status },
        accessToken,
      );
      await revalidatePartnerReservationPaths(updated.tourId ?? undefined);
      setConfirmAction(null);
      setSelected((prev) =>
        prev?.id === id ? { ...prev, status: updated.status } : prev,
      );
      await load();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Durum güncellenemedi',
      );
    } finally {
      setBusyId(null);
    }
  }

  async function handleVoucher(row: PartnerReservation) {
    if (!accessToken) return;
    setBusyId(row.id);
    setError(null);
    try {
      const voucher = await getReservationVoucher(row.id, accessToken);
      downloadVoucherHtml(row.bookingNumber, voucher.html);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Voucher alınamadı');
    } finally {
      setBusyId(null);
    }
  }

  function openConfirm(row: PartnerReservation, status: StatusAction) {
    const labels: Record<StatusAction, string> = {
      CONFIRMED: 'Onayla',
      CANCELLED: 'İptal et',
      COMPLETED: 'Tamamla',
      SUSPENDED: 'Beklemeye al',
    };
    setConfirmAction({ id: row.id, status, label: labels[status] });
  }

  const filterChips: Array<[ReservationStatusFilter | 'all', string]> = [
    ['all', 'Tümü'],
    ['PENDING', 'Bekliyor'],
    ['CONFIRMED', 'Onaylı'],
    ['SUSPENDED', 'Askıda'],
    ['COMPLETED', 'Tamamlanan'],
    ['CANCELLED', 'İptal'],
  ];

  return (
    <div className="space-y-6" data-testid="acente-reservations-page">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">
            Rezervasyonlar
          </h1>
          <p className="mt-1 text-sm text-neutral-600">
            Filtreler URL’de tutulur. İptalde kontenjan ve koltuklar serbest
            bırakılır.
          </p>
        </div>
        <button
          type="button"
          data-testid="reservations-refresh-btn"
          onClick={() => void load()}
          className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
        >
          <RefreshCw className="h-4 w-4" />
          Yenile
        </button>
      </div>

      <div
        className="space-y-3 rounded-xl border border-neutral-100 bg-white p-4 shadow-sm"
        data-testid="reservations-filters"
      >
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            data-testid="filter-customer-search"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Müşteri, e-posta veya rezervasyon no…"
            className="h-11 w-full rounded-lg border border-neutral-300 pr-3 pl-9 text-sm"
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="block text-xs font-medium text-neutral-600">
            Başlangıç
            <input
              type="date"
              data-testid="filter-date-from"
              className="mt-1 h-10 w-full rounded-lg border border-neutral-300 px-2 text-sm"
              value={filters.dateFrom}
              onChange={(e) =>
                replaceFilters({ dateFrom: e.target.value, page: 1 })
              }
            />
          </label>
          <label className="block text-xs font-medium text-neutral-600">
            Bitiş
            <input
              type="date"
              data-testid="filter-date-to"
              className="mt-1 h-10 w-full rounded-lg border border-neutral-300 px-2 text-sm"
              value={filters.dateTo}
              onChange={(e) =>
                replaceFilters({ dateTo: e.target.value, page: 1 })
              }
            />
          </label>
          <label className="block text-xs font-medium text-neutral-600">
            Durum
            <select
              data-testid="filter-status-select"
              className="mt-1 h-10 w-full rounded-lg border border-neutral-300 px-2 text-sm"
              value={filters.status ?? ''}
              onChange={(e) => {
                const v = e.target.value;
                replaceFilters({
                  status: v ? (v as ReservationStatusFilter) : null,
                  page: 1,
                });
              }}
            >
              <option value="">Tümü</option>
              <option value="PENDING">Bekliyor</option>
              <option value="CONFIRMED">Onaylandı</option>
              <option value="SUSPENDED">Askıda</option>
              <option value="COMPLETED">Tamamlandı</option>
              <option value="CANCELLED">İptal</option>
            </select>
          </label>
        </div>
        <div className="flex flex-wrap gap-2">
          {filterChips.map(([key, label]) => {
            const active =
              key === 'all' ? !filters.status : filters.status === key;
            return (
              <button
                key={key}
                type="button"
                data-testid={`filter-status-chip-${key}`}
                onClick={() =>
                  replaceFilters({
                    status: key === 'all' ? null : key,
                    page: 1,
                  })
                }
                className={`rounded-full border px-3 py-1.5 text-xs font-medium ${
                  active
                    ? 'border-neutral-900 bg-neutral-900 text-white'
                    : 'border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {error ? (
        <p
          role="alert"
          data-testid="reservations-error"
          className="rounded-lg bg-red-50 p-3 text-sm text-red-700"
        >
          {error}
        </p>
      ) : null}

      {loading || isPending ? (
        <ReservationsSkeleton />
      ) : items.length === 0 ? (
        <div
          className="rounded-xl border border-dashed border-neutral-200 bg-white px-6 py-16 text-center"
          data-testid="reservations-empty-state"
        >
          <Calendar className="mx-auto h-8 w-8 text-neutral-400" />
          <p className="mt-3 text-lg font-semibold text-neutral-700">
            Rezervasyon bulunamadı
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-neutral-100 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table
              className="min-w-full text-left text-sm"
              data-testid="reservations-table"
            >
              <thead className="border-b border-neutral-100 bg-neutral-50 text-xs tracking-wide text-neutral-500 uppercase">
                <tr>
                  <th className="px-4 py-3 font-medium">Rezervasyon</th>
                  <th className="px-4 py-3 font-medium">Müşteri</th>
                  <th className="px-4 py-3 font-medium">Ürün</th>
                  <th className="px-4 py-3 font-medium">Durum</th>
                  <th className="px-4 py-3 font-medium">Tutar</th>
                  <th className="px-4 py-3 font-medium">İşlem</th>
                </tr>
              </thead>
              <tbody>
                {items.map((row) => {
                  const needsConfirm =
                    row.status === 'PENDING' ||
                    row.status === 'PENDING_PAYMENT' ||
                    row.status === 'PAYMENT_FAILED' ||
                    row.status === 'SUSPENDED';
                  const canCancel =
                    row.status !== 'CANCELLED' &&
                    row.status !== 'COMPLETED' &&
                    row.status !== 'EXPIRED';
                  const canSuspend =
                    row.status === 'CONFIRMED' ||
                    row.status === 'PENDING' ||
                    row.status === 'PENDING_PAYMENT';
                  const canComplete = row.status === 'CONFIRMED';
                  const canOpenSeatMap =
                    Boolean(row.tourId && row.tourDateId) &&
                    (row.status === 'CONFIRMED' || row.status === 'COMPLETED');

                  return (
                    <tr
                      key={row.id}
                      data-testid={`reservation-row-${row.id}`}
                      className="cursor-pointer border-b border-neutral-50 hover:bg-neutral-50/80"
                      onClick={() => setSelected(row)}
                    >
                      <td className="px-4 py-3">
                        <p className="font-semibold text-neutral-900">
                          {row.bookingNumber}
                        </p>
                        <p className="text-xs text-neutral-500">
                          {new Date(row.createdAt).toLocaleDateString('tr-TR')}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-neutral-800">
                          {row.customerName ?? row.contactEmail}
                        </p>
                        <p className="text-xs text-neutral-500">
                          {row.contactEmail}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-neutral-800">
                          {row.tourTitle ?? 'Tur / deneyim'}
                        </p>
                        <p className="inline-flex items-center gap-1 text-xs text-neutral-500">
                          <Users className="h-3 w-3" />
                          {row.guestCount ?? row.adults + row.children} kişi
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          data-testid={`reservation-status-badge-${row.id}`}
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadgeClass(row.status)}`}
                        >
                          {STATUS_LABELS[row.status] ?? row.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-neutral-900">
                        {Number(row.totalAmount).toLocaleString('tr-TR')}{' '}
                        {row.currency}
                      </td>
                      <td
                        className="px-4 py-3"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          {needsConfirm ? (
                            <button
                              type="button"
                              data-testid={`change-status-btn-${row.id}`}
                              disabled={busyId === row.id}
                              onClick={() => openConfirm(row, 'CONFIRMED')}
                              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                            >
                              Onayla
                            </button>
                          ) : null}
                          <select
                            data-testid={`reservation-actions-${row.id}`}
                            className="h-8 rounded-lg border border-neutral-300 px-2 text-xs disabled:opacity-50"
                            disabled={busyId === row.id}
                            defaultValue=""
                            onChange={(e) => {
                              const v = e.target.value as StatusAction | '';
                              if (!v) return;
                              openConfirm(row, v);
                              e.target.value = '';
                            }}
                          >
                            <option value="">İşlem</option>
                            {canSuspend ? (
                              <option value="SUSPENDED">Beklemeye al</option>
                            ) : null}
                            {canComplete ? (
                              <option value="COMPLETED">Tamamla</option>
                            ) : null}
                            {canCancel ? (
                              <option value="CANCELLED">İptal et</option>
                            ) : null}
                          </select>
                          {canOpenSeatMap && row.tourId && row.tourDateId ? (
                            <Link
                              href={ACENTE_ROUTES.tourDateSeats(
                                row.tourId,
                                row.tourDateId,
                              )}
                              data-testid={`reservation-seats-link-${row.id}`}
                              className="inline-flex h-8 items-center gap-1 rounded-lg border border-neutral-200 px-2 text-xs font-medium text-neutral-700"
                            >
                              <Armchair className="h-3.5 w-3.5" />
                              Koltuk
                            </Link>
                          ) : null}
                          <button
                            type="button"
                            data-testid={`reservation-voucher-btn-${row.id}`}
                            disabled={busyId === row.id}
                            onClick={() => void handleVoucher(row)}
                            className="inline-flex h-8 items-center gap-1 rounded-lg border border-neutral-200 px-2 text-xs font-medium text-neutral-700 disabled:opacity-50"
                          >
                            <FileDown className="h-3.5 w-3.5" />
                            Voucher
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div
            className="flex items-center justify-between gap-3 border-t border-neutral-100 px-4 py-3"
            data-testid="reservations-pagination"
          >
            <p className="text-xs text-neutral-500">
              {meta.total} kayıt · sayfa {meta.page}/{meta.totalPages}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                data-testid="reservations-page-prev"
                disabled={meta.page <= 1}
                onClick={() => replaceFilters({ page: meta.page - 1 })}
                className="inline-flex h-8 items-center rounded-lg border border-neutral-200 px-2 text-xs disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                data-testid="reservations-page-next"
                disabled={meta.page >= meta.totalPages}
                onClick={() => replaceFilters({ page: meta.page + 1 })}
                className="inline-flex h-8 items-center rounded-lg border border-neutral-200 px-2 text-xs disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail drawer */}
      <Dialog
        open={Boolean(selected)}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      >
        <DialogContent
          data-testid="reservation-detail-drawer"
          className="fixed top-0 right-0 left-auto h-full max-h-full w-full max-w-md translate-x-0 translate-y-0 rounded-none border-l sm:max-w-md data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right"
        >
          {selected ? (
            <>
              <DialogHeader>
                <DialogTitle>{selected.bookingNumber}</DialogTitle>
                <DialogDescription>
                  {selected.tourTitle ?? 'Tur / deneyim'}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3 text-sm">
                <p>
                  <span className="text-neutral-500">Müşteri: </span>
                  {selected.customerName ?? selected.contactEmail}
                </p>
                <p>
                  <span className="text-neutral-500">E-posta: </span>
                  {selected.contactEmail}
                </p>
                <p>
                  <span className="text-neutral-500">Telefon: </span>
                  {selected.contactPhone ?? '—'}
                </p>
                <p>
                  <span className="text-neutral-500">Ödeme: </span>
                  {paymentLabel(selected.paymentStatus, selected.status)}
                </p>
                <p>
                  <span className="text-neutral-500">Durum: </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusBadgeClass(selected.status)}`}
                  >
                    {STATUS_LABELS[selected.status] ?? selected.status}
                  </span>
                </p>
                <p>
                  <span className="text-neutral-500">Tutar: </span>
                  {Number(selected.totalAmount).toLocaleString('tr-TR')}{' '}
                  {selected.currency}
                </p>
                <p>
                  <span className="text-neutral-500">Tarih: </span>
                  {selected.startDate
                    ? new Date(selected.startDate).toLocaleDateString('tr-TR')
                    : new Date(selected.createdAt).toLocaleDateString('tr-TR')}
                </p>
                {selected.seatNumbers ? (
                  <p>
                    <span className="text-neutral-500">Koltuklar: </span>
                    {selected.seatNumbers}
                  </p>
                ) : null}
              </div>
              <DialogFooter>
                <button
                  type="button"
                  data-testid="reservation-drawer-close"
                  onClick={() => setSelected(null)}
                  className="inline-flex items-center rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                >
                  <X className="mr-1 h-4 w-4" />
                  Kapat
                </button>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Status confirm modal */}
      <Dialog
        open={Boolean(confirmAction)}
        onOpenChange={(open) => {
          if (!open) setConfirmAction(null);
        }}
      >
        <DialogContent data-testid="change-status-confirm-modal">
          <DialogHeader>
            <DialogTitle>Durum değişikliğini onayla</DialogTitle>
            <DialogDescription>
              Bu işlem stok / koltukları etkileyebilir. Devam etmek istiyor
              musunuz?
            </DialogDescription>
          </DialogHeader>
          <p className="text-sm text-neutral-700">
            İşlem: <strong>{confirmAction?.label}</strong>
          </p>
          <DialogFooter>
            <button
              type="button"
              data-testid="change-status-cancel-btn"
              onClick={() => setConfirmAction(null)}
              className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium"
            >
              Vazgeç
            </button>
            <button
              type="button"
              data-testid="change-status-confirm-btn"
              disabled={!confirmAction || busyId === confirmAction.id}
              onClick={() => {
                if (!confirmAction) return;
                void applyStatus(confirmAction.id, confirmAction.status);
              }}
              className="rounded-lg bg-neutral-950 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {busyId ? 'İşleniyor…' : 'Onayla'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
