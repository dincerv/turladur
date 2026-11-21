import { test, expect, type APIRequestContext } from '@playwright/test';

import {
  loginAdmin,
  E2E_ADMIN_EMAIL,
  E2E_ADMIN_PASSWORD,
} from './helpers/admin-login';
import { gotoAdmin } from './helpers/admin-goto';

const ADMIN_A = process.env.E2E_ADMIN_EMAIL ?? E2E_ADMIN_EMAIL;
const ADMIN_B = process.env.E2E_ADMIN_B_EMAIL ?? 'admin02@demo.turta.com';
const API_BASE = process.env.API_URL ?? 'http://localhost:4000/api/v1';

async function apiLogin(
  request: APIRequestContext,
  email: string,
): Promise<string> {
  const res = await request.post(`${API_BASE}/identity/login`, {
    data: { email, password: E2E_ADMIN_PASSWORD },
  });
  expect(res.ok(), `login ${email} → ${res.status()}`).toBeTruthy();
  const body = (await res.json()) as { data?: { accessToken?: string } };
  const token = body.data?.accessToken;
  expect(token, `token missing for ${email}`).toBeTruthy();
  return token as string;
}

test.describe('Admin — audit + tur bazlı yorum', () => {
  test('unauthenticated /admin/audit redirects to login', async ({ page }) => {
    await page.goto('/admin/audit', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/login/, { timeout: 20_000 });
  });

  test('customer cannot call admin audit API', async ({ request }) => {
    const res = await request.post(`${API_BASE}/identity/login`, {
      data: {
        email: 'customer01@demo.turta.com',
        password: E2E_ADMIN_PASSWORD,
      },
    });
    expect(res.ok()).toBeTruthy();
    const body = (await res.json()) as { data?: { accessToken?: string } };
    const token = body.data?.accessToken;
    expect(token).toBeTruthy();

    const denied = await request.get(`${API_BASE}/admin/audit-logs`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(denied.status()).toBeGreaterThanOrEqual(400);
  });

  test('two admins suspend then unsuspend — both appear in audit log', async ({
    page,
    request,
  }) => {
    const tokenA = await apiLogin(request, ADMIN_A);
    // throttle: ikinci login için kısa bekleme
    await new Promise((r) => setTimeout(r, 15_000));
    const tokenB = await apiLogin(request, ADMIN_B);

    const partnersRes = await request.get(`${API_BASE}/admin/partners`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    expect(partnersRes.ok()).toBeTruthy();
    const partnersBody = (await partnersRes.json()) as {
      data?: Array<{ id: string; status: string }>;
    };
    const partner =
      partnersBody.data?.find((p) => p.status === 'VERIFIED') ??
      partnersBody.data?.[0];
    expect(partner, 'No partners').toBeTruthy();

    if (partner!.status !== 'VERIFIED') {
      const restore = await request.patch(
        `${API_BASE}/admin/partners/${partner!.id}/status`,
        {
          headers: { Authorization: `Bearer ${tokenA}` },
          data: { status: 'VERIFIED' },
        },
      );
      expect(restore.ok()).toBeTruthy();
    }

    const suspendRes = await request.patch(
      `${API_BASE}/admin/partners/${partner!.id}/status`,
      {
        headers: { Authorization: `Bearer ${tokenA}` },
        data: { status: 'SUSPENDED', note: 'E2E askı — admin A' },
      },
    );
    expect(suspendRes.ok(), await suspendRes.text()).toBeTruthy();

    const unsuspendRes = await request.patch(
      `${API_BASE}/admin/partners/${partner!.id}/status`,
      {
        headers: { Authorization: `Bearer ${tokenB}` },
        data: { status: 'VERIFIED' },
      },
    );
    expect(unsuspendRes.ok(), await unsuspendRes.text()).toBeTruthy();

    const auditRes = await request.get(
      `${API_BASE}/admin/audit-logs/entity/Agency/${partner!.id}`,
      { headers: { Authorization: `Bearer ${tokenB}` } },
    );
    expect(auditRes.ok()).toBeTruthy();
    const auditBody = (await auditRes.json()) as {
      data?: Array<{
        action: string;
        actionLabel: string;
        actorEmail: string | null;
      }>;
    };
    const rows = auditBody.data ?? [];
    expect(rows.some((r) => r.action === 'AGENCY_SUSPENDED')).toBeTruthy();
    expect(
      rows.some(
        (r) =>
          r.action === 'AGENCY_UNSUSPENDED' || r.action === 'AGENCY_VERIFIED',
      ),
    ).toBeTruthy();
    expect(
      rows.some((r) => r.actorEmail === ADMIN_A) &&
        rows.some((r) => r.actorEmail === ADMIN_B),
    ).toBeTruthy();

    // UI doğrulama (throttle yüzünden login başarısızsa atlanır)
    if (await loginAdmin(page, ADMIN_A)) {
      if (await gotoAdmin(page, '/admin/audit', 'admin-audit-page')) {
        await expect(page.getByTestId('admin-audit-list')).toContainText(
          /Acente Askıya Alındı/i,
        );
      }
    }
  });

  test('tour-grouped reviews + hide is logged', async ({ page, request }) => {
    await new Promise((r) => setTimeout(r, 15_000));
    const token = await apiLogin(request, ADMIN_A);

    const toursRes = await request.get(`${API_BASE}/admin/reviews/tours`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(toursRes.ok()).toBeTruthy();
    const toursBody = (await toursRes.json()) as {
      data?: Array<{ tourId: string }>;
    };
    const tourId = toursBody.data?.[0]?.tourId;
    expect(tourId, 'No tour review groups').toBeTruthy();

    const detailRes = await request.get(
      `${API_BASE}/admin/reviews/tours/${tourId}?includeHidden=1`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    expect(detailRes.ok()).toBeTruthy();
    const detail = (await detailRes.json()) as {
      data?: { reviews?: Array<{ id: string; hidden: boolean }> };
    };
    const review = detail.data?.reviews?.find((r) => !r.hidden);
    expect(review, 'No visible review').toBeTruthy();

    const hideRes = await request.patch(
      `${API_BASE}/admin/reviews/${review!.id}/hide`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    expect(hideRes.ok()).toBeTruthy();

    const restoreRes = await request.patch(
      `${API_BASE}/admin/reviews/${review!.id}/restore`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    expect(restoreRes.ok()).toBeTruthy();

    const auditRes = await request.get(
      `${API_BASE}/admin/audit-logs?action=REVIEW_HIDDEN&take=20`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    expect(auditRes.ok()).toBeTruthy();
    const auditBody = (await auditRes.json()) as {
      data?: Array<{ action: string; entityId: string | null }>;
    };
    expect(
      (auditBody.data ?? []).some(
        (r) => r.action === 'REVIEW_HIDDEN' && r.entityId === review!.id,
      ),
    ).toBeTruthy();

    if (await loginAdmin(page, ADMIN_A)) {
      if (await gotoAdmin(page, '/admin/reviews', 'admin-reviews-page')) {
        await expect(
          page.getByTestId(`admin-review-tour-toggle-${tourId}`),
        ).toBeVisible({ timeout: 15_000 });
      }
    }
  });
});
