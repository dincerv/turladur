'use client';

import { useEffect, useState } from 'react';
import { Clock3 } from 'lucide-react';

const HOLD_HINT_MS = 10 * 60 * 1000;

function formatClock(totalSeconds: number): string {
  const safe = Math.max(0, totalSeconds);
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

type CheckoutHoldBannerProps = {
  /** ISO deadline from reservation.holdExpiresAt after create. */
  holdExpiresAt?: string | null;
  /** When true, start a soft 10 dk countdown (payment step entered). */
  softCountdown?: boolean;
};

/**
 * Soft-live hold UX — API hold is 10 dk after create; FE warns earlier on payment step.
 * Soft-live domain: Vercel (NEXT_PUBLIC_APP_URL), not turta.com.tr yet.
 */
export function CheckoutHoldBanner({
  holdExpiresAt,
  softCountdown = false,
}: CheckoutHoldBannerProps) {
  const [now, setNow] = useState(() => Date.now());
  const [softDeadline] = useState(() =>
    softCountdown ? Date.now() + HOLD_HINT_MS : null,
  );

  useEffect(() => {
    if (!holdExpiresAt && !softDeadline) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [holdExpiresAt, softDeadline]);

  const deadlineMs = holdExpiresAt
    ? new Date(holdExpiresAt).getTime()
    : softDeadline;
  const remainingSec =
    deadlineMs != null ? Math.ceil((deadlineMs - now) / 1000) : null;
  const expired = remainingSec != null && remainingSec <= 0;
  const live = holdExpiresAt != null;

  return (
    <div
      data-testid="checkout-hold-banner"
      data-hold-live={live ? 'true' : 'false'}
      data-hold-expired={expired ? 'true' : 'false'}
      className={`mb-6 flex items-start gap-3 rounded-lg border px-4 py-3 text-sm ${
        expired
          ? 'border-red-200 bg-red-50 text-red-900'
          : 'border-sky-200 bg-sky-50 text-sky-950'
      }`}
    >
      <Clock3 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <div className="min-w-0 flex-1">
        {expired ? (
          <p data-testid="checkout-hold-expired">
            Hold süresi doldu. Koltuklar serbest bırakıldı — lütfen tur
            sayfasından yeniden rezervasyon başlatın.
          </p>
        ) : live ? (
          <p>
            Ödeme hold süresi:{' '}
            <strong data-testid="checkout-hold-countdown">
              {formatClock(remainingSec ?? 0)}
            </strong>
            . Süre dolmadan ödemeyi tamamlayın.
          </p>
        ) : (
          <p>
            Onayda koltuklar <strong>10 dakika</strong> hold edilir
            {remainingSec != null ? (
              <>
                {' '}
                (
                <span data-testid="checkout-hold-soft-countdown">
                  {formatClock(remainingSec)}
                </span>
                )
              </>
            ) : null}
            . Soft-live ortamında ödeme mock kart ile tamamlanır.
          </p>
        )}
      </div>
    </div>
  );
}
