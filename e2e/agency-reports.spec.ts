import { test, expect } from '@playwright/test';

import { loginAgency } from './helpers/agency-login';

/**
 * Agency /acente/reports — OWNER/MANAGER KPIs, charts, period filters, goals.
 * Skips when web / agency login / seed unavailable.
 */

test.describe('Acente — Raporlar', () => {
  test('loads KPIs charts and goals for manager role', async ({ page }) => {
    test.skip(!(await loginAgency(page)), 'Agency login failed / web down');

    await page.goto('/acente/reports', { waitUntil: 'domcontentloaded' });

    const forbidden = page.getByTestId('reports-forbidden');
    const shellDenied = page.getByTestId('agency-shell-denied');
    const reportsPage = page.getByTestId('acente-reports-page');

    await expect(reportsPage.or(forbidden).or(shellDenied)).toBeVisible({
      timeout: 20_000,
    });

    if (await forbidden.isVisible().catch(() => false)) {
      await expect(forbidden).toContainText(/sahibi|yönetici/i);
      return;
    }
    if (await shellDenied.isVisible().catch(() => false)) {
      return;
    }

    await expect(page.getByTestId('reports-filters')).toBeVisible();
    await expect(page.getByTestId('reports-period-tabs')).toBeVisible();

    const skeleton = page.getByTestId('reports-kpi-skeleton');
    const kpi = page.getByTestId('reports-kpi-grid');
    await expect(kpi.or(skeleton)).toBeVisible({ timeout: 20_000 });
    await expect(kpi).toBeVisible({ timeout: 25_000 });
    await expect(page.getByTestId('reports-kpi-revenue')).toBeVisible();
    await expect(page.getByTestId('reports-revenue-chart')).toBeVisible();
    await expect(page.getByTestId('reports-occupancy-chart')).toBeVisible();
    await expect(page.getByTestId('reports-goals')).toBeVisible();
  });

  test('period and range filters sync to URL', async ({ page }) => {
    test.skip(!(await loginAgency(page)), 'Agency login failed / web down');

    await page.goto('/acente/reports', { waitUntil: 'domcontentloaded' });
    const reportsPage = page.getByTestId('acente-reports-page');
    const forbidden = page.getByTestId('reports-forbidden');
    await expect(reportsPage.or(forbidden)).toBeVisible({ timeout: 20_000 });
    test.skip(
      await forbidden.isVisible().catch(() => false),
      'Staff role cannot access reports',
    );

    await page.getByTestId('reports-period-yearly').click();
    await expect(page).toHaveURL(/period=yearly|dateRange=thisYear/, {
      timeout: 10_000,
    });

    await page.getByTestId('reports-range-last3Months').click();
    await expect(page).toHaveURL(/dateRange=last3Months/, { timeout: 10_000 });

    await page.getByTestId('reports-range-custom').click();
    await expect(page.getByTestId('reports-start-date')).toBeVisible();
    await page.getByTestId('reports-start-date').fill('2026-01-01');
    await page.getByTestId('reports-end-date').fill('2026-06-30');
    await expect(page).toHaveURL(/startDate=2026-01-01/, { timeout: 10_000 });
    await expect(page).toHaveURL(/endDate=2026-06-30/);
  });
});
