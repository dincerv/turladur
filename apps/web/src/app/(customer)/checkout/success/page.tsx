'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { CheckCircle2, FileDown, Printer } from 'lucide-react';

import {
  downloadVoucherHtml,
  getReservationVoucher,
  openVoucherPrintWindow,
} from '@/services/booking';
import { useAuth } from '@/providers/auth-provider';

function formatPrice(price: number) {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
  }).format(price);
}

function CheckoutSuccessContent() {
  const searchParams = useSearchParams();
  const { accessToken } = useAuth();
  const bookingNumber = searchParams.get('bookingNumber') ?? '—';
  const reservationId = searchParams.get('reservationId');
  const title = searchParams.get('title') ?? 'Rezervasyon';
  const totalPrice = Number(searchParams.get('totalPrice') || 0);
  const paymentMethod = searchParams.get('paymentMethod') ?? 'bank_transfer';
  const paymentStatus = searchParams.get('paymentStatus');
  const startDate = searchParams.get('startDate');
  const [voucherError, setVoucherError] = useState<string | null>(null);
  const [voucherBusy, setVoucherBusy] = useState(false);

  const paidOk = paymentStatus !== 'failed';

  async function handleVoucher(action: 'download' | 'print') {
    if (!reservationId || !accessToken) {
      setVoucherError(
        'Voucher için giriş yapmanız ve rezervasyon kimliği gerekli.',
      );
      return;
    }
    setVoucherBusy(true);
    setVoucherError(null);
    try {
      const voucher = await getReservationVoucher(reservationId, accessToken);
      if (action === 'download') {
        downloadVoucherHtml(voucher.bookingNumber, voucher.html);
      } else {
        openVoucherPrintWindow(voucher.html);
      }
    } catch (err) {
      setVoucherError(err instanceof Error ? err.message : 'Voucher alınamadı');
    } finally {
      setVoucherBusy(false);
    }
  }

  return (
    <div
      className="min-h-screen bg-neutral-50 px-4 py-16"
      data-testid="checkout-success-page"
    >
      <div className="mx-auto max-w-lg rounded-xl border border-neutral-200 bg-white p-8 text-center shadow-sm">
        <CheckCircle2 className="mx-auto mb-4 h-14 w-14 text-emerald-600" />
        <h1 className="text-2xl font-bold text-neutral-900">
          {paidOk ? 'Rezervasyonunuz alındı' : 'Ödeme tamamlanamadı'}
        </h1>
        <p className="mt-2 text-neutral-600">
          {title}
          {startDate ? ` · ${startDate}` : ''}
        </p>
        <div className="mt-6 rounded-lg bg-neutral-50 p-4 text-left text-sm">
          <p>
            <span className="text-neutral-500">Rezervasyon no:</span>{' '}
            <strong>{bookingNumber}</strong>
          </p>
          <p className="mt-2">
            <span className="text-neutral-500">Toplam:</span>{' '}
            <strong>{formatPrice(totalPrice)}</strong>
          </p>
          <p className="mt-2">
            <span className="text-neutral-500">Ödeme:</span>{' '}
            {paymentMethod === 'card' ? 'Kart' : 'Havale / EFT'}
          </p>
          {paymentMethod !== 'card' ? (
            <p className="mt-3 text-xs text-neutral-500">
              Havale bilgileri e-posta ile iletilecektir. Ödeme onayı sonrası
              rezervasyonunuz kesinleşir.
            </p>
          ) : null}
        </div>

        {paidOk && reservationId && paymentMethod === 'card' ? (
          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <button
              type="button"
              disabled={voucherBusy}
              onClick={() => void handleVoucher('download')}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-neutral-300 px-4 py-2.5 text-sm font-medium text-neutral-800 hover:bg-neutral-50 disabled:opacity-60"
            >
              <FileDown className="h-4 w-4" />
              Voucher indir
            </button>
            <button
              type="button"
              disabled={voucherBusy}
              onClick={() => void handleVoucher('print')}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-neutral-300 px-4 py-2.5 text-sm font-medium text-neutral-800 hover:bg-neutral-50 disabled:opacity-60"
            >
              <Printer className="h-4 w-4" />
              Yazdır / PDF
            </button>
          </div>
        ) : null}
        {paymentMethod !== 'card' && paidOk ? (
          <p className="mt-4 text-xs text-neutral-500">
            Havale onayı sonrası voucher profilinizdeki Rezervasyonlar
            bölümünden indirilebilir.
          </p>
        ) : null}
        {voucherError ? (
          <p className="mt-3 text-sm text-red-600">{voucherError}</p>
        ) : null}

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/bookings"
            className="rounded-lg bg-neutral-950 px-5 py-2.5 text-sm font-semibold text-white hover:bg-neutral-800"
          >
            Rezervasyonlarım
          </Link>
          <Link
            href="/tours"
            className="rounded-lg border border-neutral-300 px-5 py-2.5 text-sm font-medium text-neutral-800 hover:bg-neutral-50"
          >
            Turlara dön
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<p className="p-16 text-center">Yükleniyor…</p>}>
      <CheckoutSuccessContent />
    </Suspense>
  );
}
