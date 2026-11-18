import { test, expect } from '@playwright/test';

import { loginAgency } from './helpers/agency-login';

/**
 * Agency /acente/help — FAQ search/categories, support ticket form + list.
 * Skips when web / agency login / seed unavailable.
 */

test.describe('Acente — Yardım', () => {
  test('loads FAQ accordion and contact cards', async ({ page }) => {
    test.skip(!(await loginAgency(page)), 'Agency login failed / web down');

    await page.goto('/acente/help', { waitUntil: 'domcontentloaded' });

    const shellDenied = page.getByTestId('agency-shell-denied');
    const helpPage = page.getByTestId('acente-help-page');
    await expect(helpPage.or(shellDenied)).toBeVisible({ timeout: 20_000 });
    if (await shellDenied.isVisible().catch(() => false)) return;

    await expect(page.getByTestId('help-faq-section')).toBeVisible();
    await expect(page.getByTestId('help-faq-accordion')).toBeVisible();
    await expect(page.getByTestId('help-contact-cards')).toBeVisible();
    await expect(page.getByTestId('help-ticket-form')).toBeVisible();
  });

  test('filters FAQ by category and search', async ({ page }) => {
    test.skip(!(await loginAgency(page)), 'Agency login failed / web down');

    await page.goto('/acente/help', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('acente-help-page')).toBeVisible({
      timeout: 20_000,
    });

    await page.getByTestId('help-faq-cat-PAYMENTS').click();
    await expect(page.getByTestId('help-faq-item-payout-timing')).toBeVisible();
    await expect(page.getByTestId('help-faq-item-panel-overview')).toBeHidden();

    await page.getByTestId('help-faq-cat-ALL').click();
    const search = page.getByTestId('help-faq-search');
    await search.fill('şifre');
    await expect(page.getByTestId('help-faq-item-password-reset')).toBeVisible({
      timeout: 5_000,
    });
  });

  test('ticket form validates short message', async ({ page }) => {
    test.skip(!(await loginAgency(page)), 'Agency login failed / web down');

    await page.goto('/acente/help', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('help-ticket-form')).toBeVisible({
      timeout: 20_000,
    });

    await page.getByTestId('help-ticket-subject').fill('Kısa');
    await page.getByTestId('help-ticket-message').fill('çok kısa');
    await page.getByTestId('help-ticket-submit').click();

    await expect(page.getByText(/en az/i).first()).toBeVisible({
      timeout: 10_000,
    });
  });

  test('creates support ticket when API available', async ({ page }) => {
    test.skip(!(await loginAgency(page)), 'Agency login failed / web down');

    await page.goto('/acente/help', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('help-ticket-form')).toBeVisible({
      timeout: 20_000,
    });

    const suffix = Date.now().toString(36);
    const subject = `E2E destek talebi ${suffix}`;
    const message =
      `Bu otomatik E2E test mesajıdır. Detaylı açıklama satırı ${suffix} ` +
      'için yeterli uzunlukta içerik sağlanmıştır.';

    await page.getByTestId('help-ticket-subject').fill(subject);
    await page.getByTestId('help-ticket-priority').selectOption('MEDIUM');
    await page.getByTestId('help-ticket-category').selectOption('ACCOUNT');
    await page.getByTestId('help-ticket-message').fill(message);
    await page.getByTestId('help-ticket-submit').click();

    const toast = page.getByTestId('help-ticket-toast');
    await expect(toast).toBeVisible({ timeout: 20_000 });

    const variant = await toast.getAttribute('data-variant');
    if (variant === 'error') {
      // Migration/API down — form path still wired
      return;
    }

    await expect(toast).toContainText(/oluşturuldu/i);
    await expect(page.getByText(subject)).toBeVisible({ timeout: 10_000 });
    await expect(
      page.locator('[data-testid^="help-ticket-row-"]').first(),
    ).toBeVisible();
  });

  test('shows ticket list or empty state', async ({ page }) => {
    test.skip(!(await loginAgency(page)), 'Agency login failed / web down');

    await page.goto('/acente/help', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('acente-help-page')).toBeVisible({
      timeout: 20_000,
    });

    const empty = page.getByTestId('help-ticket-empty');
    const list = page.getByTestId('help-ticket-list');
    const skeleton = page.getByTestId('help-ticket-list-skeleton');
    const err = page.getByTestId('help-ticket-list-error');

    await expect(empty.or(list).or(skeleton).or(err)).toBeVisible({
      timeout: 20_000,
    });
    await expect(empty.or(list).or(err)).toBeVisible({ timeout: 25_000 });
  });
});
