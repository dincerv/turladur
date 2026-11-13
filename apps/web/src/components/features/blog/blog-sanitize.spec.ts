import { describe, expect, it } from 'vitest';

import { sanitizeBlogHtml } from './blog-sanitize';
import { estimateReadingMinutes, looksLikeHtml } from './blog.helpers';

describe('blog sanitize & reading helpers', () => {
  it('strips script and event handlers from html', () => {
    const dirty =
      '<p>Merhaba</p><script>alert(1)</script><img src="https://x.test/a.jpg" onerror="alert(1)" /><a href="javascript:alert(1)">x</a>';
    const safe = sanitizeBlogHtml(dirty);
    expect(safe).toContain('<p>Merhaba</p>');
    expect(safe).not.toMatch(/script/i);
    expect(safe).not.toMatch(/onerror/i);
    expect(safe).not.toMatch(/javascript:/i);
  });

  it('detects html vs markdown', () => {
    expect(looksLikeHtml('<p>Hi</p>')).toBe(true);
    expect(looksLikeHtml('## Başlık\n\nParagraf')).toBe(false);
  });

  it('estimates at least 1 minute', () => {
    expect(estimateReadingMinutes('kısa')).toBe(1);
    expect(
      estimateReadingMinutes(
        Array.from({ length: 450 }, () => 'kelime').join(' '),
      ),
    ).toBe(3);
  });
});
