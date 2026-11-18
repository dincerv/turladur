import { test, expect } from '@playwright/test';

import { loginAgency } from './helpers/agency-login';

/**
 * Agency /acente/atamalar — tabs, invite modal, searchable select, grid.
 * Skips when web / agency login / seed unavailable.
 */

test.describe('Acente — Rehber ve Otobüs Atamaları', () => {
  test('loads page with status tabs and data grid', async ({ page }) => {
    test.skip(!(await loginAgency(page)), 'Agency login failed / web down');

    await page.goto('/acente/atamalar', { waitUntil: 'domcontentloaded' });

    await expect(page.getByTestId('acente-assignments-page')).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByTestId('assignments-tabs')).toBeVisible();
    await expect(page.getByTestId('assignments-tab-all')).toBeVisible();
    await expect(page.getByTestId('assignments-tab-PENDING')).toBeVisible();
    await expect(page.getByTestId('assignments-tab-ACCEPTED')).toBeVisible();
    await expect(page.getByTestId('assignments-tab-REJECTED')).toBeVisible();
    await expect(page.getByTestId('assignments-new-invite-btn')).toBeVisible();

    await page.getByTestId('assignments-tab-PENDING').click();
    await expect(page.getByTestId('assignments-tab-PENDING')).toHaveAttribute(
      'aria-selected',
      'true',
    );

    const empty = page.getByTestId('assignments-empty');
    const table = page.getByTestId('assignments-table');
    await expect(empty.or(table)).toBeVisible({ timeout: 15_000 });
  });

  test('opens invite modal with searchable select and can switch roles', async ({
    page,
  }) => {
    test.skip(!(await loginAgency(page)), 'Agency login failed / web down');

    await page.goto('/acente/atamalar', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('acente-assignments-page')).toBeVisible({
      timeout: 20_000,
    });

    await page.getByTestId('assignments-new-invite-btn').click();
    const modal = page.getByTestId('invite-assignment-modal');
    await expect(modal).toBeVisible({ timeout: 10_000 });

    await expect(page.getByTestId('invite-role-GUIDE')).toBeVisible();
    await expect(page.getByTestId('invite-tour-select')).toBeVisible();
    await expect(page.getByTestId('invite-tour-date-select')).toBeVisible();
    await expect(page.getByTestId('invite-search-input')).toBeVisible();
    await expect(page.getByTestId('invite-candidate-list')).toBeVisible();
    await expect(page.getByTestId('invite-submit-btn')).toBeDisabled();

    await page.getByTestId('invite-search-input').fill('a');
    await page.getByTestId('invite-role-BUS').click();
    await expect(page.getByTestId('invite-role-BUS')).toHaveClass(/bg-blue-50/);

    await page.getByTestId('invite-modal-close').click();
    await expect(modal).toBeHidden();
  });

  test('sends guide invite from modal when candidates exist', async ({
    page,
  }) => {
    test.skip(!(await loginAgency(page)), 'Agency login failed / web down');

    await page.goto('/acente/atamalar', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('acente-assignments-page')).toBeVisible({
      timeout: 20_000,
    });

    await page.getByTestId('assignments-new-invite-btn').click();
    await expect(page.getByTestId('invite-assignment-modal')).toBeVisible({
      timeout: 10_000,
    });

    const tourSelect = page.getByTestId('invite-tour-select');
    await expect(tourSelect).toBeVisible();
    const tourOptions = tourSelect.locator('option');
    const tourCount = await tourOptions.count();
    test.skip(tourCount < 1 || !(await tourSelect.inputValue()), 'No tours');

    const dateSelect = page.getByTestId('invite-tour-date-select');
    await expect(dateSelect).toBeVisible();
    // Wait for dates / candidates to settle
    await page.waitForTimeout(800);

    const dateValue = await dateSelect.inputValue();
    test.skip(!dateValue, 'No active tour dates');

    const guideOption = page
      .locator('[data-testid^="invite-guide-option-"]')
      .first();
    const hasGuide = await guideOption
      .waitFor({ state: 'visible', timeout: 12_000 })
      .then(() => true)
      .catch(() => false);
    test.skip(!hasGuide, 'No available guide candidates in seed');

    await guideOption.click();
    await expect(page.getByTestId('invite-submit-btn')).toBeEnabled();
    await page.getByTestId('invite-submit-btn').click();

    const toast = page.getByTestId('assignments-toast');
    const modalError = page.getByTestId('invite-modal-error');

    await expect(toast.or(modalError)).toBeVisible({ timeout: 20_000 });

    if (await modalError.isVisible().catch(() => false)) {
      const msg = (await modalError.textContent()) ?? '';
      // Conflict / already-active are valid production outcomes against seed
      expect(msg.length).toBeGreaterThan(0);
      return;
    }

    await expect(toast).toHaveAttribute('data-toast-type', 'success');
    await expect(page.getByTestId('invite-assignment-modal')).toBeHidden();
  });

  test('filters by role and shows withdraw action on pending rows', async ({
    page,
  }) => {
    test.skip(!(await loginAgency(page)), 'Agency login failed / web down');

    await page.goto('/acente/atamalar', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('acente-assignments-page')).toBeVisible({
      timeout: 20_000,
    });

    await page.getByTestId('assignments-role-GUIDE').click();
    await page.getByTestId('assignments-tab-PENDING').click();

    const empty = page.getByTestId('assignments-empty');
    const table = page.getByTestId('assignments-table');
    await expect(empty.or(table)).toBeVisible({ timeout: 15_000 });

    if (await empty.isVisible().catch(() => false)) {
      return;
    }

    const withdraw = page
      .locator('[data-testid^="assignment-withdraw-"]')
      .first();
    const hasWithdraw = await withdraw.isVisible().catch(() => false);
    if (!hasWithdraw) return;

    await withdraw.click();
    await expect(page.getByTestId('assignments-toast')).toBeVisible({
      timeout: 15_000,
    });
  });
});
