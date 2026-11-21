'use client';

import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';

import {
  hideAdminReview,
  listAdminReviewTours,
  listAdminTourReviews,
  restoreAdminReview,
  type AdminReviewTourSummary,
  type AdminTourReviewDetail,
} from '@/services/partner-admin';
import { resolveMediaUrl, shouldUnoptimizeMedia } from '@/lib/media';
import { useAuth } from '@/providers/auth-provider';

const FOCUS_FILTERS = [
  { id: 'attention', label: 'Öncelikli' },
  { id: 'all', label: 'Tümü' },
  { id: 'hidden', label: 'Gizli var' },
] as const;

type FocusFilter = (typeof FOCUS_FILTERS)[number]['id'];

function scoreChips(row: AdminTourReviewDetail) {
  const chips: Array<{ label: string; value: number }> = [];
  if (row.guideRating != null)
    chips.push({ label: 'Rehber', value: row.guideRating });
  if (row.transportRating != null)
    chips.push({ label: 'Ulaşım', value: row.transportRating });
  if (row.accommodationRating != null)
    chips.push({ label: 'Konaklama', value: row.accommodationRating });
  if (row.operatorRating != null)
    chips.push({ label: 'Operatör', value: row.operatorRating });
  if (row.routeRating != null)
    chips.push({ label: 'Rota', value: row.routeRating });
  if (row.foodRating != null)
    chips.push({ label: 'Yemek', value: row.foodRating });
  return chips;
}

function shortTitle(title: string) {
  return title.replace(/\s*—\s*.+$/, '').trim() || title;
}

