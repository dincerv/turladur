import { test as setup, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

import {
  E2E_AGENCY_EMAIL,
  E2E_AGENCY_PASSWORD,
  isAgencyAuthenticatedUrl,
  waitForAgencyShell,
} from './helpers/agency-login';

const authDir = path.join(__dirname, '.auth');
const authFile = path.join(authDir, 'agency.json');

setup('agency staff authenticate', async ({ page }) => {
  fs.mkdirSync(authDir, { recursive: true });

  await page.goto('/acente/giris');
  await page
    .locator('#email, input[name="email"], input[type="email"]')
    .first()
    .fill(E2E_AGENCY_EMAIL);
  await page
    .locator('#password, input[name="password"], input[type="password"]')
    .first()
    .fill(E2E_AGENCY_PASSWORD);
  await Promise.all([
    page.waitForURL((url) => isAgencyAuthenticatedUrl(url.toString()), {
      timeout: 45_000,
      waitUntil: 'domcontentloaded',
    }),
    page.getByRole('button', { name: /Giriş Yap|Giriş/i }).click(),
  ]);
  expect(isAgencyAuthenticatedUrl(page.url())).toBeTruthy();
  expect(await waitForAgencyShell(page, 45_000)).toBeTruthy();
  await page.context().storageState({ path: authFile });
});
