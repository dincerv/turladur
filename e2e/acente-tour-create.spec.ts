import { test, expect } from '@playwright/test';

import { loginAgency } from './helpers/agency-login';

/**
 * Legacy alias — full coverage lives in create-tour.spec.ts.
 * Keeps smoke contract for stepper + required title gate.
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

    await expect(page.getByTestId('tour-create-stepper')).toBeVisible();
    await expect(page.getByTestId('tour-title-input')).toBeVisible();
    await expect(page.getByTestId('tour-step-next-btn')).toBeVisible();

    await page.getByTestId('tour-step-next-btn').click();
    await expect(page.getByTestId('tour-title-error')).toBeVisible();
  });
});
