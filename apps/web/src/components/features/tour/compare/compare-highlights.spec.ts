import { describe, expect, it } from 'vitest';
import type { ComparedTourAvailable } from '@turta/shared-types';
import { computeCompareHighlights } from './compare-highlights';

function tour(
  partial: Partial<ComparedTourAvailable> & Pick<ComparedTourAvailable, 'id'>,
): ComparedTourAvailable {
  return {
    available: true,
    title: partial.title ?? partial.id,
    slug: partial.slug ?? partial.id,
    coverUrl: null,
    price: partial.price ?? 1000,
    currency: 'TRY',
    durationDays: partial.durationDays ?? 3,
    averageRating: partial.averageRating ?? 4,
    reviewCount: partial.reviewCount ?? 1,
    hotelStars: partial.hotelStars ?? null,
    accommodationName: null,
    accommodationType: null,
    transportation: null,
    cancellationPolicy: null,
    inclusions: partial.inclusions ?? [],
    partnerName: null,
    entertainmentLevel: partial.entertainmentLevel ?? null,
    entertainmentLabel: partial.entertainmentLabel ?? null,
    ...partial,
  };
}

describe('computeCompareHighlights', () => {
  it('highlights lowest price and highest rating only when values differ', () => {
    const columns = [
      tour({ id: 'a', price: 900, averageRating: 4.2 }),
      tour({ id: 'b', price: 1200, averageRating: 4.9 }),
      {
        id: 'gone',
        available: false as const,
        message: 'Bu tur artık yayında değil',
      },
    ];

    const highlights = computeCompareHighlights(columns);
    expect([...highlights.price!]).toEqual(['a']);
    expect([...highlights.averageRating!]).toEqual(['b']);
  });

  it('skips highlight when all comparable values tie', () => {
    const columns = [
      tour({ id: 'a', price: 1000 }),
      tour({ id: 'b', price: 1000 }),
    ];
    const highlights = computeCompareHighlights(columns);
    expect(highlights.price?.size ?? 0).toBe(0);
  });
});
