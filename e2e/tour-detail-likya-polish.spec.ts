import { test, expect } from '@playwright/test';

const SLUG = 'seed-tour-a1-t2-antalya';

test.describe('Antalya Likya Yolu — detay rötuşları', () => {
  test('hero görseller, öğünler, harita, yorum çubukları', async ({
    page,
    request,
  }) => {
    test.setTimeout(120_000);

    const api =
      process.env.API_URL?.replace(/\/$/, '') || 'http://127.0.0.1:4000/api/v1';
    const tourRes = await request.get(`${api}/catalog/tours/${SLUG}`);
    expect(tourRes.ok()).toBeTruthy();
    const tourBody = (await tourRes.json()) as {
      data?: {
        id: string;
        coverUrl?: string;
        galleryUrls?: string[];
        reviewCount?: number;
        extras?: { itinerary?: Record<string, { meals?: unknown }> };
      };
    };
    expect(tourBody.data?.coverUrl).toMatch(
      /^https:\/\/images\.unsplash\.com\//,
    );
    expect((tourBody.data?.galleryUrls ?? []).length).toBeGreaterThan(1);
    expect(tourBody.data?.extras?.itinerary?.day0?.meals).toBeTruthy();

    const stopsRes = await request.get(
      `${api}/catalog/tours/${SLUG}/route-stops`,
    );
    expect(stopsRes.ok()).toBeTruthy();
    const stopsBody = (await stopsRes.json()) as { data?: unknown[] };
    expect((stopsBody.data ?? []).length).toBeGreaterThanOrEqual(3);

    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(`/tours/${SLUG}`, { waitUntil: 'domcontentloaded' });

    const hero = page.getByTestId('tour-detail-hero');
    await expect(hero).toBeVisible({ timeout: 30_000 });
    await expect(page.getByRole('heading', { level: 1 })).toContainText(
      /Antalya Likya Yolu/i,
    );

    // Kapak: Unsplash URL yüklensin (next/image optimizer)
    const heroImg = hero.locator('img').first();
    await expect(heroImg).toBeVisible();
    await expect
      .poll(
        async () =>
          heroImg.evaluate((el) => {
            const img = el as HTMLImageElement;
            return img.complete && img.naturalWidth > 0 ? img.naturalWidth : 0;
          }),
        { timeout: 20_000 },
      )
      .toBeGreaterThan(0);
    await expect(heroImg).toHaveAttribute('src', /unsplash|photo-/i);

    await expect(page.getByTestId('tour-detail-meeting')).toContainText(
      'Kalkış Noktaları ve Önemli Hatırlatmalar',
    );
    await expect(page.getByTestId('tour-detail-meeting')).not.toContainText(
      'Kalkış Kalkış',
    );

    // Günlük öğün: boş "Kahvaltı:" olmamalı
    const day1 = page.getByTestId('tour-itinerary-day-1');
    await day1.scrollIntoViewIfNeeded();
    await day1.click();
    const logistics = page.getByTestId('tour-itinerary-day-1-logistics');
    await expect(logistics).toBeVisible({ timeout: 10_000 });
    await expect(logistics).toContainText(/Kahvaltı:\s*(Dahil|Hariç|Serbest)/);
    await expect(logistics).not.toHaveText(/Kahvaltı:\s*$/);

    const map = page.getByTestId('tour-route-map').first();
    await map.scrollIntoViewIfNeeded();
    await expect(map).toBeVisible({ timeout: 20_000 });

    await expect(page.getByTestId('tour-reviews')).toBeVisible();
    if ((tourBody.data?.reviewCount ?? 0) > 0) {
      await expect(page.getByText(/Yeni Rota/)).toHaveCount(0);
    }
    const bars = page.getByTestId('review-score-bar');
    await expect(bars.first()).toBeVisible();
    expect(await bars.count()).toBeGreaterThanOrEqual(3);

    // Operatör ayraç: puan · N değerlendirme
    const sidebar = page.getByTestId('tour-detail-sidebar');
    await expect(
      sidebar.getByText(/\d\.\d\s*·\s*\d+\s*değerlendirme/),
    ).toBeVisible();
  });
});
