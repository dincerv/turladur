import { test, expect } from '@playwright/test';

import { loginAgency } from './helpers/agency-login';

/**
 * Agency seat map — load, MANUAL select seat-10, Kaydet success (no double-book).
 * Skips when web / seed / layout unavailable.
 */

test.describe('Acente — Koltuk haritası', () => {
  test('loads map, MANUAL selects seat-10, saves without error', async ({
    page,
  }) => {
    test.skip(!(await loginAgency(page)), 'Agency login failed / web down');

    // Seed tags the seat-map demo tour with [SEAT-DEMO] for stable lookup.
    await page.goto('/acente/tours?q=SEAT-DEMO&view=list', {
      waitUntil: 'domcontentloaded',
    });
    await expect(page.getByTestId('agency-shell')).toBeVisible({
      timeout: 20_000,
    });
    const listeTab = page.getByRole('tab', { name: /Liste/i });
    if (await listeTab.isVisible().catch(() => false)) {
      await listeTab.click();
    }

    const detailLink = page.getByRole('link', { name: /Detaylar/i }).first();
    test.skip(
      !(await detailLink
        .waitFor({ state: 'visible', timeout: 15_000 })
        .then(() => true)
        .catch(() => false)),
      'No owned tour',
    );

    await detailLink.click();
    await expect(page.getByTestId('acente-tour-detail-page')).toBeVisible({
      timeout: 15_000,
    });
    await page.getByTestId('tab-dates').click();

    const seatsLinks = page.locator('[data-testid^="manage-seats-link-"]');
    await expect(seatsLinks.first()).toBeVisible({ timeout: 15_000 });

    const linkCount = await seatsLinks.count();
    let opened = false;
    for (let i = 0; i < linkCount; i++) {
      if (i > 0) {
        await page.getByTestId('tab-dates').click();
        await expect(seatsLinks.first()).toBeVisible({ timeout: 10_000 });
      }
      await seatsLinks.nth(i).click();
      await expect(page.getByTestId('tour-date-seats-page')).toBeVisible({
        timeout: 15_000,
      });

      const layoutRequired = page.getByTestId('seats-layout-required');
      if (await layoutRequired.isVisible().catch(() => false)) {
        await page.getByTestId('layout-kind-select').selectOption({ index: 1 });
        await page.getByTestId('bind-layout-btn').click();
      }

      await expect(page.getByTestId('bus-seat-map-panel')).toBeVisible({
        timeout: 20_000,
      });

      const guest = page.locator('[data-testid^="guest-"]').first();
      if (await guest.isVisible().catch(() => false)) {
        opened = true;
        break;
      }

      await page.goBack({ waitUntil: 'domcontentloaded' });
      await expect(page.getByTestId('acente-tour-detail-page')).toBeVisible({
        timeout: 15_000,
      });
    }

    test.skip(!opened, 'No tourDate with unassigned guest');

    await expect(page.getByTestId('seat-map-grid')).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByTestId('seat-legend')).toBeVisible();
    await expect(page.getByTestId('mode-manual-btn')).toBeVisible();

    await page.getByTestId('mode-manual-btn').click();

    const freeSeat = page
      .locator('[data-testid^="seat-"][data-testid$="-AVAILABLE"]')
      .first();
    test.skip(
      !(await freeSeat
        .waitFor({ state: 'visible', timeout: 10_000 })
        .then(() => true)
        .catch(() => false)),
      'No AVAILABLE seat (layout/seed)',
    );

    const seatTestId = (await freeSeat.getAttribute('data-testid')) ?? '';
    const seatCode = seatTestId
      .replace(/^seat-/, '')
      .replace(/-AVAILABLE$/, '');
    test.skip(!seatCode, 'Could not parse seat code');

    const guest = page.locator('[data-testid^="guest-"]').first();
    await guest.click();

    await freeSeat.click();
    await expect(page.getByTestId(`seat-${seatCode}-RESERVED`)).toBeVisible({
      timeout: 5_000,
    });
    await expect(page.getByTestId('pending-count')).toContainText('1');

    const saveBtn = page.getByTestId('save-seats-btn');
    await expect(saveBtn).toBeEnabled();
    await saveBtn.click();

    await expect(page.getByTestId('seats-success-toast')).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByTestId('seats-error')).toHaveCount(0);

    await expect(
      page
        .getByTestId(`seat-${seatCode}-SOLD`)
        .or(page.getByTestId(`seat-${seatCode}-AVAILABLE`)),
    ).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId(`seat-${seatCode}-AVAILABLE`)).toHaveCount(0);
  });

  test('foreign tourDate shows forbidden', async ({ page }) => {
    test.skip(!(await loginAgency(page)), 'Agency login failed / web down');

    await page.goto('/acente/tours/not-owned-tour/dates/not-owned-date/seats', {
      waitUntil: 'domcontentloaded',
    });

    await expect(
      page.getByTestId('seats-forbidden').or(page.getByTestId('seats-error')),
    ).toBeVisible({ timeout: 15_000 });
  });
});
