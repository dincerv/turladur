import {
  buildTourPersonaMatch,
  inferPersonaFromIntent,
  tagReviewComment,
} from './persona-review-engine';

describe('persona-review-engine', () => {
  it('tags party and calm phrases', () => {
    expect(
      tagReviewComment('Yüksek sesli dans ve gece eğlencesi çok yoğundu'),
    ).toContain('gece-hayati');
    expect(
      tagReviewComment('Sakin dinlenme ve huzurlu bir kaçış oldu'),
    ).toContain('sakin-dinlenme');
  });

  it('infers persona from natural-language intent', () => {
    expect(inferPersonaFromIntent('Parti ve eğlence seviyorum')).toBe('PARTY');
    expect(inferPersonaFromIntent('Sakinlik istiyorum')).toBe('CALM');
  });

  it('scores the same tour differently for PARTY vs CALM', () => {
    const reviews = [
      {
        id: '1',
        rating: 5,
        comment:
          'Parti ve dans inanılmazdı, yüksek sesli gece eğlencesi harika!',
        createdAt: new Date('2026-01-01'),
      },
      {
        id: '2',
        rating: 1,
        comment: 'Yüksek sesli dans çok yorucu; sakin dinlenme bekliyordum.',
        createdAt: new Date('2026-01-02'),
      },
    ];

    const party = buildTourPersonaMatch({
      tourId: 'likya',
      persona: 'PARTY',
      reviews,
    });
    const calm = buildTourPersonaMatch({
      tourId: 'likya',
      persona: 'CALM',
      reviews,
    });

    expect(party.fitScore).toBeGreaterThan(calm.fitScore);
    expect(party.alignedTags).toContain('gece-hayati');
    expect(calm.conflictTags).toContain('gece-hayati');
    expect(calm.warnings.length).toBeGreaterThan(0);
  });
});
