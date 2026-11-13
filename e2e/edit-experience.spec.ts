import { test, expect } from '@playwright/test';

/**
 * Agency experience edit — prefill, change field, save success toast.
 * Skips when web / agency login / seed unavailable.
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

test.describe('Acente — Deneyim düzenle', () => {
  test('prefills form, edits title, saves success toast', async ({ page }) => {
    test.skip(!(await loginAgency(page)), 'Agency login failed / web down');

    await page.goto('/acente/experiences', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('acente-experiences-page')).toBeVisible({
      timeout: 20_000,
    });

    const editLink = page
      .locator('[data-testid^="edit-experience-btn-"]')
      .first();
    test.skip(
      !(await editLink.isVisible().catch(() => false)),
      'No experience edit button',
    );
    await editLink.click();

    await expect(page.getByTestId('acente-experience-edit-page')).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByTestId('edit-experience-skeleton')).toHaveCount(0);

    const title = page.getByTestId('edit-experience-title');
    await expect(title).toBeVisible();
    const original = await title.inputValue();
    expect(original.length).toBeGreaterThan(0);

    const nextTitle =
      `${original.replace(/\s*\[E2E.*?\]$/, '').trim()} [E2E ${Date.now()}]`.slice(
        0,
        100,
      );
    await title.fill(nextTitle);
    await expect(page.getByTestId('edit-experience-dirty')).toBeVisible();

    // Advance to media step then save
    await page.getByTestId('edit-experience-next-btn').click();
    await expect(page.getByTestId('edit-experience-included')).toBeVisible({
      timeout: 10_000,
    });
    await page.getByTestId('edit-experience-next-btn').click();

    const saveBtn = page.getByTestId('save-experience-btn');
    await expect(saveBtn).toBeVisible({ timeout: 10_000 });
    await saveBtn.click();

    await expect(page.getByTestId('save-experience-success-toast')).toBeVisible(
      {
        timeout: 45_000,
      },
    );
    await expect(
      page.getByTestId('save-experience-success-toast'),
    ).toContainText(/başarıyla güncellendi/i);
  });

  test('foreign id shows forbidden', async ({ page }) => {
    test.skip(!(await loginAgency(page)), 'Agency login failed / web down');

    await page.goto('/acente/experiences/not-an-owned-experience/edit', {
      waitUntil: 'domcontentloaded',
    });

    await expect(
      page
        .getByTestId('edit-experience-forbidden')
        .or(page.getByTestId('edit-experience-error')),
    ).toBeVisible({ timeout: 15_000 });
  });
});
