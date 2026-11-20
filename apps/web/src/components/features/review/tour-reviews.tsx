'use client';

import Image from 'next/image';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type {
  Review,
  TourReviewCriteria,
  TourReviewSummary,
  TravelerContext,
} from '@turta/shared-types';

import {
  createReview,
  getReviewEligibility,
  getTourReviewSummary,
  listTourReviews,
} from '@/services/review';
import { useAuth } from '@/providers/auth-provider';
import { resolveMediaUrl, shouldUnoptimizeMedia } from '@/lib/media';
import {
  CRITERION_LABELS,
  REVIEW_QUICK_TAGS,
  TRAVELER_CONTEXT_LABELS,
  TRAVELER_CONTEXT_OPTIONS,
  activeCriteria,
  previewOverallRating,
  type TourReviewCriterionKey,
} from '@/lib/reviews/tour-review-scoring';

type Props = { tourId: string };

type FilterMode = 'ALL' | 'PHOTOS' | TravelerContext;

const DEFAULT_CRITERIA: TourReviewCriteria = {
  guide: true,
  value: true,
  transport: true,
  accommodation: true,
};

function StarPicker({
  value,
  onChange,
  label,
}: {
  value: number;
  onChange: (n: number) => void;
  label: string;
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-sm font-medium text-neutral-800">{label}</p>
      <div className="flex gap-1.5" role="group" aria-label={label}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={`h-10 w-10 rounded-lg text-sm font-semibold transition ${
              value >= n
                ? 'bg-amber-400 text-neutral-950'
                : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200'
            }`}
            aria-pressed={value >= n}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}

function ScoreBar({ label, value }: { label: string; value: number | null }) {
  const pct = value != null && value > 0 ? Math.min(100, (value / 5) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="text-neutral-700">{label}</span>
        <span className="font-medium text-neutral-900">
          {value != null && value > 0 ? value.toFixed(1) : '—'}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-neutral-100">
        <div
          className="h-full rounded-full bg-amber-400 transition-[width]"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function formatJoinedContext(review: Review): string {
  const ctx = review.travelerContext
    ? TRAVELER_CONTEXT_LABELS[review.travelerContext]
    : null;
  const when = new Date(review.createdAt).toLocaleDateString('tr-TR', {
    month: 'long',
    year: 'numeric',
  });
  if (ctx) return `${ctx} olarak katıldı · ${when}`;
  return when;
}

/**
 * Tour reviews — summary bars, filters, quick 15s form, agency reply cards.
 */
export function TourReviews({ tourId }: Props) {
  const { accessToken, isAuthenticated } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [total, setTotal] = useState(0);
  const [summary, setSummary] = useState<TourReviewSummary | null>(null);
  const [filter, setFilter] = useState<FilterMode>('ALL');
  const [eligible, setEligible] = useState<{
    reservationId: string | null;
    alreadyReviewed: boolean;
    criteria: TourReviewCriteria;
  } | null>(null);
  const [travelerContext, setTravelerContext] =
    useState<TravelerContext>('COUPLE');
  const [scores, setScores] = useState<
    Partial<Record<TourReviewCriterionKey, number>>
  >({ guide: 5, value: 5 });
  const [tags, setTags] = useState<string[]>([]);
  const [comment, setComment] = useState('');
  const [photoUrlsText, setPhotoUrlsText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const criteria = eligible?.criteria ?? summary?.criteria ?? DEFAULT_CRITERIA;
  const criterionKeys = useMemo(() => activeCriteria(criteria), [criteria]);

  const liveOverall = useMemo(
    () => previewOverallRating(scores, criteria),
    [scores, criteria],
  );

  const reload = useCallback(async () => {
    const params =
      filter === 'ALL'
        ? undefined
        : filter === 'PHOTOS'
          ? { hasPhotos: true }
          : { travelerContext: filter };

    const [{ data, meta }, summaryData] = await Promise.all([
      listTourReviews(tourId, params),
      getTourReviewSummary(tourId),
    ]);
    setReviews(data);
    setTotal(meta?.total ?? data.length);
    setSummary(summaryData);
  }, [tourId, filter]);

  useEffect(() => {
    void reload().catch((err: Error) => setError(err.message));
  }, [reload]);

  useEffect(() => {
    if (!accessToken) {
      setEligible(null);
      return;
    }
    void getReviewEligibility(tourId, accessToken)
      .then((data) => {
        setEligible(data);
        setScores((prev) => {
          const next: Partial<Record<TourReviewCriterionKey, number>> = {
            guide: prev.guide ?? 5,
            value: prev.value ?? 5,
          };
          if (data.criteria.transport) next.transport = prev.transport ?? 5;
          if (data.criteria.accommodation) {
            next.accommodation = prev.accommodation ?? 5;
          }
          return next;
        });
      })
      .catch(() => setEligible(null));
  }, [tourId, accessToken]);

  function toggleTag(tag: string) {
    setTags((prev) =>
      prev.includes(tag)
        ? prev.filter((t) => t !== tag)
        : prev.length >= 8
          ? prev
          : [...prev, tag],
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!accessToken || !eligible?.reservationId) return;
    setSaving(true);
    setError(null);
    try {
      const photoUrls = photoUrlsText
        .split(/\n|,/)
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 5);

      await createReview(
        {
          reservationId: eligible.reservationId,
          guideRating: scores.guide ?? 5,
          valueRating: scores.value ?? 5,
          transportRating: criteria.transport
            ? (scores.transport ?? 5)
            : undefined,
          accommodationRating: criteria.accommodation
            ? (scores.accommodation ?? 5)
            : undefined,
          travelerContext,
          tags: tags.length ? tags : undefined,
          comment: comment.trim() || undefined,
          photoUrls: photoUrls.length ? photoUrls : undefined,
        },
        accessToken,
      );
      setComment('');
      setTags([]);
      setPhotoUrlsText('');
      setEligible({ ...eligible, alreadyReviewed: true });
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Yorum kaydedilemedi');
    } finally {
      setSaving(false);
    }
  }

  const canWrite =
    isAuthenticated &&
    eligible &&
    !eligible.alreadyReviewed &&
    Boolean(eligible.reservationId);

  const filterChips: { id: FilterMode; label: string }[] = [
    { id: 'ALL', label: 'Tümü' },
    { id: 'PHOTOS', label: 'Fotoğraflı' },
    { id: 'FAMILY', label: 'Aile' },
    { id: 'COUPLE', label: 'Çift' },
    { id: 'FRIENDS', label: 'Arkadaş' },
    { id: 'SOLO', label: 'Tek' },
  ];

  return (
    <section
      id="tour-reviews"
      data-testid="tour-reviews"
      className="mt-10 scroll-mt-24 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-6 md:p-8"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-neutral-900 md:text-2xl">
            Yolcu Deneyimi & Puanlar
          </h2>
          <p className="mt-1 text-sm text-neutral-600">
            Doğrulanmış rezervasyonlardan gelen alt kırılımlı puanlar.
          </p>
        </div>
        {summary ? (
          <div className="rounded-xl bg-neutral-50 px-3 py-2 text-right ring-1 ring-neutral-200">
            <p className="text-2xl font-semibold text-neutral-950">
              {summary.averageRating > 0
                ? summary.averageRating.toFixed(1)
                : '—'}
            </p>
            <p className="text-xs text-neutral-500">
              {summary.reviewCount} yorum
            </p>
            {summary.ratingSource === 'AGENCY_COLD_START' ? (
              <p className="mt-1 text-xs font-medium text-amber-700">
                Yeni Rota — Acente Puanı
                {summary.agencyReviewCount != null
                  ? ` · ${summary.agencyReviewCount} doğrulanmış`
                  : ''}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>

      {summary ? (
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <div className="space-y-3">
            <ScoreBar
              label={CRITERION_LABELS.guide}
              value={summary.averageGuideRating}
            />
            <ScoreBar
              label={CRITERION_LABELS.value}
              value={summary.averageValueRating}
            />
            {summary.criteria.transport ? (
              <ScoreBar
                label={CRITERION_LABELS.transport}
                value={summary.averageTransportRating}
              />
            ) : null}
            {summary.criteria.accommodation ? (
              <ScoreBar
                label={CRITERION_LABELS.accommodation}
                value={summary.averageAccommodationRating}
              />
            ) : null}
          </div>
          <div>
            <p className="mb-2 text-sm font-medium text-neutral-800">
              En sık seçilen etiketler
            </p>
            {summary.topTags.length === 0 ? (
              <p className="text-sm text-neutral-500">Henüz etiket yok.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {summary.topTags.map((item) => (
                  <span
                    key={item.tag}
                    className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-900 ring-1 ring-amber-200"
                  >
                    {item.tag}
                    <span className="ml-1 text-amber-700/70">
                      ×{item.count}
                    </span>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : null}

      {error ? (
        <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {canWrite ? (
        <form
          onSubmit={handleSubmit}
          data-testid="quick-review-form"
          className="mt-8 space-y-5 rounded-2xl border border-neutral-200 bg-neutral-50/80 p-4 sm:p-5"
        >
          <div>
            <p className="text-sm font-semibold text-neutral-900">
              15 saniyelik hızlı değerlendirme
            </p>
            <p className="mt-0.5 text-xs text-neutral-600">
              Tamamlanan rezervasyonunuz için doğrulanmış yorum.
            </p>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-neutral-800">
              Kiminle katıldınız?
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {TRAVELER_CONTEXT_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setTravelerContext(opt.id)}
                  className={`rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                    travelerContext === opt.id
                      ? 'bg-neutral-950 text-white'
                      : 'bg-white text-neutral-700 ring-1 ring-neutral-200 hover:bg-neutral-100'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            {criterionKeys.map((key) => (
              <StarPicker
                key={key}
                label={CRITERION_LABELS[key]}
                value={scores[key] ?? 5}
                onChange={(n) => setScores((prev) => ({ ...prev, [key]: n }))}
              />
            ))}
            <p className="text-sm text-neutral-700">
              Genel puan önizleme:{' '}
              <span className="font-semibold text-neutral-950">
                {liveOverall.toFixed(1)}
              </span>
              <span className="text-neutral-500"> (otomatik)</span>
            </p>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-neutral-800">
              Hızlı etiketler
            </p>
            <div className="flex flex-wrap gap-2">
              {REVIEW_QUICK_TAGS.map((tag) => {
                const active = tags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                      active
                        ? 'bg-emerald-600 text-white'
                        : 'bg-white text-neutral-700 ring-1 ring-neutral-200 hover:bg-neutral-100'
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>

          <label className="block text-sm">
            <span className="font-medium text-neutral-700">
              Kısa yorum (opsiyonel)
            </span>
            <textarea
              rows={2}
              className="mt-1 w-full rounded-xl border border-neutral-300 bg-white px-3 py-2"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="İsterseniz bir cümle ekleyin…"
            />
          </label>

          <label className="block text-sm">
            <span className="font-medium text-neutral-700">
              Fotoğraf URL’leri (opsiyonel, satır veya virgülle)
            </span>
            <textarea
              rows={2}
              className="mt-1 w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 font-mono text-xs"
              value={photoUrlsText}
              onChange={(e) => setPhotoUrlsText(e.target.value)}
              placeholder="https://…"
            />
          </label>

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-xl bg-neutral-950 px-4 py-3 text-sm font-semibold text-white hover:bg-neutral-800 disabled:opacity-60 sm:w-auto"
          >
            {saving ? 'Gönderiliyor…' : 'Değerlendirmeyi gönder'}
          </button>
        </form>
      ) : null}

      {!isAuthenticated ? (
        <p className="mt-4 text-sm text-neutral-600">
          Yorum yazmak için giriş yapın (tamamlanmış tur gerekir).
        </p>
      ) : eligible && !eligible.reservationId ? (
        <p className="mt-4 text-sm text-neutral-600">
          Bu tura ait tamamlanmış bir rezervasyonunuz yok.
        </p>
      ) : eligible?.alreadyReviewed ? (
        <p className="mt-4 text-sm text-emerald-700">
          Bu rezervasyon için değerlendirmeniz kaydedildi. Teşekkürler!
        </p>
      ) : null}

      <div className="mt-8 flex flex-wrap gap-2">
        {filterChips.map((chip) => (
          <button
            key={chip.id}
            type="button"
            onClick={() => setFilter(chip.id)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
              filter === chip.id
                ? 'bg-neutral-950 text-white'
                : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
            }`}
          >
            {chip.label}
          </button>
        ))}
      </div>

      <ul className="mt-5 space-y-4">
        {reviews.length === 0 ? (
          <li className="text-sm text-neutral-600">
            {total === 0 && filter === 'ALL'
              ? 'Henüz doğrulanmış yorum yok.'
              : 'Bu filtreye uygun yorum bulunamadı.'}
          </li>
        ) : null}
        {reviews.map((r) => {
          const reply = r.agencyReply ?? r.partnerReply;
          return (
            <li
              key={r.id}
              className="rounded-xl border border-neutral-200 bg-white p-4"
              data-testid={`review-card-${r.id}`}
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-amber-600">
                  {r.rating.toFixed(1)}/5
                </span>
                <span className="text-xs text-neutral-500">
                  {formatJoinedContext(r)}
                </span>
              </div>

              <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-neutral-600">
                {r.guideRating != null ? (
                  <span>Rehber {r.guideRating}</span>
                ) : null}
                {r.valueRating != null ? (
                  <span>Program {r.valueRating}</span>
                ) : null}
                {r.transportRating != null ? (
                  <span>Ulaşım {r.transportRating}</span>
                ) : null}
                {r.accommodationRating != null ? (
                  <span>Konaklama {r.accommodationRating}</span>
                ) : null}
              </div>

              {r.tags && r.tags.length > 0 ? (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {r.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs text-neutral-700"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              ) : null}

              {r.comment ? (
                <p className="mt-2 text-sm text-neutral-700">{r.comment}</p>
              ) : null}

              {r.photoUrls?.length ? (
                <div className="mt-3 flex gap-2 overflow-x-auto">
                  {r.photoUrls.map((url) => {
                    const src = resolveMediaUrl(url) ?? url;
                    return (
                      <div
                        key={url}
                        className="relative h-20 w-28 shrink-0 overflow-hidden rounded-lg bg-neutral-100"
                      >
                        <Image
                          src={src}
                          alt="Yolcu fotoğrafı"
                          fill
                          className="object-cover"
                          unoptimized={shouldUnoptimizeMedia(src)}
                          sizes="112px"
                        />
                      </div>
                    );
                  })}
                </div>
              ) : null}

              {reply ? (
                <div className="mt-3 rounded-lg border-l-4 border-emerald-500 bg-emerald-50/80 p-3 text-sm text-neutral-700">
                  <p className="font-medium text-emerald-900">Acente yanıtı</p>
                  <p className="mt-1">{reply}</p>
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
