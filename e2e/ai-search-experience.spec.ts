import { test, expect } from '@playwright/test';

const apiBase = process.env.API_URL ?? 'http://localhost:4000/api/v1';

test.describe('AI search experience', () => {
  test('types a prompt, renders AI result, opens compare from compact action', async ({
    page,
    request,
  }) => {
    const health = await request.get(`${apiBase}/health`);
    test.skip(!health.ok(), 'API not running');

    const probe = await request.post(`${apiBase}/catalog/tours/ai-search`, {
      data: {
        prompt: 'Karadeniz yayla turu öner',
      },
    });
    test.skip(!probe.ok(), 'AI search endpoint unavailable');
    const probeBody = (await probe.json()) as {
      data?: { tours?: unknown[] };
    };
    test.skip(
      !Array.isArray(probeBody.data?.tours) || probeBody.data.tours.length < 2,
      'Need at least 2 AI search hits in catalog',
    );

    await page.goto('/tours');
    await expect(page.getByTestId('ai-search-input')).toBeVisible({
      timeout: 30_000,
    });

    await page.getByTestId('ai-search-input').fill('Karadeniz yayla turu öner');
    await page.getByTestId('ai-search-submit-btn').click();

    await expect(page.getByTestId('ai-search-panel')).toBeVisible();
    await expect(page.getByTestId('ai-search-result')).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByTestId('ai-search-summary')).toBeVisible();

    const tourCards = page.locator('[data-testid^="ai-search-tour-"]');
    await expect(tourCards.first()).toBeVisible({ timeout: 15_000 });
    const tourCount = await tourCards.count();
    test.skip(tourCount < 2, 'Need at least 2 AI search hits for compare');

    await page.getByTestId('compact-compare-btn').click();
    await expect(page.getByTestId('compare-modal')).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByTestId('compare-matrix')).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(page.getByTestId('compare-modal')).toBeHidden();
  });

  test('quick prompt chip fills and searches', async ({ page, request }) => {
    const health = await request.get(`${apiBase}/health`);
    test.skip(!health.ok(), 'API not running');

    await page.goto('/tours');
    await expect(
      page.getByTestId('quick-prompt-chip-karadeniz-3n'),
    ).toBeVisible({ timeout: 30_000 });

    await page.getByTestId('quick-prompt-chip-karadeniz-3n').click();
    await expect(page.getByTestId('ai-search-input')).toHaveValue(/Karadeniz/i);
    await expect(page.getByTestId('ai-search-panel')).toBeVisible();
    await expect(page.getByTestId('ai-search-result')).toBeVisible({
      timeout: 20_000,
    });
  });

  test('AI search API rejects oversized prompts', async ({ request }) => {
    const health = await request.get(`${apiBase}/health`);
    test.skip(!health.ok(), 'API not running');

    const response = await request.post(`${apiBase}/catalog/tours/ai-search`, {
      data: { prompt: 'x'.repeat(600) },
    });
    expect(response.status()).toBeGreaterThanOrEqual(400);
    expect(response.ok()).toBeFalsy();
  });
});
