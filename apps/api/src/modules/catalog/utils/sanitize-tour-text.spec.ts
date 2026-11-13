import {
  sanitizeTourExtras,
  sanitizeTourPlainText,
} from './sanitize-tour-text';

describe('sanitizeTourPlainText', () => {
  it('strips script and html tags', () => {
    expect(
      sanitizeTourPlainText('Merhaba <script>alert(1)</script><b>dünya</b>'),
    ).toBe('Merhaba dünya');
  });
});

describe('sanitizeTourExtras', () => {
  it('sanitizes itinerary and list fields', () => {
    const safe = sanitizeTourExtras({
      includes: ['<img src=x onerror=alert(1)>Transfer'],
      itinerary: [
        {
          title: '<script>x</script>Gün 1',
          description: 'Açıklama <b>bold</b>',
        },
      ],
    });
    expect(safe.includes).toEqual(['Transfer']);
    expect((safe.itinerary as Array<{ title: string }>)[0].title).toBe('Gün 1');
  });
});
