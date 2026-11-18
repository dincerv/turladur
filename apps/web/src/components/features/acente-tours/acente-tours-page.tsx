'use client';

import Image from 'next/image';
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
  LayoutGrid,
  List,
  Pencil,
  Plus,
  Search,
  X,
} from 'lucide-react';

import { useDebouncedInput } from '@/components/features/activity/activities-page/use-debounced-input';
import { resolveMediaUrl, shouldUnoptimizeMedia } from '@/lib/media';
import { ACENTE_ROUTES } from '@/lib/panel-routes';
import { useAuth } from '@/providers/auth-provider';
import { ApiError } from '@/services/api-client';
import {
  cancelPartnerTour,
  cancelPartnerTourDates,
  listPartnerTours,
  updatePartnerTour,
  type PartnerTour,
  type PartnerTourListMeta,
  type TourCancelReason,
} from '@/services/partner-admin';

import { revalidatePartnerTourPaths } from '@/app/(agency)/acente/tours/actions';

import { TourCancelDialog } from './tour-cancel-dialog';
import { ToursSkeleton } from './tours-skeleton';
import {
  isTourLive,
  nextTourToggleStatus,
  parseToursSearchParams,
  sanitizeTourText,
  TOUR_CATEGORIES,
  TOUR_STATUS_FILTERS,
  toursSearchToQueryString,
  type TourCategoryFilter,
  type TourStatusFilter,
  type ToursSearchParams,
} from './tours-query';

const PAGE_SIZE = 12;
const SAFE_ERROR = 'Tur listesi yüklenemedi. Lütfen tekrar deneyin.';

const STATUS_LABELS: Record<TourStatusFilter, string> = {
  DRAFT: 'Taslak',
  PENDING_REVIEW: 'İncelemede',
  PUBLISHED: 'Yayında',
  ARCHIVED: 'Arşiv',
};

const CATEGORY_LABELS: Record<TourCategoryFilter, string> = {
  CULTURAL: 'Kültür',
  ADVENTURE: 'Macera',
  GASTRONOMY: 'Gastronomi',
  NATURE: 'Doğa',
  CITY: 'Şehir',
  BEACH: 'Plaj',
};

function statusBadgeClass(status: string): string {
  if (isTourLive(status)) return 'bg-emerald-50 text-emerald-700';
  if (status === 'ARCHIVED') return 'bg-neutral-100 text-neutral-600';
  if (status === 'PENDING_REVIEW') return 'bg-amber-50 text-amber-800';
  return 'bg-sky-50 text-sky-800';
}

