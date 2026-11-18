import type { Page } from '@playwright/test';

export const E2E_ADMIN_EMAIL =
  process.env.E2E_ADMIN_EMAIL ?? 'admin01@demo.turta.com';
export const E2E_ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? 'Demo1234!';

export function isAdminAuthenticatedUrl(url: string): boolean {
  try {
    const path = new URL(url).pathname;
    return path === '/admin' || path.startsWith('/admin/');
  } catch {
    return false;
  }
}

/** Login via /login → /admin/dashboard. Returns false when seed/web down. */
export async function loginAdmin(page: Page): Promise<boolean> {
  try {
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    const email = page.getByTestId('login-email');
    if (!(await email.isVisible({ timeout: 15_000 }).catch(() => false))) {
      return false;
    }
    await email.fill(E2E_ADMIN_EMAIL);
    await page.getByTestId('login-password').fill(E2E_ADMIN_PASSWORD);
    await page.getByTestId('login-submit').click();

    const deadline = Date.now() + 45_000;
    while (Date.now() < deadline) {
      if (isAdminAuthenticatedUrl(page.url())) {
        return true;
      }
      if (
        await page
          .getByTestId('admin-dashboard-page')
          .isVisible()
          .catch(() => false)
      ) {
        return true;
      }
      await page.waitForTimeout(250);
    }
    return isAdminAuthenticatedUrl(page.url());
  } catch {
    return false;
  }
}