export default function AdminReviewsPage() {
  const { accessToken } = useAuth();
  const [tours, setTours] = useState<AdminReviewTourSummary[]>([]);
  const [query, setQuery] = useState('');
  const [focus, setFocus] = useState<FocusFilter>('attention');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [reviews, setReviews] = useState<AdminTourReviewDetail[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [loadingList, setLoadingList] = useState(false);

  async function reloadTours() {
    if (!accessToken) return;
    setLoadingList(true);
    try {
      setTours(await listAdminReviewTours(accessToken));
    } finally {
      setLoadingList(false);
    }
  }

  async function loadTourReviews(tourId: string) {
    if (!accessToken) return;
    setLoadingDetail(true);
    try {
      const data = await listAdminTourReviews(tourId, accessToken, {
        includeHidden: true,
      });
      setReviews(data.reviews);
    } finally {
      setLoadingDetail(false);
    }
  }

  useEffect(() => {
    if (!accessToken) return;
    void reloadTours().catch((err: Error) => setError(err.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    let rows = tours;
    if (focus === 'attention') {
      rows = rows.filter((t) => t.needsReviewCount > 0 || t.hiddenCount > 0);
    } else if (focus === 'hidden') {
      rows = rows.filter((t) => t.hiddenCount > 0);
    }
    if (q) {
      rows = rows.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          (t.agencyName?.toLowerCase().includes(q) ?? false),
      );
    }
    return [...rows].sort((a, b) => {
      const aPri = a.needsReviewCount + a.hiddenCount;
      const bPri = b.needsReviewCount + b.hiddenCount;
      if (bPri !== aPri) return bPri - aPri;
      return b.reviewCount - a.reviewCount;
    });
  }, [tours, query, focus]);

  const attentionCount = useMemo(
    () =>
      tours.filter((t) => t.needsReviewCount > 0 || t.hiddenCount > 0).length,
    [tours],
  );

  async function toggleTour(tourId: string) {
    if (expandedId === tourId) {
      setExpandedId(null);
      setReviews([]);
      return;
    }
    setExpandedId(tourId);
    setError(null);
    setSuccess(null);
    try {
      await loadTourReviews(tourId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Yorumlar yüklenemedi');
    }
  }

  async function onHide(reviewId: string, tourId: string) {
    if (!accessToken) return;
    if (!window.confirm('Bu yorum gizlensin mi?')) return;
    setBusyId(reviewId);
    setError(null);
    try {
      await hideAdminReview(reviewId, accessToken);
      setSuccess('Yorum gizlendi');
      await loadTourReviews(tourId);
      await reloadTours();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'İşlem başarısız');
    } finally {
      setBusyId(null);
    }
  }

  async function onRestore(reviewId: string, tourId: string) {
    if (!accessToken) return;
    setBusyId(reviewId);
    setError(null);
    try {
      await restoreAdminReview(reviewId, accessToken);
      setSuccess('Yorum yayına alındı');
      await loadTourReviews(tourId);
      await reloadTours();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'İşlem başarısız');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div data-testid="admin-reviews-page">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">
            Yorum denetimi
          </h1>
          <p className="mt-1 text-sm text-neutral-600">
            Düşük puanlı veya gizli yorumlara önce bakın; tura tıklayınca detay
            açılır.
          </p>
        </div>
        <p
          className="text-xs text-neutral-500"
          data-testid="admin-reviews-stats"
        >
          {attentionCount} öncelikli · {tours.length} tur
        </p>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {FOCUS_FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            data-testid={`admin-reviews-filter-${f.id}`}
            onClick={() => setFocus(f.id)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
              focus === f.id
                ? 'bg-neutral-950 text-white'
                : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
            }`}
          >
            {f.label}
            {f.id === 'attention' ? ` (${attentionCount})` : ''}
          </button>
        ))}
      </div>

      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Tur veya acente ara…"
        className="mt-3 w-full max-w-md rounded-lg border border-neutral-300 px-3 py-2 text-sm"
        data-testid="admin-reviews-search"
      />

      {error ? (
        <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}
      {success ? (
        <p
          className="mt-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800"
          data-testid="admin-reviews-success"
        >
          {success}
        </p>
      ) : null}

      <ul
        className="mt-6 divide-y rounded-xl border border-neutral-200 bg-white"
        data-testid="admin-reviews-list"
        data-count={String(visible.length)}
      >
        {loadingList && tours.length === 0 ? (
          <li className="p-4 text-sm text-neutral-500">Yükleniyor…</li>
        ) : null}
        {!loadingList && visible.length === 0 ? (
          <li
            className="p-4 text-sm text-neutral-600"
            data-testid="admin-reviews-empty"
          >
            {focus === 'attention'
              ? 'Öncelikli tur yok — Tümü’ne geçebilirsiniz.'
              : 'Bu filtrede tur yok.'}
          </li>
        ) : null}

        {visible.map((tour) => {
          const open = expandedId === tour.tourId;
          const needs = tour.needsReviewCount > 0;
          return (
            <li
              key={tour.tourId}
              data-testid={`admin-review-tour-${tour.tourId}`}
              className={needs ? 'bg-amber-50/40' : undefined}
            >
              <button
                type="button"
                className="grid w-full grid-cols-[1fr_auto] items-center gap-3 px-4 py-3.5 text-left hover:bg-neutral-50 sm:grid-cols-[minmax(0,1fr)_auto_auto]"
                data-testid={`admin-review-tour-toggle-${tour.tourId}`}
                onClick={() => void toggleTour(tour.tourId)}
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-neutral-900">
                    {shortTitle(tour.title)}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-neutral-500">
                    {tour.agencyName ?? 'Acente'}
                  </p>
                </div>

                <div className="hidden items-center gap-2 sm:flex">
                  <span className="tabular-nums text-sm font-semibold text-neutral-900">
                    {tour.averageRating.toFixed(1)}
                    <span className="font-normal text-neutral-400">/5</span>
                  </span>
                  <span className="text-xs text-neutral-500">
                    {tour.reviewCount} yorum
                  </span>
                  {needs ? (
                    <span className="rounded-md bg-amber-100 px-1.5 py-0.5 text-[11px] font-medium text-amber-900">
                      {tour.needsReviewCount} düşük
                    </span>
                  ) : null}
                  {tour.hiddenCount > 0 ? (
                    <span className="rounded-md bg-neutral-200 px-1.5 py-0.5 text-[11px] font-medium text-neutral-700">
                      {tour.hiddenCount} gizli
                    </span>
                  ) : null}
                </div>

                <span className="text-xs font-medium text-neutral-500">
                  {open ? 'Kapat' : 'Aç'}
                </span>
              </button>

              {/* Mobile metrics */}
              <div className="flex flex-wrap gap-2 px-4 pb-3 sm:hidden">
                <span className="text-xs text-neutral-600">
                  {tour.averageRating.toFixed(1)}/5 · {tour.reviewCount} yorum
                </span>
                {needs ? (
                  <span className="rounded-md bg-amber-100 px-1.5 py-0.5 text-[11px] font-medium text-amber-900">
                    {tour.needsReviewCount} düşük
                  </span>
                ) : null}
              </div>

              {open ? (
                <div
                  className="space-y-2 border-t border-neutral-200 bg-neutral-50 px-4 py-3"
                  data-testid={`admin-review-tour-detail-${tour.tourId}`}
                >
                  {loadingDetail ? (
                    <p className="text-xs text-neutral-500">Yükleniyor…</p>
                  ) : null}
                  {!loadingDetail && reviews.length === 0 ? (
                    <p className="text-xs text-neutral-500">Yorum yok.</p>
                  ) : null}

                  {reviews.map((row) => {
                    const chips = scoreChips(row);
                    const low = row.rating <= 2;
                    return (
                      <article
                        key={row.id}
                        className={`rounded-lg border bg-white p-3 ${
                          row.hidden
                            ? 'border-neutral-200 opacity-70'
                            : low
                              ? 'border-amber-200'
                              : 'border-neutral-200'
                        }`}
                        data-testid={`admin-review-row-${row.id}`}
                        data-hidden={row.hidden ? '1' : '0'}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className={`text-sm font-semibold tabular-nums ${
                                  low ? 'text-amber-800' : 'text-neutral-900'
                                }`}
                              >
                                {row.rating}/5
                              </span>
                              {row.hidden ? (
                                <span className="rounded bg-neutral-200 px-1.5 py-0.5 text-[10px] font-medium text-neutral-700">
                                  Gizli
                                </span>
                              ) : null}
                              <time className="text-[11px] text-neutral-400">
                                {new Date(row.createdAt).toLocaleDateString(
                                  'tr-TR',
                                )}
                              </time>
                            </div>

                            <p className="mt-1.5 text-sm leading-snug text-neutral-800">
                              {row.comment || '—(yorum metni yok)'}
                            </p>

                            {chips.length > 0 ? (
                              <ul className="mt-2 flex flex-wrap gap-1.5">
                                {chips.map((c) => (
                                  <li
                                    key={c.label}
                                    className="rounded bg-neutral-100 px-1.5 py-0.5 text-[11px] text-neutral-600"
                                  >
                                    {c.label} {c.value}
                                  </li>
                                ))}
                              </ul>
                            ) : null}

                            {row.agencyReply ? (
                              <p className="mt-2 border-l-2 border-neutral-200 pl-2 text-xs text-neutral-600">
                                <span className="font-medium text-neutral-700">
                                  Acente:{' '}
                                </span>
                                {row.agencyReply}
                              </p>
                            ) : null}

                            {row.photoUrls?.length ? (
                              <ul className="mt-2 flex flex-wrap gap-1.5">
                                {row.photoUrls.slice(0, 4).map((url) => {
                                  const src = resolveMediaUrl(url);
                                  if (!src) return null;
                                  return (
                                    <li
                                      key={url}
                                      className="relative h-12 w-12 overflow-hidden rounded bg-neutral-100"
                                    >
                                      <Image
                                        src={src}
                                        alt=""
                                        fill
                                        sizes="48px"
                                        unoptimized={shouldUnoptimizeMedia(src)}
                                        className="object-cover"
                                      />
                                    </li>
                                  );
                                })}
                              </ul>
                            ) : null}
                          </div>

                          {row.hidden ? (
                            <button
                              type="button"
                              disabled={busyId === row.id || !accessToken}
                              className="shrink-0 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-900 disabled:opacity-50"
                              data-testid={`admin-review-restore-${row.id}`}
                              onClick={() =>
                                void onRestore(row.id, tour.tourId)
                              }
                            >
                              Yayına al
                            </button>
                          ) : (
                            <button
                              type="button"
                              disabled={busyId === row.id || !accessToken}
                              className="shrink-0 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-800 disabled:opacity-50"
                              data-testid={`admin-review-hide-${row.id}`}
                              onClick={() => void onHide(row.id, tour.tourId)}
                            >
                              Gizle
                            </button>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
