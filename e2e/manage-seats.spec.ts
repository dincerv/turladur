import { test, expect } from '@playwright/test';

/**
 * Agency seat map — load, MANUAL select seat-10, Kaydet success (no double-book).
 * Skips when web / seed / layout unavailable.
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

test.describe('Acente — Koltuk haritası', () => {
  test('loads map, MANUAL selects seat-10, saves without error', async ({
    page,
  }) => {
    test.skip(!(await loginAgency(page)), 'Agency login failed / web down');

    await page.goto('/acente/tours', { waitUntil: 'domcontentloaded' });
    const detailLink = page.getByRole('link', { name: /Detaylar/i }).first();
    test.skip(
      !(await detailLink.isVisible().catch(() => false)),
      'No owned tour',
    );

    await detailLink.click();
    await expect(page.getByTestId('acente-tour-detail-page')).toBeVisible({
      timeout: 15_000,
    });
    await page.getByTestId('tab-dates').click();

    const seatsLink = page
      .locator('[data-testid^="manage-seats-link-"]')
      .first();
    test.skip(
      !(await seatsLink.isVisible().catch(() => false)),
      'No manage-seats link',
    );
    await seatsLink.click();

    await expect(page.getByTestId('tour-date-seats-page')).toBeVisible({
      timeout: 15_000,
    });

    // Bind layout if required (seed may already have one).
    const layoutRequired = page.getByTestId('seats-layout-required');
    if (await layoutRequired.isVisible().catch(() => false)) {
      await page.getByTestId('layout-kind-select').selectOption({ index: 1 });
      await page.getByTestId('bind-layout-btn').click();
    }

    await expect(page.getByTestId('bus-seat-map-panel')).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByTestId('seat-map-grid')).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByTestId('seat-legend')).toBeVisible();
    await expect(page.getByTestId('mode-manual-btn')).toBeVisible();

    await page.getByTestId('mode-manual-btn').click();

    const seat10 = page.getByTestId('seat-10-AVAILABLE');
    test.skip(
      !(await seat10.isVisible().catch(() => false)),
      'seat-10 not AVAILABLE (layout/seed)',
    );

    const guest = page.locator('[data-testid^="guest-"]').first();
    test.skip(
      !(await guest.isVisible().catch(() => false)),
      'No unassigned guest to seat',
    );
    await guest.click();

    await seat10.click();
    await expect(page.getByTestId('seat-10-RESERVED')).toBeVisible({
      timeout: 5_000,
    });
    await expect(page.getByTestId('pending-count')).toContainText('1');

    const saveBtn = page.getByTestId('save-seats-btn');
    await expect(saveBtn).toBeEnabled();
    await saveBtn.click();

    await expect(page.getByTestId('seats-success-toast')).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByTestId('seats-error')).toHaveCount(0);

    // After save, seat-10 should be SOLD (not double-bookable as AVAILABLE).
    await expect(
      page
        .getByTestId('seat-10-SOLD')
        .or(page.getByTestId('seat-10-AVAILABLE')),
    ).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId('seat-10-AVAILABLE')).toHaveCount(0);
  });

  test('foreign tourDate shows forbidden', async ({ page }) => {
    test.skip(!(await loginAgency(page)), 'Agency login failed / web down');

    await page.goto('/acente/tours/not-owned-tour/dates/not-owned-date/seats', {
      waitUntil: 'domcontentloaded',
    });

    await expect(
      page.getByTestId('seats-forbidden').or(page.getByTestId('seats-error')),
    ).toBeVisible({ timeout: 15_000 });
  });
});
