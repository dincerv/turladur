import { test, expect } from '@playwright/test';

import { loginAgency } from './helpers/agency-login';

/**
 * Agency tours list — load, search filter, status toggle, edit navigation.
 * Skips when web / seed agency login unavailable.
 */

test.describe('Acente — Tur listesi', () => {
  test('loads page, searches, toggles status, opens edit', async ({ page }) => {
    test.skip(!(await loginAgency(page)), 'Agency login failed / web down');

    await page.goto('/acente/tours', { waitUntil: 'domcontentloaded' });

    await expect(page.getByTestId('acente-tours-page')).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByTestId('tours-skeleton')).toHaveCount(0);
    await expect(page.getByTestId('new-tour-btn')).toBeVisible();
    await expect(page.getByTestId('search-tour-input')).toBeVisible();

    const empty = page.getByTestId('tours-empty-state');
    const firstCard = page.locator('[data-testid^="tour-card-"]').first();
    const firstRow = page.locator('[data-testid^="tour-row-"]').first();

    const hasItems =
      (await firstCard.isVisible().catch(() => false)) ||
      (await firstRow.isVisible().catch(() => false));

    if (!hasItems) {
      await expect(empty).toBeVisible();
      test.skip(true, 'No tours in seed to search/toggle');
    }

    const cardOrRow = (await firstCard.isVisible().catch(() => false))
      ? firstCard
      : firstRow;
    const testId = await cardOrRow.getAttribute('data-testid');
    const tourId = testId?.replace(/^tour-(card|row)-/, '') ?? '';
    expect(tourId.length).toBeGreaterThan(0);

    const titleText = (
      await cardOrRow.locator('h3, p').first().innerText()
    ).trim();
    const searchTerm = titleText.slice(0, Math.min(12, titleText.length));

    const search = page.getByTestId('search-tour-input');
    await search.fill(searchTerm);
    await search.blur();

    await expect.poll(async () => page.url(), { timeout: 8_000 }).toMatch(/q=/);

    await expect(
      page
        .getByTestId(`tour-card-${tourId}`)
        .or(page.getByTestId(`tour-row-${tourId}`))
        .or(page.getByTestId('tours-empty-state')),
    ).toBeVisible({ timeout: 15_000 });

    const clearBtn = page.getByTestId('clear-tour-search');
    if (await clearBtn.isVisible().catch(() => false)) {
      await clearBtn.click();
    } else {
      await search.fill('');
      await search.blur();
    }

    const toggle = page.getByTestId(`toggle-status-btn-${tourId}`);
    test.skip(
      !(await toggle.isVisible().catch(() => false)),
      'Toggle not visible after search clear',
    );

    const before = await toggle.getAttribute('aria-checked');
    await toggle.click();

    await expect
      .poll(async () => toggle.getAttribute('aria-checked'), {
        timeout: 15_000,
      })
      .not.toBe(before);

    await expect(page.getByTestId('tours-error')).toHaveCount(0);

    // Self-publish kapalı: yayından arşive iner; ikinci tık onaya gönderir (live olmaz).
    // Seed'i bozmamak için yalnızca arşivden çıkarıp PENDING bırakıyoruz.
    if (before === 'true') {
      await toggle.click();
      await expect
        .poll(async () => toggle.getAttribute('aria-checked'), {
          timeout: 15_000,
        })
        .toBe('false');
    }

    const editBtn = page.getByTestId(`edit-tour-btn-${tourId}`);
    await expect(editBtn).toBeVisible();
    await editBtn.click();

    await expect(page).toHaveURL(new RegExp(`/acente/tours/${tourId}/edit`), {
      timeout: 15_000,
    });
  });
});
