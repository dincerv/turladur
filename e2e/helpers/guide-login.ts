import type { Page } from '@playwright/test';

export function isGuideAuthenticatedUrl(url: string): boolean {
  try {
    const path = new URL(url).pathname;
    if (path === '/rehber/giris' || path.startsWith('/rehber/giris/')) {
      return false;
    }
    if (path === '/rehber/kayit' || path.startsWith('/rehber/kayit/')) {
      return false;
    }
    return path === '/rehber' || path.startsWith('/rehber/');
  } catch {
    return false;
  }
}

export async function loginGuide(
  page: Page,
  email: string,
  password: string,
): Promise<boolean> {
  try {
    await page.goto('/rehber/giris', { waitUntil: 'domcontentloaded' });
    if (isGuideAuthenticatedUrl(page.url())) {
      return true;
    }

    const form = page.getByTestId('rehber-login-form');
    if (!(await form.isVisible({ timeout: 15_000 }).catch(() => false))) {
      return false;
    }

    await page.getByTestId('rehber-login-email').fill(email);
    await page.getByTestId('rehber-login-password').fill(password);
    await page.getByTestId('rehber-login-submit').click();

    const deadline = Date.now() + 45_000;
    while (Date.now() < deadline) {
      if (isGuideAuthenticatedUrl(page.url())) return true;
      if (
        await page
          .getByTestId('rehber-dashboard-page')
          .isVisible()
          .catch(() => false)
      ) {
        return true;
      }
      await page.waitForTimeout(250);
    }
    return isGuideAuthenticatedUrl(page.url());
  } catch {
    return false;
  }
}
