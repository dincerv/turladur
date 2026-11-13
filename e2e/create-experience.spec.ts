import { test, expect } from '@playwright/test';

/**
 * Agency experience create — stepper fill, submit, success toast.
 * Skips when web / agency login unavailable.
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

test.describe('Acente — Yeni deneyim', () => {
  test('fills basic fields, advances steps, submits with success toast', async ({
    page,
  }) => {
    test.skip(!(await loginAgency(page)), 'Agency login failed / web down');

    await page.goto('/acente/experiences/new', {
      waitUntil: 'domcontentloaded',
    });

    await expect(page.getByTestId('acente-experience-create-page')).toBeVisible(
      {
        timeout: 20_000,
      },
    );
    await expect(page.getByTestId('experience-create-stepper')).toBeVisible();
    await expect(page.getByTestId('experience-title-input')).toBeVisible();

    const stamp = Date.now();
    await page
      .getByTestId('experience-title-input')
      .fill(`E2E Atölye ${stamp}`);
    await page
      .getByTestId('experience-description-input')
      .fill('Kısa açıklama en az on karakter uzunluğunda olmalı.');
    await page
      .getByTestId('experience-long-description-input')
      .fill(
        'Uzun açıklama metni burada yer alır ve en az on karakter olmalıdır.',
      );
    await page.getByTestId('experience-location-input').fill('Avanos');
    await page.getByTestId('experience-duration-input').fill('2 saat');

    await page.getByTestId('experience-step-next-btn').click();
    await expect(page.getByTestId('experience-included')).toBeVisible({
      timeout: 10_000,
    });

    await page.getByTestId('experience-included-input').fill('Transfer');
    await page.getByTestId('experience-included-add').click();

    await page.getByTestId('experience-step-next-btn').click();
    await expect(page.getByTestId('experience-price-input')).toBeVisible({
      timeout: 10_000,
    });
    await page.getByTestId('experience-price-input').fill('750');
    await expect(page.getByTestId('experience-media-dropzone')).toBeVisible();

    const submit = page.getByTestId('submit-experience-btn');
    await expect(submit).toBeEnabled();
    await submit.click();

    await expect(page.getByTestId('create-success-toast')).toBeVisible({
      timeout: 45_000,
    });
    await expect(page.getByTestId('create-success-toast')).toContainText(
      /başarıyla oluşturuldu/i,
    );
  });

  test('blocks step advance without required title', async ({ page }) => {
    test.skip(!(await loginAgency(page)), 'Agency login failed / web down');

    await page.goto('/acente/experiences/new', {
      waitUntil: 'domcontentloaded',
    });
    await expect(page.getByTestId('experience-step-next-btn')).toBeVisible({
      timeout: 15_000,
    });
    await page.getByTestId('experience-step-next-btn').click();
    // Still on basic — media submit not visible
    await expect(page.getByTestId('submit-experience-btn')).toHaveCount(0);
    await expect(page.getByTestId('experience-title-input')).toBeVisible();
  });
});
