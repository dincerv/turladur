import { test, expect, type APIRequestContext } from '@playwright/test';

import {
  E2E_AGENCY_EMAIL,
  E2E_AGENCY_PASSWORD,
  loginAgency,
} from './helpers/agency-login';

const API_BASE =
  process.env.API_URL?.replace(/\/$/, '') || 'http://127.0.0.1:4000/api/v1';

async function agencyLoginToken(
  request: APIRequestContext,
): Promise<string | null> {
  const res = await request.post(`${API_BASE}/identity/agency-staff/login`, {
    data: { email: E2E_AGENCY_EMAIL, password: E2E_AGENCY_PASSWORD },
  });
  if (!res.ok()) return null;
  const body = (await res.json()) as {
    data?: { accessToken?: string; tokens?: { accessToken?: string } };
  };
  return body.data?.accessToken ?? body.data?.tokens?.accessToken ?? null;
}

test.describe('Tur gezi durakları + rota haritası', () => {
  test('API ile durak kaydı ve public tur detayda Tur Rotası paneli', async ({
    page,
    request,
  }) => {
    test.setTimeout(120_000);

    const token = await agencyLoginToken(request);
    test.skip(!token, 'Agency API login failed');

    const search = await request.get(
      `${API_BASE}/catalog/tours/search?q=Kapadokya&limit=1`,
    );
    test.skip(!search.ok(), 'Tour search failed');
    const searchBody = (await search.json()) as {
      data?: Array<{ id: string; slug: string; status: string }>;
    };
    const published = searchBody.data?.[0];
    test.skip(!published?.id, 'No published Kapadokya tour');

    const stopPayload = [
      {
        dayNumber: 1,
        order: 0,
        name: 'E2E Uçhisar Kalesi',
        description: 'Rota testi 1',
        latitude: 38.6301,
        longitude: 34.8053,
        kind: 'VISIT',
      },
      {
        dayNumber: 1,
        order: 1,
        name: 'E2E Göreme Müze',
        description: 'Rota testi 2',
        latitude: 38.6398,
        longitude: 34.8448,
        kind: 'VISIT',
      },
      {
        dayNumber: 1,
        order: 2,
        name: 'E2E Mağara Otel',
        description: 'Konaklama',
        latitude: 38.6431,
        longitude: 34.8289,
        kind: 'LODGING',
      },
    ];

    const patchRes = await request.patch(
      `${API_BASE}/catalog/tours/${published.id}`,
      {
        headers: { Authorization: `Bearer ${token}` },
        data: {
          replaceRouteStops: true,
          routeStops: stopPayload,
        },
      },
    );
    expect(patchRes.ok(), `patch ${patchRes.status()}`).toBeTruthy();

    const stopsRes = await request.get(
      `${API_BASE}/catalog/tours/${published.id}/route-stops`,
    );
    expect(stopsRes.ok()).toBeTruthy();
    const stopsBody = (await stopsRes.json()) as {
      data?: Array<{ name: string; kind: string }>;
    };
    expect(stopsBody.data?.length).toBeGreaterThanOrEqual(3);
    expect(stopsBody.data?.some((s) => s.kind === 'LODGING')).toBeTruthy();

    await page.goto(`/tours/${published.slug}`, {
      waitUntil: 'domcontentloaded',
    });

    await expect(page.getByTestId('tour-route-panel')).toBeVisible({
      timeout: 45_000,
    });
    await expect(page.getByTestId('tour-route-tab-route')).toBeVisible();
    await expect(page.getByTestId('tour-route-program-list')).toContainText(
      'E2E Uçhisar',
      { timeout: 20_000 },
    );

    // Desktop map is md+; force viewport then assert new IA + map
    await page.setViewportSize({ width: 1280, height: 900 });
    await expect(page.getByTestId('tour-detail-gallery')).toBeVisible();
    await expect(page.getByTestId('tour-detail-about')).toBeVisible();
    await expect(page.getByTestId('tour-detail-inclusions')).toBeVisible();
    await expect(page.getByTestId('tour-detail-sidebar')).toBeVisible();
    const map = page.getByTestId('tour-route-map');
    await expect(map).toBeVisible({ timeout: 20_000 });

    // Gallery should appear above the route panel in the document
    const galleryBox = await page
      .getByTestId('tour-detail-gallery')
      .boundingBox();
    const aboutBox = await page.getByTestId('tour-detail-about').boundingBox();
    const routeBox = await page.getByTestId('tour-route-panel').boundingBox();
    expect(galleryBox && aboutBox && routeBox).toBeTruthy();
    expect(galleryBox!.y).toBeLessThan(aboutBox!.y);
    expect(aboutBox!.y).toBeLessThan(routeBox!.y);

    // Tiles + custom pins + dashed route polyline
    await expect
      .poll(
        async () =>
          map
            .locator('.leaflet-tile-loaded')
            .count()
            .then((n) => n > 4),
        { timeout: 25_000 },
      )
      .toBeTruthy();
    await expect(map.locator('.tour-route-stop-pin')).toHaveCount(3, {
      timeout: 15_000,
    });
    await expect(map.locator('.leaflet-overlay-pane path')).toHaveCount(2, {
      timeout: 10_000,
    });
    await expect(page.getByTestId('tour-route-map-fit')).toBeVisible();
    await expect(page.getByTestId('tour-route-map-zoom-in')).toBeVisible();

    await page.getByTestId('tour-route-program-stop-0').click();
    await expect(
      map
        .locator('.leaflet-popup-content-wrapper')
        .filter({ hasText: 'E2E Uçhisar' })
        .first(),
    ).toBeVisible({ timeout: 10_000 });

    await map.screenshot({
      path: 'test-results/tour-route-map-desktop.png',
    });

    await page.getByTestId('tour-route-tab-boarding').click();
    await expect(page.getByTestId('tour-route-tab-boarding')).toHaveAttribute(
      'aria-selected',
      'true',
    );
  });

  test('acente edit formunda Gezi Durakları bölümü', async ({ page }) => {
    test.setTimeout(90_000);
    test.skip(!(await loginAgency(page)), 'Agency login failed / web down');

    const token = await agencyLoginToken(page.request);
    test.skip(!token, 'Agency API login failed');

    const toursRes = await page.request.get(
      `${API_BASE}/partner/tours?pageSize=1`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    test.skip(!toursRes.ok(), 'Partner tours list failed');
    const toursBody = (await toursRes.json()) as {
      data?: { items?: Array<{ id: string }> };
    };
    const owned = toursBody.data?.items?.[0];
    test.skip(!owned?.id, 'No owned tour');

    await page.goto(`/acente/tours/${owned.id}/edit`, {
      waitUntil: 'domcontentloaded',
    });
    await expect(page.getByTestId('tour-route-stops-form')).toBeVisible({
      timeout: 45_000,
    });
    await expect(page.getByTestId('tour-route-stop-add-btn')).toBeVisible();
  });
});
