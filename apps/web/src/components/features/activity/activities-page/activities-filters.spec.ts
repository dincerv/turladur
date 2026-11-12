import { describe, expect, it } from 'vitest';
import { DEFAULT_FILTERS } from './activities-page.constants';
import {
  filterAndSortExperiences,
  mapExperienceRow,
  parseDurationHours,
} from './activities-page.helpers';
import {
  formatAgeRestriction,
  getAgeRangeError,
  matchesParticipantAges,
  parseAgeRestriction,
  toSearchKey,
} from './activity-age';
import {
  buildActivitiesQuery,
  buildFilterChips,
  parseActivityFilters,
  parseBoundedInt,
  sanitizeText,
} from './activity-filters';
import type { ActivityFilters, Experience } from './activities-page.types';

const params = (qs: string) => new URLSearchParams(qs);

describe('parseAgeRestriction', () => {
  it.each([
    ['18+', { minAge: 18, maxAge: null }],
    ['7-65', { minAge: 7, maxAge: 65 }],
    ['7 – 65 yaş', { minAge: 7, maxAge: 65 }],
    ['65-7', { minAge: 7, maxAge: 65 }],
    ['12 yaş üstü', { minAge: 12, maxAge: null }],
    ['16 yaş ve üzeri', { minAge: 16, maxAge: null }],
    ['8 yaşından büyük', { minAge: 8, maxAge: null }],
    ['65 yaş altı', { minAge: null, maxAge: 64 }],
    ['En fazla 70', { minAge: null, maxAge: 70 }],
    ['Minimum 10', { minAge: 10, maxAge: null }],
    ['18', { minAge: 18, maxAge: null }],
  ])('%s', (input, expected) => {
    expect(parseAgeRestriction(input)).toEqual(expected);
  });

  it.each([
    '',
    '   ',
    'Her yaş',
    'Yaş sınırı yok',
    'abc',
    '0+',
    '200+',
    null,
    undefined,
  ])('no restriction for %s', (input) => {
    expect(parseAgeRestriction(input)).toBeNull();
  });

  it('formats badge labels', () => {
    expect(formatAgeRestriction({ minAge: 18, maxAge: null })).toBe('18+');
    expect(formatAgeRestriction({ minAge: 7, maxAge: 65 })).toBe('7-65 yaş');
    expect(formatAgeRestriction({ minAge: null, maxAge: 12 })).toBe(
      '12 yaş ve altı',
    );
  });
});

describe('matchesParticipantAges', () => {
  const adult = { minAge: 18, maxAge: null };
  const kids = { minAge: 6, maxAge: 12 };

  it('keeps unrestricted activities and empty filters', () => {
    expect(matchesParticipantAges(null, 5, 80)).toBe(true);
    expect(matchesParticipantAges(adult, null, null)).toBe(true);
  });

  it('requires every participant to be allowed', () => {
    expect(matchesParticipantAges(adult, 18, 40)).toBe(true);
    expect(matchesParticipantAges(adult, 10, 40)).toBe(false);
    expect(matchesParticipantAges(kids, 6, 12)).toBe(true);
    expect(matchesParticipantAges(kids, 6, 30)).toBe(false);
  });

  it('treats a single bound as one participant', () => {
    expect(matchesParticipantAges(adult, null, 10)).toBe(false);
    expect(matchesParticipantAges(kids, 20, null)).toBe(false);
  });

  it('ignores inverted ranges (UI warns instead)', () => {
    expect(getAgeRangeError(30, 10)).not.toBeNull();
    expect(matchesParticipantAges(adult, 30, 10)).toBe(true);
  });
});

