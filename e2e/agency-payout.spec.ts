import { test, expect } from '@playwright/test';

import { loginAgency } from './helpers/agency-login';

/**
 * Agency bank account + payout request flow on /acente/financials.
 * Skips when web / login / insufficient withdrawable balance.
 */

test.describe('Acente — Banka & Payout', () => {
  test('adds bank account, validates IBAN, creates PENDING payout', async ({
    page,
  }) => {
    test.skip(!(await loginAgency(page)), 'Agency login failed / web down');

    await page.goto('/acente/financials', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('acente-financials-page')).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByTestId('financials-payout-panel')).toBeVisible({
      timeout: 25_000,
    });

    await page.getByTestId('add-bank-account-btn').click();
    await expect(page.getByTestId('bank-account-modal')).toBeVisible();

    await page.getByTestId('bank-iban-input').fill('TR123');
    await page.getByTestId('bank-account-name-input').fill('E2E Test Hesap');
    await page.getByTestId('bank-modal-submit').click();
    await expect(page.getByTestId('bank-iban-error')).toBeVisible({
      timeout: 5_000,
    });

    const digits = `${Date.now()}`.padStart(24, '0').slice(-24);
    const iban = `TR${digits}`;

    await page.getByTestId('bank-iban-input').fill(iban);
    await page.getByTestId('bank-name-input').fill('E2E Demo Bank');
    await page.getByTestId('bank-default-checkbox').check();
    await page.getByTestId('bank-modal-submit').click();

    await expect(page.getByTestId('payout-toast')).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByTestId('bank-accounts-list')).toBeVisible();

    const balanceAttr = await page
      .getByTestId('withdrawable-kpi')
      .getAttribute('data-withdrawable');
    const balance = Number(balanceAttr ?? '0');
    test.skip(!(balance >= 1), 'No withdrawable ACCRUED balance in seed');

    await page.getByTestId('create-payout-btn').click();
    await expect(page.getByTestId('payout-request-modal')).toBeVisible();

    const amount = Math.min(100, Math.floor(balance));
    await page.getByTestId('payout-amount-input').fill(String(amount));
    await page.getByTestId('payout-modal-submit').click();

    await expect(page.getByTestId('payout-toast')).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByTestId('payouts-table')).toBeVisible({
      timeout: 15_000,
    });
    await expect(
      page
        .locator('[data-testid^="payout-status-"]')
        .filter({ hasText: /Bekliyor/i })
        .first(),
    ).toBeVisible({ timeout: 10_000 });
  });
});
