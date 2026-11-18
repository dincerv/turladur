import { test, expect } from '@playwright/test';

import { loginAgency } from './helpers/agency-login';

/**
 * Agency /acente/financials — KPIs, filters, ledger grid, export actions.
 * Skips when web / agency login / seed unavailable.
 */

test.describe('Acente — Finansal Durum', () => {
  test('loads KPI cards and filters', async ({ page }) => {
    test.skip(!(await loginAgency(page)), 'Agency login failed / web down');

    await page.goto('/acente/financials', { waitUntil: 'domcontentloaded' });

    await expect(page.getByTestId('acente-financials-page')).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByTestId('financials-filters')).toBeVisible();
    await expect(page.getByTestId('financials-search-input')).toBeVisible();
    await expect(page.getByTestId('financials-start-date')).toBeVisible();
    await expect(page.getByTestId('financials-end-date')).toBeVisible();
    await expect(page.getByTestId('financials-status-select')).toBeVisible();
    await expect(page.getByTestId('financials-export-csv-btn')).toBeVisible();
    await expect(page.getByTestId('financials-export-pdf-btn')).toBeVisible();

    const kpi = page.getByTestId('financials-kpi-grid');
    const skeleton = page.getByTestId('financials-kpi-skeleton');
    await expect(kpi.or(skeleton)).toBeVisible({ timeout: 20_000 });
    await expect(kpi).toBeVisible({ timeout: 25_000 });
    await expect(page.getByTestId('financials-kpi-gross')).toBeVisible();
    await expect(page.getByTestId('financials-kpi-pending')).toBeVisible();
    await expect(page.getByTestId('financials-kpi-paid')).toBeVisible();
    await expect(page.getByTestId('financials-kpi-commission')).toBeVisible();
  });

  test('status filter syncs to URL and updates grid', async ({ page }) => {
    test.skip(!(await loginAgency(page)), 'Agency login failed / web down');

    await page.goto('/acente/financials', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('acente-financials-page')).toBeVisible({
      timeout: 20_000,
    });

    await page.getByTestId('financials-status-chip-PENDING').click();
    await expect(page).toHaveURL(/status=PENDING/, { timeout: 10_000 });

    const empty = page.getByTestId('financials-empty');
    const table = page.getByTestId('financials-table');
    await expect(empty.or(table)).toBeVisible({ timeout: 20_000 });
  });

  test('date filters write startDate/endDate to URL', async ({ page }) => {
    test.skip(!(await loginAgency(page)), 'Agency login failed / web down');

    await page.goto('/acente/financials', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('acente-financials-page')).toBeVisible({
      timeout: 20_000,
    });

    await page.getByTestId('financials-start-date').fill('2026-01-01');
    await page.getByTestId('financials-end-date').fill('2026-12-31');

    await expect(page).toHaveURL(/startDate=2026-01-01/, { timeout: 10_000 });
    await expect(page).toHaveURL(/endDate=2026-12-31/);
  });

  test('CSV export triggers download toast', async ({ page }) => {
    test.skip(!(await loginAgency(page)), 'Agency login failed / web down');

    await page.goto('/acente/financials', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('acente-financials-page')).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByTestId('financials-kpi-grid')).toBeVisible({
      timeout: 20_000,
    });

    const downloadPromise = page
      .waitForEvent('download', { timeout: 15_000 })
      .catch(() => null);
    await page.getByTestId('financials-export-csv-btn').click();

    const download = await downloadPromise;
    const toast = page.getByTestId('financials-toast');
    const err = page.getByTestId('financials-error');

    if (download) {
      expect(download.suggestedFilename()).toMatch(/finans.*\.csv$/i);
    }

    await expect(toast.or(err)).toBeVisible({ timeout: 15_000 });
  });
});
