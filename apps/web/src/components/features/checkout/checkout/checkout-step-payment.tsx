'use client';

import { Building2, ChevronLeft, ChevronRight, CreditCard } from 'lucide-react';
import { EmailOtpPanel } from '@/components/features/auth/email-otp-panel';
import { BANK_TRANSFER_DETAILS } from '@/lib/constants/bank-transfer';

import { useCheckoutUi } from './checkout-context';
import {
  detectCardBrand,
  formatCardNumberInput,
  formatCvcInput,
  formatExpiryInput,
} from './checkout.helpers';

/** Split from checkout-client.tsx (Faz 7) — CheckoutStepPayment; UI unchanged. */
export function CheckoutStepPayment() {
  const {
    paymentMethod,
    setPaymentMethod,
    bankTransferAck,
    setBankTransferAck,
    cardName,
    setCardName,
    cardNumber,
    setCardNumber,
    cardExpiry,
    setCardExpiry,
    cardCvc,
    setCardCvc,
    cardBrand,
    cardBrandLabel,
    expectedCvcLength,
    primaryEmail,
    guests,
    setEmailOtpVerified,
    canProceedPayment,
    setCurrentStep,
  } = useCheckoutUi();

  return (
    <div className="rounded-xl border border-neutral-200/70 bg-white p-6 shadow-sm sm:p-8">
      <h2 className="mb-6 text-xl font-bold text-neutral-900">Ödeme Yöntemi</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => {
            setPaymentMethod('bank_transfer');
            setBankTransferAck(false);
          }}
          className={`rounded-xl border p-4 text-left ${
            paymentMethod === 'bank_transfer'
              ? 'border-neutral-950 bg-neutral-50'
              : 'border-neutral-200'
          }`}
        >
          <Building2 className="mb-2 h-5 w-5" />
          <p className="font-semibold">Havale / EFT</p>
          <p className="text-xs text-neutral-500">
            IBAN bilgilerini görüp onaylayın
          </p>
        </button>
        <button
          type="button"
          data-testid="checkout-pay-card"
          onClick={() => {
            setPaymentMethod('card');
            setBankTransferAck(false);
          }}
          className={`rounded-xl border p-4 text-left ${
            paymentMethod === 'card'
              ? 'border-neutral-950 bg-neutral-50'
              : 'border-neutral-200'
          }`}
        >
          <CreditCard className="mb-2 h-5 w-5" />
          <p className="font-semibold">Kredi / Banka Kartı</p>
          <p className="text-xs text-neutral-500">
            Kart (3DS): …0008 mock 3DS · …0000 red · İyzico key varsa sandbox
            test kartı
          </p>
        </button>
      </div>

      {paymentMethod === 'bank_transfer' ? (
        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
          <p className="font-semibold">Havale / EFT bilgileri</p>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-amber-800/80">Banka</dt>
              <dd className="font-medium text-right">
                {BANK_TRANSFER_DETAILS.bankName}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-amber-800/80">Hesap sahibi</dt>
              <dd className="font-medium text-right">
                {BANK_TRANSFER_DETAILS.accountHolder}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-amber-800/80">Şube</dt>
              <dd className="font-medium text-right">
                {BANK_TRANSFER_DETAILS.branch}
              </dd>
            </div>
            <div className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:gap-3">
              <dt className="text-amber-800/80">IBAN</dt>
              <dd className="font-mono text-sm font-semibold tracking-wide sm:text-right">
                {BANK_TRANSFER_DETAILS.iban}
              </dd>
            </div>
          </dl>
          <p className="mt-3 text-xs text-amber-800">
            {BANK_TRANSFER_DETAILS.descriptionHint}. Partner ödemeyi
            onayladıktan sonra rezervasyon kesinleşir.
          </p>
          <label className="mt-4 flex cursor-pointer items-start gap-2 text-sm">
            <input
              type="checkbox"
              checked={bankTransferAck}
              onChange={(e) => setBankTransferAck(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-amber-400"
            />
            <span>
              IBAN ve havale bilgilerini okudum, ödemeyi bu hesaba yapacağımı
              onaylıyorum.
            </span>
          </label>
        </div>
      ) : null}

      {paymentMethod === 'card' ? (
        <div className="mt-6 space-y-3">
          <input
            data-testid="checkout-card-name"
            value={cardName}
            onChange={(e) => setCardName(e.target.value)}
            placeholder="Kart üzerindeki isim"
            autoComplete="cc-name"
            className="h-11 w-full rounded-lg border border-neutral-300 px-3 text-sm"
          />
          <div className="relative">
            <input
              data-testid="checkout-card-number"
              value={cardNumber}
              onChange={(e) => {
                const nextBrand = detectCardBrand(e.target.value);
                setCardNumber(formatCardNumberInput(e.target.value, nextBrand));
                setCardCvc((prev) => formatCvcInput(prev, nextBrand));
              }}
              placeholder="5528 7900 0000 0008"
              inputMode="numeric"
              autoComplete="cc-number"
              maxLength={19}
              className="h-11 w-full rounded-lg border border-neutral-300 px-3 pr-28 text-sm tracking-wide"
            />
            {cardBrandLabel ? (
              <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs font-semibold uppercase tracking-wide text-neutral-600">
                {cardBrandLabel}
              </span>
            ) : null}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input
              data-testid="checkout-card-expiry"
              value={cardExpiry}
              onChange={(e) => setCardExpiry(formatExpiryInput(e.target.value))}
              placeholder="AA/YY"
              inputMode="numeric"
              autoComplete="cc-exp"
              maxLength={5}
              className="h-11 rounded-lg border border-neutral-300 px-3 text-sm"
            />
            <input
              data-testid="checkout-card-cvc"
              value={cardCvc}
              onChange={(e) =>
                setCardCvc(formatCvcInput(e.target.value, cardBrand))
              }
              placeholder={cardBrand === 'amex' ? 'CVC (4)' : 'CVC'}
              inputMode="numeric"
              autoComplete="cc-csc"
              maxLength={expectedCvcLength}
              className="h-11 rounded-lg border border-neutral-300 px-3 text-sm"
            />
          </div>
        </div>
      ) : null}

      <div className="mt-6">
        <EmailOtpPanel
          email={primaryEmail}
          purpose="CHECKOUT"
          firstName={guests[0]?.firstName}
          verifyOnSubmit
          onVerified={() => setEmailOtpVerified(true)}
        />
        {!primaryEmail ? (
          <p className="mt-2 text-xs text-amber-700">
            Önce katılımcı formunda e-posta girin.
          </p>
        ) : null}
      </div>

      <div className="mt-8 flex justify-between">
        <button
          type="button"
          onClick={() => setCurrentStep(1)}
          className="inline-flex items-center gap-2 rounded-lg border border-neutral-300 px-4 py-2.5 text-sm font-medium"
        >
          <ChevronLeft className="h-4 w-4" />
          Geri
        </button>
        <button
          type="button"
          data-testid="checkout-payment-next"
          disabled={!canProceedPayment}
          onClick={() => setCurrentStep(3)}
          className="inline-flex items-center gap-2 rounded-lg bg-neutral-950 px-5 py-2.5 text-sm font-semibold text-white hover:bg-neutral-800 disabled:opacity-50"
        >
          Devam et
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
