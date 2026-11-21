import { test, expect } from '@playwright/test';

test.describe('Ankara market homepage', () => {
  test('hero origin default, routes, departure badges', async ({ page }) => {
    test.setTimeout(120_000);
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    await expect(page.getByTestId('home-hero')).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByTestId('home-hero-origin')).toBeVisible();
    await expect(page.getByTestId('home-hero-origin')).toContainText(/Ankara/i);
    await expect(page.getByTestId('home-hero-destination')).toBeVisible();

    const destinations = page.getByTestId('home-destinations');
    await destinations.scrollIntoViewIfNeeded();
    await expect(destinations).toBeVisible();

    const routeNames = page.getByTestId('home-route-name');
    await expect(routeNames).toHaveCount(4);
    const names = (await routeNames.allTextContents()).map((t) => t.trim());
    expect(names).toEqual(
      expect.arrayContaining([
        'Kapadokya',
        'Amasra & Safranbolu',
        'GAP & Mezopotamya',
        'Abant & Yedigöller',
      ]),
    );

    for (const name of names) {
      expect(name).not.toMatch(/\.\.\.$/);
      expect(name.length).toBeLessThan(28);
    }

    const tourCards = page.getByTestId('home-tour-card');
    await expect(tourCards.first()).toBeVisible({ timeout: 20_000 });
    const sample = Math.min(await tourCards.count(), 4);
    for (let i = 0; i < sample; i++) {
      await expect(
        tourCards.nth(i).getByTestId('home-card-departure'),
      ).toContainText(/Ankara Çıkışlı/i);
    }

    // Mobil: taşma yok
    await page.setViewportSize({ width: 390, height: 844 });
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect(page.getByTestId('home-hero-turta-ask-mobile')).toBeVisible();
    const overflow = await page.evaluate(() => {
      const doc = document.documentElement;
      return doc.scrollWidth > doc.clientWidth + 2;
    });
    expect(overflow).toBeFalsy();
  });
});
