import {
  computeOverallRating,
  resolveReviewCriteria,
  weightsForCriteria,
} from './review-scoring';

describe('review-scoring', () => {
  it('keeps guide+value only for day trips without transport', () => {
    const flags = resolveReviewCriteria({
      stayKind: 'DAY_TRIP',
      hasPickupPoints: false,
      hasTransportation: false,
      hasAccommodation: false,
    });
    expect(flags).toEqual({
      guide: true,
      value: true,
      transport: false,
      accommodation: false,
    });
    const weights = weightsForCriteria(flags);
    expect((weights.guide ?? 0) + (weights.value ?? 0)).toBeCloseTo(1, 5);
    expect(weights.transport).toBeUndefined();
  });

  it('opens transport+accommodation for overnight tours', () => {
    const flags = resolveReviewCriteria({ stayKind: 'OVERNIGHT' });
    expect(flags.transport).toBe(true);
    expect(flags.accommodation).toBe(true);
  });

  it('computes weighted overall with renormalized weights', () => {
    const flags = resolveReviewCriteria({
      stayKind: 'DAY_TRIP',
      hasTransportation: false,
    });
    const overall = computeOverallRating({ guide: 5, value: 4 }, flags);
    expect(overall).toBeCloseTo(4.6, 1);
  });
});
