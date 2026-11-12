import { describe, expect, it } from 'vitest';
import {
  buildActivityJsonLd,
  getStartingPrice,
  istanbulTodayKey,
  normalizeActivityDetail,
  normalizeActivitySessions,
  toContentBlocks,
  toDateKey,
  toMeetingPoint,
  toPlainText,
  toSafeHttpUrl,
  toStringList,
} from './activity-detail.helpers';

describe('normalizeActivityDetail', () => {
  it('survives a lean (list-shaped) payload without detail fields', () => {
    const a = normalizeActivityDetail({
      id: 'x1',
      title: 'Balon Turu',
      description: 'Kısa',
      price: '2300',
      averageRating: '4.5',
      reviewCount: 5,
      duration: '3 saat',
    });
    expect(a).not.toBeNull();
    expect(a).toMatchObject({
      price: 2300,
      rating: 4.5,
      highlights: [],
      included: [],
      notIncluded: [],
      schedule: [],
      images: [],
      meetingPoint: null,
      operator: null,
      ageRestriction: null,
      currency: 'TRY',
    });
  });

  it('returns null for unusable payloads', () => {
    expect(normalizeActivityDetail(null)).toBeNull();
    expect(normalizeActivityDetail([])).toBeNull();
    expect(normalizeActivityDetail({ id: 'x' })).toBeNull();
    expect(normalizeActivityDetail({ title: 'T' })).toBeNull();
  });

  it('parses age, drops malformed list items and hides rating without reviews', () => {
    const a = normalizeActivityDetail({
      id: 'x',
      title: 'T',
      ageRestriction: '18+',
      included: ['Transfer', 3, null, ' ', 'transfer', '<b>Sigorta</b>'],
      schedule: [
        { time: '09:00', activity: 'Toplanma' },
        'Kalkış',
        { time: 1 },
      ],
      averageRating: '4.9',
      reviewCount: 0,
      price: '0',
    });
    expect(a?.ageRestrictionLabel).toBe('18+');
    expect(a?.included).toEqual(['Transfer', 'Sigorta']);
    expect(a?.schedule).toEqual([
      { time: '09:00', activity: 'Toplanma' },
      { time: '', activity: 'Kalkış' },
    ]);
    expect(a?.rating).toBe(0);
    expect(a?.price).toBeNull();
  });

  it('drops a long description identical to the summary', () => {
    const a = normalizeActivityDetail({
      id: 'x',
      title: 'T',
      description: 'Aynı metin',
      longDescription: 'Aynı metin',
    });
    expect(a?.longDescription).toBe('');
  });
});

describe('toPlainText / toContentBlocks', () => {
  it('never keeps markup and removes script bodies', () => {
    const out = toPlainText(
      '<p>Merhaba<script>alert(1)</script></p><img src=x onerror=alert(1)>Dünya',
    );
    expect(out).not.toMatch(/[<>]|alert/);
    expect(out).toContain('Merhaba');
    expect(out).toContain('Dünya');
  });

  it('keeps paragraphs and turns bullet runs into lists', () => {
    const blocks = toContentBlocks(
      toPlainText('Giriş\nikinci satır\n\n- Bir\n- İki\n\nSon'),
    );
    expect(blocks).toEqual([
      { kind: 'paragraph', text: 'Giriş\nikinci satır' },
      { kind: 'list', items: ['Bir', 'İki'] },
      { kind: 'paragraph', text: 'Son' },
    ]);
  });

  it('converts html lists to blocks', () => {
    expect(
      toContentBlocks(toPlainText('<ul><li>A</li><li>B</li></ul>')),
    ).toEqual([{ kind: 'list', items: ['A', 'B'] }]);
  });

  it('caps list size', () => {
    expect(
      toStringList(Array.from({ length: 80 }, (_, i) => `m${i}`)),
    ).toHaveLength(50);
  });
});

describe('URLs', () => {
  it('only allows http(s)', () => {
    expect(toSafeHttpUrl('javascript:alert(1)')).toBeNull();
    expect(toSafeHttpUrl('data:text/html,hi')).toBeNull();
    expect(toSafeHttpUrl('https://maps.app.goo.gl/abc')).toBe(
      'https://maps.app.goo.gl/abc',
    );
  });

  it('builds a maps link from text meeting points and ignores unsafe hrefs', () => {
    const text = toMeetingPoint('Göreme Meydanı', null, 'Nevşehir');
    expect(text?.label).toBe('Göreme Meydanı');
    expect(text?.mapUrl.startsWith('https://www.google.com/maps/search/')).toBe(
      true,
    );

    expect(toMeetingPoint('javascript:alert(1)', null, null)).toBeNull();
    const unsafe = toMeetingPoint('javascript:alert(1)', 'Otogar', null);
    expect(unsafe?.label).toBe('Otogar');
    expect(unsafe?.mapUrl.startsWith('https://')).toBe(true);
    expect(toMeetingPoint('Saat 09:30 Meydan', null, null)?.label).toBe(
      'Saat 09:30 Meydan',
    );
    expect(toMeetingPoint('Adres: Göreme', null, null)?.label).toBe(
      'Adres: Göreme',
    );
    expect(toMeetingPoint(' ', '', null)).toBeNull();
  });
});

describe('sessions', () => {
  it('keeps future, active, bookable sessions sorted, prices as numbers', () => {
    const rows = [
      {
        id: 'b',
        startDate: '2026-12-02',
        endDate: '2026-12-02',
        price: '900',
        availableSeats: 4,
        isActive: true,
      },
      {
        id: 'a',
        startDate: '2026-11-20T00:00:00.000Z',
        price: '1000',
        availableSeats: 10,
      },
      { id: 'past', startDate: '2026-11-01', price: '500', availableSeats: 10 },
      { id: 'full', startDate: '2026-12-10', price: '500', availableSeats: 0 },
      {
        id: 'off',
        startDate: '2026-12-10',
        price: '500',
        availableSeats: 5,
        isActive: false,
      },
      { id: 'bad', startDate: 'yarın', price: '500', availableSeats: 5 },
    ];
    const s = normalizeActivitySessions(rows, '2026-11-13');
    expect(s.map((x) => x.id)).toEqual(['a', 'b']);
    expect(s[0]).toMatchObject({
      startDate: '2026-11-20',
      endDate: '2026-11-20',
      price: 1000,
    });
    expect(getStartingPrice({ price: 2000 }, s)).toBe(900);
    expect(getStartingPrice({ price: 2000 }, [])).toBe(2000);
  });

  it('rejects impossible dates and uses the Istanbul calendar day', () => {
    expect(toDateKey('2026-02-30')).toBeNull();
    expect(istanbulTodayKey(new Date('2026-11-13T22:30:00Z'))).toBe(
      '2026-11-14',
    );
  });
});

describe('buildActivityJsonLd', () => {
  it('escapes "<" so the script tag cannot be closed', () => {
    const a = normalizeActivityDetail({
      id: 'x',
      title: '&lt;/script&gt;Balon',
    });
    expect(a?.title).toBe('</script>Balon');
    const json = buildActivityJsonLd(a!, [], '/activities/x');
    expect(json).not.toContain('<');
    expect(JSON.parse(json).name).toBe('</script>Balon');
  });
});
