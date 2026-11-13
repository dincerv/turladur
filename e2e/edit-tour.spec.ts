import { test, expect } from '@playwright/test';

/**
 * Agency tour edit — prefill, dirty field change, save + success toast.
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

test.describe('Acente — Tur düzenle', () => {
  test('prefills form, edits title, saves and shows success toast', async ({
    page,
  }) => {
    test.skip(!(await loginAgency(page)), 'Agency login failed / web down');

    await page.goto('/acente/tours', { waitUntil: 'domcontentloaded' });

    // Prefer detail → edit for stable ownership path.
    const detailLink = page.getByRole('link', { name: /Detaylar/i }).first();
    const listEditBtn = page.getByRole('button', { name: /Düzenle/i }).first();

    if (await detailLink.isVisible().catch(() => false)) {
      await detailLink.click();
      await expect(page.getByTestId('acente-tour-detail-page')).toBeVisible({
        timeout: 15_000,
      });
      await page.getByTestId('edit-tour-btn').click();
    } else if (await listEditBtn.isVisible().catch(() => false)) {
      await listEditBtn.click();
    } else {
      test.skip(true, 'No owned tour to edit');
    }

    await expect(page.getByTestId('acente-tour-edit-page')).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByTestId('edit-tour-skeleton')).toHaveCount(0);

    const titleInput = page.getByTestId('edit-tour-title');
    await expect(titleInput).toBeVisible();
    const original = await titleInput.inputValue();
    expect(original.length).toBeGreaterThan(0);

    const nextTitle =
      `${original.replace(/\s*\[E2E.*?\]$/, '').trim()} [E2E ${Date.now()}]`.slice(
        0,
        100,
      );
    await titleInput.fill(nextTitle);
    await expect(page.getByTestId('dirty-indicator')).toBeVisible();

    // Advance to details step (sidebar or footer next).
    await page
      .getByTestId('edit-step-next-btn')
      .or(page.getByTestId('step-1-next-btn'))
      .first()
      .click();

    const saveBtn = page.getByTestId('save-tour-btn').first();
    await expect(saveBtn).toBeVisible({ timeout: 15_000 });
    await expect(saveBtn).toBeEnabled();
    await saveBtn.click();

    await expect(page.getByTestId('save-success-toast')).toBeVisible({
      timeout: 45_000,
    });
    await expect(page.getByTestId('save-success-toast')).toContainText(
      /başarıyla güncellendi/i,
    );
  });

  test('foreign tour id shows forbidden state', async ({ page }) => {
    test.skip(!(await loginAgency(page)), 'Agency login failed / web down');

    await page.goto('/acente/tours/not-an-owned-tour-id/edit', {
      waitUntil: 'domcontentloaded',
    });

    await expect(
      page
        .getByTestId('edit-tour-forbidden')
        .or(page.getByTestId('edit-tour-error')),
    ).toBeVisible({ timeout: 15_000 });
  });
});
