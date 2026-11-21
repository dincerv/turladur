import { test, expect } from '@playwright/test';

const API_BASE =
  process.env.API_URL?.replace(/\/$/, '') || 'http://127.0.0.1:4000/api/v1';

test.describe('Günlük tur programı', () => {
  test('çok günlü Karadeniz — akordeon, öğün, harita senkron', async ({
    page,
    request,
  }) => {
    test.setTimeout(120_000);
    const slug = 'seed-tour-a5-t5-trabzon';
    const probe = await request.get(`${API_BASE}/catalog/tours/${slug}`);
    test.skip(!probe.ok(), 'Karadeniz tour missing');

    await page.goto(`/tours/${slug}`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { level: 1 })).toContainText(
      /Karadeniz Yayla Escape/i,
      { timeout: 45_000 },
    );

    const panel = page.getByTestId('tour-route-panel');
    await panel.scrollIntoViewIfNeeded();
    await expect(panel).toBeVisible();

    await expect(page.getByTestId('tour-route-map').first()).toBeVisible({
      timeout: 20_000,
    });

    const day1 = page.getByTestId('tour-itinerary-day-1');
    await expect(day1).toHaveAttribute('data-expanded', 'true');
    await expect(
      page.getByTestId('tour-itinerary-day-1-logistics'),
    ).toContainText(/Kahvaltı/i);
    await expect(
      page.getByTestId('tour-itinerary-day-1-logistics'),
    ).toContainText(/Konaklama/i);

    const day3 = page.getByTestId('tour-itinerary-day-3');
    await expect(day3).toHaveAttribute('data-expanded', 'false');
    await day3.getByRole('button').first().click();
    await expect(day3).toHaveAttribute('data-expanded', 'true');

    const chip = page
      .locator('[data-testid^="tour-itinerary-stop-chip-"]')
      .first();
    if (await chip.count()) {
      await chip.click();
      await expect(page.getByTestId('tour-route-map').first()).toBeVisible();
    }
  });

  test('1 günlük İstanbul — konaklama yok, program kartı var', async ({
    page,
    request,
  }) => {
    test.setTimeout(90_000);
    const slug = 'seed-tour-a5-t3-i-stanbul';
    const probe = await request.get(`${API_BASE}/catalog/tours/${slug}`);
    test.skip(!probe.ok(), 'Istanbul day-trip missing');

    await page.goto(`/tours/${slug}`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { level: 1 })).toContainText(
      /İstanbul Boğaz/i,
      { timeout: 45_000 },
    );

    await expect(page.getByTestId('tour-itinerary-day-1')).toBeVisible({
      timeout: 20_000,
    });
    const logistics = page.getByTestId('tour-itinerary-day-1-logistics');
    await expect(logistics).toContainText(/Kahvaltı/i);
    await expect(logistics).not.toContainText(/Konaklama:/);
  });
});