export function AcenteToursPage() {
  const { accessToken } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const filters = useMemo(
    () => parseToursSearchParams(searchParams),
    [searchParams],
  );

  const [tours, setTours] = useState<PartnerTour[]>([]);
  const [meta, setMeta] = useState<PartnerTourListMeta>({
    page: 1,
    pageSize: PAGE_SIZE,
    total: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelTour, setCancelTour] = useState<PartnerTour | null>(null);
  const [cancelBusy, setCancelBusy] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const replaceFilters = useCallback(
    (
      next: Partial<ToursSearchParams> & {
        status?: TourStatusFilter | undefined;
        category?: TourCategoryFilter | undefined;
      },
    ) => {
      const merged: ToursSearchParams = {
        q: next.q ?? filters.q,
        status: 'status' in next ? next.status : filters.status,
        category: 'category' in next ? next.category : filters.category,
        page: next.page ?? filters.page,
        pageSize: filters.pageSize,
        view: next.view ?? filters.view,
      };
      if (next.q !== undefined || 'status' in next || 'category' in next) {
        merged.page = next.page ?? 1;
      }
      const qs = toursSearchToQueryString(merged);
      startTransition(() => {
        router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
      });
    },
    [filters, pathname, router],
  );

  const { draft, setDraft, flush } = useDebouncedInput(
    filters.q,
    (value) => replaceFilters({ q: value.trim().slice(0, 80), page: 1 }),
    { delay: 400 },
  );

  const load = useCallback(async () => {
    if (!accessToken) return;
    setError(null);
    try {
      const result = await listPartnerTours(accessToken, {
        q: filters.q || undefined,
        status: filters.status,
        category: filters.category,
        page: filters.page,
        pageSize: PAGE_SIZE,
      });
      setTours(result.items);
      setMeta(result.meta);
    } catch (err) {
      console.error('[acente-tours] load failed', {
        code: err instanceof ApiError ? err.code : 'UNKNOWN',
        status: err instanceof ApiError ? err.status : undefined,
      });
      setError(SAFE_ERROR);
      setTours([]);
    } finally {
      setLoading(false);
    }
  }, [accessToken, filters.category, filters.page, filters.q, filters.status]);

  useEffect(() => {
    if (!accessToken) return;
    setLoading(true);
    void load();
  }, [accessToken, load]);

  async function handleToggleStatus(tour: PartnerTour) {
    if (!accessToken || togglingId) return;
    const nextStatus = nextTourToggleStatus(tour.status);
    const previous = tour.status;
    setTogglingId(tour.id);
    setError(null);
    setTours((prev) =>
      prev.map((row) =>
        row.id === tour.id ? { ...row, status: nextStatus } : row,
      ),
    );
    try {
      await updatePartnerTour(tour.id, { status: nextStatus }, accessToken);
      await revalidatePartnerTourPaths(tour.id);
    } catch (err) {
      setTours((prev) =>
        prev.map((row) =>
          row.id === tour.id ? { ...row, status: previous } : row,
        ),
      );
      setError(
        err instanceof ApiError
          ? err.message || 'Durum güncellenemedi'
          : 'Durum güncellenemedi',
      );
    } finally {
      setTogglingId(null);
    }
  }

  async function handleConfirmCancel(input: {
    dateIds: string[];
    reason: TourCancelReason;
    note?: string;
    hasDates: boolean;
  }) {
    if (!accessToken || !cancelTour) return;
    setCancelBusy(true);
    try {
      if (input.hasDates) {
        await cancelPartnerTourDates(
          cancelTour.id,
          {
            dateIds: input.dateIds,
            reason: input.reason,
            note: input.note,
          },
          accessToken,
        );
      } else {
        await cancelPartnerTour(
          cancelTour.id,
          { reason: input.reason, note: input.note },
          accessToken,
        );
      }
      setCancelTour(null);
      await revalidatePartnerTourPaths(cancelTour.id);
      setLoading(true);
      await load();
    } finally {
      setCancelBusy(false);
    }
  }

  const listView = filters.view === 'list';
  const hasActiveFilters = Boolean(
    filters.q || filters.status || filters.category,
  );
  const emptyBecauseSearch = hasActiveFilters && tours.length === 0;

  if (loading && tours.length === 0) {
    return <ToursSkeleton listView={listView} />;
  }

  return (
    <div className="space-y-6" data-testid="acente-tours-page">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-950">
            Turlar
          </h1>
          <p className="mt-1 max-w-prose text-sm text-neutral-600">
            Turlarınızı yönetin. Durum, kategori ve arama filtreleriyle listeyi
            daraltın; koltuk ve düzenleme işlemlerine hızlıca geçin.
          </p>
        </div>
        <Link
          href={`${ACENTE_ROUTES.tours}/new`}
          data-testid="new-tour-btn"
          className="inline-flex min-h-11 items-center justify-center rounded-lg bg-neutral-950 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2"
        >
          <Plus className="mr-1.5 h-4 w-4" aria-hidden />
          Yeni Tur Ekle
        </Link>
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative max-w-md flex-1">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-neutral-400"
              aria-hidden
            />
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value.slice(0, 80))}
              onBlur={flush}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  flush();
                }
              }}
              placeholder="Tur ara…"
              aria-label="Tur ara"
              data-testid="search-tour-input"
              className="w-full rounded-lg border border-neutral-300 py-2.5 pr-10 pl-10 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-950 focus:outline-none focus:ring-1 focus:ring-neutral-950"
            />
            {draft ? (
              <button
                type="button"
                aria-label="Aramayı temizle"
                data-testid="clear-tour-search"
                onClick={() => {
                  setDraft('');
                  replaceFilters({ q: '', page: 1 });
                }}
                className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-1 text-neutral-400 hover:text-neutral-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <label className="sr-only" htmlFor="tour-category-filter">
              Kategori
            </label>
            <select
              id="tour-category-filter"
              data-testid="tour-category-filter"
              value={filters.category ?? ''}
              onChange={(e) => {
                const value = e.target.value;
                replaceFilters({
                  category: value ? (value as TourCategoryFilter) : undefined,
                  page: 1,
                });
              }}
              className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-800 focus:border-neutral-950 focus:outline-none focus:ring-1 focus:ring-neutral-950"
            >
              <option value="">Tüm kategoriler</option>
              {TOUR_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {CATEGORY_LABELS[cat]}
                </option>
              ))}
            </select>

            <div
              role="tablist"
              aria-label="Görünüm"
              className="flex gap-1 rounded-lg bg-neutral-100 p-1"
            >
              <button
                type="button"
                role="tab"
                aria-selected={!listView}
                data-testid="tours-view-grid"
                onClick={() => replaceFilters({ view: 'grid' })}
                className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 ${
                  !listView
                    ? 'bg-white text-neutral-950 shadow-sm'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                <LayoutGrid className="h-3.5 w-3.5" aria-hidden />
                Kart
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={listView}
                data-testid="tours-view-list"
                onClick={() => replaceFilters({ view: 'list' })}
                className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 ${
                  listView
                    ? 'bg-white text-neutral-950 shadow-sm'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                <List className="h-3.5 w-3.5" aria-hidden />
                Liste
              </button>
            </div>
          </div>
        </div>

        <div
          className="mt-3 flex flex-wrap gap-2"
          role="group"
          aria-label="Durum filtresi"
          data-testid="tour-status-filters"
        >
          <button
            type="button"
            aria-pressed={!filters.status}
            data-testid="tour-status-all"
            onClick={() => replaceFilters({ status: undefined, page: 1 })}
            className={`rounded-full px-3 py-1 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 ${
              !filters.status
                ? 'bg-neutral-950 text-white'
                : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
            }`}
          >
            Tümü
          </button>
          {TOUR_STATUS_FILTERS.map((status) => (
            <button
              key={status}
              type="button"
              aria-pressed={filters.status === status}
              data-testid={`tour-status-${status}`}
              onClick={() => replaceFilters({ status, page: 1 })}
              className={`rounded-full px-3 py-1 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 ${
                filters.status === status
                  ? 'bg-neutral-950 text-white'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              {STATUS_LABELS[status]}
            </button>
          ))}
        </div>
      </div>

      {error ? (
        <div
          role="alert"
          data-testid="tours-error"
          className="flex flex-col items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <p className="text-sm text-red-700">{error}</p>
          <button
            type="button"
            onClick={() => {
              setLoading(true);
              void load();
            }}
            className="rounded-lg bg-neutral-950 px-3 py-1.5 text-xs font-semibold text-white hover:bg-neutral-800"
          >
            Tekrar dene
          </button>
        </div>
      ) : null}

      <div
        className={isPending || loading ? 'opacity-60 transition-opacity' : ''}
        aria-busy={isPending || loading}
        data-testid="tours-results"
      >
        {tours.length === 0 ? (
          <div
            className="rounded-xl border border-dashed border-neutral-200 bg-white px-6 py-16 text-center"
            data-testid="tours-empty-state"
          >
            <p className="text-lg font-semibold text-neutral-800">
              Tur bulunamadı
            </p>
            <p className="mt-1 text-sm text-neutral-500">
              {emptyBecauseSearch
                ? 'Arama veya filtre sonucu boş. Filtreleri temizleyip tekrar deneyin.'
                : 'Henüz tur eklemediniz. İlk turunuzu oluşturarak başlayın.'}
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              {emptyBecauseSearch ? (
                <button
                  type="button"
                  data-testid="clear-tour-filters"
                  onClick={() => {
                    setDraft('');
                    replaceFilters({
                      q: '',
                      status: undefined,
                      category: undefined,
                      page: 1,
                    });
                  }}
                  className="inline-flex rounded-lg border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-800 hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950"
                >
                  Filtreleri Temizle
                </button>
              ) : null}
              <Link
                href={`${ACENTE_ROUTES.tours}/new`}
                className="inline-flex rounded-lg bg-neutral-950 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2"
              >
                {emptyBecauseSearch ? 'Yeni Tur Ekle' : 'İlk turu ekle'}
              </Link>
            </div>
          </div>
        ) : listView ? (
          <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table
                className="min-w-full text-left text-sm"
                data-testid="tours-table"
              >
                <thead className="border-b border-neutral-200 bg-neutral-50 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                  <tr>
                    <th className="px-4 py-3">Tur</th>
                    <th className="px-4 py-3">Kategori</th>
                    <th className="px-4 py-3">Süre</th>
                    <th className="px-4 py-3">Fiyat</th>
                    <th className="px-4 py-3">Durum</th>
                    <th className="px-4 py-3 text-right">Aksiyonlar</th>
                  </tr>
                </thead>
                <tbody>
                  {tours.map((tour) => (
                    <TourTableRow
                      key={tour.id}
                      tour={tour}
                      toggling={togglingId === tour.id}
                      onToggle={() => void handleToggleStatus(tour)}
                      onDeactivate={() => setCancelTour(tour)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div
            className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3"
            data-testid="tours-grid"
          >
            {tours.map((tour) => (
              <TourGridCard
                key={tour.id}
                tour={tour}
                toggling={togglingId === tour.id}
                onToggle={() => void handleToggleStatus(tour)}
                onDeactivate={() => setCancelTour(tour)}
              />
            ))}
          </div>
        )}
      </div>

      {meta.totalPages > 1 ? (
        <nav
          aria-label="Sayfalama"
          data-testid="tours-pagination"
          className="flex flex-wrap items-center justify-between gap-3 border-t border-neutral-200 pt-4"
        >
          <p className="text-sm text-neutral-600">
            Toplam {meta.total} tur · Sayfa {meta.page}/{meta.totalPages}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              data-testid="tours-page-prev"
              disabled={meta.page <= 1 || loading}
              onClick={() => replaceFilters({ page: meta.page - 1 })}
              className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-800 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950"
            >
              Önceki
            </button>
            <button
              type="button"
              data-testid="tours-page-next"
              disabled={meta.page >= meta.totalPages || loading}
              onClick={() => replaceFilters({ page: meta.page + 1 })}
              className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-800 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950"
            >
              Sonraki
            </button>
          </div>
        </nav>
      ) : null}

      <TourCancelDialog
        tour={cancelTour}
        open={Boolean(cancelTour)}
        busy={cancelBusy}
        onOpenChange={(open) => {
          if (!open && !cancelBusy) setCancelTour(null);
        }}
        onConfirm={handleConfirmCancel}
      />
    </div>
  );
}

function TourTableRow({
  tour,
  toggling,
  onToggle,
  onDeactivate,
}: {
  tour: PartnerTour;
  toggling: boolean;
  onToggle: () => void;
  onDeactivate: () => void;
}) {
  const live = isTourLive(tour.status);
  const title = sanitizeTourText(tour.title, 80);
  const category = sanitizeTourText(
    CATEGORY_LABELS[tour.category as TourCategoryFilter] ?? tour.category,
    40,
  );
  const price = `${Number(tour.price).toLocaleString('tr-TR')} ${sanitizeTourText(tour.currency, 8)}`;
  const cover = resolveMediaUrl(tour.coverUrl) || '/brand/mark-on-light.png';

  return (
    <tr
      className="border-b border-neutral-100 last:border-0"
      data-testid={`tour-row-${tour.id}`}
    >
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="relative h-12 w-16 shrink-0 overflow-hidden rounded-md bg-neutral-100">
            <Image
              src={cover}
              alt=""
              fill
              unoptimized={shouldUnoptimizeMedia(cover)}
              className="object-cover"
              sizes="64px"
            />
          </div>
          <div className="min-w-0">
            <p className="truncate font-medium text-neutral-950">{title}</p>
            <p className="truncate text-xs text-neutral-500">
              {sanitizeTourText(tour.slug ?? '', 40)}
            </p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-neutral-700">{category}</td>
      <td className="px-4 py-3 text-neutral-700">{tour.durationDays} gün</td>
      <td className="px-4 py-3 font-medium text-neutral-950">{price}</td>
      <td className="px-4 py-3">
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusBadgeClass(tour.status)}`}
          data-testid={`tour-status-badge-${tour.id}`}
        >
          {STATUS_LABELS[tour.status as TourStatusFilter] ?? tour.status}
        </span>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            role="switch"
            aria-checked={live}
            aria-label={live ? 'Arşivle' : 'Onaya gönder'}
            title={live ? 'Arşivle' : 'Admin onayına gönder'}
            data-testid={`toggle-status-btn-${tour.id}`}
            disabled={toggling}
            onClick={onToggle}
            className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition disabled:opacity-50 ${
              live ? 'bg-emerald-600' : 'bg-amber-500'
            }`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
                live ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
          <Link
            href={`${ACENTE_ROUTES.tours}/${tour.id}`}
            data-testid={`detail-tour-btn-${tour.id}`}
            className="rounded-lg border border-neutral-200 px-2 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
          >
            Detaylar
          </Link>
          <Link
            href={`${ACENTE_ROUTES.tours}/${tour.id}/edit`}
            data-testid={`edit-tour-btn-${tour.id}`}
            className="inline-flex items-center gap-1 rounded-lg border border-neutral-200 px-2 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
          >
            <Pencil className="h-3.5 w-3.5" aria-hidden />
            Düzenle
          </Link>
          <Link
            href={ACENTE_ROUTES.tourSeats(tour.id)}
            data-testid={`seats-tour-btn-${tour.id}`}
            className="inline-flex items-center gap-1 rounded-lg border border-neutral-200 px-2 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
          >
            <Armchair className="h-3.5 w-3.5" aria-hidden />
            Koltuk
          </Link>
          {!live ? null : (
            <button
              type="button"
              data-testid={`deactivate-tour-btn-${tour.id}`}
              onClick={onDeactivate}
              className="rounded-lg border border-neutral-200 px-2 py-1 text-xs font-medium text-neutral-600 hover:bg-red-50 hover:text-red-700"
            >
              Pasife al
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

function TourGridCard({
  tour,
  toggling,
  onToggle,
  onDeactivate,
}: {
  tour: PartnerTour;
  toggling: boolean;
  onToggle: () => void;
  onDeactivate: () => void;
}) {
  const live = isTourLive(tour.status);
  const title = sanitizeTourText(tour.title, 80);
  const category = sanitizeTourText(
    CATEGORY_LABELS[tour.category as TourCategoryFilter] ?? tour.category,
    40,
  );
  const cover = resolveMediaUrl(tour.coverUrl) || '/brand/mark-on-light.png';

  return (
    <article
      className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm"
      data-testid={`tour-card-${tour.id}`}
    >
      <div className="relative aspect-[16/10] bg-neutral-100">
        <Image
          src={cover}
          alt=""
          fill
          unoptimized={shouldUnoptimizeMedia(cover)}
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 33vw"
        />
      </div>
      <div className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-2 text-base font-semibold text-neutral-950">
            {title}
          </h3>
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${statusBadgeClass(tour.status)}`}
            data-testid={`tour-status-badge-${tour.id}`}
          >
            {STATUS_LABELS[tour.status as TourStatusFilter] ?? tour.status}
          </span>
        </div>
        <p className="text-sm text-neutral-600">
          {category} · {tour.durationDays} gün
        </p>
        <p className="text-lg font-bold text-neutral-950">
          {Number(tour.price).toLocaleString('tr-TR')}{' '}
          {sanitizeTourText(tour.currency, 8)}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            role="switch"
            aria-checked={live}
            aria-label={live ? 'Arşivle' : 'Onaya gönder'}
            title={live ? 'Arşivle' : 'Admin onayına gönder'}
            data-testid={`toggle-status-btn-${tour.id}`}
            disabled={toggling}
            onClick={onToggle}
            className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition disabled:opacity-50 ${
              live ? 'bg-emerald-600' : 'bg-amber-500'
            }`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
                live ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
          <Link
            href={`${ACENTE_ROUTES.tours}/${tour.id}`}
            data-testid={`detail-tour-btn-${tour.id}`}
            className="rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
          >
            Detaylar
          </Link>
          <Link
            href={`${ACENTE_ROUTES.tours}/${tour.id}/edit`}
            data-testid={`edit-tour-btn-${tour.id}`}
            className="rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
          >
            Düzenle
          </Link>
          <Link
            href={ACENTE_ROUTES.tourSeats(tour.id)}
            data-testid={`seats-tour-btn-${tour.id}`}
            className="rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
          >
            Koltuk
          </Link>
          {live ? (
            <button
              type="button"
              data-testid={`deactivate-tour-btn-${tour.id}`}
              onClick={onDeactivate}
              className="rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-600 hover:bg-red-50 hover:text-red-700"
            >
              Pasife al
            </button>
          ) : null}
        </div>
      </div>
    </article>
  );
}
