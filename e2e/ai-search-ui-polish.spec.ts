import { test, expect } from '@playwright/test';

async function openTurtaPanel(page: import('@playwright/test').Page) {
  await expect(page.getByTestId('home-hero-turta-ask')).toBeVisible();
  await page.getByTestId('home-hero-turta-ask').click();
  const dock = page.getByTestId('ai-search-scroll-dock');
  try {
    await expect(dock).toBeVisible({ timeout: 3_000 });
  } catch {
    await page.evaluate(() => {
      window.dispatchEvent(new Event('turta:open-ai-search'));
    });
    await expect(dock).toBeVisible({ timeout: 10_000 });
  }
}

test.describe('Turta AI search UI polish', () => {
  test('single X, backdrop, unified card, clean empty state', async ({
    page,
  }) => {
    test.setTimeout(90_000);
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/', { waitUntil: 'networkidle' });

    await expect(page.getByTestId('home-hero')).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByTestId('bottom-chrome-stack')).toBeAttached({
      timeout: 30_000,
    });

    await openTurtaPanel(page);

    const panel = page.getByTestId('ai-search-panel');
    await expect(panel).toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId('ai-search-backdrop')).toBeVisible();

    // Only the in-header close control
    await expect(page.getByTestId('ai-search-bubble-close')).toHaveCount(0);
    await expect(page.getByTestId('ai-search-close-btn')).toHaveCount(1);

    // No empty-state example line; chips sit above the composer
    await expect(
      page.getByText(/Örn\.\s*"?Ankara'dan 3 gece Karadeniz/i),
    ).toHaveCount(0);
    await expect(page.getByTestId('ai-search-quick-prompts')).toBeVisible();
    await expect(
      page.getByTestId('quick-prompt-chip-karadeniz-3n'),
    ).toBeVisible();

    // Unified card: composer lives inside the panel
    await expect(panel.getByTestId('ai-search-dock')).toBeVisible();
    await expect(panel.getByTestId('ai-search-input')).toBeVisible();

    const bg = await panel.evaluate(
      (el) => getComputedStyle(el).backgroundColor,
    );
    expect(bg).toMatch(/rgb\(255,\s*255,\s*255\)/);

    const inputBox = page.getByTestId('ai-search-input');
    const submit = page.getByTestId('ai-search-submit-btn');
    const inputMid = await inputBox.evaluate((el) => {
      const r = el.getBoundingClientRect();
      return r.top + r.height / 2;
    });
    const submitMid = await submit.evaluate((el) => {
      const r = el.getBoundingClientRect();
      return r.top + r.height / 2;
    });
    expect(Math.abs(inputMid - submitMid)).toBeLessThan(6);

    await page.getByTestId('ai-search-backdrop').click({
      position: { x: 40, y: 320 },
    });
    await expect(panel).toHaveCount(0);

    await openTurtaPanel(page);
    await expect(page.getByTestId('ai-search-panel')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('ai-search-panel')).toHaveCount(0);

    await openTurtaPanel(page);
    await page.getByTestId('ai-search-close-btn').click();
    await expect(page.getByTestId('ai-search-panel')).toHaveCount(0);
  });
});
