import { test, expect } from '@playwright/test';

/**
 * Agency reservations list — load, status filter, confirm via modal.
 * Skips when web / agency login / seed unavailable.
 */

const agencyEmail =
  process.env.E2E_AGENCY_EMAIL ?? 'owner01@agency.demo.turta.com';
const agencyPassword = process.env.E2E_AGENCY_PASSWORD ?? 'Demo1234!';

async function loginAgency(page: import('@playwright/test').Page) {
  const loginRes = await page.goto('/acente/giris');
  if (!loginRes || !loginRes.ok()) return false;

  await page
    .locator('#email, input[name="email"], input[type="email"]')
    .first()
    .fill(agencyEmail);
  await page
    .locator('#password, input[name="password"], input[type="password"]')
    .first()
    .fill(agencyPassword);
  await page.getByRole('button', { name: /Giriş/i }).click();
  await page
    .waitForURL(/\/acente(\/|$)/, { timeout: 20_000 })
    .catch(() => null);
  return page.url().includes('/acente');
}

test.describe('Acente — Rezervasyonlar', () => {
  test('loads, filters by pending, confirms via modal', async ({ page }) => {
    test.skip(!(await loginAgency(page)), 'Agency login failed / web down');

    await page.goto('/acente/reservations', { waitUntil: 'domcontentloaded' });

    await expect(page.getByTestId('acente-reservations-page')).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByTestId('reservations-filters')).toBeVisible();
    await expect(page.getByTestId('filter-status-select')).toBeVisible();
    await expect(page.getByTestId('filter-customer-search')).toBeVisible();
    await expect(page.getByTestId('filter-date-from')).toBeVisible();

    // Filter: Bekliyor (PENDING group)
    await page.getByTestId('filter-status-chip-PENDING').click();
    await expect(page).toHaveURL(/status=PENDING/, { timeout: 10_000 });

    const empty = page.getByTestId('reservations-empty-state');
    const confirmBtn = page
      .locator('[data-testid^="change-status-btn-"]')
      .first();

    const hasConfirm = await confirmBtn.isVisible().catch(() => false);
    const isEmpty = await empty.isVisible().catch(() => false);

    if (isEmpty && !hasConfirm) {
      // No pending rows in seed — still assert filter + empty UX
      await expect(empty).toBeVisible();
      return;
    }

    test.skip(!hasConfirm, 'No pending reservation to confirm');

    await confirmBtn.click();
    await expect(page.getByTestId('change-status-confirm-modal')).toBeVisible({
      timeout: 10_000,
    });
    await page.getByTestId('change-status-confirm-btn').click();

    await expect(page.getByTestId('change-status-confirm-modal')).toBeHidden({
      timeout: 45_000,
    });
  });

  test('row opens detail drawer', async ({ page }) => {
    test.skip(!(await loginAgency(page)), 'Agency login failed / web down');

    await page.goto('/acente/reservations', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('acente-reservations-page')).toBeVisible({
      timeout: 20_000,
    });

    // Clear status filter to see any row
    await page.getByTestId('filter-status-chip-all').click();

    const row = page.locator('[data-testid^="reservation-row-"]').first();
    test.skip(
      !(await row.isVisible().catch(() => false)),
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
