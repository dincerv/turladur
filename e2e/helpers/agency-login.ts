import type { Page } from '@playwright/test';

export const E2E_AGENCY_EMAIL =
  process.env.E2E_AGENCY_EMAIL ?? 'owner01@agency.demo.turta.com';
export const E2E_AGENCY_PASSWORD =
  process.env.E2E_AGENCY_PASSWORD ?? 'Demo1234!';

/** True only after leaving the login route for the agency panel. */
export function isAgencyAuthenticatedUrl(url: string): boolean {
  try {
    const path = new URL(url).pathname;
    if (path === '/acente/giris' || path.startsWith('/acente/giris/')) {
      return false;
    }
    return path === '/acente' || path.startsWith('/acente/');
  } catch {
    return false;
  }
}

export async function waitForAgencyShell(
  page: Page,
  timeoutMs = 45_000,
): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (
      await page
        .getByTestId('agency-shell')
        .isVisible()
        .catch(() => false)
    ) {
      return true;
    }
    if (
      await page
        .getByTestId('agency-shell-denied')
        .isVisible()
        .catch(() => false)
    ) {
      return false;
    }
    await page.waitForTimeout(250);
  }
  return page
    .getByTestId('agency-shell')
    .isVisible()
    .catch(() => false);
}

async function waitForLoginFormHydrated(page: Page): Promise<boolean> {
  try {
    await page.waitForSelector(
      '[data-testid="acente-login-form"][data-ready="true"]',
      { timeout: 20_000 },
    );
    return true;
  } catch {
    return false;
  }
}

async function loginAgencyOnce(page: Page): Promise<boolean> {
  await page.goto('/acente/giris', { waitUntil: 'domcontentloaded' });

  // Existing refresh cookie → soft redirect off /giris
  if (isAgencyAuthenticatedUrl(page.url())) {
    return waitForAgencyShell(page);
  }

  const hydrated = await waitForLoginFormHydrated(page);
  if (isAgencyAuthenticatedUrl(page.url())) {
    return waitForAgencyShell(page);
  }
  if (!hydrated) return false;

  try {
    await page
      .locator('#acente-email')
      .fill(E2E_AGENCY_EMAIL, { timeout: 10_000 });
    await page
      .locator('#acente-password')
      .fill(E2E_AGENCY_PASSWORD, { timeout: 10_000 });
  } catch {
    // Detached by soft redirect while filling
    if (isAgencyAuthenticatedUrl(page.url())) {
      return waitForAgencyShell(page);
    }
    return false;
  }

  await Promise.all([
    page
      .waitForURL((url) => isAgencyAuthenticatedUrl(url.toString()), {
        timeout: 20_000,
        waitUntil: 'domcontentloaded',
      })
      .catch(() => null),
    page.getByRole('button', { name: /^Giriş Yap$/i }).click(),
  ]);

  if (page.url().includes('password=')) return false;
  if (!isAgencyAuthenticatedUrl(page.url())) return false;
  return waitForAgencyShell(page, 20_000);
}

/**
 * Full agency-staff login each test (refresh tokens rotate; storageState breaks).
 */
export async function loginAgency(page: Page): Promise<boolean> {
  if (await loginAgencyOnce(page)) return true;
  await page.waitForTimeout(1_000);
  return loginAgencyOnce(page);
}
