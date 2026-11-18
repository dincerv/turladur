import { test, expect } from '@playwright/test';

import { loginAgency } from './helpers/agency-login';

/**
 * Agency /acente/settings — tab URL sync, profile/security/company forms.
 * Skips when web / agency login / seed unavailable.
 */

test.describe('Acente — Ayarlar', () => {
  test('loads settings shell with profile tab', async ({ page }) => {
    test.skip(!(await loginAgency(page)), 'Agency login failed / web down');

    await page.goto('/acente/settings', { waitUntil: 'domcontentloaded' });

    const shellDenied = page.getByTestId('agency-shell-denied');
    const settingsPage = page.getByTestId('acente-settings-page');

    await expect(settingsPage.or(shellDenied)).toBeVisible({
      timeout: 20_000,
    });
    if (await shellDenied.isVisible().catch(() => false)) return;

    await expect(page.getByTestId('settings-tabs')).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByTestId('settings-tab-profile')).toBeVisible();
    await expect(page.getByTestId('settings-panel-profile')).toBeVisible();
    await expect(page.getByTestId('settings-profile-form')).toBeVisible();
  });

  test('tab switches sync to URL searchParams', async ({ page }) => {
    test.skip(!(await loginAgency(page)), 'Agency login failed / web down');

    await page.goto('/acente/settings', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('acente-settings-page')).toBeVisible({
      timeout: 20_000,
    });

    await page.getByTestId('settings-tab-security').click();
    await expect(page).toHaveURL(/[?&]tab=security/, { timeout: 10_000 });
    await expect(page.getByTestId('settings-panel-security')).toBeVisible();
    await expect(page.getByTestId('settings-security-form')).toBeVisible();

    await page.getByTestId('settings-tab-notifications').click();
    await expect(page).toHaveURL(/tab=notifications/, { timeout: 10_000 });
    await expect(page.getByTestId('settings-notifications-form')).toBeVisible();

    await page.goto('/acente/settings?tab=security', {
      waitUntil: 'domcontentloaded',
    });
    await expect(page.getByTestId('settings-panel-security')).toBeVisible({
      timeout: 15_000,
    });
  });

  test('security form validates password mismatch', async ({ page }) => {
    test.skip(!(await loginAgency(page)), 'Agency login failed / web down');

    await page.goto('/acente/settings?tab=security', {
      waitUntil: 'domcontentloaded',
    });
    await expect(page.getByTestId('settings-security-form')).toBeVisible({
      timeout: 20_000,
    });

    await page.getByTestId('settings-current-password').fill('Demo1234!');
    await page.getByTestId('settings-new-password').fill('NewPass12');
    await page.getByTestId('settings-confirm-password').fill('Different12');
    await page.getByTestId('settings-security-submit').click();

    await expect(page.getByText(/eşleşmiyor|aynı/i).first()).toBeVisible({
      timeout: 10_000,
    });
  });

  test('company tab available for OWNER with legal fields', async ({
    page,
  }) => {
    test.skip(!(await loginAgency(page)), 'Agency login failed / web down');

    await page.goto('/acente/settings?tab=company', {
      waitUntil: 'domcontentloaded',
    });

    const settingsPage = page.getByTestId('acente-settings-page');
    await expect(settingsPage).toBeVisible({ timeout: 20_000 });

    const companyTab = page.getByTestId('settings-tab-company');
    const disabled = await companyTab.isDisabled().catch(() => false);
    if (disabled) {
      await expect(page).not.toHaveURL(/tab=company/);
      return;
    }

    await expect(page.getByTestId('settings-company-form')).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByTestId('settings-company-name')).toBeVisible();
    await expect(page.getByTestId('settings-company-legal')).toBeVisible();
    await expect(page.getByTestId('settings-company-tax')).toBeVisible();
    await expect(page.getByTestId('settings-company-submit')).toBeVisible();
  });

  test('profile form shows name and readonly email', async ({ page }) => {
    test.skip(!(await loginAgency(page)), 'Agency login failed / web down');

    await page.goto('/acente/settings?tab=profile', {
      waitUntil: 'domcontentloaded',
    });
    await expect(page.getByTestId('settings-profile-form')).toBeVisible({
      timeout: 20_000,
    });

    const name = page.getByTestId('settings-profile-name');
    const email = page.getByTestId('settings-profile-email');
    await expect(name).toBeVisible();
    await expect(email).toBeVisible();
    await expect(email).toBeDisabled();
    const emailValue = await email.inputValue();
    expect(emailValue).toContain('@');
  });
});
