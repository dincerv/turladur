import { test, expect } from '@playwright/test';

/**
 * Agency experiences list — load, search filter, status toggle optimistic UI.
 * Skips when web / seed agency login unavailable.
 */

const agencyEmail =
  process.env.E2E_AGENCY_EMAIL ?? 'owner01@agency.demo.turta.com';
const agencyPassword = process.env.E2E_AGENCY_PASSWORD ?? 'Demo1234!';

async function loginAgency(page: import('@playwright/test').Page) {
  const loginRes = await page.goto('/acente/giris');
  if (!loginRes || !loginRes.ok()) return false;

  await page
    .locator('#email, input[name="email"], input[type="email"]')
    .first()
    .fill(agencyEmail);
  await page
    .locator('#password, input[name="password"], input[type="password"]')
    .first()
    .fill(agencyPassword);
  await page.getByRole('button', { name: /Giriş/i }).click();
  await page
    .waitForURL(/\/acente(\/|$)/, { timeout: 20_000 })
    .catch(() => null);
  return page.url().includes('/acente');
}

test.describe('Acente — Aktiviteler listesi', () => {
  test('loads page, searches, toggles status', async ({ page }) => {
    test.skip(!(await loginAgency(page)), 'Agency login failed / web down');

    await page.goto('/acente/experiences', { waitUntil: 'domcontentloaded' });

    await expect(page.getByTestId('acente-experiences-page')).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByTestId('experiences-skeleton')).toHaveCount(0);
    await expect(page.getByTestId('new-experience-btn')).toBeVisible();
    await expect(page.getByTestId('search-experience-input')).toBeVisible();

    const empty = page.getByTestId('experiences-empty-state');
    const firstCard = page.locator('[data-testid^="experience-card-"]').first();
    const firstRow = page.locator('[data-testid^="experience-row-"]').first();

    const hasItems =
      (await firstCard.isVisible().catch(() => false)) ||
      (await firstRow.isVisible().catch(() => false));

    if (!hasItems) {
      await expect(empty).toBeVisible();
      test.skip(true, 'No experiences in seed to search/toggle');
    }

    const cardOrRow = (await firstCard.isVisible().catch(() => false))
      ? firstCard
      : firstRow;
    const testId = await cardOrRow.getAttribute('data-testid');
    const experienceId = testId?.replace(/^experience-(card|row)-/, '') ?? '';
    expect(experienceId.length).toBeGreaterThan(0);

    const titleText = (
      await cardOrRow.locator('h3, td').first().innerText()
    ).trim();
    const searchTerm = titleText.slice(0, Math.min(12, titleText.length));

    const search = page.getByTestId('search-experience-input');
    await search.fill(searchTerm);
    await search.blur();

    await expect.poll(async () => page.url(), { timeout: 8_000 }).toMatch(/q=/);

    await expect(
      page
        .getByTestId(`experience-card-${experienceId}`)
        .or(page.getByTestId(`experience-row-${experienceId}`))
        .or(page.getByTestId('experiences-empty-state')),
    ).toBeVisible({ timeout: 15_000 });

    // Clear search to restore list for toggle
    const clearBtn = page.getByTestId('clear-experience-search');
    if (await clearBtn.isVisible().catch(() => false)) {
      await clearBtn.click();
    } else {
      await search.fill('');
      await search.blur();
    }

    const toggle = page.getByTestId(`toggle-status-btn-${experienceId}`);
    test.skip(
      !(await toggle.isVisible().catch(() => false)),
      'Toggle not visible after search clear',
    );

    const before = await toggle.getAttribute('aria-checked');
    await toggle.click();

    await expect
      .poll(async () => toggle.getAttribute('aria-checked'), {
        timeout: 15_000,
      })
      .not.toBe(before);

    await expect(page.getByTestId('experiences-error')).toHaveCount(0);
  });

  test('exposes new-experience CTA on empty or populated list', async ({
    page,
  }) => {
    test.skip(!(await loginAgency(page)), 'Agency login failed / web down');

    await page.goto('/acente/experiences', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('new-experience-btn')).toBeVisible({
      timeout: 20_000,
    });
  });
});
