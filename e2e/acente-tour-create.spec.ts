import { test, expect } from '@playwright/test';

import { loginAgency } from './helpers/agency-login';

/**
 * Multi-step agency tour create — UI contract + validation gates.
 * Skips gracefully when web/API are down.
 */

test.describe('Acente — Yeni Tur multi-step', () => {
  test('stepper blocks step-2 without required fields and exposes testids', async ({
    page,
  }) => {
    test.skip(!(await loginAgency(page)), 'Agency login failed — seed DB?');

    await page.goto('/acente/tours/new', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('agency-shell')).toBeVisible({
      timeout: 45_000,
    });

    const pageRoot = page.getByTestId('acente-tour-create-page');
    await expect(pageRoot).toBeVisible({ timeout: 30_000 });

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
