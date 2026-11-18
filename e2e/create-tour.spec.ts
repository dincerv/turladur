import { test, expect } from '@playwright/test';

import { loginAgency } from './helpers/agency-login';

/**
 * Agency tour create — stepper fill, required validation, submit → /acente/tours.
 * Skips when web / agency login unavailable.
 */

test.describe('Acente — Yeni tur', () => {
  test('validates required fields, submits, redirects to tours list', async ({
    page,
  }) => {
    test.skip(!(await loginAgency(page)), 'Agency login failed / web down');

    await page.goto('/acente/tours/new', { waitUntil: 'domcontentloaded' });

    await expect(page.getByTestId('acente-tour-create-page')).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByTestId('tour-create-stepper')).toBeVisible();
    await expect(page.getByTestId('tour-title-input')).toBeVisible();

    // Required validation: empty title blocks advance
    await page.getByTestId('tour-step-next-btn').click();
    await expect(page.getByTestId('tour-title-error')).toBeVisible();
    await expect(page.getByTestId('submit-tour-btn')).toHaveCount(0);

    const stamp = Date.now();
    await page
      .getByTestId('tour-title-input')
      .fill(`E2E Kapadokya Turu ${stamp}`);
    await page
      .getByTestId('tour-description-input')
      .fill(
        'E2E test açıklaması en az on karakter uzunluğunda olmalıdır ve XSS denemesi <script>alert(1)</script> içerir.',
      );
    await page.getByTestId('tour-category-select').selectOption('CULTURAL');
    await page.getByTestId('tour-departure-input').fill('Ankara');
    await page.getByTestId('tour-stay-kind-select').selectOption('OVERNIGHT');
    await page.getByTestId('tour-scope-select').selectOption('DOMESTIC');
    await page.getByTestId('tour-duration-input').fill('3');

    await page.getByTestId('tour-step-next-btn').click();
    await expect(page.getByTestId('tour-price-input')).toBeVisible({
      timeout: 10_000,
    });

    await page.getByTestId('tour-price-input').fill('4200');
    await page.getByTestId('tour-capacity-input').fill('18');

    await page.getByTestId('tour-step-next-btn').click();
    await expect(page.getByTestId('tour-pickup-step')).toBeVisible({
      timeout: 10_000,
    });

    // Empty location blocks advance
    await page.getByTestId('tour-pickup-location-0').fill('');
    await page.getByTestId('tour-step-next-btn').click();
    await expect(page.getByTestId('tour-pickup-location-error-0')).toBeVisible({
      timeout: 5_000,
    });

    await page.getByTestId('tour-pickup-city-0').fill('Ankara');
    await page
      .getByTestId('tour-pickup-location-0')
      .fill('AŞTİ Terminal Girişi');
    await page.getByTestId('tour-pickup-time-0').fill('08:30');
    await page.getByTestId('tour-pickup-description-0').fill('Kapı 3 önü');

    await page.getByTestId('tour-step-next-btn').click();
    await expect(page.getByTestId('tour-media-dropzone')).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByTestId('submit-tour-btn')).toBeVisible();

    // Draft avoids publish queue side-effects; still creates tenant-bound tour
    const draft = page.getByTestId('tour-as-draft-checkbox');
    if (await draft.isVisible().catch(() => false)) {
      await draft.check();
    }

    await page.getByTestId('submit-tour-btn').click();

    await expect(page.getByTestId('create-success-toast')).toBeVisible({
      timeout: 45_000,
    });
    await expect(page.getByTestId('create-success-toast')).toContainText(
      /başarıyla oluşturuldu/i,
    );

    await expect(page).toHaveURL(/\/acente\/tours(?:\?|$)/, {
      timeout: 20_000,
    });
    await expect(page.getByTestId('acente-tours-page')).toBeVisible({
      timeout: 20_000,
    });
  });

  test('blocks step advance without required title', async ({ page }) => {
    test.skip(!(await loginAgency(page)), 'Agency login failed / web down');

    await page.goto('/acente/tours/new', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('tour-step-next-btn')).toBeVisible({
      timeout: 15_000,
    });
    await page.getByTestId('tour-step-next-btn').click();
    await expect(page.getByTestId('submit-tour-btn')).toHaveCount(0);
    await expect(page.getByTestId('tour-title-input')).toBeVisible();
    await expect(page.getByTestId('tour-title-error')).toBeVisible();
  });
});
