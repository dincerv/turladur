import { test, expect } from '@playwright/test';

import { loginAgency } from './helpers/agency-login';

/**
 * Agency /acente/reservations — filters, table rows, confirm/cancel status.
 * Skips when web / agency login / seed unavailable.
 */

test.describe('Acente — Rezervasyonlar', () => {
  test('loads table or empty state with filters', async ({ page }) => {
    test.skip(!(await loginAgency(page)), 'Agency login failed / web down');

    await page.goto('/acente/reservations', { waitUntil: 'domcontentloaded' });

    await expect(page.getByTestId('acente-reservations-page')).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByTestId('reservations-filters')).toBeVisible();
    await expect(page.getByTestId('filter-customer-search')).toBeVisible();
    await expect(page.getByTestId('filter-date-from')).toBeVisible();

    const empty = page.getByTestId('reservations-empty-state');
    const table = page.getByTestId('reservations-table');
    const skeleton = page.getByTestId('reservations-skeleton');
    await expect(empty.or(table).or(skeleton)).toBeVisible({ timeout: 20_000 });
    await expect(empty.or(table)).toBeVisible({ timeout: 25_000 });
  });

  test('status chip syncs status to URL', async ({ page }) => {
    test.skip(!(await loginAgency(page)), 'Agency login failed / web down');

    await page.goto('/acente/reservations', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('acente-reservations-page')).toBeVisible({
      timeout: 20_000,
    });

    await page.getByTestId('filter-status-chip-PENDING').click();
    await expect(page).toHaveURL(/status=PENDING/, { timeout: 10_000 });
  });

  test('debounced search syncs q to URL', async ({ page }) => {
    test.skip(!(await loginAgency(page)), 'Agency login failed / web down');

    await page.goto('/acente/reservations', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('acente-reservations-page')).toBeVisible({
      timeout: 20_000,
    });

    const search = page.getByTestId('filter-customer-search');
    await search.fill('demo');
    await search.blur();

    await expect(page).toHaveURL(/[?&]q=demo/, { timeout: 10_000 });
  });

  test('loads rows and confirms via modal', async ({ page }) => {
    test.skip(!(await loginAgency(page)), 'Agency login failed / web down');

    await page.goto('/acente/reservations', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('acente-reservations-page')).toBeVisible({
      timeout: 20_000,
    });

    await page.getByTestId('filter-status-chip-PENDING').click();
    await expect(page).toHaveURL(/status=PENDING/, { timeout: 10_000 });

    const empty = page.getByTestId('reservations-empty-state');
    const confirmBtn = page
      .locator('[data-testid^="change-status-btn-"]')
      .first();

    const hasConfirm = await confirmBtn
      .waitFor({ state: 'visible', timeout: 15_000 })
      .then(() => true)
      .catch(() => false);

    if (!hasConfirm) {
      await expect(empty).toBeVisible();
      test.skip(true, 'No pending reservation to confirm');
    }

    await confirmBtn.click();
    await expect(page.getByTestId('change-status-confirm-modal')).toBeVisible({
      timeout: 10_000,
    });
    await page.getByTestId('change-status-confirm-btn').click();
    await expect(page.getByTestId('change-status-confirm-modal')).toBeHidden({
      timeout: 45_000,
    });
  });

  test('cancel action opens confirm modal', async ({ page }) => {
    test.skip(!(await loginAgency(page)), 'Agency login failed / web down');

    await page.goto('/acente/reservations', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('acente-reservations-page')).toBeVisible({
      timeout: 20_000,
    });

    await page.getByTestId('filter-status-chip-all').click();

    const actions = page
      .locator('[data-testid^="reservation-actions-"]')
      .first();
    const hasActions = await actions
      .waitFor({ state: 'visible', timeout: 15_000 })
      .then(() => true)
      .catch(() => false);

    if (!hasActions) {
      await expect(page.getByTestId('reservations-empty-state')).toBeVisible();
      test.skip(true, 'No cancellable reservation row');
    }

    await actions.selectOption('CANCELLED');
    await expect(page.getByTestId('change-status-confirm-modal')).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByTestId('change-status-confirm-modal')).toContainText(
      /İptal/i,
    );
    await page.getByTestId('change-status-cancel-btn').click();
    await expect(page.getByTestId('change-status-confirm-modal')).toBeHidden();
  });

  test('row opens detail drawer', async ({ page }) => {
    test.skip(!(await loginAgency(page)), 'Agency login failed / web down');

    await page.goto('/acente/reservations', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('acente-reservations-page')).toBeVisible({
      timeout: 20_000,
    });

    await page.getByTestId('filter-status-chip-all').click();

    const row = page.locator('[data-testid^="reservation-row-"]').first();
    test.skip(
      !(await row
        .waitFor({ state: 'visible', timeout: 15_000 })
        .then(() => true)
        .catch(() => false)),
      'No reservation rows',
    );

    await row.click();
    await expect(page.getByTestId('reservation-detail-drawer')).toBeVisible({
      timeout: 10_000,
    });
    await page.getByTestId('reservation-drawer-close').click();
    await expect(page.getByTestId('reservation-detail-drawer')).toBeHidden({
      timeout: 10_000,
    });
  });
});
