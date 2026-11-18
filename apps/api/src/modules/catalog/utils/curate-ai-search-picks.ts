import type { AiSearchPickRole, AiSearchTourHit } from '@turta/shared-types';

export type CuratableTour = {
  id: string;
  price: number;
  averageRating: number;
  reviewCount: number;
};

const PICK_LABELS: Record<AiSearchPickRole, string> = {
  TOP_RATED: 'En yüksek puan',
  BEST_PRICE: 'En uygun fiyat',
  BEST_VALUE: 'En iyi F/P',
};

function valueScore(tour: CuratableTour): number {
  if (!(tour.price > 0)) return 0;
  const rating = Math.max(0, tour.averageRating);
  const reviewsBoost = 1 + Math.min(0.25, tour.reviewCount / 40);
  return (rating / tour.price) * 1000 * reviewsBoost;
}

/**
 * Pick up to 3 distinct tours: top rated, best price, best value (F/P).
 * Falls back gracefully when the pool is smaller than 3.
 */
export function curateAiSearchPicks<T extends CuratableTour>(
  pool: T[],
): { tour: T; pickRole: AiSearchPickRole; pickLabel: string }[] {
  if (pool.length === 0) return [];

  const used = new Set<string>();
  const picks: { tour: T; pickRole: AiSearchPickRole; pickLabel: string }[] =
    [];

  const take = (role: AiSearchPickRole, rank: (a: T, b: T) => number): void => {
    const candidate = [...pool]
      .filter((tour) => !used.has(tour.id))
      .sort(rank)[0];
    if (!candidate) return;
    used.add(candidate.id);
    picks.push({
      tour: candidate,
      pickRole: role,
      pickLabel: PICK_LABELS[role],
    });
  };

  take('TOP_RATED', (a, b) => {
    if (b.averageRating !== a.averageRating) {
      return b.averageRating - a.averageRating;
    }
    return b.reviewCount - a.reviewCount;
  });

  take('BEST_PRICE', (a, b) => {
    if (a.price !== b.price) return a.price - b.price;
    return b.averageRating - a.averageRating;
  });

  take('BEST_VALUE', (a, b) => valueScore(b) - valueScore(a));

  return picks;
}

export function attachPickMeta(
  hit: AiSearchTourHit,
  pickRole: AiSearchPickRole,
  pickLabel: string,
): AiSearchTourHit {
  return { ...hit, pickRole, pickLabel };
}