describe('URL params', () => {
  it('rejects negative, non-numeric and out-of-range numbers', () => {
    expect(parseBoundedInt('-5', 0, 120)).toBeNull();
    expect(parseBoundedInt('1e3', 0, 120)).toBeNull();
    expect(parseBoundedInt('18abc', 0, 120)).toBeNull();
    expect(parseBoundedInt('121', 0, 120)).toBeNull();
    expect(parseBoundedInt(' 18 ', 0, 120)).toBe(18);
  });

  it('parses ?minAge=18 and falls back on garbage', () => {
    const f = parseActivityFilters(
      params(
        'minAge=18&maxAge=-3&category=<x>&sort=drop&type=evil&maxDuration=99',
      ),
    );
    expect(f).toEqual({ ...DEFAULT_FILTERS, minAge: 18 });
  });

  it('swaps inverted pairs from the URL', () => {
    const f = parseActivityFilters(
      params('minAge=40&maxAge=10&minPrice=900&maxPrice=100'),
    );
    expect([f.minAge, f.maxAge, f.minPrice, f.maxPrice]).toEqual([
      10, 40, 100, 900,
    ]);
  });

  it('strips markup from q and city', () => {
    const f = parseActivityFilters(
      params(
        `q=${encodeURIComponent('<script>alert(1)</script>')}&city=${encodeURIComponent('<img>')}`,
      ),
    );
    expect(f.q).toBe('scriptalert(1)/script');
    expect(f.city).toBeNull();
    expect(sanitizeText('a\u0000b"c')).toBe('abc');
  });

  it('round-trips through a canonical query', () => {
    const filters: ActivityFilters = {
      ...DEFAULT_FILTERS,
      q: 'balon',
      category: 'doga',
      city: 'Göreme',
      minAge: 18,
      maxAge: 60,
      minPrice: 100,
      sort: 'price_asc',
    };
    const qs = buildActivitiesQuery(filters);
    expect(parseActivityFilters(params(qs))).toEqual(filters);
    expect(buildActivitiesQuery(DEFAULT_FILTERS)).toBe('');
  });

  it('builds readable chips', () => {
    const chips = buildFilterChips({
      ...DEFAULT_FILTERS,
      minAge: 18,
      maxPrice: 2000,
    });
    expect(chips.map((c) => c.label)).toEqual([
      'Max ₺2.000',
      'Yaş: En küçük 18 yaş',
    ]);
  });
});

describe('catalog mapping & filtering', () => {
  it('folds Turkish characters', () => {
    expect(toSearchKey('Doğa ŞİİR Işık')).toBe('doga siir isik');
  });

  it('parses duration text', () => {
    expect(parseDurationHours('3 saat')).toBe(3);
    expect(parseDurationHours('1,5 saat')).toBe(1.5);
    expect(parseDurationHours('90 dakika')).toBe(1.5);
    expect(parseDurationHours('2 gün')).toBe(48);
    expect(parseDurationHours('belirsiz')).toBeNull();
  });

  it('maps untrusted API rows safely', () => {
    const e = mapExperienceRow({
      id: 7,
      title: 'Balon Turu',
      category: 'Doğa',
      location: 'Göreme',
      duration: '3 saat',
      price: '2300',
      averageRating: '4.5',
      reviewCount: '12',
      ageRestriction: '18+',
      imageUrl: '',
    });
    expect(e).toMatchObject({
      id: '7',
      categoryKey: 'doga',
      durationHours: 3,
      price: 2300,
      rating: 4.5,
      reviewCount: 12,
      ageRestrictionLabel: '18+',
      imageUrl: null,
    });
    expect(mapExperienceRow({ title: 'x' })).toBeNull();
    expect(mapExperienceRow({ id: 1, title: '' })).toBeNull();
  });

  const rows = [
    {
      id: 1,
      title: 'Balon Turu',
      category: 'Doğa',
      location: 'Göreme',
      price: 3000,
      ageRestriction: '18+',
    },
    {
      id: 2,
      title: 'Çocuk Atölyesi',
      category: 'Kültür',
      location: 'İzmir',
      price: 500,
      ageRestriction: '6-12',
    },
    {
      id: 3,
      title: 'Tekne Turu',
      category: 'Deniz',
      location: 'Fethiye',
      price: 1500,
    },
  ]
    .map((r) => mapExperienceRow(r))
    .filter((e): e is Experience => e !== null);

  it('filters by participant ages', () => {
    const ids = (f: Partial<ActivityFilters>) =>
      filterAndSortExperiences(rows, { ...DEFAULT_FILTERS, ...f }).map(
        (e) => e.id,
      );
    expect(ids({ minAge: 8, maxAge: 10 })).toEqual(['2', '3']);
    expect(ids({ minAge: 25, maxAge: 40 })).toEqual(['1', '3']);
  });

  it('filters by category, type, city, price and sorts', () => {
    const run = (f: Partial<ActivityFilters>) =>
      filterAndSortExperiences(rows, { ...DEFAULT_FILTERS, ...f }).map(
        (e) => e.id,
      );
    expect(run({ category: 'kultur' })).toEqual(['2']);
    expect(run({ type: 'tekne-turu' })).toEqual(['3']);
    expect(run({ city: 'izmir' })).toEqual(['2']);
    expect(run({ minPrice: 2000, maxPrice: 1000, sort: 'price_asc' })).toEqual([
      '3',
    ]);
    expect(run({ sort: 'price_desc' })).toEqual(['1', '3', '2']);
    expect(run({ q: 'BALON göreme' })).toEqual(['1']);
  });
});
