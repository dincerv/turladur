import { test, expect } from '@playwright/test';

const SLUG = 'seed-tour-a5-t5-trabzon';

test.describe('Tur detay full-bleed hero', () => {
  test('şeffaf navbar → sticky beyaz; kapak + mini galeri lightbox', async ({
    page,
  }) => {
    test.setTimeout(90_000);
    await page.setViewportSize({ width: 1280, height: 900 });

    await page.goto(`/tours/${SLUG}`, { waitUntil: 'domcontentloaded' });

    const hero = page.getByTestId('tour-detail-hero');
    await expect(hero).toBeVisible({ timeout: 30_000 });
    await expect(page.getByRole('heading', { level: 1 })).toContainText(
      /Karadeniz Yayla Escape/i,
    );

    const header = page.locator('header.fixed').first();
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(250);
    await expect(header).toHaveClass(/bg-transparent/);

    const heroBox = await hero.boundingBox();
    expect(heroBox).toBeTruthy();
    expect(heroBox!.width).toBeGreaterThan(1100);
    expect(heroBox!.height).toBeGreaterThan(480);

    const gallery = page.getByTestId('tour-detail-gallery');
    await expect(gallery).toBeVisible();
    const allPhotos = gallery.getByRole('button', {
      name: /Tüm fotoğraflar/i,
    });
    if ((await allPhotos.count()) > 0) {
      await allPhotos.click();
      const dialog = page.getByTestId('tour-detail-lightbox');
      await expect(dialog).toBeVisible();
      await expect(
        page.getByTestId('tour-detail-lightbox-counter'),
      ).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(dialog).toHaveCount(0);
    }

    await page.evaluate(() => window.scrollTo(0, 800));
    await page.waitForTimeout(350);
    await expect(header).toHaveClass(/bg-white\/95/);

    await expect(page.getByTestId('tour-detail-about')).toBeVisible();
    await expect(page.getByTestId('tour-detail-sidebar')).toBeVisible();
  });
});
