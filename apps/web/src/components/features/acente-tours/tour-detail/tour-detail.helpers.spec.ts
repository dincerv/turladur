import { describe, expect, it } from 'vitest';

import {
  asStringList,
  formatMoney,
  sanitizePlainText,
  statusLabel,
} from './tour-detail.helpers';

describe('tour-detail helpers', () => {
  it('sanitizes html in plain text', () => {
    expect(sanitizePlainText('<b>Merhaba</b> <script>x</script>')).toContain(
      'Merhaba',
    );
    expect(sanitizePlainText('<script>x</script>')).not.toContain('script');
  });

  it('formats free / nullish prices safely', () => {
    expect(formatMoney(0, 'TRY')).toBe('Ücretsiz');
    expect(formatMoney(Number.NaN, 'TRY')).toBe('Ücretsiz');
    expect(formatMoney(1000, 'TRY')).toContain('1.000');
  });

  it('filters string lists', () => {
    expect(asStringList(['a', 1, null, 'b'])).toEqual(['a', 'b']);
    expect(asStringList(undefined)).toEqual([]);
  });

  it('maps status labels', () => {
    expect(statusLabel('PUBLISHED')).toBe('Yayında');
    expect(statusLabel('DRAFT')).toBe('Taslak');
  });
});
