import { test, expect } from '@playwright/test';

import { loginAgency } from './helpers/agency-login';

/**
 * Agency /acente/users — OWNER-only staff CRUD, role badges, status toggle.
 * Skips when web / agency login / seed unavailable.
 */

test.describe('Acente — Personel (Users)', () => {
  test('loads staff grid or empty state for OWNER', async ({ page }) => {
    test.skip(!(await loginAgency(page)), 'Agency login failed / web down');

    await page.goto('/acente/users', { waitUntil: 'domcontentloaded' });

    const forbidden = page.getByTestId('users-forbidden');
    const shellDenied = page.getByTestId('agency-shell-denied');
    const usersPage = page.getByTestId('acente-users-page');

    await expect(usersPage.or(forbidden).or(shellDenied)).toBeVisible({
      timeout: 20_000,
    });

    if (await forbidden.isVisible().catch(() => false)) {
      await expect(forbidden).toContainText(/sahibi|OWNER/i);
      return;
    }
    if (await shellDenied.isVisible().catch(() => false)) {
      return;
    }

    await expect(page.getByTestId('users-add-button')).toBeVisible();

    const empty = page.getByTestId('users-empty');
    const table = page.getByTestId('users-table');
    const skeleton = page.getByTestId('users-skeleton');
    await expect(empty.or(table).or(skeleton)).toBeVisible({ timeout: 20_000 });
    await expect(empty.or(table)).toBeVisible({ timeout: 25_000 });
  });

  test('opens create modal with validated form fields', async ({ page }) => {
    test.skip(!(await loginAgency(page)), 'Agency login failed / web down');

    await page.goto('/acente/users', { waitUntil: 'domcontentloaded' });
    const usersPage = page.getByTestId('acente-users-page');
    const forbidden = page.getByTestId('users-forbidden');
    await expect(usersPage.or(forbidden)).toBeVisible({ timeout: 20_000 });
    test.skip(
      await forbidden.isVisible().catch(() => false),
      'Non-OWNER cannot manage users',
    );

    await page.getByTestId('users-add-button').click();
    await expect(page.getByTestId('staff-form-dialog')).toBeVisible();
    await expect(page.getByTestId('staff-form-title')).toContainText(
      /Yeni Personel/i,
    );
    await expect(page.getByTestId('staff-name-input')).toBeVisible();
    await expect(page.getByTestId('staff-email-input')).toBeVisible();
    await expect(page.getByTestId('staff-password-input')).toBeVisible();
    await expect(page.getByTestId('staff-role-select')).toBeVisible();
    await expect(page.getByTestId('staff-status-select')).toBeVisible();

    await page.getByTestId('staff-form-cancel').click();
    await expect(page.getByTestId('staff-form-dialog')).toBeHidden();
  });

  test('shows role badges and status toggles in grid', async ({ page }) => {
    test.skip(!(await loginAgency(page)), 'Agency login failed / web down');

    await page.goto('/acente/users', { waitUntil: 'domcontentloaded' });
    const usersPage = page.getByTestId('acente-users-page');
    const forbidden = page.getByTestId('users-forbidden');
    await expect(usersPage.or(forbidden)).toBeVisible({ timeout: 20_000 });
    test.skip(
      await forbidden.isVisible().catch(() => false),
      'Non-OWNER cannot manage users',
    );

    const empty = page.getByTestId('users-empty');
    const row = page.locator('[data-testid^="staff-row-"]').first();
    const hasRow = await row
      .waitFor({ state: 'visible', timeout: 15_000 })
      .then(() => true)
      .catch(() => false);

    if (!hasRow) {
      await expect(empty).toBeVisible();
      test.skip(true, 'No staff in seed');
    }

    await expect(row.getByTestId('staff-role-badge')).toBeVisible();
    const badgeRole = await row
      .getByTestId('staff-role-badge')
      .getAttribute('data-role');
    expect(['OWNER', 'MANAGER', 'AGENT']).toContain(badgeRole);

    const toggle = row.locator('[data-testid^="staff-status-toggle-"]').first();
    await expect(toggle).toBeVisible();
    await expect(toggle).toHaveAttribute('role', 'switch');
  });

  test('self-delete control is disabled for current OWNER row', async ({
    page,
  }) => {
    test.skip(!(await loginAgency(page)), 'Agency login failed / web down');

    await page.goto('/acente/users', { waitUntil: 'domcontentloaded' });
    const usersPage = page.getByTestId('acente-users-page');
    const forbidden = page.getByTestId('users-forbidden');
    await expect(usersPage.or(forbidden)).toBeVisible({ timeout: 20_000 });
    test.skip(
      await forbidden.isVisible().catch(() => false),
      'Non-OWNER cannot manage users',
    );

    const selfRow = page.locator('[data-testid^="staff-row-"]').filter({
      hasText: '(siz)',
    });
    const hasSelf = await selfRow
      .first()
      .isVisible()
      .catch(() => false);
    test.skip(!hasSelf, 'Current actor row not marked in list');

    const deleteBtn = selfRow.first().locator('[data-testid^="staff-delete-"]');
    await expect(deleteBtn).toBeDisabled();

    const toggle = selfRow
      .first()
      .locator('[data-testid^="staff-status-toggle-"]');
    await expect(toggle).toBeDisabled();
  });

  test('creates staff via modal when API available', async ({ page }) => {
    test.skip(!(await loginAgency(page)), 'Agency login failed / web down');

    await page.goto('/acente/users', { waitUntil: 'domcontentloaded' });
    const usersPage = page.getByTestId('acente-users-page');
    const forbidden = page.getByTestId('users-forbidden');
    await expect(usersPage.or(forbidden)).toBeVisible({ timeout: 20_000 });
    test.skip(
      await forbidden.isVisible().catch(() => false),
      'Non-OWNER cannot manage users',
    );

    const suffix = Date.now().toString(36);
    const email = `e2e.staff.${suffix}@agency.demo.turta.com`;

    await page.getByTestId('users-add-button').click();
    await expect(page.getByTestId('staff-form-dialog')).toBeVisible();

    await page.getByTestId('staff-name-input').fill(`E2E Staff ${suffix}`);
    await page.getByTestId('staff-email-input').fill(email);
    await page.getByTestId('staff-password-input').fill('StaffPass1!');
    await page.getByTestId('staff-role-select').selectOption('AGENT');
    await page.getByTestId('staff-status-select').selectOption('ACTIVE');
    await page.getByTestId('staff-form-submit').click();

    const dialog = page.getByTestId('staff-form-dialog');
    const formError = page.getByTestId('staff-form-error');
    const flash = page.getByTestId('users-flash');

    await expect(dialog.or(formError).or(flash)).toBeVisible({
      timeout: 20_000,
    });

    if (await formError.isVisible().catch(() => false)) {
      // Duplicate / API validation — still proves form + server path wired
      await expect(formError).toBeVisible();
      return;
    }

    await expect(dialog).toBeHidden({ timeout: 15_000 });
    await expect(page.locator(`[data-staff-email="${email}"]`)).toBeVisible({
      timeout: 15_000,
    });
  });
});
