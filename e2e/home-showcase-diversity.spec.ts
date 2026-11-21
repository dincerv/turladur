import { test, expect } from '@playwright/test';

test.describe('Ana sayfa vitrin çeşitlilik + kıyasla', () => {
  test('8 farklı deneyim, şehir konumları, + Kıyasla dock', async ({
    page,
  }) => {
    test.setTimeout(120_000);
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const toursHeading = page.getByTestId('home-tours-heading');
    await toursHeading.scrollIntoViewIfNeeded();
    await expect(toursHeading).toBeVisible({ timeout: 30_000 });

    const tourCards = page.getByTestId('home-tour-card');
    await expect(tourCards.first()).toBeVisible({ timeout: 20_000 });
    const tourCount = await tourCards.count();
    expect(tourCount).toBeGreaterThanOrEqual(1);
    expect(tourCount).toBeLessThanOrEqual(8);

    const routeKeys = new Set<string>();
    const locations: string[] = [];
    for (let i = 0; i < tourCount; i++) {
      const card = tourCards.nth(i);
      const key = await card.getAttribute('data-route-key');
      expect(key).toBeTruthy();
      expect(routeKeys.has(key!)).toBeFalsy();
      routeKeys.add(key!);

      const loc = (
        await card.getByTestId('home-card-location').innerText()
      ).trim();
      locations.push(loc);
      expect(loc.length).toBeGreaterThan(0);
      // Genel "Türkiye" yerine şehir / bölge beklenir (en azından çoğunluk)
      await expect(card.getByText(/Bronze|Silver|Gold/i)).toHaveCount(0);
    }

    const turkeyOnly = locations.filter((l) => /^türkiye$/i.test(l)).length;
    expect(turkeyOnly).toBeLessThan(tourCount);

    const activityCards = page.getByTestId('home-activity-card');
    const activityCount = await activityCards.count();
    if (activityCount > 0) {
      const activityKeys = new Set<string>();
      for (let i = 0; i < activityCount; i++) {
        const key = await activityCards.nth(i).getAttribute('data-route-key');
        expect(key).toBeTruthy();
        expect(activityKeys.has(key!)).toBeFalsy();
        activityKeys.add(key!);
      }
    }

    // Toplam vitrin deneyimi (tur + aktivite) çeşitlilik
    const totalExperiences = tourCount + activityCount;
    expect(totalExperiences).toBeGreaterThanOrEqual(5);

    const firstCompare = tourCards
      .first()
      .locator('[data-testid^="home-compare-"]');
    await expect(firstCompare).toBeVisible();
    await expect(firstCompare).toContainText(/\+\s*Kıyasla/i);
    await firstCompare.click();
    await expect(page.getByTestId('floating-compare-bar')).toBeVisible({
      timeout: 10_000,
    });
    await expect(firstCompare).toContainText(/Seçildi/i);
  });
});
