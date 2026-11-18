import { test, expect } from '@playwright/test';

import { loginAgency } from './helpers/agency-login';

/**
 * Agency /acente/customers — list, debounced search URL sync, detail drawer.
 * Skips when web / agency login / seed unavailable.
 */

test.describe('Acente — Müşteriler', () => {
  test('loads page with search and table or empty state', async ({ page }) => {
    test.skip(!(await loginAgency(page)), 'Agency login failed / web down');

    await page.goto('/acente/customers', { waitUntil: 'domcontentloaded' });

    await expect(page.getByTestId('acente-customers-page')).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByTestId('customers-filters')).toBeVisible();
    await expect(page.getByTestId('customers-search-input')).toBeVisible();

    const empty = page.getByTestId('customers-empty');
    const table = page.getByTestId('customers-table');
    await expect(empty.or(table)).toBeVisible({ timeout: 20_000 });
  });

  test('debounced search syncs q to URL', async ({ page }) => {
    test.skip(!(await loginAgency(page)), 'Agency login failed / web down');

    await page.goto('/acente/customers', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('acente-customers-page')).toBeVisible({
      timeout: 20_000,
    });

    const search = page.getByTestId('customers-search-input');
    await search.fill('demo');
    await search.blur();

    await expect(page).toHaveURL(/[?&]q=demo/, { timeout: 10_000 });
  });

  test('opens detail drawer from row click', async ({ page }) => {
    test.skip(!(await loginAgency(page)), 'Agency login failed / web down');

    await page.goto('/acente/customers', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('acente-customers-page')).toBeVisible({
      timeout: 20_000,
    });

    const empty = page.getByTestId('customers-empty');
    const row = page.locator('[data-testid^="customer-row-"]').first();

    const hasRow = await row
      .waitFor({ state: 'visible', timeout: 15_000 })
      .then(() => true)
      .catch(() => false);

    if (!hasRow) {
      await expect(empty).toBeVisible();
      test.skip(true, 'No customers in seed');
    }

    await row.click();
    await expect(page.getByTestId('customer-drawer')).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByTestId('customer-drawer-panel')).toBeVisible();

    const loading = page.getByTestId('customer-drawer-loading');
    const tours = page.getByTestId('customer-tours-section');
    const err = page.getByTestId('customer-drawer-error');
    await expect(tours.or(err).or(loading)).toBeVisible({ timeout: 15_000 });
    await expect(tours.or(err)).toBeVisible({ timeout: 20_000 });

    if (await tours.isVisible().catch(() => false)) {
      await expect(page.getByTestId('customer-payments-section')).toBeVisible();
    }

    await page.getByTestId('customer-drawer-close').click();
    await expect(page.getByTestId('customer-drawer')).toBeHidden();
  });

  test('masks email in list cells', async ({ page }) => {
    test.skip(!(await loginAgency(page)), 'Agency login failed / web down');

    await page.goto('/acente/customers', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('acente-customers-page')).toBeVisible({
      timeout: 20_000,
    });

    const row = page.locator('[data-testid^="customer-row-"]').first();
    const hasRow = await row.isVisible().catch(() => false);
    test.skip(!hasRow, 'No customers in seed');

    const emailCell = row.locator('td').nth(1);
    const text = (await emailCell.innerText()).trim();
    expect(text).toMatch(/\*\*\*/);
    expect(text).toContain('@');
  });
});
