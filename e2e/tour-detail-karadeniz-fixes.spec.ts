import { test, expect, type APIRequestContext } from '@playwright/test';

const API_BASE =
  process.env.API_URL?.replace(/\/$/, '') || 'http://127.0.0.1:4000/api/v1';
const SLUG = 'seed-tour-a5-t5-trabzon';

async function assertApiReady(request: APIRequestContext) {
  const tour = await request.get(`${API_BASE}/catalog/tours/${SLUG}`);
  expect(tour.ok(), 'Karadeniz tour API').toBeTruthy();
  const body = (await tour.json()) as {
    data?: { id: string; reviewCount: number; slug: string };
  };
  expect(body.data?.slug).toBe(SLUG);
  expect(Number(body.data?.reviewCount)).toBeGreaterThan(0);

  const stops = await request.get(
    `${API_BASE}/catalog/tours/${SLUG}/route-stops`,
  );
  expect(stops.ok()).toBeTruthy();
  const stopBody = (await stops.json()) as { data?: unknown[] };
  expect((stopBody.data ?? []).length).toBeGreaterThanOrEqual(3);

  const reviews = await request.get(
    `${API_BASE}/review/tours/${body.data!.id}`,
  );
  expect(reviews.ok()).toBeTruthy();
  const revBody = (await reviews.json()) as { meta?: { total?: number } };
  expect(revBody.meta?.total).toBe(Number(body.data?.reviewCount));
}

test.describe('Karadeniz Yayla Escape — detay düzeltmeleri', () => {
  test('header, CTA, Carto Voyager rota, puan tutarlılığı', async ({
    page,
    request,
  }) => {
    test.setTimeout(120_000);
    await assertApiReady(request);

    const tileUrls: string[] = [];
    page.on('request', (req) => {
      const url = req.url();
      if (
        url.includes('arcgisonline.com') &&
        url.includes('/MapServer/tile/')
      ) {
        tileUrls.push(url);
      }
    });

    await page.goto(`/tours/${SLUG}`, {
      waitUntil: 'domcontentloaded',
    });

    await expect(page.getByRole('heading', { level: 1 })).toContainText(
      /Karadeniz Yayla Escape/i,
      { timeout: 30_000 },
    );

    const header = page.locator('header.fixed').first();
    await expect(header).toBeVisible();
    const hero = page.getByTestId('tour-detail-hero');
    await expect(hero).toBeVisible();

    // En tepede şeffaf navbar (full-bleed kapak üstünde)
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(300);
    await expect(header).toHaveClass(/bg-transparent/);

    // Aşağı kayınca opak sticky navbar
    await page.evaluate(() => window.scrollTo(0, 900));
    await page.waitForTimeout(400);
    await expect(header).toHaveClass(/bg-white\/95/);
    await expect(header).toHaveClass(/z-\[60\]/);

    // Header opak + en üstte: ortasındaki nokta navbar'a ait olmalı (harita/metin değil)
    const topHit = await page.evaluate(() => {
      const nav = document.querySelector('header.fixed') as HTMLElement | null;
      if (!nav) return { ok: false, tag: '', cls: '' };
      const rect = nav.getBoundingClientRect();
      const x = Math.round(rect.left + rect.width / 2);
      const y = Math.round(rect.top + rect.height / 2);
      const el = document.elementFromPoint(x, y) as HTMLElement | null;
      const insideNav = Boolean(el && nav.contains(el));
      const bg = getComputedStyle(nav).backgroundColor;
      return {
        ok: insideNav,
        tag: el?.tagName ?? '',
        cls: el?.className?.toString?.() ?? '',
        bg,
      };
    });
    expect(topHit.ok, `header hit ${topHit.tag}.${topHit.cls}`).toBeTruthy();
    expect(topHit.bg).not.toMatch(/rgba\(0,\s*0,\s*0,\s*0\)/);

    const cta = page.getByTestId('tour-detail-reserve-cta');
    await expect(cta).toBeVisible();
    await expect(cta).toContainText('Rezervasyon Yap');

    const map = page.getByTestId('tour-route-map').first();
    await map.scrollIntoViewIfNeeded();
    await expect(map).toBeVisible({ timeout: 20_000 });
    await expect
      .poll(() => tileUrls.length, { timeout: 25_000 })
      .toBeGreaterThan(0);

    // Durak pinleri / polyline render
    await expect(
      map
        .locator('.leaflet-overlay-pane path, .leaflet-marker-pane img')
        .first(),
    ).toBeVisible({ timeout: 20_000 });

    await expect(page.getByTestId('tour-detail-reviews')).toBeVisible();
    await expect(page.getByText('Program & Fiyat/Performans')).toBeVisible();
    await expect(page.getByText('Rehberlik & Anlatım')).toBeVisible();

    const reviewCards = page.locator('[data-testid^="review-card-"]');
    await expect(reviewCards.first()).toBeVisible({ timeout: 20_000 });
    expect(await reviewCards.count()).toBeGreaterThan(0);

    // Üst meta: puan + yorum sayısı; acente tıklanabilir
    await expect(hero.getByText(/\(\d+\s*yorum\)/)).toBeVisible();
    await expect(
      hero.getByRole('link', { name: /^Trabzon Demo Acente 05$/ }),
    ).toBeVisible();

    const other = page.getByTestId('tour-detail-other-tours');
    if ((await other.count()) > 0) {
      await expect(other).toBeVisible();
      await expect(other.locator('[class*="aspect-"]').first()).toBeVisible();
    }
  });
});
