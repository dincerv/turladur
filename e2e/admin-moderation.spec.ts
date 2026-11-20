import { test, expect } from '@playwright/test';

import { loginAdmin } from './helpers/admin-login';

/**
 * Admin moderation + auth negative checks.
 */

test.describe('Admin — yetkisiz erişim', () => {
  test('unauthenticated /admin redirects to login', async ({ page }) => {
    await page.goto('/admin/dashboard', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/login/, { timeout: 20_000 });
  });
});

test.describe('Admin — dashboard ve moderasyon', () => {
  test('dashboard metrics + partner reject with note', async ({ page }) => {
    test.skip(!(await loginAdmin(page)), 'Admin login failed — seed DB?');

    await page.goto('/admin/dashboard', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('admin-dashboard-page')).toBeVisible({
      timeout: 25_000,
    });
    await expect(page.getByTestId('admin-stat-partners-pending')).toBeVisible();
    await expect(page.getByTestId('admin-stat-tours-pending')).toBeVisible();

    await page.goto('/admin/agencies', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('admin-agencies-page')).toBeVisible();
    await page.getByTestId('admin-partner-filter-ALL').click();

    const row = page.locator('[data-testid^="admin-partner-row-"]').first();
    if (!(await row.isVisible().catch(() => false))) {
      test.skip(true, 'No partners to moderate');
    }

    const testId = await row.getAttribute('data-testid');
    const id = testId?.replace('admin-partner-row-', '') ?? '';
    expect(id.length).toBeGreaterThan(0);

    const status = (await row.getAttribute('data-status')) ?? '';
    if (status === 'REJECTED') {
      // Re-approve then reject again for deterministic flow
      page.once('dialog', (d) => d.accept());
      await page.getByTestId(`admin-partner-approve-${id}`).click();
      await expect(page.getByTestId('admin-partner-success')).toBeVisible({
        timeout: 15_000,
      });
    }

    await page.getByTestId(`admin-partner-reject-${id}`).click();
    await expect(page.getByTestId('admin-moderation-dialog')).toBeVisible();
    await page.getByTestId('admin-moderation-note').fill('E2E red gerekçesi');
    await page.getByTestId('admin-moderation-confirm').click();
    await expect(page.getByTestId('admin-partner-success')).toContainText(
      /reddedildi/i,
      { timeout: 20_000 },
    );

    // Restore: approve again so seed stays usable
    await page.getByTestId('admin-partner-filter-ALL').click();
    const rejectBtn = page.getByTestId(`admin-partner-reject-${id}`);
    if (await rejectBtn.isVisible().catch(() => false)) {
      // still rejectable → not rejected; skip restore
    } else {
      page.once('dialog', (d) => d.accept());
      await page.getByTestId(`admin-partner-approve-${id}`).click();
      await expect(page.getByTestId('admin-partner-success')).toContainText(
        /onaylandı/i,
        { timeout: 20_000 },
      );
    }
  });

  test('reviews list loads', async ({ page }) => {
    test.skip(!(await loginAdmin(page)), 'Admin login failed — seed DB?');
    await page.goto('/admin/reviews', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('admin-reviews-page')).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByTestId('admin-reviews-list')).toBeVisible();
  });
});
