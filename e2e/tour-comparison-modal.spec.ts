import { test, expect } from '@playwright/test';

const apiBase = process.env.API_URL ?? 'http://localhost:4000/api/v1';

type TourSearchItem = { id: string; title?: string };

test.describe('Tour comparison modal', () => {
  test('selects two tours, shows floating bar, opens compare matrix', async ({
    page,
    request,
  }) => {
    const health = await request.get(`${apiBase}/health`);
    test.skip(!health.ok(), 'API not running');

    const search = await request.get(
      `${apiBase}/catalog/tours/search?page=1&limit=5`,
    );
    test.skip(!search.ok(), 'Tour search unavailable');

    const searchBody = (await search.json()) as {
      success?: boolean;
      data?: TourSearchItem[] | null;
    };
    const tours = Array.isArray(searchBody.data) ? searchBody.data : [];
    test.skip(tours.length < 2, 'Need at least 2 published tours');

    await page.goto('/tours');
    await expect(
      page.getByRole('heading', { name: 'Tüm Turlar', exact: true }),
    ).toBeVisible({ timeout: 30_000 });

    // Prefer DOM cards (client list) over API search order — first two visible.
    const selectButtons = page.locator('[data-testid^="compare-select-"]');
    await expect(selectButtons.first()).toBeVisible({ timeout: 45_000 });
    const selectCount = await selectButtons.count();
    test.skip(selectCount < 2, 'Need at least 2 tour cards on /tours');

    const firstSelectTestId = await selectButtons
      .nth(0)
      .getAttribute('data-testid');
    const secondSelectTestId = await selectButtons
      .nth(1)
      .getAttribute('data-testid');
    test.skip(
      !firstSelectTestId || !secondSelectTestId,
      'Compare controls missing',
    );

    const firstId = firstSelectTestId.replace('compare-select-', '');
    const secondId = secondSelectTestId.replace('compare-select-', '');

    await page.getByTestId(firstSelectTestId).click();
    await expect(page.getByTestId('floating-compare-bar')).toBeVisible();

    await page.getByTestId(secondSelectTestId).click();
    await expect(page.getByTestId('floating-compare-bar')).toContainText('2/4');

    await page.getByTestId('open-compare-modal-btn').click();
    await expect(page.getByTestId('compare-modal')).toBeVisible();

    await expect(page.getByTestId('compare-matrix')).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByTestId(`compare-column-${firstId}`)).toBeVisible();
    await expect(page.getByTestId(`compare-column-${secondId}`)).toBeVisible();
    await expect(
      page.getByTestId(`compare-cell-price-${firstId}`),
    ).toBeVisible();
    await expect(
      page.getByTestId(`compare-cell-price-${secondId}`),
    ).toBeVisible();
    await expect(
      page.getByTestId(`compare-cell-entertainment-${firstId}`),
    ).toBeVisible();
    await expect(
      page.getByTestId(`compare-cell-entertainment-${secondId}`),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', {
        name: 'Eğlence / Tempo Seviyesi',
        exact: true,
      }),
    ).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(page.getByTestId('compare-modal')).toBeHidden();
  });

  test('compare API returns entertainment fields for Likya vs Ege', async ({
    request,
  }) => {
    const health = await request.get(`${apiBase}/health`);
    test.skip(!health.ok(), 'API not running');

    const likya = await request.get(
      `${apiBase}/catalog/tours/seed-tour-likya-party`,
    );
    const ege = await request.get(
      `${apiBase}/catalog/tours/seed-tour-ege-calm`,
    );
    test.skip(
      !likya.ok() || !ege.ok(),
      'Persona seed tours missing — run prisma seed',
    );

    const response = await request.post(`${apiBase}/catalog/tours/compare`, {
      data: {
        ids: ['seed-tour-likya-party', 'seed-tour-ege-calm'],
      },
    });
    expect(response.ok()).toBeTruthy();
    const body = (await response.json()) as {
      data?: {
        columns?: {
          id: string;
          available: boolean;
          entertainmentLevel?: string | null;
          entertainmentLabel?: string | null;
          partnerName?: string | null;
        }[];
      };
    };
    const columns = body.data?.columns ?? [];
    expect(columns).toHaveLength(2);
    const likyaCol = columns.find((c) => c.id === 'seed-tour-likya-party');
    const egeCol = columns.find((c) => c.id === 'seed-tour-ege-calm');
    expect(likyaCol?.available).toBe(true);
    expect(egeCol?.available).toBe(true);
    expect(likyaCol?.entertainmentLevel).toBe('HIGH');
    expect(egeCol?.entertainmentLevel).toBe('LOW');
    expect(likyaCol?.partnerName).toMatch(/Likya/i);
    expect(egeCol?.partnerName).toMatch(/Ege Akademi/i);
  });

  test('compare API rejects more than 4 ids', async ({ request }) => {
    const health = await request.get(`${apiBase}/health`);
    test.skip(!health.ok(), 'API not running');

    const response = await request.post(`${apiBase}/catalog/tours/compare`, {
      data: {
        ids: ['a', 'b', 'c', 'd', 'e'],
      },
    });

    expect(response.status()).toBeGreaterThanOrEqual(400);
    expect(response.ok()).toBeFalsy();
  });
});
