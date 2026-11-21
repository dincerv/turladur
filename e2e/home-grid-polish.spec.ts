import { test, expect } from '@playwright/test';

test.describe('Ana sayfa grid + balon + B2B şerit', () => {
  test('tam satır grid, hero’da balon gizli, rota metinleri, acente CTA', async ({
    page,
  }) => {
    test.setTimeout(120_000);
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    await expect(page.getByTestId('home-hero')).toBeVisible({
      timeout: 30_000,
    });
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(300);
    await expect(page.getByTestId('ai-search-bubble')).toHaveCount(0);
    await expect(page.getByTestId('home-hero-turta-ask')).toBeVisible();

    await page.evaluate(() => window.scrollTo(0, 1400));
    await page.waitForTimeout(400);
    await expect(page.getByTestId('ai-search-bubble')).toBeVisible();

    const tourCards = page.getByTestId('home-tour-card');
    await expect(tourCards.first()).toBeVisible({ timeout: 20_000 });
    const tourCount = await tourCards.count();
    expect([4, 8]).toContain(tourCount);

    const activityCards = page.getByTestId('home-activity-card');
    const activityCount = await activityCards.count();
    if (activityCount > 0) {
      expect([4, 8]).toContain(activityCount);
    }

    const routeNames = page.getByTestId('home-route-name');
    const routeCount = await routeNames.count();
    for (let i = 0; i < routeCount; i++) {
      const text = (await routeNames.nth(i).innerText()).trim();
      expect(text).not.toMatch(/\.\.\.$/);
      expect(text.length).toBeGreaterThan(2);
      expect(text.length).toBeLessThan(28);
    }
    const routeLocs = page.getByTestId('home-route-location');
    for (let i = 0; i < (await routeLocs.count()); i++) {
      const text = (await routeLocs.nth(i).innerText()).trim();
      expect(text).not.toMatch(/\.\.\.$/);
      expect(text).not.toMatch(/Türkiye/i);
    }

    const agencyCta = page.getByTestId('home-agency-cta');
    await agencyCta.scrollIntoViewIfNeeded();
    await expect(agencyCta).toBeVisible();
    await expect(agencyCta).toContainText(/Tur acenteniz mi var/i);
    await expect(
      agencyCta.getByRole('link', { name: /Acente Başvurusu/i }),
    ).toHaveAttribute('href', '/partner-register');
  });
});
