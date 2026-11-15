import { defineConfig, devices } from '@playwright/test';

const apiBase = process.env.API_URL ?? 'http://localhost:4000/api/v1';
const webBase = process.env.WEB_URL ?? 'http://localhost:3001';

/**
 * Agency JWT lives in memory; only HttpOnly refresh cookie persists.
 * Rotating refresh tokens invalidate Playwright storageState mid-suite,
 * so agency specs login per test (throttle raised to 60/min).
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  timeout: 90_000,
  reporter: 'list',
  use: {
    baseURL: webBase,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium-agency',
      testMatch: /.*\.spec\.ts/,
      testIgnore: /critical-flow\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'chromium',
      testMatch: /critical-flow\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  metadata: { apiBase },
});
