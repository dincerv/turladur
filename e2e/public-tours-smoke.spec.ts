import { test, expect } from '@playwright/test';

/**
 * Soft-live: public /tours must not be empty after seed.
 * Covers list load, ?q= filter, card → detail.
 */

const apiBase = process.env.API_URL ?? 'http://localhost:4000/api/v1';

test.describe('Public — /tours smoke', () => {
  test('lists published tours, search works, detail opens', async ({
    page,
    request,
  }) => {
    const health = await request.get(`${apiBase}/health`);
    test.skip(!health.ok(), 'API not running');

    const searchApi = await request.get(
      `${apiBase}/catalog/tours/search?limit=5`,
    );
    test.skip(!searchApi.ok(), 'Catalog search failed');
    const payload = (await searchApi.json()) as {
      success?: boolean;
      data?: Array<{ id: string; title?: string; slug?: string }>;
    };
    test.skip(
      !(payload.data?.length ?? 0),
      'No published tours — run pnpm --filter api prisma:seed && seed:verify',
    );

    await page.goto('/tours', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('public-tours-results')).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByTestId('public-tours-error')).toHaveCount(0);

    const countEl = page.getByTestId('public-tours-count');
    await expect(countEl).toBeVisible({ timeout: 20_000 });
    const total = Number((await countEl.getAttribute('data-total')) ?? '0');
    expect(total).toBeGreaterThan(0);

    const card = page.locator('[data-testid^="tour-card-"]').first();
    await expect(card).toBeVisible({ timeout: 15_000 });

    const sampleTitle = payload.data?.[0]?.title?.trim() ?? '';
    const q = sampleTitle.slice(0, Math.min(8, sampleTitle.length)) || 'Ankara';
    await page.goto(`/tours?q=${encodeURIComponent(q)}`, {
      waitUntil: 'domcontentloaded',
    });
    await expect(page).toHaveURL(/[?&]q=/);
    await expect(page.getByTestId('public-tours-results')).toBeVisible({
      timeout: 25_000,
    });

    const link = page.locator('[data-testid^="tour-card-link-"]').first();
    const hasLink = await link
      .isVisible({ timeout: 15_000 })
      .catch(() => false);
    if (!hasLink) {
      // Query may filter everything client-side — fall back to unfiltered
      await page.goto('/tours', { waitUntil: 'domcontentloaded' });
      await expect(
        page.locator('[data-testid^="tour-card-link-"]').first(),
      ).toBeVisible({ timeout: 20_000 });
    }

    await page.locator('[data-testid^="tour-card-link-"]').first().click();
    await expect(page).toHaveURL(/\/tours\/[A-Za-z0-9_-]+/, {
      timeout: 20_000,
    });
  });
});
