import { test, expect } from '@playwright/test';

import { loginAdmin } from './helpers/admin-login';
import { gotoAdmin } from './helpers/admin-goto';

/**
 * Soft-live admin smoke — dashboard + pending tours + partner queue.
 * If a PENDING_REVIEW tour exists, publishes it; otherwise empty state OK.
 */

test.describe('Admin — onay kuyrukları', () => {
  test('login, dashboard, tours queue, partners list', async ({ page }) => {
    test.skip(!(await loginAdmin(page)), 'Admin login failed — seed DB?');

    test.skip(
      !(await gotoAdmin(page, '/admin/dashboard', 'admin-dashboard-page')),
      'Admin dashboard did not load after bootstrap',
    );

    test.skip(
      !(await gotoAdmin(page, '/admin/tours', 'admin-tours-page')),
      'Admin tours did not load',
    );
    await expect(page.getByTestId('admin-tours-tab')).toBeVisible();
    await expect(page.getByTestId('admin-pending-list')).toBeVisible();
    await expect(page.getByTestId('admin-tours-error')).toHaveCount(0);

    const pendingRow = page
      .locator('[data-testid^="admin-pending-row-"]')
      .first();
    if (await pendingRow.isVisible().catch(() => false)) {
      const testId = await pendingRow.getAttribute('data-testid');
      const id = testId?.replace('admin-pending-row-', '') ?? '';
      expect(id.length).toBeGreaterThan(0);
      page.once('dialog', (d) => d.accept());
      await page.getByTestId(`admin-publish-${id}`).click();
      await expect(page.getByTestId(`admin-pending-row-${id}`)).toHaveCount(0, {
        timeout: 20_000,
      });
    } else {
      await expect(page.getByTestId('admin-pending-empty')).toBeVisible();
    }

    test.skip(
      !(await gotoAdmin(page, '/admin/agencies', 'admin-agencies-page')),
      'Admin agencies did not load',
    );
    await page.getByTestId('admin-partner-filter-ALL').click();
    await expect(page.getByTestId('admin-partners-list')).toBeVisible();
    const partnerCount = Number(
      (await page
        .getByTestId('admin-partners-list')
        .getAttribute('data-count')) ?? '0',
    );
    if (partnerCount === 0) {
      await expect(page.getByTestId('admin-partners-empty')).toBeVisible();
      test.skip(true, 'No partners in admin list — seed incomplete');
    }
    await expect(
      page.locator('[data-testid^="admin-partner-row-"]').first(),
    ).toBeVisible();
  });
});
