import { describe, expect, it } from 'vitest';

import { toPlainExcerpt, toSafeSearchLabel } from './blog.helpers';

describe('blog helpers', () => {
  it('strips html and scripts from search labels', () => {
    expect(toSafeSearchLabel('  Kapadokya <script>alert(1)</script>  ')).toBe(
      'Kapadokya alert(1)',
    );
  });

  it('converts rich excerpts to plain clamped text', () => {
    const plain = toPlainExcerpt(
      '<p>Merhaba <strong>dünya</strong> &amp; seyahat</p>',
      40,
    );
    expect(plain).toBe('Merhaba dünya & seyahat');
    expect(toPlainExcerpt(null)).toBe('');
  });
});
