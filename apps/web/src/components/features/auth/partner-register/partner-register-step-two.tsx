'use client';

import Link from 'next/link';
import { ChevronLeft, Loader2, MapPin, Phone, UserPlus } from 'lucide-react';
import type { UseFormReturn } from 'react-hook-form';

import type { PartnerRegisterStepTwo } from '@/lib/auth-schemas';

import {
  PARTNER_FIELD_ERR,
  PARTNER_INPUT,
  PARTNER_INPUT_ERR,
  PARTNER_INPUT_OK,
  PARTNER_LABEL,
} from './form-styles';

type PartnerRegisterStepTwoProps = {
  form: UseFormReturn<PartnerRegisterStepTwo>;
  disabled: boolean;
  isSubmitting: boolean;
  onBack: () => void;
  onSubmit: () => void;
};

export function PartnerRegisterStepTwoFields({
  form,
  disabled,
  isSubmitting,
  onBack,
  onSubmit,
}: PartnerRegisterStepTwoProps) {
  const {
    register,
    formState: { errors },
  } = form;

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
      noValidate
    >
      <div>
        <label htmlFor="phone" className={PARTNER_LABEL}>
          Telefon
        </label>
        <div className="relative">
          <Phone
            className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-neutral-400"
            aria-hidden
          />
          <input
            id="phone"
            autoComplete="tel"
            aria-invalid={Boolean(errors.phone)}
            disabled={disabled}
            className={`${PARTNER_INPUT} ${errors.phone ? PARTNER_INPUT_ERR : PARTNER_INPUT_OK}`}
            placeholder="+90 5xx xxx xx xx"
            {...register('phone')}
          />
        </div>
        {errors.phone ? (
          <p className={PARTNER_FIELD_ERR}>{errors.phone.message}</p>
        ) : null}
      </div>

      <div>
        <label htmlFor="address" className={PARTNER_LABEL}>
          Adres
        </label>
        <div className="relative">
          <MapPin
            className="pointer-events-none absolute top-3 left-3 h-4 w-4 text-neutral-400"
            aria-hidden
          />
          <textarea
            id="address"
            rows={2}
            autoComplete="street-address"
            aria-invalid={Boolean(errors.address)}
            disabled={disabled}
            className={`${PARTNER_INPUT} ${errors.address ? PARTNER_INPUT_ERR : PARTNER_INPUT_OK}`}
            {...register('address')}
          />
        </div>
        {errors.address ? (
          <p className={PARTNER_FIELD_ERR}>{errors.address.message}</p>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="city" className={PARTNER_LABEL}>
            Şehir
          </label>
          <input
            id="city"
            autoComplete="address-level2"
            aria-invalid={Boolean(errors.city)}
            disabled={disabled}
            className={`${PARTNER_INPUT} pl-4 ${errors.city ? PARTNER_INPUT_ERR : PARTNER_INPUT_OK}`}
            {...register('city')}
          />
          {errors.city ? (
            <p className={PARTNER_FIELD_ERR}>{errors.city.message}</p>
          ) : null}
        </div>
        <div>
          <label htmlFor="country" className={PARTNER_LABEL}>
            Ülke
          </label>
          <input
            id="country"
            autoComplete="country-name"
            aria-invalid={Boolean(errors.country)}
            disabled={disabled}
            className={`${PARTNER_INPUT} pl-4 ${errors.country ? PARTNER_INPUT_ERR : PARTNER_INPUT_OK}`}
            {...register('country')}
          />
          {errors.country ? (
            <p className={PARTNER_FIELD_ERR}>{errors.country.message}</p>
          ) : null}
        </div>
      </div>

      <div>
        <label htmlFor="taxNumber" className={PARTNER_LABEL}>
          Vergi no (opsiyonel)
        </label>
        <input
          id="taxNumber"
          disabled={disabled}
          className={`${PARTNER_INPUT} pl-4 ${PARTNER_INPUT_OK}`}
          {...register('taxNumber')}
        />
      </div>

      <label className="flex items-start gap-2 text-xs text-neutral-600">
        <input
          type="checkbox"
          className="mt-0.5 h-4 w-4 rounded border-neutral-300 text-neutral-950 focus:ring-neutral-950"
          disabled={disabled}
          {...register('termsAccepted')}
        />
        <span>
          <Link href="/terms" className="underline underline-offset-2">
            Kullanım Şartları
          </Link>{' '}
          ve{' '}
          <Link href="/privacy" className="underline underline-offset-2">
            Gizlilik Politikası
          </Link>
          ’nı kabul ediyorum.
        </span>
      </label>
      {errors.termsAccepted ? (
        <p className={PARTNER_FIELD_ERR}>{errors.termsAccepted.message}</p>
      ) : null}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          disabled={disabled}
          className="inline-flex min-h-11 flex-1 items-center justify-center rounded-lg border border-neutral-300 bg-white px-4 text-sm font-semibold text-neutral-800 transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <ChevronLeft className="mr-1 h-4 w-4" aria-hidden />
          Geri
        </button>
        <button
          type="submit"
          disabled={disabled}
          className="inline-flex min-h-11 flex-[1.4] items-center justify-center rounded-lg bg-neutral-950 px-4 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
              Gönderiliyor...
            </>
          ) : (
            <>
              <UserPlus className="mr-1.5 h-4 w-4" aria-hidden />
              Başvuruyu Tamamla
            </>
          )}
        </button>
      </div>
    </form>
  );
}
