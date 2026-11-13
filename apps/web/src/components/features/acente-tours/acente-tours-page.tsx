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
import { LayoutGrid, List, Plus, Search, X } from 'lucide-react';

import { TourCard } from '@/components/features/partner-dashboard/tour-card';
import { useDebouncedInput } from '@/components/features/activity/activities-page/use-debounced-input';
import { ACENTE_ROUTES } from '@/lib/panel-routes';
import { useAuth } from '@/providers/auth-provider';
import { ApiError } from '@/services/api-client';
import {
  cancelPartnerTour,
  cancelPartnerTourDates,
  listPartnerTours,
  type PartnerTour,
  type PartnerTourListMeta,
  type TourCancelReason,
} from '@/services/partner-admin';

import { TourCancelDialog } from './tour-cancel-dialog';
import { ToursSkeleton } from './tours-skeleton';
import {
  parseToursSearchParams,
  sanitizeTourText,
  toursSearchToQueryString,
  TOUR_STATUS_FILTERS,
  type TourStatusFilter,
  type ToursSearchParams,
} from './tours-query';

const PAGE_SIZE = 12;
const SAFE_ERROR = 'Tur listesi yüklenemedi. Lütfen tekrar deneyin.';

function mapStatus(status: string): 'active' | 'draft' | 'archived' {
  if (status === 'PUBLISHED' || status === 'ACTIVE') return 'active';
  if (status === 'ARCHIVED') return 'archived';
  return 'draft';
}

const STATUS_LABELS: Record<TourStatusFilter, string> = {
  DRAFT: 'Taslak',
  PENDING_REVIEW: 'İncelemede',
  PUBLISHED: 'Yayında',
  ARCHIVED: 'Arşiv',
};

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

  const replaceFilters = useCallback(
    (next: Partial<ToursSearchParams>) => {
      const merged: ToursSearchParams = {
        q: next.q ?? filters.q,
        status: 'status' in next ? next.status : filters.status,
        page: next.page ?? filters.page,
        view: next.view ?? filters.view,
      };
      if (next.q !== undefined || 'status' in next) {
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
  }, [accessToken, filters.page, filters.q, filters.status]);

  useEffect(() => {
    if (!accessToken) return;
    setLoading(true);
    void load();
  }, [accessToken, load]);

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
      setLoading(true);
      await load();
    } finally {
      setCancelBusy(false);
    }
  }

  // Legacy Railway payloads ignore q/status — refine client-side as a safety net.
  const visibleTours = useMemo(() => {
    const q = filters.q.trim().toLowerCase();
    return tours.filter((tour) => {
      if (filters.status && tour.status !== filters.status) return false;
      if (!q) return true;
      return (
        tour.title.toLowerCase().includes(q) ||
        tour.category.toLowerCase().includes(q) ||
        (tour.slug ?? '').toLowerCase().includes(q)
      );
    });
  }, [filters.q, filters.status, tours]);

  const listView = filters.view === 'list';
  const hasActiveFilters = Boolean(filters.q || filters.status);
  const emptyBecauseSearch = hasActiveFilters && visibleTours.length === 0;

  if (loading && tours.length === 0) {
    return <ToursSkeleton listView={listView} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-950">
            Turlar
          </h1>
          <p className="mt-1 max-w-prose text-sm text-neutral-600">
            Turlarınızı yönetin. İptal ederken tarih seçin; yalnızca o tarihteki
            rezervasyonlar iptal edilir.
          </p>
        </div>
        <Link
          href={`${ACENTE_ROUTES.tours}/new`}
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
              className="w-full rounded-lg border border-neutral-300 py-2.5 pr-10 pl-10 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-950 focus:outline-none focus:ring-1 focus:ring-neutral-950"
            />
            {draft ? (
              <button
                type="button"
                aria-label="Aramayı temizle"
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
            <div
              role="tablist"
              aria-label="Görünüm"
              className="flex gap-1 rounded-lg bg-neutral-100 p-1"
            >
              <button
                type="button"
                role="tab"
                aria-selected={!listView}
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

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
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
      >
        {visibleTours.length === 0 ? (
          <div className="rounded-xl border border-dashed border-neutral-200 bg-white px-6 py-16 text-center">
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
                  onClick={() => {
                    setDraft('');
                    replaceFilters({
                      q: '',
                      status: undefined,
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
        ) : (
          <div
            className={
              listView
                ? 'space-y-4'
                : 'grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3'
            }
          >
            {visibleTours.map((tour) => (
              <TourCard
                key={tour.id}
                id={tour.id}
                title={sanitizeTourText(tour.title, 80)}
                price={`${Number(tour.price).toLocaleString('tr-TR')} ${sanitizeTourText(tour.currency, 8)}`}
                location={sanitizeTourText(tour.category || '—', 40)}
                duration={`${tour.durationDays} gün`}
                maxParticipants={20}
                imageUrl={tour.coverUrl || '/brand/mark-on-light.png'}
                status={mapStatus(tour.status)}
                rating={
                  tour.averageRating && tour.averageRating > 0
                    ? tour.averageRating
                    : undefined
                }
                listView={listView}
                onEdit={(id) =>
                  router.push(`${ACENTE_ROUTES.tours}/${id}/edit`)
                }
                onDelete={
                  mapStatus(tour.status) === 'archived'
                    ? undefined
                    : () => setCancelTour(tour)
                }
              />
            ))}
          </div>
        )}
      </div>

      {meta.totalPages > 1 ? (
        <nav
          aria-label="Sayfalama"
          className="flex flex-wrap items-center justify-between gap-3 border-t border-neutral-200 pt-4"
        >
          <p className="text-sm text-neutral-600">
            Toplam {meta.total} tur · Sayfa {meta.page}/{meta.totalPages}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={meta.page <= 1 || loading}
              onClick={() => replaceFilters({ page: meta.page - 1 })}
              className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-800 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950"
            >
              Önceki
            </button>
            <button
              type="button"
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
