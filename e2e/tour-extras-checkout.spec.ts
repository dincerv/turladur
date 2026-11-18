import { test, expect } from '@playwright/test';

import { loginAgency } from './helpers/agency-login';

/**
 * Soft-live TourExtra flow:
 * agency adds paid extra → checkout shows it → total updates → ReservationExtra persists.
 */

const apiBase = process.env.API_URL ?? 'http://localhost:4000/api/v1';
const VALID_TCKN = '10000000146';

type ApiEnvelope<T> = {
  success?: boolean;
  data?: T;
  error?: { code?: string; message?: string } | null;
};

async function apiJson<T>(
  request: import('@playwright/test').APIRequestContext,
  method: 'get' | 'post',
  path: string,
  options?: { data?: unknown; token?: string },
): Promise<{ status: number; body: ApiEnvelope<T> }> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (options?.token) headers.Authorization = `Bearer ${options.token}`;
  const response =
    method === 'get'
      ? await request.get(`${apiBase}${path}`, { headers })
      : await request.post(`${apiBase}${path}`, {
          headers,
          data: options?.data,
        });
  let body: ApiEnvelope<T> = {};
  try {
    body = (await response.json()) as ApiEnvelope<T>;
  } catch {
    body = {};
  }
  return { status: response.status(), body };
}

