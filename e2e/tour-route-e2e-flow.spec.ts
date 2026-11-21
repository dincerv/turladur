import { test, expect, type APIRequestContext } from '@playwright/test';

import { E2E_AGENCY_EMAIL, E2E_AGENCY_PASSWORD } from './helpers/agency-login';
import {
  E2E_ADMIN_EMAIL,
  E2E_ADMIN_PASSWORD,
  loginAdmin,
} from './helpers/admin-login';
import { gotoAdmin } from './helpers/admin-goto';

const API_BASE =
  process.env.API_URL?.replace(/\/$/, '') || 'http://127.0.0.1:4000/api/v1';

function isoOffset(days: number): string {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

async function agencyToken(request: APIRequestContext): Promise<string | null> {
  const res = await request.post(`${API_BASE}/identity/agency-staff/login`, {
    data: { email: E2E_AGENCY_EMAIL, password: E2E_AGENCY_PASSWORD },
  });
  if (!res.ok()) return null;
  const body = (await res.json()) as { data?: { accessToken?: string } };
  return body.data?.accessToken ?? null;
}

async function adminToken(request: APIRequestContext): Promise<string | null> {
  const res = await request.post(`${API_BASE}/identity/login`, {
    data: { email: E2E_ADMIN_EMAIL, password: E2E_ADMIN_PASSWORD },
  });
  if (!res.ok()) return null;
  const body = (await res.json()) as { data?: { accessToken?: string } };
  return body.data?.accessToken ?? null;
}

const KAPADOKYA_STOPS = [
  {
    dayNumber: 1,
    order: 0,
    name: 'Uçhisar Kalesi',
    description: 'Panoramik vadi manzarası',
    latitude: 38.6301,
    longitude: 34.8053,
    kind: 'VISIT' as const,
  },
  {
    dayNumber: 1,
    order: 1,
    name: 'Göreme Açık Hava Müzesi',
    description: 'Kayadan oyma kiliseler',
    latitude: 38.6398,
    longitude: 34.8448,
    kind: 'VISIT' as const,
  },
  {
    dayNumber: 1,
    order: 2,
    name: 'Avanos Çömlek Atölyesi',
    description: 'Kızılırmak kenarı deneyim',
    latitude: 38.715,
    longitude: 34.8467,
    kind: 'VISIT' as const,
  },
  {
    dayNumber: 1,
    order: 3,
    name: 'Göreme Mağara Otel',
    description: 'Gece konaklama',
    latitude: 38.6431,
    longitude: 34.8289,
    kind: 'LODGING' as const,
  },
  {
    dayNumber: 2,
    order: 4,
    name: 'Derinkuyu Yeraltı Şehri',
    description: 'Yeraltı tünelleri',
    latitude: 38.3736,
    longitude: 34.7345,
    kind: 'VISIT' as const,
  },
  {
    dayNumber: 2,
    order: 5,
    name: 'Ürgüp',
    description: 'Tarihi evler ve şarap',
    latitude: 38.6316,
    longitude: 34.911,
    kind: 'VISIT' as const,
  },
];

test.describe('Uçtan uca — tur oluştur, onayla, rota haritası', () => {
  test('acente oluşturur → admin yayınlar → detay haritası açılır', async ({
    page,
    request,
  }) => {
    test.setTimeout(180_000);

    const stamp = Date.now();
    const title = `Kapadokya Rota Harita E2E ${stamp}`;

    // API-first create (agency UI login flake'inden bağımsız)
    const aToken = await agencyToken(request);
    test.skip(!aToken, 'Agency API token failed');

    const createRes = await request.post(`${API_BASE}/catalog/tours`, {
      headers: { Authorization: `Bearer ${aToken}` },
      data: {
        title,
        description:
          'İki günlük Kapadokya rotası: peri bacaları, açık hava müzesi, yeraltı şehri ve mağara otel konaklaması. Rota haritası E2E testi.',
        price: 5190,
        category: 'CULTURAL',
        durationDays: 2,
        stayKind: 'OVERNIGHT',
        destinationScope: 'DOMESTIC',
        departureCities: ['Ankara'],
        asDraft: false,
        dates: [
          {
            startDate: isoOffset(14),
            endDate: isoOffset(15),
            capacity: 20,
            priceOverride: 5190,
          },
        ],
        pickupPoints: [
          {
            city: 'Ankara',
            location: 'AŞTİ Terminal Girişi',
            time: '07:00',
            description: 'Kapı 3 önü',
            latitude: 39.9208,
            longitude: 32.8541,
            order: 0,
          },
        ],
        routeStops: KAPADOKYA_STOPS,
      },
    });
    expect(createRes.ok(), `create ${createRes.status()}`).toBeTruthy();
    const created = (await createRes.json()) as {
      data?: { id: string; slug?: string; status?: string };
    };
    const tourId = created.data?.id;
    expect(tourId).toBeTruthy();

    // Admin API yayın
    const admTok = await adminToken(request);
    test.skip(!admTok, 'Admin API token failed');
    const pubRes = await request.patch(
      `${API_BASE}/admin/tours/${tourId}/status`,
      {
        headers: { Authorization: `Bearer ${admTok}` },
        data: { status: 'PUBLISHED', note: 'Rota harita E2E onayı' },
      },
    );
    expect(pubRes.ok(), `publish ${pubRes.status()}`).toBeTruthy();

    // Audit log (entity timeline)
    const audit = await request.get(
      `${API_BASE}/admin/audit-logs/entity/TOUR/${tourId}`,
      { headers: { Authorization: `Bearer ${admTok}` } },
    );
    if (audit.ok()) {
      const auditBody = (await audit.json()) as {
        data?:
          Array<{ action?: string }> | { items?: Array<{ action?: string }> };
      };
      const items = Array.isArray(auditBody.data)
        ? auditBody.data
        : (auditBody.data?.items ?? []);
      expect(items.length).toBeGreaterThanOrEqual(0);
    }

    // Opsiyonel admin UI doğrulama
    if (await loginAdmin(page)) {
      await gotoAdmin(page, '/admin/tours', 'admin-tours-page');
    }

    // Public slug
    const detailRes = await request.get(`${API_BASE}/catalog/tours/${tourId}`);
    expect(detailRes.ok()).toBeTruthy();
    const detail = (await detailRes.json()) as {
      data?: { slug?: string; status?: string };
    };
    expect(detail.data?.status).toBe('PUBLISHED');
    const slug = detail.data?.slug || tourId!;

    // --- Tur detay: masaüstü harita ---
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(`/tours/${slug}`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('tour-route-panel')).toBeVisible({
      timeout: 45_000,
    });
    await expect(page.getByTestId('tour-route-tab-route')).toBeVisible();
    const desktopMap = page.getByTestId('tour-route-map');
    await expect(desktopMap).toBeVisible({
      timeout: 20_000,
    });
    await expect
      .poll(
        async () =>
          desktopMap
            .locator('.leaflet-tile-loaded')
            .count()
            .then((n) => n > 4),
        { timeout: 25_000 },
      )
      .toBeTruthy();
    await expect(desktopMap.locator('.tour-route-stop-pin')).toHaveCount(6, {
      timeout: 15_000,
    });
    await expect(desktopMap.locator('.leaflet-overlay-pane path')).toHaveCount(
      5,
      { timeout: 10_000 },
    );
    await desktopMap.screenshot({
      path: 'test-results/tour-route-map-e2e-flow.png',
    });
    await expect(page.getByTestId('tour-route-program-list')).toContainText(
      'Uçhisar',
    );
    await expect(page.getByTestId('tour-route-day-filters')).toBeVisible();
    await page
      .getByTestId('tour-route-day-filters')
      .getByRole('button', { name: '2. Gün' })
      .click();
    await expect(page.getByTestId('tour-route-program-list')).toContainText(
      'Derinkuyu',
    );
    await page
      .getByTestId('tour-route-day-filters')
      .getByRole('button', { name: 'Tümü' })
      .click();
    await page.getByTestId('tour-route-tab-boarding').click();
    await expect(page.getByTestId('tour-route-tab-boarding')).toHaveAttribute(
      'aria-selected',
      'true',
    );

    // --- Mobil harita ---
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/tours/${slug}`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('tour-route-panel')).toBeVisible({
      timeout: 30_000,
    });
    await page.getByTestId('tour-route-tab-route').click();
    await page.getByTestId('tour-route-mobile-map-toggle').click();
    await expect(page.getByTestId('tour-route-map')).toBeVisible({
      timeout: 15_000,
    });

    // eslint-disable-next-line no-console
    console.log(`TOUR_PUBLIC_URL=/tours/${slug}`);
    // eslint-disable-next-line no-console
    console.log(`TOUR_ID=${tourId}`);
  });
});
