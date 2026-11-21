import { test, expect } from '@playwright/test';

test.describe('Ana sayfa vitrin temizliği', () => {
  test('hero navbar, Turta’ya Sor, kartlar, bülten kontrastı', async ({
    page,
  }) => {
    test.setTimeout(120_000);
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const hero = page.getByTestId('home-hero');
    await expect(hero).toBeVisible({ timeout: 30_000 });

    const header = page.locator('header.fixed').first();
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(250);
    await expect(header).toHaveClass(/bg-transparent/);

    await page.evaluate(() => window.scrollTo(0, 500));
    await page.waitForTimeout(350);
    await expect(header).toHaveClass(/bg-white\/95/);

    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(250);

    await expect(page.getByTestId('home-hero-turta-ask')).toBeVisible();
    await page.getByTestId('home-hero-turta-ask').click();
    await expect(page.getByTestId('ai-search-scroll-dock')).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByTestId('ai-search-panel')).toBeVisible();
    await expect(page.getByTestId('ai-search-bubble-close')).toHaveCount(0);
    await page.getByTestId('ai-search-close-btn').click();
    await expect(page.getByTestId('ai-search-panel')).toHaveCount(0);

    await expect(page.getByText('Keşfetmeye başla')).toHaveCount(0);

    const toursHeading = page.getByTestId('home-tours-heading');
    await toursHeading.scrollIntoViewIfNeeded();
    await expect(toursHeading).toHaveText('Sizin İçin Seçtiğimiz Turlar');

    const tourCards = page.getByTestId('home-tour-card');
    await expect(tourCards.first()).toBeVisible({ timeout: 20_000 });
    const tourCount = await tourCards.count();
    expect(tourCount).toBeGreaterThan(0);

    for (let i = 0; i < Math.min(tourCount, 8); i++) {
      const card = tourCards.nth(i);
      const text = await card.innerText();
      expect(text).not.toMatch(/E2E|Rota Harita/i);
      await expect(card.getByTestId('home-card-agency')).toBeVisible();
      await expect(card.getByTestId('home-card-duration')).toBeVisible();
    }

    const activityCards = page.getByTestId('home-activity-card');
    if ((await activityCards.count()) > 0) {
      const first = activityCards.first();
      await expect(first.getByTestId('home-card-agency')).toBeVisible();
      const desc = await first
        .locator('p')
        .filter({ hasText: /.+/ })
        .allTextContents();
      expect(desc.join(' ')).not.toMatch(/kısa açıklama/i);
    }

    const newsletter = page.getByTestId('newsletter-heading');
    await newsletter.scrollIntoViewIfNeeded();
    await expect(newsletter).toBeVisible();
    const color = await newsletter.evaluate((el) => getComputedStyle(el).color);
    // koyu tipografi — rgb toplamı düşük olmalı (beyaz ~765 değil)
    const nums = color.match(/\d+/g)?.map(Number) ?? [255, 255, 255];
    const sum = (nums[0] ?? 255) + (nums[1] ?? 255) + (nums[2] ?? 255);
    expect(sum).toBeLessThan(200);
  });
});