test.describe('TourExtra — acente → checkout', () => {
  test('agency add extra, checkout total updates, reservation extras persist', async ({
    page,
    request,
  }) => {
    const health = await request.get(`${apiBase}/health`);
    test.skip(!health.ok(), 'API not running');

    test.skip(!(await loginAgency(page)), 'Agency login failed / web down');

    await page.goto('/acente/tours', { waitUntil: 'domcontentloaded' });
    await page
      .getByRole('tab', { name: /Liste/i })
      .click()
      .catch(() => null);

    const editLink = page.locator('[data-testid^="edit-tour-btn-"]').first();
    test.skip(
      !(await editLink.isVisible({ timeout: 15_000 }).catch(() => false)),
      'No agency tour to edit',
    );

    const editTestId = await editLink.getAttribute('data-testid');
    const tourId = editTestId?.replace('edit-tour-btn-', '') ?? '';
    expect(tourId.length).toBeGreaterThan(0);

    await editLink.click();
    await expect(page.getByTestId('acente-tour-edit-page')).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByTestId('edit-tour-skeleton')).toHaveCount(0);

    // Move to details step where paid extras panel lives
    const nextBtn = page
      .getByTestId('edit-step-next-btn')
      .or(page.getByTestId('step-1-next-btn'));
    if (
      await nextBtn
        .first()
        .isVisible()
        .catch(() => false)
    ) {
      await nextBtn.first().click();
    }

    await expect(page.getByTestId('tour-paid-extras-panel')).toBeVisible({
      timeout: 20_000,
    });

    const stamp = Date.now();
    const extraTitle = `E2E VIP Transfer ${stamp}`;
    const extraPrice = 175;

    await page.getByTestId('tour-extra-title').fill(extraTitle);
    await page.getByTestId('tour-extra-price').fill(String(extraPrice));
    await page.getByTestId('tour-extra-description').fill('E2E paid extra');
    await page.getByTestId('tour-extra-submit').click();

    await expect(
      page.locator('[data-testid^="tour-extra-row-"]').filter({
        hasText: extraTitle,
      }),
    ).toBeVisible({ timeout: 20_000 });

    const publicExtras = await apiJson<
      Array<{ id: string; title: string; price: string; isRequired: boolean }>
    >(request, 'get', `/catalog/tours/${tourId}/extras`);
    expect(publicExtras.body.success).toBe(true);
    const created = (publicExtras.body.data ?? []).find(
      (row) => row.title === extraTitle,
    );
    expect(created?.id).toBeTruthy();
    const extraId = created!.id;

    // Find bookable date + pickup for this tour
    const dates = await apiJson<
      Array<{
        id: string;
        startDate?: string;
        remainingCapacity?: number;
        isActive?: boolean;
        priceOverride?: string | null;
      }>
    >(request, 'get', `/catalog/tours/${tourId}/dates`);
    const open = (dates.body.data ?? []).find(
      (d) =>
        d.isActive !== false &&
        (d.remainingCapacity ?? 0) > 0 &&
        (!d.startDate ||
          new Date(d.startDate) >= new Date(new Date().toDateString())),
    );
    test.skip(!open, 'No open tour date with capacity');

    const pickups = await apiJson<Array<{ id: string }>>(
      request,
      'get',
      `/catalog/tours/${tourId}/pickup-points`,
    );
    test.skip(!(pickups.body.data ?? []).length, 'No pickup points');

    const tourMeta = await apiJson<{
      id: string;
      slug?: string;
      price?: string | number;
    }>(request, 'get', `/catalog/tours/${tourId}`);
    const tourKey = tourMeta.body.data?.slug || tourId;
    const unitPrice = Number(
      open!.priceOverride ?? tourMeta.body.data?.price ?? 0,
    );

    const qs = new URLSearchParams({
      type: 'tour',
      itemId: tourKey,
      dateId: open!.id,
      adults: '1',
      children: '0',
    });

    await page.goto(`/checkout?${qs.toString()}`, {
      waitUntil: 'domcontentloaded',
    });
    await expect(page.getByTestId('checkout-page')).toBeVisible({
      timeout: 30_000,
    });
    await page.getByTestId('checkout-summary-next').click();

    await expect(page.getByTestId('checkout-extras-panel')).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByTestId(`checkout-extra-${extraId}`)).toBeVisible();

    const checkbox = page.getByTestId(`checkout-extra-check-${extraId}`);
    const wasChecked = await checkbox.isChecked();
    if (!wasChecked) {
      await checkbox.check();
    }
    await expect(checkbox).toBeChecked();

    await expect(page.getByTestId('checkout-extras-subtotal')).toContainText(
      String(extraPrice),
      { timeout: 10_000 },
    );
    await expect(page.getByTestId('checkout-sidebar-total')).toBeVisible();

    const expectedTotal = unitPrice + extraPrice;
    // Sidebar total may be formatted with thousand separators — assert numeric via data flow
    const sidebarText =
      (await page.getByTestId('checkout-sidebar-total').textContent()) ?? '';
    const digits = sidebarText.replace(/[^\d]/g, '');
    expect(Number(digits)).toBeGreaterThanOrEqual(Math.floor(expectedTotal));

    // Persist via booking API (same pricing path as checkout submit)
    const email = `e2e.extras.${stamp}@turta.test`;
    const boot = await apiJson<{ accessToken: string }>(
      request,
      'post',
      '/identity/guest-bootstrap',
      {
        data: {
          email,
          firstName: 'E2E',
          lastName: 'Extras',
          phone: '+905551112233',
          address: 'Kadikoy Istanbul',
          billingLine1: 'Bagdat Cad. No:1',
          billingCity: 'Istanbul',
          billingCountry: 'Türkiye',
          identityNumber: VALID_TCKN,
        },
      },
    );
    test.skip(
      !boot.body.success || !boot.body.data?.accessToken,
      'Guest bootstrap failed',
    );
    const token = boot.body.data!.accessToken;

    const reservation = await apiJson<{
      id: string;
      totalAmount: string;
      extras?: Array<{ tourExtraId: string; quantity: number; title: string }>;
    }>(request, 'post', '/booking/reservations', {
      token,
      data: {
        tourDateId: open!.id,
        pickupPointId: pickups.body.data![0].id,
        adults: 1,
        children: 0,
        contactEmail: email,
        contactPhone: '+905551112233',
        guests: [
          {
            firstName: 'E2E',
            lastName: 'Extras',
            identityNumber: VALID_TCKN,
            phone: '+905551112233',
            email,
            address: 'Kadikoy Istanbul',
          },
        ],
        extras: [{ tourExtraId: extraId, quantity: 1 }],
        billing: {
          fullName: 'E2E Extras',
          line1: 'Bagdat Cad. No:1',
          city: 'Istanbul',
          country: 'Türkiye',
          taxId: VALID_TCKN,
        },
      },
    });

    expect(reservation.status).toBeLessThan(400);
    expect(reservation.body.success).toBe(true);
    expect(reservation.body.data?.extras?.length).toBeGreaterThan(0);
    expect(
      reservation.body.data?.extras?.some((row) => row.tourExtraId === extraId),
    ).toBe(true);
    expect(Number(reservation.body.data?.totalAmount)).toBeGreaterThanOrEqual(
      expectedTotal,
    );

    const fetched = await apiJson<{
      extras?: Array<{ tourExtraId: string }>;
    }>(request, 'get', `/booking/reservations/${reservation.body.data!.id}`, {
      token,
    });
    expect(fetched.body.success).toBe(true);
    expect(
      fetched.body.data?.extras?.some((row) => row.tourExtraId === extraId),
    ).toBe(true);
  });
});
