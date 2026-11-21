import { test, expect } from '@playwright/test';

const SLUG = 'seed-tour-a5-t5-trabzon';

test.describe('Tur detay lightbox UX', () => {
  test('karakteristik kontroller: sayaç, kapat, oklar, thumbnail şeridi', async ({
    page,
  }) => {
    test.setTimeout(90_000);
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(`/tours/${SLUG}`, { waitUntil: 'domcontentloaded' });

    await expect(page.getByTestId('tour-detail-hero')).toBeVisible({
      timeout: 30_000,
    });

    const openBtn = page
      .getByTestId('tour-detail-gallery')
      .getByRole('button', { name: /Tüm fotoğraflar/i });
    await expect(openBtn).toBeVisible();
    await openBtn.click();

    const lightbox = page.getByTestId('tour-detail-lightbox');
    await expect(lightbox).toBeVisible();

    // Opak karanlık perde (header üstünde)
    await expect(lightbox).toHaveClass(/bg-black\/95/);
    await expect(lightbox).toHaveClass(/z-\[200\]/);

    const counter = page.getByTestId('tour-detail-lightbox-counter');
    await expect(counter).toBeVisible();
    await expect(counter).toHaveText(/^\s*1\s*\/\s*\d+\s*$/);
    await expect(
      page.getByTestId('tour-detail-lightbox-tour-name'),
    ).toContainText(/Karadeniz Yayla Escape/i);

    const imageBox = page.getByTestId('tour-detail-lightbox-image');
    await expect(imageBox).toHaveClass(/max-h-\[78vh\]/);
    await expect(imageBox).toHaveClass(/max-w-\[86vw\]/);

    await expect(page.getByTestId('tour-detail-lightbox-close')).toBeVisible();
    await expect(page.getByTestId('tour-detail-lightbox-prev')).toBeVisible();
    await expect(page.getByTestId('tour-detail-lightbox-next')).toBeVisible();

    const thumbs = page.getByTestId('tour-detail-lightbox-thumbs');
    await expect(thumbs).toBeVisible();
    const thumbCount = await thumbs.getByRole('listitem').count();
    expect(thumbCount).toBeGreaterThan(1);

    // Genel / eşleşmeyen destinasyon alt yazısı basılmamalı
    await expect(page.getByTestId('tour-detail-lightbox-caption')).toHaveCount(
      0,
    );

    // Ok ile sonraki
    await page.getByTestId('tour-detail-lightbox-next').click();
    await expect(counter).toHaveText(/^\s*2\s*\/\s*\d+\s*$/);

    // Thumbnail ile atla
    await thumbs.getByRole('listitem').nth(0).click();
    await expect(counter).toHaveText(/^\s*1\s*\/\s*\d+\s*$/);

    // ESC kapatır
    await page.keyboard.press('Escape');
    await expect(lightbox).toHaveCount(0);

    // Yeniden aç + dışarı tıkla
    await openBtn.click();
    await expect(lightbox).toBeVisible();
    await lightbox.click({ position: { x: 8, y: 200 } });
    await expect(lightbox).toHaveCount(0);
  });
});
