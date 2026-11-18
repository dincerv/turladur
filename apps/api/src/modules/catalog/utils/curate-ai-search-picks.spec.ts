import { curateAiSearchPicks } from './curate-ai-search-picks';

describe('curateAiSearchPicks', () => {
  it('returns top rated, best price and best value as distinct tours', () => {
    const picks = curateAiSearchPicks([
      { id: 'rated', price: 5000, averageRating: 4.9, reviewCount: 20 },
      { id: 'cheap', price: 2200, averageRating: 3.8, reviewCount: 8 },
      { id: 'value', price: 3100, averageRating: 4.6, reviewCount: 15 },
      { id: 'other', price: 4500, averageRating: 4.1, reviewCount: 4 },
    ]);

    expect(picks.map((p) => p.pickRole)).toEqual([
      'TOP_RATED',
      'BEST_PRICE',
      'BEST_VALUE',
    ]);
    expect(picks.map((p) => p.tour.id)).toEqual(['rated', 'cheap', 'value']);
    expect(picks[0].pickLabel).toBe('En yüksek puan');
  });

  it('handles small pools without duplicates', () => {
    const picks = curateAiSearchPicks([
      { id: 'only', price: 3000, averageRating: 4.2, reviewCount: 3 },
    ]);
    expect(picks).toHaveLength(1);
    expect(picks[0].pickRole).toBe('TOP_RATED');
  });
});
