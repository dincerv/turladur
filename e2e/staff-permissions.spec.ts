import { test, expect } from '@playwright/test';

import {
  loginAgency,
  loginAgencyAs,
  logoutAgency,
} from './helpers/agency-login';

/**
 * OWNER creates staff with tours read-only; restricted staff sees
 * filtered sidebar and is blocked from write routes.
 */
test.describe('Acente — Staff granüler izinler', () => {
  test('OWNER sets read-only tours; staff sidebar + write gate', async ({
    page,
  }) => {
    test.skip(
      !(await loginAgency(page)),
      'Agency owner login failed / web down',
    );

    await page.goto('/acente/users', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('acente-users-page')).toBeVisible({
      timeout: 25_000,
    });

    const stamp = Date.now();
    const staffEmail = `e2e.staff.perms.${stamp}@agency.demo.turta.com`;
    const staffPassword = 'StaffPerm1!';

    await page.getByTestId('users-add-button').click();
    await expect(page.getByTestId('staff-form-dialog')).toBeVisible();

    await page.getByTestId('staff-name-input').fill(`E2E Perm Staff ${stamp}`);
    await page.getByTestId('staff-email-input').fill(staffEmail);
    await page.getByTestId('staff-password-input').fill(staffPassword);
    await page.getByTestId('staff-role-select').selectOption('AGENT');

    await expect(page.getByTestId('staff-permissions-matrix')).toBeVisible();

    // tours read-only
    await page.getByTestId('staff-perm-tours-read').check();
    await page.getByTestId('staff-perm-tours-write').uncheck();
    await page.getByTestId('staff-perm-reservations-read').uncheck();
    await page.getByTestId('staff-perm-reservations-write').uncheck();
    await page.getByTestId('staff-perm-financials-read').uncheck();
    await page.getByTestId('staff-perm-financials-write').uncheck();
    await page.getByTestId('staff-perm-reports-read').uncheck();
    await page.getByTestId('staff-perm-reports-write').uncheck();
    await page.getByTestId('staff-perm-settings-read').uncheck();
    await page.getByTestId('staff-perm-settings-write').uncheck();

    await page.getByTestId('staff-form-submit').click();

    await expect(page.getByTestId('users-flash')).toContainText(/eklendi/i, {
      timeout: 20_000,
    });
    await expect(
      page.locator(`[data-staff-email="${staffEmail}"]`),
    ).toBeVisible({ timeout: 15_000 });

    await logoutAgency(page);
    test.skip(
      !(await loginAgencyAs(page, staffEmail, staffPassword)),
      'Restricted staff login failed',
    );

    await expect(page.getByTestId('agency-shell-nav')).toBeVisible({
      timeout: 20_000,
    });

    // Allowed module visible
    await expect(page.getByTestId('agency-nav-tours')).toBeVisible();

    // Unauthorized modules hidden
    await expect(page.getByTestId('agency-nav-financials')).toHaveCount(0);
    await expect(page.getByTestId('agency-nav-reports')).toHaveCount(0);
    await expect(page.getByTestId('agency-nav-settings')).toHaveCount(0);
    await expect(page.getByTestId('agency-nav-users')).toHaveCount(0);
    await expect(page.getByTestId('agency-nav-reservations')).toHaveCount(0);

    // Read path OK
    await page.goto('/acente/tours', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('partner-forbidden')).toHaveCount(0);

    // Write-required path blocked
    await page.goto('/acente/tours/new', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('partner-forbidden')).toBeVisible({
      timeout: 20_000,
    });

    // Direct financials URL blocked
    await page.goto('/acente/financials', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('partner-forbidden')).toBeVisible({
      timeout: 20_000,
    });
  });
});
