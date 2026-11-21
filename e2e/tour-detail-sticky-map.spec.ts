import { test, expect } from '@playwright/test';

const SLUG = 'seed-tour-a5-t5-trabzon';

test.describe('Tur detay — sticky sağ sütun + Esri tile', () => {
  test('sticky sidebar, güvence kutusu, hatırlatma akordeonu, API KEY yok', async ({
    page,
  }) => {
    test.setTimeout(120_000);

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

    await page.goto(`/tours/${SLUG}`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { level: 1 })).toContainText(
      /Karadeniz Yayla Escape/i,
      { timeout: 30_000 },
    );

    const sticky = page.getByTestId('tour-detail-sidebar-sticky');
    await expect(sticky).toBeVisible();

    await expect(page.getByTestId('tour-detail-trust-box')).toContainText(
      'Turta Güvencesi',
    );
    await expect(page.getByTestId('tour-detail-trust-box')).toContainText(
      'Doğrulanmış Tur Operatörü',
    );

    const persona = page.getByTestId('tour-detail-persona');
    const reviews = page.getByTestId('tour-detail-reviews');
    await expect(persona).toBeVisible();
    await expect(reviews).toBeVisible();
    const personaY = (await persona.boundingBox())?.y ?? 0;
    const reviewsY = (await reviews.boundingBox())?.y ?? 0;
    expect(personaY).toBeLessThan(reviewsY);
    await expect(page.getByTestId('persona-fit-placeholder')).toHaveText(
      /Tercihinizi seçin/i,
    );

    const remindersToggle = page.getByTestId('tour-detail-reminders-toggle');
    await expect(remindersToggle).toHaveAttribute('aria-expanded', 'false');
    await expect(remindersToggle).toContainText(/\d+\s*hatırlatma/);
    await remindersToggle.click();
    await expect(remindersToggle).toHaveAttribute('aria-expanded', 'true');
    await expect(
      page.getByText(/profesyonel rehber eşliğinde karşılama/i),
    ).toBeVisible();

    await page.setViewportSize({ width: 1280, height: 900 });
    await page.evaluate(() => window.scrollTo(0, 1600));
    await page.waitForTimeout(450);
    const box = await sticky.boundingBox();
    expect(box).toBeTruthy();
    expect(box!.y).toBeGreaterThanOrEqual(80);
    expect(box!.y).toBeLessThan(140);

    const map = page.getByTestId('tour-route-map').first();
    await map.scrollIntoViewIfNeeded();
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

    await expect(map.getByText(/API KEY REQUIRED/i)).toHaveCount(0);
    await expect(page.getByText(/API KEY REQUIRED/i)).toHaveCount(0);
  });
});
