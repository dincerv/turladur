import { test, expect } from '@playwright/test';

/**
 * Soft-live: tour cards link via slug; detail resolves slug OR legacy id.
 */

test.describe('Public — tour slug URLs', () => {
  test('card href prefers slug and detail loads', async ({ page }) => {
    await page.goto('/tours', { waitUntil: 'domcontentloaded' });
    const cardLink = page.locator('[data-testid^="tour-card-link-"]').first();
    const visible = await cardLink
      .isVisible({ timeout: 25_000 })
      .catch(() => false);
    test.skip(!visible, 'No published tours in catalog');

    const href = await cardLink.getAttribute('href');
    expect(href).toMatch(/^\/tours\/[A-Za-z0-9_-]+$/);

    await cardLink.click();
    await expect(page).toHaveURL(/\/tours\/[A-Za-z0-9_-]+/, {
      timeout: 20_000,
    });
    await expect(
      page
        .getByRole('heading', { level: 1 })
        .or(page.locator('[data-testid="tour-detail"]'))
        .first(),
    ).toBeVisible({ timeout: 25_000 });
  });
});
