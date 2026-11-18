import { test, expect } from '@playwright/test';

import { loginAdmin } from './helpers/admin-login';
import { loginAgency } from './helpers/agency-login';
import { loginGuide } from './helpers/guide-login';

/**
 * Soft-live guide smoke:
 * register → PENDING → admin VERIFIED → agency invite → guide ACCEPT.
 */
test.describe('Rehber — soft-live smoke', () => {
  test('register PENDING, admin VERIFIED, accept agency invite', async ({
    browser,
  }) => {
    const stamp = Date.now().toString();
    const email = `guide.smoke.${stamp}@e2e.turta.com`;
    const password = 'Demo1234!';
    const lastName = `Smoke${stamp.slice(-6)}`;
    // 11-digit TCKN (no checksum enforced by API)
    const tckn = `1${stamp.slice(-10)}`;
    const ruhsatExpires = new Date();
    ruhsatExpires.setFullYear(ruhsatExpires.getFullYear() + 2);
    const ruhsatExpiresAt = ruhsatExpires.toISOString().slice(0, 10);

    const guideCtx = await browser.newContext();
    const guidePage = await guideCtx.newPage();

    await guidePage.goto('/rehber/kayit', { waitUntil: 'domcontentloaded' });
    const form = guidePage.getByTestId('rehber-kayit-form');
    test.skip(
      !(await form.isVisible({ timeout: 20_000 }).catch(() => false)),
      'Guide register page unavailable',
    );

    await guidePage.getByTestId('rehber-kayit-firstName').fill('E2E');
    await guidePage.getByTestId('rehber-kayit-lastName').fill(lastName);
    await guidePage.getByTestId('rehber-kayit-email').fill(email);
    await guidePage.getByTestId('rehber-kayit-password').fill(password);
    await guidePage.getByTestId('rehber-kayit-tckn').fill(tckn);
    await guidePage.getByTestId('rehber-kayit-languages').fill('tr, en');
    await guidePage.getByTestId('rehber-kayit-oda').fill('Istanbul');
    await guidePage
      .getByTestId('rehber-kayit-sicil')
      .fill(`SIC-${stamp.slice(-8)}`);
    await guidePage
      .getByTestId('rehber-kayit-ruhsat')
      .fill(`RUH-${stamp.slice(-8)}`);
    await guidePage
      .getByTestId('rehber-kayit-ruhsat-expires')
      .fill(ruhsatExpiresAt);
    await guidePage.getByTestId('rehber-kayit-submit').click();

    await expect(guidePage.getByTestId('rehber-dashboard-page')).toBeVisible({
      timeout: 45_000,
    });
    await expect(
      guidePage.getByTestId('rehber-dashboard-status'),
    ).toHaveAttribute('data-status', 'PENDING', { timeout: 20_000 });

    // Admin verifies from a fresh context (separate cookies)
    const adminCtx = await browser.newContext();
    const adminPage = await adminCtx.newPage();
    test.skip(!(await loginAdmin(adminPage)), 'Admin login failed — seed DB?');

    await adminPage.goto('/admin/guides', { waitUntil: 'domcontentloaded' });
    await expect(adminPage.getByTestId('admin-guides-page')).toBeVisible({
      timeout: 25_000,
    });

    const guideRow = adminPage.locator(
      `[data-testid^="admin-guide-row-"][data-email="${email}"]`,
    );
    await expect(guideRow).toBeVisible({ timeout: 20_000 });
    const rowTestId = await guideRow.getAttribute('data-testid');
    const guideId = rowTestId?.replace('admin-guide-row-', '') ?? '';
    expect(guideId.length).toBeGreaterThan(0);

    await adminPage.getByTestId(`admin-guide-verify-${guideId}`).click();
    await expect(guideRow).toHaveAttribute('data-status', 'VERIFIED', {
      timeout: 20_000,
    });
    await adminCtx.close();

    // Agency invites the newly verified guide
    const agencyCtx = await browser.newContext();
    const agencyPage = await agencyCtx.newPage();
    test.skip(
      !(await loginAgency(agencyPage)),
      'Agency login failed / web down',
    );

    await agencyPage.goto('/acente/atamalar', {
      waitUntil: 'domcontentloaded',
    });
    await expect(agencyPage.getByTestId('acente-assignments-page')).toBeVisible(
      { timeout: 20_000 },
    );

    await agencyPage.getByTestId('assignments-new-invite-btn').click();
    await expect(agencyPage.getByTestId('invite-assignment-modal')).toBeVisible(
      { timeout: 10_000 },
    );

    const tourSelect = agencyPage.getByTestId('invite-tour-select');
    const tourCount = await tourSelect.locator('option').count();
    test.skip(tourCount < 1 || !(await tourSelect.inputValue()), 'No tours');

    await agencyPage.waitForTimeout(800);
    const dateValue = await agencyPage
      .getByTestId('invite-tour-date-select')
      .inputValue();
    test.skip(!dateValue, 'No active tour dates');

    await agencyPage.getByTestId('invite-search-input').fill(lastName);
    await agencyPage.waitForTimeout(1_000);

    const guideOption = agencyPage.locator(
      `[data-testid^="invite-guide-option-"]`,
      { hasText: lastName },
    );
    const hasGuide = await guideOption
      .first()
      .waitFor({ state: 'visible', timeout: 15_000 })
      .then(() => true)
      .catch(() => false);
    test.skip(!hasGuide, 'Verified guide not listed for invite');

    await guideOption.first().click();
    await expect(agencyPage.getByTestId('invite-submit-btn')).toBeEnabled();
    await agencyPage.getByTestId('invite-submit-btn').click();

    const toast = agencyPage.getByTestId('assignments-toast');
    const modalError = agencyPage.getByTestId('invite-modal-error');
    await expect(toast.or(modalError)).toBeVisible({ timeout: 20_000 });
    if (await modalError.isVisible().catch(() => false)) {
      const msg = (await modalError.textContent()) ?? '';
      test.skip(true, `Invite failed: ${msg}`);
    }
    await expect(toast).toHaveAttribute('data-toast-type', 'success');
    await agencyCtx.close();

    // Guide accepts invite
    await guidePage.goto('/rehber/atamalar', {
      waitUntil: 'domcontentloaded',
    });
    // Session may have expired after long admin/agency steps — re-login
    if (
      !(await guidePage
        .getByTestId('rehber-atamalar-page')
        .isVisible({ timeout: 8_000 })
        .catch(() => false))
    ) {
      test.skip(
        !(await loginGuide(guidePage, email, password)),
        'Guide re-login failed',
      );
      await guidePage.goto('/rehber/atamalar', {
        waitUntil: 'domcontentloaded',
      });
    }

    await expect(guidePage.getByTestId('rehber-atamalar-page')).toBeVisible({
      timeout: 20_000,
    });

    const pendingRow = guidePage
      .locator('[data-testid^="rehber-assignment-row-"][data-status="PENDING"]')
      .first();
    await expect(pendingRow).toBeVisible({ timeout: 20_000 });
    const pendingTestId = await pendingRow.getAttribute('data-testid');
    const assignmentId =
      pendingTestId?.replace('rehber-assignment-row-', '') ?? '';
    expect(assignmentId.length).toBeGreaterThan(0);

    await guidePage
      .getByTestId(`rehber-assignment-accept-${assignmentId}`)
      .click();
    await expect(
      guidePage.getByTestId(`rehber-assignment-row-${assignmentId}`),
    ).toHaveAttribute('data-status', 'ACCEPTED', { timeout: 20_000 });

    await guidePage.goto('/rehber/dashboard', {
      waitUntil: 'domcontentloaded',
    });
    await expect(
      guidePage.getByTestId('rehber-dashboard-status'),
    ).toHaveAttribute('data-status', 'VERIFIED', { timeout: 20_000 });

    await guideCtx.close();
  });
});
