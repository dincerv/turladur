'use client';

import { CheckCircle2, ChevronLeft } from 'lucide-react';
import { BANK_TRANSFER_DETAILS } from '@/lib/constants/bank-transfer';

import { useCheckoutUi } from './checkout-context';
import { formatPrice } from './checkout.helpers';

/** Split from checkout-client.tsx (Faz 7) — CheckoutStepConfirm; UI unchanged. */
export function CheckoutStepConfirm() {
  const {
    title,
    party,
    guests,
    paymentMethod,
    totalPrice,
    submitting,
    handleSubmit,
    setCurrentStep,
  } = useCheckoutUi();

  return (
    <div className="rounded-xl border border-neutral-200/70 bg-white p-6 shadow-sm sm:p-8">
      <h2 className="mb-6 text-xl font-bold text-neutral-900">Onay</h2>
      <ul className="space-y-2 text-sm text-neutral-700">
        <li className="flex items-start gap-2">
          <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" />
          {title}
        </li>
        <li className="flex items-start gap-2">
          <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" />
          {party.adults} yetişkin
          {party.children > 0 ? `, ${party.children} çocuk` : ''}
        </li>
        <li className="flex items-start gap-2">
          <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" />
          {guests.length} katılımcı formu tamamlandı
        </li>
        <li className="flex items-start gap-2">
          <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" />
          Ödeme: {paymentMethod === 'card' ? 'Kart' : 'Havale / EFT'}
        </li>
        {paymentMethod === 'bank_transfer' ? (
          <li className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
            <p className="font-semibold">IBAN</p>
            <p className="mt-1 font-mono text-xs tracking-wide">
              {BANK_TRANSFER_DETAILS.iban}
            </p>
            <p className="mt-1 text-xs">
              {BANK_TRANSFER_DETAILS.bankName} ·{' '}
              {BANK_TRANSFER_DETAILS.accountHolder}
            </p>
          </li>
        ) : null}
        <li className="flex items-start gap-2 font-semibold">
          <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" />
          Toplam: {formatPrice(totalPrice)}
        </li>
      </ul>
      <div className="mt-8 flex justify-between">
        <button
          type="button"
          onClick={() => setCurrentStep(2)}
          className="inline-flex items-center gap-2 rounded-lg border border-neutral-300 px-4 py-2.5 text-sm font-medium"
        >
          <ChevronLeft className="h-4 w-4" />
          Geri
        </button>
        <button
          type="button"
          data-testid="checkout-submit"
          disabled={submitting}
          onClick={() => void handleSubmit()}
          className="inline-flex items-center gap-2 rounded-lg bg-neutral-950 px-5 py-2.5 text-sm font-semibold text-white hover:bg-neutral-800 disabled:opacity-60"
        >
          {submitting ? 'İşleniyor…' : 'Rezervasyonu tamamla'}
        </button>
      </div>
    </div>
  );
}
