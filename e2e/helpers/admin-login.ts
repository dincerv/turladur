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
export async function loginAdmin(
  page: Page,
  emailOverride?: string,
): Promise<boolean> {
  try {
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    const email = page
      .getByTestId('login-email')
      .or(page.getByLabel(/e-posta/i));
    if (
      !(await email
        .first()
        .isVisible({ timeout: 25_000 })
        .catch(() => false))
    ) {
      return false;
    }
    await email.first().fill(emailOverride ?? E2E_ADMIN_EMAIL);
    const password = page
      .getByTestId('login-password')
      .or(page.getByLabel(/^şifre$/i));
    await password.first().fill(E2E_ADMIN_PASSWORD);
    const submit = page
      .getByTestId('login-submit')
      .or(page.getByRole('button', { name: /giriş yap/i }));
    await submit.first().click();

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
