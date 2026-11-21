import { test, expect } from '@playwright/test';

const SLUG = 'seed-tour-a1-t2-antalya';

test.describe('Likya — Esri harita + gün fotoğrafları', () => {
  test('filigransız Esri zemin ve gün kartı thumb → lightbox', async ({
    page,
    request,
  }) => {
    test.setTimeout(120_000);

    const api =
      process.env.API_URL?.replace(/\/$/, '') || 'http://127.0.0.1:4000/api/v1';
    const tourRes = await request.get(`${api}/catalog/tours/${SLUG}`);
    expect(tourRes.ok()).toBeTruthy();
    const body = (await tourRes.json()) as {
      data?: {
        extras?: {
          itinerary?: Record<
            string,
            { imageUrls?: string[]; images?: string[] }
          >;
        };
      };
    };
    const day0 =
      body.data?.extras?.itinerary?.day0?.imageUrls ??
      body.data?.extras?.itinerary?.day0?.images ??
      [];
    expect(day0.length).toBeGreaterThan(0);

    const tileUrls: string[] = [];
    const blockedUrls: string[] = [];
    page.on('request', (req) => {
      const url = req.url();
      if (
        url.includes('arcgisonline.com') &&
        url.includes('/MapServer/tile/')
      ) {
        tileUrls.push(url);
      }
      if (
        url.includes('basemaps.cartocdn.com') ||
        url.includes('carto.com/basemaps')
      ) {
        blockedUrls.push(url);
      }
    });

    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(`/tours/${SLUG}`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { level: 1 })).toContainText(
      /Antalya Likya Yolu/i,
      { timeout: 30_000 },
    );

    const map = page.getByTestId('tour-route-map').first();
    await map.scrollIntoViewIfNeeded();
    await expect(map).toBeVisible({ timeout: 20_000 });
    await expect
      .poll(() => tileUrls.length, { timeout: 25_000 })
      .toBeGreaterThan(0);
    expect(blockedUrls.length).toBe(0);
    expect(
      tileUrls.every(
        (u) =>
          !u.includes('apikey=') && /\/MapServer\/tile\/\d+\/\d+\/\d+/.test(u),
      ),
    ).toBeTruthy();

    // En az birkaç tile başarıyla yüklensin (bej boşluk olmasın)
    const tileImgs = map.locator('.leaflet-tile-pane img.leaflet-tile');
    await expect
      .poll(async () => tileImgs.count(), { timeout: 20_000 })
      .toBeGreaterThan(4);
    await expect(map.getByText(/API KEY REQUIRED/i)).toHaveCount(0);

    const day1 = page.getByTestId('tour-itinerary-day-1');
    await day1.scrollIntoViewIfNeeded();
    if ((await day1.getAttribute('data-expanded')) !== 'true') {
      await day1.click();
    }
    const dayImages = page.getByTestId('tour-itinerary-day-1-images');
    await expect(dayImages).toBeVisible({ timeout: 10_000 });
    await dayImages.locator('button').first().click();
    await expect(page.getByTestId('tour-detail-lightbox')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('tour-detail-lightbox')).toHaveCount(0);
  });
});
