import { test, expect } from '@playwright/test';

import { loginAdmin } from './helpers/admin-login';

/**
 * Soft-live admin smoke — dashboard + pending tours + partner queue.
 * If a PENDING_REVIEW tour exists, publishes it; otherwise empty state OK.
 */

test.describe('Admin — onay kuyrukları', () => {
  test('login, dashboard, tours queue, partners list', async ({ page }) => {
    test.skip(!(await loginAdmin(page)), 'Admin login failed — seed DB?');

    await page.goto('/admin/dashboard', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('admin-dashboard-page')).toBeVisible({
      timeout: 25_000,
    });

    await page.goto('/admin/tours', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('admin-tours-page')).toBeVisible({
      timeout: 20_000,
    });
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

    await page.goto('/admin/agencies', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('admin-agencies-page')).toBeVisible({
      timeout: 20_000,
    });
    await page.getByTestId('admin-partner-filter-ALL').click();
    await expect(page.getByTestId('admin-partners-list')).toBeVisible();
    const partnerCount = Number(
      (await page
        .getByTestId('admin-partners-list')
        .getAttribute('data-count')) ?? '0',
    );
    // Seed agencies/partners should appear; empty only if wipe without seed
    if (partnerCount === 0) {
      await expect(page.getByTestId('admin-partners-empty')).toBeVisible();
      test.skip(true, 'No partners in admin list — seed incomplete');
    }
    await expect(
      page.locator('[data-testid^="admin-partner-row-"]').first(),
    ).toBeVisible();
  });
});
