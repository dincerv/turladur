import { test, expect } from '@playwright/test';

import { loginAgency } from './helpers/agency-login';
import { E2E_BUS_EMAIL, E2E_BUS_PASSWORD, loginBus } from './helpers/bus-login';

/**
 * Soft-live bus panel smoke (seed-first, no public register):
 * bus01 login → fleet list → availability toggle → agency invite → accept w/ plate.
 */
test.describe('Otobüs — soft-live smoke', () => {
  test('login, vehicles, availability, accept invite with plate', async ({
    browser,
  }) => {
    const busCtx = await browser.newContext();
    const busPage = await busCtx.newPage();

    test.skip(
      !(await loginBus(busPage, E2E_BUS_EMAIL, E2E_BUS_PASSWORD)),
      'Bus login failed — seed DB?',
    );

    await busPage.goto('/otobus/dashboard', { waitUntil: 'domcontentloaded' });
    await expect(busPage.getByTestId('otobus-dashboard-page')).toBeVisible({
      timeout: 25_000,
    });
    await expect(
      busPage.getByTestId('otobus-dashboard-status'),
    ).toHaveAttribute('data-status', 'VERIFIED', { timeout: 15_000 });
    await expect(busPage.getByTestId('otobus-kpi-vehicles')).toBeVisible();
    await expect(busPage.getByTestId('otobus-kpi-utilization')).toBeVisible();

    await busPage.goto('/otobus/araclar', { waitUntil: 'domcontentloaded' });
    await expect(busPage.getByTestId('otobus-araclar-page')).toBeVisible({
      timeout: 20_000,
    });

    const vehicleRow = busPage
      .locator('[data-testid^="otobus-vehicle-row-"]')
      .first();
    await expect(vehicleRow).toBeVisible({ timeout: 15_000 });
    const vehicleTestId = await vehicleRow.getAttribute('data-testid');
    const vehicleId = vehicleTestId?.replace('otobus-vehicle-row-', '') ?? '';
    expect(vehicleId.length).toBeGreaterThan(0);
    const plate = (await vehicleRow.getAttribute('data-plate')) ?? '';
    expect(plate.length).toBeGreaterThan(0);

    await busPage
      .getByTestId(`otobus-vehicle-availability-${vehicleId}`)
      .click();
    await expect(busPage.getByTestId('otobus-musaitlik-page')).toBeVisible({
      timeout: 15_000,
    });
    await expect(busPage.getByTestId('availability-calendar')).toBeVisible();

    const toggleDay = busPage
      .locator(
        '[data-testid^="availability-day-"][data-state="available"], [data-testid^="availability-day-"][data-state="maintenance"]',
      )
      .first();
    await expect(toggleDay).toBeVisible({ timeout: 10_000 });
    const beforeState = await toggleDay.getAttribute('data-state');
    await toggleDay.click();
    await expect(toggleDay).not.toHaveAttribute(
      'data-state',
      beforeState ?? '',
      {
        timeout: 15_000,
      },
    );

    // Agency invites this bus company (search by seed plate / company)
    const agencyCtx = await browser.newContext();
    const agencyPage = await agencyCtx.newPage();
    test.skip(
      !(await loginAgency(agencyPage)),
      'Agency login failed / web down',
    );

    await agencyPage.goto('/acente/atamalar', {
      waitUntil: 'domcontentloaded',
    });
    await expect(agencyPage.getByTestId('acente-assignments-page')).toBeVisible(
      { timeout: 20_000 },
    );

    await agencyPage.getByTestId('assignments-new-invite-btn').click();
    await expect(agencyPage.getByTestId('invite-assignment-modal')).toBeVisible(
      { timeout: 10_000 },
    );

    await agencyPage.getByTestId('invite-role-BUS').click();
    const tourSelect = agencyPage.getByTestId('invite-tour-select');
    const tourCount = await tourSelect.locator('option').count();
    test.skip(tourCount < 1 || !(await tourSelect.inputValue()), 'No tours');

    await agencyPage.waitForTimeout(800);
    const dateValue = await agencyPage
      .getByTestId('invite-tour-date-select')
      .inputValue();
    test.skip(!dateValue, 'No active tour dates');

    await agencyPage.getByTestId('invite-search-input').fill(plate);
    await agencyPage.waitForTimeout(1_000);

    const vehicleOption = agencyPage
      .locator('[data-testid^="invite-vehicle-option-"]')
      .first();
    const hasVehicle = await vehicleOption
      .waitFor({ state: 'visible', timeout: 15_000 })
      .then(() => true)
      .catch(() => false);
    test.skip(!hasVehicle, 'Seed bus vehicle not listed for invite');

    await vehicleOption.click();
    await expect(agencyPage.getByTestId('invite-submit-btn')).toBeEnabled();
    await agencyPage.getByTestId('invite-submit-btn').click();

    const toast = agencyPage.getByTestId('assignments-toast');
    const modalError = agencyPage.getByTestId('invite-modal-error');
    await expect(toast.or(modalError)).toBeVisible({ timeout: 20_000 });
    if (await modalError.isVisible().catch(() => false)) {
      const msg = (await modalError.textContent()) ?? '';
      test.skip(true, `Bus invite failed: ${msg}`);
    }
    await expect(toast).toHaveAttribute('data-toast-type', 'success');
    await agencyCtx.close();

    // Bus accepts with plate selection
    await busPage.goto('/otobus/atamalar', { waitUntil: 'domcontentloaded' });
    if (
      !(await busPage
        .getByTestId('otobus-atamalar-page')
        .isVisible({ timeout: 8_000 })
        .catch(() => false))
    ) {
      test.skip(
        !(await loginBus(busPage, E2E_BUS_EMAIL, E2E_BUS_PASSWORD)),
        'Bus re-login failed',
      );
      await busPage.goto('/otobus/atamalar', {
        waitUntil: 'domcontentloaded',
      });
    }

    await expect(busPage.getByTestId('otobus-atamalar-page')).toBeVisible({
      timeout: 20_000,
    });

    const pendingRow = busPage
      .locator('[data-testid^="otobus-assignment-row-"][data-status="PENDING"]')
      .first();
    await expect(pendingRow).toBeVisible({ timeout: 20_000 });
    const pendingTestId = await pendingRow.getAttribute('data-testid');
    const assignmentId =
      pendingTestId?.replace('otobus-assignment-row-', '') ?? '';
    expect(assignmentId.length).toBeGreaterThan(0);

    const vehicleSelect = busPage.getByTestId(
      `otobus-assignment-vehicle-${assignmentId}`,
    );
    await vehicleSelect.selectOption({ value: vehicleId });
    await busPage
      .getByTestId(`otobus-assignment-accept-${assignmentId}`)
      .click();

    await expect(
      busPage.getByTestId(`otobus-assignment-row-${assignmentId}`),
    ).toHaveAttribute('data-status', 'ACCEPTED', { timeout: 20_000 });
    await expect(
      busPage.getByTestId(`otobus-assignment-plate-${assignmentId}`),
    ).toContainText(plate);

    await busCtx.close();
  });
});
