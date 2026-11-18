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
  MessageSquare,
  RefreshCw,
  Search,
  Star,
} from 'lucide-react';

import { useDebouncedInput } from '@/components/features/activity/activities-page/use-debounced-input';
import {
  ReviewCard,
  type ReviewCardProps,
} from '@/components/features/partner-dashboard/review-card';
import { resolveCategoryFeedback } from '@/lib/partner/reviews/client';
import { useAuth } from '@/providers/auth-provider';
import { ApiError } from '@/services/api-client';
import {
  listPartnerReviews,
  replyPartnerReview,
  type PartnerReviewItem,
  type PartnerReviewsStats,
  type PartnerReviewTourOption,
} from '@/services/partner-admin';

import {
  parseReviewsSearchParams,
  reviewsSearchToQueryString,
  type ReviewsSearchParams,
} from './reviews-query';

const SAFE_ERROR = 'Değerlendirmeler yüklenemedi. Lütfen tekrar deneyin.';

const EMPTY_CATEGORY_RATINGS = {
  guideRating: null,
  operatorRating: null,
  routeRating: null,
  foodRating: null,
  hotelRating: null,
  transportRating: null,
} as const;

const EMPTY_CATEGORY_FEEDBACK = {
  guideFeedback: null,
  operatorFeedback: null,
  routeFeedback: null,
  foodFeedback: null,
  hotelFeedback: null,
  transportFeedback: null,
} as const;

const RATING_FILTERS = [
  { id: 'all', label: 'Tümü' },
  { id: '5', label: '5 Yıldız' },
  { id: '4', label: '4 Yıldız' },
  { id: '3', label: '3 Yıldız' },
  { id: '2', label: '2 Yıldız' },
  { id: '1', label: '1 Yıldız' },
] as const;

function mapReviewToCard(review: PartnerReviewItem): ReviewCardProps {
  return {
    id: review.id,
    customerName: review.customerName,
    customerImage: review.customerImage ?? undefined,
    tourName: review.tourName,
    tourId: review.tourId,
    productType: review.productType,
    rating: review.rating,
    categoryRatings: review.categoryRatings,
    categoryFeedback: resolveCategoryFeedback(
      review.categoryRatings ?? EMPTY_CATEGORY_RATINGS,
      review.categoryFeedback ?? EMPTY_CATEGORY_FEEDBACK,
    ),
    reviewDate: review.reviewDate,
    reviewText: review.reviewText,
    isResponded: review.isResponded,
    responseText: review.responseText,
  };
}

function ReviewsSkeleton() {
  return (
    <div className="animate-pulse space-y-3" data-testid="reviews-skeleton">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="h-40 rounded-xl border border-neutral-100 bg-white"
        />
      ))}
    </div>
  );
}

const EMPTY_STATS: PartnerReviewsStats = {
  total: 0,
  averageRating: 0,
  responded: 0,
  pending: 0,
  ratingDistribution: [5, 4, 3, 2, 1].map((rating) => ({
    rating,
    count: 0,
    percent: 0,
  })),
};

