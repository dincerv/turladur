import type { Page } from '@playwright/test';

export const E2E_BUS_EMAIL =
  process.env.E2E_BUS_EMAIL ?? 'bus01@demo.turta.com';
export const E2E_BUS_PASSWORD = process.env.E2E_BUS_PASSWORD ?? 'Demo1234!';

export function isBusAuthenticatedUrl(url: string): boolean {
  try {
    const path = new URL(url).pathname;
    if (path === '/otobus/giris' || path.startsWith('/otobus/giris/')) {
      return false;
    }
    return path === '/otobus' || path.startsWith('/otobus/');
  } catch {
    return false;
  }
}

export async function loginBus(
  page: Page,
  email = E2E_BUS_EMAIL,
  password = E2E_BUS_PASSWORD,
): Promise<boolean> {
  try {
    await page.goto('/otobus/giris', { waitUntil: 'domcontentloaded' });
    if (isBusAuthenticatedUrl(page.url())) {
      return true;
    }

    const form = page.getByTestId('otobus-login-form');
    if (!(await form.isVisible({ timeout: 15_000 }).catch(() => false))) {
      return false;
    }

    await page.getByTestId('otobus-login-email').fill(email);
    await page.getByTestId('otobus-login-password').fill(password);
    await page.getByTestId('otobus-login-submit').click();

    const deadline = Date.now() + 45_000;
    while (Date.now() < deadline) {
      if (isBusAuthenticatedUrl(page.url())) return true;
      if (
        await page
          .getByTestId('otobus-dashboard-page')
          .isVisible()
          .catch(() => false)
      ) {
        return true;
      }
      await page.waitForTimeout(250);
    }
    return isBusAuthenticatedUrl(page.url());
  } catch {
    return false;
  }
}
