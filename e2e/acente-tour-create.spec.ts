import { test, expect } from '@playwright/test';

/**
 * Multi-step agency tour create — UI contract + validation gates.
 * Skips gracefully when web/API are down.
 */

const agencyEmail =
  process.env.E2E_AGENCY_EMAIL ?? 'owner01@agency.demo.turta.com';
const agencyPassword = process.env.E2E_AGENCY_PASSWORD ?? 'Demo1234!';

test.describe('Acente — Yeni Tur multi-step', () => {
  test('stepper blocks step-2 without required fields and exposes testids', async ({
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
    test.skip(
      !page.url().includes('/acente'),
      'Agency login failed — seed DB?',
    );

    await page.goto('/acente/tours/new', { waitUntil: 'domcontentloaded' });

    const pageRoot = page.getByTestId('acente-tour-create-page');
    await expect(pageRoot).toBeVisible({ timeout: 15_000 });

    await expect(page.getByTestId('tour-stepper')).toBeVisible();
    await expect(page.getByTestId('tour-name-input')).toBeVisible();
    await expect(page.getByTestId('step-1-next-btn')).toBeVisible();

    await page.getByTestId('step-1-next-btn').click();
    await expect(page.getByTestId('tour-name-error')).toBeVisible();

    await page.getByTestId('tour-name-input').fill('E2E Kapadokya Test Turu');

    // Mobile preview toggle is lg:hidden — force narrow viewport for the control.
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(page.getByTestId('preview-toggle-btn')).toBeVisible();
    await page.getByTestId('preview-toggle-btn').click();
    await expect(page.getByTestId('mobile-preview-drawer')).toBeVisible();
    await page.getByTestId('preview-close-btn').click();
    await expect(page.getByTestId('mobile-preview-drawer')).toHaveCount(0);
  });
});
