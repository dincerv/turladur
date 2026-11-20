import type { TourReviewCriteria } from '@turta/shared-types';

export type TourReviewCriterionKey =
  'guide' | 'value' | 'transport' | 'accommodation';

const BASE_WEIGHTS: Record<TourReviewCriterionKey, number> = {
  guide: 0.35,
  value: 0.2,
  transport: 0.2,
  accommodation: 0.25,
};

export const REVIEW_QUICK_TAGS = [
  'Ekstra ücret sürprizi yok',
  'Otel merkeziydi',
  'Araç tertemizdi',
  'Rehber çok ilgiliydi',
  'Program sıkışıktı',
  'Otobüs dardı',
  'Serbest zaman azdı',
] as const;

export const TRAVELER_CONTEXT_OPTIONS = [
  { id: 'SOLO' as const, label: 'Tek' },
  { id: 'COUPLE' as const, label: 'Çift' },
  { id: 'FAMILY' as const, label: 'Çocuklu Aile' },
  { id: 'FRIENDS' as const, label: 'Arkadaş Grubu' },
];

export const TRAVELER_CONTEXT_LABELS: Record<
  (typeof TRAVELER_CONTEXT_OPTIONS)[number]['id'],
  string
> = {
  SOLO: 'Tek',
  COUPLE: 'Çift',
  FAMILY: 'Çocuklu Aile',
  FRIENDS: 'Arkadaş Grubu',
};

export const CRITERION_LABELS: Record<TourReviewCriterionKey, string> = {
  guide: 'Rehberlik & Anlatım',
  value: 'Program & Fiyat/Performans',
  transport: 'Ulaşım & Araç Konforu',
  accommodation: 'Konaklama & Yemek',
};

export function activeCriteria(
  criteria: TourReviewCriteria,
): TourReviewCriterionKey[] {
  const keys: TourReviewCriterionKey[] = ['guide', 'value'];
  if (criteria.transport) keys.push('transport');
  if (criteria.accommodation) keys.push('accommodation');
  return keys;
}

/** Live overall preview — mirrors API weighted average. */
export function previewOverallRating(
  scores: Partial<Record<TourReviewCriterionKey, number>>,
  criteria: TourReviewCriteria,
): number {
  const keys = activeCriteria(criteria);
  const rawSum = keys.reduce((sum, key) => sum + BASE_WEIGHTS[key], 0);
  let weighted = 0;
  let used = 0;
  for (const key of keys) {
    const score = scores[key];
    if (typeof score !== 'number' || score < 1 || score > 5) continue;
    const weight = BASE_WEIGHTS[key] / rawSum;
    weighted += score * weight;
    used += weight;
  }
  if (used <= 0) return 0;
  return Math.round((weighted / used) * 10) / 10;
}
