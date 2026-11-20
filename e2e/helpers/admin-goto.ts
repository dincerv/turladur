import type { Page } from '@playwright/test';

import { loginAdmin } from './admin-login';

/** Full navigation remounts the app — wait for refresh-cookie bootstrap. */
export async function gotoAdmin(
  page: Page,
  path: string,
  testId: string,
): Promise<boolean> {
  await page.goto(path, { waitUntil: 'domcontentloaded' });

  const target = page.getByTestId(testId);
  const loginForm = page.getByTestId('login-email');

  const deadline = Date.now() + 45_000;
  while (Date.now() < deadline) {
    if (await target.isVisible().catch(() => false)) return true;
    if (await loginForm.isVisible().catch(() => false)) {
      if (!(await loginAdmin(page))) return false;
      await page.goto(path, { waitUntil: 'domcontentloaded' });
      continue;
    }
    await page.waitForTimeout(300);
  }
  return target.isVisible().catch(() => false);
}
