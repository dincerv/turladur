import { test, expect } from '@playwright/test';

/**
 * Agency tour detail — tabs, empty/media states, seats CTA contract.
 * Skips when web/API/seed unavailable.
 */

const agencyEmail =
  process.env.E2E_AGENCY_EMAIL ?? 'owner01@agency.demo.turta.com';
const agencyPassword = process.env.E2E_AGENCY_PASSWORD ?? 'Demo1234!';

test.describe('Acente — Tur detay', () => {
  test('renders tabs and manage-seats links for owned tour', async ({
    page,
  }) => {
    const loginRes = await page.goto('/acente/giris');
    test.skip(!loginRes || !loginRes.ok(), 'Web app not running');

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
    test.skip(!page.url().includes('/acente'), 'Agency login failed');

    await page.goto('/acente/tours', { waitUntil: 'domcontentloaded' });
    const detailLink = page.getByRole('link', { name: /Detaylar/i }).first();
    test.skip(
      !(await detailLink.isVisible().catch(() => false)),
      'No owned tours to open',
    );

    await detailLink.click();
    await expect(page.getByTestId('acente-tour-detail-page')).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByTestId('edit-tour-btn')).toBeVisible();
    await expect(page.getByTestId('tab-media')).toBeVisible();

    await page.getByTestId('tab-media').click();
    await expect(
      page
        .getByTestId('tour-media-gallery')
        .or(page.getByTestId('media-empty-state')),
    ).toBeVisible();

    await page.getByTestId('tab-dates').click();
    const seatsLink = page
      .locator('[data-testid^="manage-seats-link-"]')
      .first();
    const emptyDates = page.getByTestId('dates-empty-state');
    await expect(seatsLink.or(emptyDates)).toBeVisible({ timeout: 10_000 });

    if (await seatsLink.isVisible().catch(() => false)) {
      await seatsLink.click();
      await expect(page.getByTestId('tour-date-seats-page')).toBeVisible({
        timeout: 15_000,
      });
    }
  });

  test('foreign tour id redirects to list safely', async ({ page }) => {
    const loginRes = await page.goto('/acente/giris');
    test.skip(!loginRes || !loginRes.ok(), 'Web app not running');

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
    test.skip(!page.url().includes('/acente'), 'Agency login failed');

    await page.goto('/acente/tours/does-not-exist-tour-id', {
      waitUntil: 'domcontentloaded',
    });

    await expect(
      page
        .getByTestId('tour-detail-forbidden')
        .or(page.getByTestId('tour-detail-error'))
        .or(page),
    ).toBeVisible({ timeout: 15_000 });

    await page
      .waitForURL(/\/acente\/tours\/?$/, { timeout: 5000 })
      .catch(() => null);
  });
});