export function AcenteReviewsPage() {
  const { accessToken } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const filters = useMemo(
    () => parseReviewsSearchParams(searchParams),
    [searchParams],
  );

  const [items, setItems] = useState<PartnerReviewItem[]>([]);
  const [stats, setStats] = useState<PartnerReviewsStats>(EMPTY_STATS);
  const [tours, setTours] = useState<PartnerReviewTourOption[]>([]);
  const [meta, setMeta] = useState({
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const replaceFilters = useCallback(
    (next: ReviewsSearchParams) => {
      const qs = reviewsSearchToQueryString(next);
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
      const result = await listPartnerReviews(accessToken, {
        q: filters.q || undefined,
        rating: filters.rating,
        tourId: filters.tourId,
        responseStatus: filters.responseStatus,
        sort: filters.sort,
        page: filters.page,
        pageSize: filters.pageSize,
      });
      setItems(result.items);
      setStats(result.stats);
      setTours(result.tours);
      setMeta(result.meta);
    } catch (err) {
      setItems([]);
      setStats(EMPTY_STATS);
      setError(err instanceof ApiError ? err.message : SAFE_ERROR);
    } finally {
      setLoading(false);
    }
  }, [accessToken, filters]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleReply = async (reviewId: string, responseText: string) => {
    if (!accessToken) throw new Error('Oturum gerekli');
    await replyPartnerReview(reviewId, responseText, accessToken);
    setItems((prev) =>
      prev.map((r) =>
        r.id === reviewId ? { ...r, isResponded: true, responseText } : r,
      ),
    );
    setStats((prev) => ({
      ...prev,
      responded: prev.responded + 1,
      pending: Math.max(0, prev.pending - 1),
    }));
  };

  const satisfactionLabel =
    stats.averageRating >= 4.5
      ? 'Çok memnun'
      : stats.averageRating >= 3.5
        ? 'Memnun'
        : stats.averageRating >= 2.5
          ? 'Karışık'
          : stats.total === 0
            ? 'Veri yok'
            : 'İyileştirme gerekli';

  return (
    <div className="space-y-6" data-testid="acente-reviews-page">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Müşteri Değerlendirmeleri
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Yalnızca acentenizin turlarına gelen yorumlar. Filtreler URL ile
            senkronize çalışır.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
          data-testid="reviews-refresh-btn"
        >
          <RefreshCw className="h-4 w-4" />
          Yenile
        </button>
      </div>

      <div
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        data-testid="reviews-kpi-grid"
      >
        <div
          className="rounded-xl border border-amber-100 bg-gradient-to-br from-amber-50 to-white p-4 shadow-sm"
          data-testid="reviews-kpi-average"
        >
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-amber-700">
            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
            Ortalama puan
          </div>
          <p className="mt-2 text-3xl font-semibold text-gray-900">
            {stats.averageRating.toFixed(1)}
          </p>
          <p className="mt-1 text-xs text-gray-500">{satisfactionLabel}</p>
        </div>
        <div
          className="rounded-xl border border-sky-100 bg-gradient-to-br from-sky-50 to-white p-4 shadow-sm"
          data-testid="reviews-kpi-total"
        >
          <div className="text-xs font-medium uppercase tracking-wide text-sky-700">
            Toplam değerlendirme
          </div>
          <p className="mt-2 text-3xl font-semibold text-gray-900">
            {stats.total}
          </p>
          <p className="mt-1 text-xs text-gray-500">Filtrelenmiş sonuç</p>
        </div>
        <div
          className="rounded-xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-4 shadow-sm"
          data-testid="reviews-kpi-responded"
        >
          <div className="text-xs font-medium uppercase tracking-wide text-emerald-700">
            Yanıtlanan
          </div>
          <p className="mt-2 text-3xl font-semibold text-gray-900">
            {stats.responded}
          </p>
        </div>
        <div
          className="rounded-xl border border-orange-100 bg-gradient-to-br from-orange-50 to-white p-4 shadow-sm"
          data-testid="reviews-kpi-pending"
        >
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-orange-700">
            <MessageSquare className="h-4 w-4" />
            Bekleyen
          </div>
          <p className="mt-2 text-3xl font-semibold text-gray-900">
            {stats.pending}
          </p>
        </div>
      </div>

      <div
        className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm"
        data-testid="reviews-distribution"
      >
        <h2 className="text-sm font-semibold text-gray-800">Yıldız dağılımı</h2>
        <div className="mt-3 space-y-2">
          {stats.ratingDistribution.map((row) => (
            <div
              key={row.rating}
              className="flex items-center gap-3 text-sm"
              data-testid={`reviews-dist-${row.rating}`}
            >
              <span className="w-16 shrink-0 text-gray-600">
                {row.rating} yıldız
              </span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-amber-400 transition-all"
                  style={{ width: `${Math.min(100, row.percent)}%` }}
                />
              </div>
              <span className="w-16 shrink-0 text-right text-xs text-gray-500">
                {row.count} (%{row.percent})
              </span>
            </div>
          ))}
        </div>
      </div>

      <div
        className="space-y-3 rounded-xl border border-gray-100 bg-white p-4 shadow-sm"
        data-testid="reviews-filters"
      >
        <div className="relative max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={() => flush()}
            placeholder="Yorum veya müşteri ara…"
            className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            data-testid="reviews-search-input"
          />
        </div>

        <div
          className="flex flex-wrap gap-2"
          data-testid="reviews-rating-chips"
        >
          {RATING_FILTERS.map((opt) => {
            const active =
              opt.id === 'all'
                ? !filters.rating
                : filters.rating === Number(opt.id);
            return (
              <button
                key={opt.id}
                type="button"
                data-testid={`reviews-rating-${opt.id}`}
                onClick={() =>
                  replaceFilters({
                    ...filters,
                    rating: opt.id === 'all' ? undefined : Number(opt.id),
                    page: 1,
                  })
                }
                className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                  active
                    ? 'bg-amber-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap gap-3">
          <select
            value={filters.tourId ?? ''}
            onChange={(e) =>
              replaceFilters({
                ...filters,
                tourId: e.target.value || undefined,
                page: 1,
              })
            }
            className="h-9 min-w-[200px] rounded-lg border border-gray-300 bg-white px-3 text-sm"
            data-testid="reviews-tour-select"
          >
            <option value="">Tüm turlar</option>
            {tours.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title}
                {t.type === 'experience' ? ' (Aktivite)' : ''}
              </option>
            ))}
          </select>

          <select
            value={filters.responseStatus}
            onChange={(e) =>
              replaceFilters({
                ...filters,
                responseStatus: e.target
                  .value as ReviewsSearchParams['responseStatus'],
                page: 1,
              })
            }
            className="h-9 rounded-lg border border-gray-300 bg-white px-3 text-sm"
            data-testid="reviews-response-select"
          >
            <option value="all">Tüm değerlendirmeler</option>
            <option value="responded">Yanıtlananlar</option>
            <option value="pending">Yanıtlanmayanlar</option>
          </select>

          <select
            value={filters.sort}
            onChange={(e) =>
              replaceFilters({
                ...filters,
                sort: e.target.value as ReviewsSearchParams['sort'],
                page: 1,
              })
            }
            className="h-9 rounded-lg border border-gray-300 bg-white px-3 text-sm"
            data-testid="reviews-sort-select"
          >
            <option value="newest">En yeni</option>
            <option value="oldest">En eski</option>
            <option value="highest">En yüksek puan</option>
            <option value="lowest">En düşük puan</option>
          </select>
        </div>
      </div>

      {error ? (
        <p
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
          data-testid="reviews-error"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      {loading || isPending ? <ReviewsSkeleton /> : null}

      {!loading && !isPending && items.length === 0 ? (
        <div
          className="rounded-xl border border-dashed border-gray-200 bg-white px-6 py-16 text-center"
          data-testid="reviews-empty"
        >
          <MessageSquare className="mx-auto h-8 w-8 text-gray-400" />
          <p className="mt-3 text-lg font-semibold text-gray-700">
            Değerlendirme bulunamadı
          </p>
          <p className="mt-1 text-sm text-gray-500">
            Filtreleri temizleyerek tekrar deneyin.
          </p>
        </div>
      ) : null}

      {!loading && !isPending && items.length > 0 ? (
        <div className="space-y-4" data-testid="reviews-list">
          {items.map((review) => (
            <ReviewCard
              key={review.id}
              {...mapReviewToCard(review)}
              onReply={handleReply}
            />
          ))}
        </div>
      ) : null}

      {!loading && meta.totalPages > 1 ? (
        <div
          className="flex items-center justify-between gap-3"
          data-testid="reviews-pagination"
        >
          <p className="text-sm text-gray-500">
            Sayfa {meta.page} / {meta.totalPages} · {meta.total} kayıt
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={meta.page <= 1}
              data-testid="reviews-page-prev"
              onClick={() =>
                replaceFilters({ ...filters, page: Math.max(1, meta.page - 1) })
              }
              className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
              Önceki
            </button>
            <button
              type="button"
              disabled={meta.page >= meta.totalPages}
              data-testid="reviews-page-next"
              onClick={() =>
                replaceFilters({
                  ...filters,
                  page: Math.min(meta.totalPages, meta.page + 1),
                })
              }
              className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm disabled:opacity-40"
            >
              Sonraki
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
