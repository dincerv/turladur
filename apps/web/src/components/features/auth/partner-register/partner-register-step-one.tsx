'use client';

import { ArrowRight, Building2, Eye, EyeOff, Lock, Mail } from 'lucide-react';
import type { UseFormReturn } from 'react-hook-form';

import { CUSTOMER_PASSWORD_HINT } from '@/lib/auth-schemas';
import type { PartnerRegisterStepOne } from '@/lib/auth-schemas';

import {
  PARTNER_FIELD_ERR,
  PARTNER_INPUT,
  PARTNER_INPUT_ERR,
  PARTNER_INPUT_OK,
  PARTNER_LABEL,
} from './form-styles';

type PartnerRegisterStepOneProps = {
  form: UseFormReturn<PartnerRegisterStepOne>;
  disabled: boolean;
  showPassword: boolean;
  onTogglePassword: () => void;
  onContinue: () => void;
};

export function PartnerRegisterStepOneFields({
  form,
  disabled,
  showPassword,
  onTogglePassword,
  onContinue,
}: PartnerRegisterStepOneProps) {
  const {
    register,
    formState: { errors },
  } = form;

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        onContinue();
      }}
      noValidate
    >
      <div>
        <label htmlFor="companyName" className={PARTNER_LABEL}>
          Şirket Adı
        </label>
        <div className="relative">
          <Building2
            className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-neutral-400"
            aria-hidden
          />
          <input
            id="companyName"
            autoComplete="organization"
            aria-invalid={Boolean(errors.companyName)}
            disabled={disabled}
            className={`${PARTNER_INPUT} ${errors.companyName ? PARTNER_INPUT_ERR : PARTNER_INPUT_OK}`}
            placeholder="Şirketinizin unvanı"
            {...register('companyName')}
          />
        </div>
        {errors.companyName ? (
          <p className={PARTNER_FIELD_ERR}>{errors.companyName.message}</p>
        ) : null}
      </div>

      <div>
        <label htmlFor="partner-email" className={PARTNER_LABEL}>
          İş e-postası
        </label>
        <div className="relative">
          <Mail
            className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-neutral-400"
            aria-hidden
          />
          <input
            id="partner-email"
            type="email"
            autoComplete="email"
            aria-invalid={Boolean(errors.email)}
            disabled={disabled}
            className={`${PARTNER_INPUT} ${errors.email ? PARTNER_INPUT_ERR : PARTNER_INPUT_OK}`}
            placeholder="partner@sirketiniz.com"
            {...register('email')}
          />
        </div>
        {errors.email ? (
          <p className={PARTNER_FIELD_ERR}>{errors.email.message}</p>
        ) : null}
      </div>

      <div>
        <label htmlFor="partner-password" className={PARTNER_LABEL}>
          Şifre
        </label>
        <div className="relative">
          <Lock
            className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-neutral-400"
            aria-hidden
          />
          <input
            id="partner-password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            aria-invalid={Boolean(errors.password)}
            disabled={disabled}
            className={`${PARTNER_INPUT} pr-11 ${errors.password ? PARTNER_INPUT_ERR : PARTNER_INPUT_OK}`}
            {...register('password')}
          />
          <button
            type="button"
            className="absolute inset-y-0 right-0 flex min-w-11 items-center justify-center text-neutral-400 hover:text-neutral-600"
            onClick={onTogglePassword}
            aria-label={showPassword ? 'Şifreyi gizle' : 'Şifreyi göster'}
          >
            {showPassword ? (
              <EyeOff className="h-5 w-5" />
            ) : (
              <Eye className="h-5 w-5" />
            )}
          </button>
        </div>
        <p className="mt-1.5 text-xs text-neutral-500">
          {CUSTOMER_PASSWORD_HINT}
        </p>
        {errors.password ? (
          <p className={PARTNER_FIELD_ERR}>{errors.password.message}</p>
        ) : null}
      </div>

      <div>
        <label htmlFor="confirmPassword" className={PARTNER_LABEL}>
          Şifre tekrarı
        </label>
        <div className="relative">
          <Lock
            className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-neutral-400"
            aria-hidden
          />
          <input
            id="confirmPassword"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            aria-invalid={Boolean(errors.confirmPassword)}
            disabled={disabled}
            className={`${PARTNER_INPUT} ${errors.confirmPassword ? PARTNER_INPUT_ERR : PARTNER_INPUT_OK}`}
            {...register('confirmPassword')}
          />
        </div>
        {errors.confirmPassword ? (
          <p className={PARTNER_FIELD_ERR}>{errors.confirmPassword.message}</p>
        ) : null}
      </div>

      <button
        type="submit"
        disabled={disabled}
        className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-neutral-950 px-4 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        Devam Et
        <ArrowRight className="ml-1.5 h-4 w-4" aria-hidden />
      </button>
    </form>
  );
}
