import { test, expect } from '@playwright/test';

import { loginAgency } from './helpers/agency-login';

/**
 * Agency /acente/reviews — KPI cards, URL-synced filters, review cards.
 * Skips when web / agency login / seed unavailable.
 */

test.describe('Acente — Değerlendirmeler', () => {
  test('loads KPIs filters and list or empty state', async ({ page }) => {
    test.skip(!(await loginAgency(page)), 'Agency login failed / web down');

    await page.goto('/acente/reviews', { waitUntil: 'domcontentloaded' });

    const shellDenied = page.getByTestId('agency-shell-denied');
    const reviewsPage = page.getByTestId('acente-reviews-page');

    await expect(reviewsPage.or(shellDenied)).toBeVisible({
      timeout: 20_000,
    });
    if (await shellDenied.isVisible().catch(() => false)) return;

    await expect(page.getByTestId('reviews-kpi-grid')).toBeVisible();
    await expect(page.getByTestId('reviews-kpi-average')).toBeVisible();
    await expect(page.getByTestId('reviews-kpi-total')).toBeVisible();
    await expect(page.getByTestId('reviews-distribution')).toBeVisible();
    await expect(page.getByTestId('reviews-filters')).toBeVisible();

    const empty = page.getByTestId('reviews-empty');
    const list = page.getByTestId('reviews-list');
    const skeleton = page.getByTestId('reviews-skeleton');
    await expect(empty.or(list).or(skeleton)).toBeVisible({ timeout: 20_000 });
    await expect(empty.or(list)).toBeVisible({ timeout: 25_000 });
  });

  test('rating chip syncs rating to URL', async ({ page }) => {
    test.skip(!(await loginAgency(page)), 'Agency login failed / web down');

    await page.goto('/acente/reviews', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('acente-reviews-page')).toBeVisible({
      timeout: 20_000,
    });

    await page.getByTestId('reviews-rating-5').click();
    await expect(page).toHaveURL(/[?&]rating=5/, { timeout: 10_000 });

    await page.getByTestId('reviews-rating-all').click();
    await expect(page).not.toHaveURL(/[?&]rating=/, { timeout: 10_000 });
  });

  test('debounced search syncs q to URL', async ({ page }) => {
    test.skip(!(await loginAgency(page)), 'Agency login failed / web down');

    await page.goto('/acente/reviews', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('acente-reviews-page')).toBeVisible({
      timeout: 20_000,
    });

    const search = page.getByTestId('reviews-search-input');
    await search.fill('harika');
    await search.blur();

    await expect(page).toHaveURL(/[?&]q=harika/, { timeout: 10_000 });
  });

  test('shows review cards with customer and rating', async ({ page }) => {
    test.skip(!(await loginAgency(page)), 'Agency login failed / web down');

    await page.goto('/acente/reviews', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('acente-reviews-page')).toBeVisible({
      timeout: 20_000,
    });

    const empty = page.getByTestId('reviews-empty');
    const card = page.locator('[data-testid^="review-card-"]').first();

    const hasCard = await card
      .waitFor({ state: 'visible', timeout: 15_000 })
      .then(() => true)
      .catch(() => false);

    if (!hasCard) {
      await expect(empty).toBeVisible();
      test.skip(true, 'No reviews in seed');
    }

    await expect(card.getByTestId('review-customer-name')).toBeVisible();
    const rating = await card.getAttribute('data-rating');
    expect(Number(rating)).toBeGreaterThanOrEqual(1);
    expect(Number(rating)).toBeLessThanOrEqual(5);
  });

  test('tour and response filters sync to URL', async ({ page }) => {
    test.skip(!(await loginAgency(page)), 'Agency login failed / web down');

    await page.goto('/acente/reviews', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('acente-reviews-page')).toBeVisible({
      timeout: 20_000,
    });

    await page.getByTestId('reviews-response-select').selectOption('pending');
    await expect(page).toHaveURL(/responseStatus=pending/, {
      timeout: 10_000,
    });

    const tourSelect = page.getByTestId('reviews-tour-select');
    const options = tourSelect.locator('option');
    const count = await options.count();
    if (count > 1) {
      const value = await options.nth(1).getAttribute('value');
      if (value) {
        await tourSelect.selectOption(value);
        await expect(page).toHaveURL(new RegExp(`tourId=${value}`), {
          timeout: 10_000,
        });
      }
    }
  });
});
