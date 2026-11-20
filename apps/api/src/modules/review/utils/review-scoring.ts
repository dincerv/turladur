export type ReviewCriterionKey =
  'guide' | 'value' | 'transport' | 'accommodation';

export type ReviewCriteriaFlags = {
  guide: true;
  value: true;
  transport: boolean;
  accommodation: boolean;
};

/** Base weights — renormalized when conditional criteria are off. */
const BASE_WEIGHTS: Record<ReviewCriterionKey, number> = {
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

export type ReviewQuickTag = (typeof REVIEW_QUICK_TAGS)[number];

export const TRAVELER_CONTEXTS = [
  'SOLO',
  'COUPLE',
  'FAMILY',
  'FRIENDS',
] as const;

export type TravelerContext = (typeof TRAVELER_CONTEXTS)[number];

export const TRAVELER_CONTEXT_LABELS: Record<TravelerContext, string> = {
  SOLO: 'Tek',
  COUPLE: 'Çift',
  FAMILY: 'Çocuklu Aile',
  FRIENDS: 'Arkadaş Grubu',
};

export const COLD_START_REVIEW_THRESHOLD = 3;

export function resolveReviewCriteria(input: {
  stayKind?: string | null;
  hasPickupPoints?: boolean;
  hasTransportation?: boolean;
  hasAccommodation?: boolean;
}): ReviewCriteriaFlags {
  const overnight = input.stayKind === 'OVERNIGHT';
  return {
    guide: true,
    value: true,
    transport:
      Boolean(input.hasPickupPoints) ||
      Boolean(input.hasTransportation) ||
      overnight,
    accommodation: overnight || Boolean(input.hasAccommodation),
  };
}

export function activeCriterionKeys(
  flags: ReviewCriteriaFlags,
): ReviewCriterionKey[] {
  return (Object.keys(flags) as ReviewCriterionKey[]).filter(
    (key) => flags[key],
  );
}

export function weightsForCriteria(
  flags: ReviewCriteriaFlags,
): Partial<Record<ReviewCriterionKey, number>> {
  const keys = activeCriterionKeys(flags);
  const rawSum = keys.reduce((sum, key) => sum + BASE_WEIGHTS[key], 0);
  const out: Partial<Record<ReviewCriterionKey, number>> = {};
  for (const key of keys) {
    out[key] = BASE_WEIGHTS[key] / rawSum;
  }
  return out;
}

export function computeOverallRating(
  scores: Partial<Record<ReviewCriterionKey, number>>,
  flags: ReviewCriteriaFlags,
): number {
  const weights = weightsForCriteria(flags);
  let weighted = 0;
  let used = 0;
  for (const key of activeCriterionKeys(flags)) {
    const score = scores[key];
    const weight = weights[key];
    if (
      typeof score === 'number' &&
      score >= 1 &&
      score <= 5 &&
      typeof weight === 'number'
    ) {
      weighted += score * weight;
      used += weight;
    }
  }
  if (used <= 0) return 0;
  return Math.round((weighted / used) * 10) / 10;
}

export function clampStar(value: number | undefined | null): number | null {
  if (value == null || !Number.isFinite(value)) return null;
  const n = Math.round(value);
  if (n < 1 || n > 5) return null;
  return n;
}
