import {
  buildAiSearchSummaryPills,
  parseTourSearchPrompt,
} from './parse-tour-prompt';

describe('parseTourSearchPrompt', () => {
  it('parses departure, nights, region and destinations', () => {
    const filters = parseTourSearchPrompt(
      "Ankara'dan 3 gece Karadeniz turu arıyorum, Uzungöl ve Ayder olsun",
    );

    expect(filters.departureCity).toBe('Ankara');
    expect(filters.nights).toBe(3);
    expect(filters.stayKind).toBe('OVERNIGHT');
    expect(filters.region).toBe('Karadeniz');
    expect(filters.destinations).toEqual(
      expect.arrayContaining(['Uzungöl', 'Ayder']),
    );
    expect(filters.durationDays).toBeNull();
    expect(filters.duration).toBe('4-6');

    const pills = buildAiSearchSummaryPills(filters);
    expect(pills.map((p) => p.label)).toEqual(
      expect.arrayContaining([
        'Karadeniz',
        'Ankara çıkışlı',
        '3 gece',
        'Konaklamalı',
        'Uzungöl',
        'Ayder',
      ]),
    );
  });

  it('detects day trip stay kind', () => {
    const filters = parseTourSearchPrompt('İstanbul çıkışlı günübirlik tur');
    expect(filters.departureCity).toBe('İstanbul');
    expect(filters.stayKind).toBe('DAY_TRIP');
    expect(filters.durationDays).toBe(1);
    expect(filters.duration).toBeNull();
  });

  it('parses Ankara çıkışlı Kapadokya', () => {
    const filters = parseTourSearchPrompt('Ankara çıkışlı Kapadokya turu');
    expect(filters.departureCity).toBe('Ankara');
    expect(filters.destinations).toEqual(expect.arrayContaining(['Kapadokya']));
  });
});
