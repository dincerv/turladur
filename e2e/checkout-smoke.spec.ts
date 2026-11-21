import { test, expect } from '@playwright/test';

/**
 * Soft-live browser checkout smoke (Vercel / local — not turta.com.tr yet).
 * Builds checkout URL from catalog API, walks UI steps, mock card (…0016).
 * Skips when API/web/seed unavailable or OTP debug code missing.
 */

const apiBase = process.env.API_URL ?? 'http://localhost:4000/api/v1';
/** Mock gateway: not ending 0008/0000 → immediate SUCCESS (no 3DS). */
const MOCK_SUCCESS_CARD = '5528790000000016';
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
  options?: { data?: unknown },
): Promise<{ status: number; body: ApiEnvelope<T> }> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
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

test.describe('Checkout — browser smoke', () => {
  test('hold banner visible; guest card path reaches success', async ({
    page,
    request,
  }) => {
    const health = await request.get(`${apiBase}/health`);
    test.skip(!health.ok(), 'API not running');

    const search = await apiJson<
      Array<{ id: string; slug?: string; title?: string }>
    >(request, 'get', '/catalog/tours/search?limit=15');
    test.skip(
      !search.body.success || !(search.body.data?.length ?? 0),
      'No published tours',
    );

    let tourKey: string | null = null;
    let dateId: string | null = null;
    for (const tour of search.body.data ?? []) {
      const dates = await apiJson<
        Array<{
          id: string;
          startDate?: string;
          remainingCapacity?: number;
          isActive?: boolean;
        }>
      >(request, 'get', `/catalog/tours/${tour.id}/dates`);
      const open = (dates.body.data ?? []).find(
        (d) =>
          d.isActive !== false &&
          (d.remainingCapacity ?? 0) > 0 &&
          (!d.startDate ||
            new Date(d.startDate) >= new Date(new Date().toDateString())),
      );
      if (!open) continue;
      const pickups = await apiJson<Array<{ id: string }>>(
        request,
        'get',
        `/catalog/tours/${tour.id}/pickup-points`,
      );
      if (!(pickups.body.data ?? []).length) continue;
      tourKey = tour.slug || tour.id;
      dateId = open.id;
      break;
    }
    test.skip(!tourKey || !dateId, 'No tour with capacity + pickup');

    const stamp = Date.now();
    const email = `e2e-checkout-${stamp}@turta.test`;
    const qs = new URLSearchParams({
      type: 'tour',
      itemId: tourKey!,
      dateId: dateId!,
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
    await expect(page.getByTestId('checkout-guest-first-0')).toBeVisible({
      timeout: 10_000,
    });

    await page.getByTestId('checkout-guest-first-0').fill('E2E');
    await page.getByTestId('checkout-guest-last-0').fill('Checkout');
    await page.getByTestId('checkout-guest-tckn-0').fill(VALID_TCKN);
    await page.getByTestId('checkout-guest-email-0').fill(email);
    await page
      .getByTestId('checkout-guest-address-0')
      .fill('Kadikoy Istanbul Test Mahallesi');
    await page.getByTestId('phone-local-input').fill('5551112233');
    // Kurumsal fatura kapalı: fatura birincil katılımcıdan türetilir
    await expect(
      page.getByTestId('checkout-want-company-invoice'),
    ).not.toBeChecked();

    await page.getByTestId('checkout-guests-next').click();
    await expect(page.getByTestId('checkout-hold-banner')).toBeVisible({
      timeout: 10_000,
    });
    await expect(
      page.getByTestId('checkout-hold-soft-countdown'),
    ).toBeVisible();

    await page.getByTestId('checkout-pay-card').click();
    await page.getByTestId('checkout-card-name').fill('E2E Checkout');
    await page.getByTestId('checkout-card-number').fill(MOCK_SUCCESS_CARD);
    await page.getByTestId('checkout-card-expiry').fill('12/30');
    await page.getByTestId('checkout-card-cvc').fill('123');

    await page.getByTestId('otp-send-btn').click();
    const debug = page.getByTestId('otp-debug-code');
    const hasDebug = await debug
      .isVisible({ timeout: 15_000 })
      .catch(() => false);
    test.skip(
      !hasDebug,
      'OTP debugCode unavailable (prod mail / OTP_SHOW_DEBUG_CODE)',
    );
    const code = await debug.getAttribute('data-code');
    expect(code).toMatch(/^\d{6}$/);
    await page.getByTestId('otp-code-input').fill(code!);
    await page.getByTestId('otp-verify-btn').click();
    await expect(page.getByText(/E-posta doğrulandı/i)).toBeVisible({
      timeout: 15_000,
    });

    await page.getByTestId('checkout-payment-next').click();
    await expect(page.getByTestId('checkout-submit')).toBeVisible();
    await page.getByTestId('checkout-submit').click();

    await expect(page.getByTestId('checkout-success-page')).toBeVisible({
      timeout: 60_000,
    });
    await expect(page.getByText(/Rezervasyonunuz alındı/i)).toBeVisible();
  });
});
