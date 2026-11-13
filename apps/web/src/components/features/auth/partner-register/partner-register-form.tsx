'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, Mail, X } from 'lucide-react';

import { MailtoLink } from '@/components/ui/mailto-link';
import {
  partnerRegisterStepOneSchema,
  partnerRegisterStepTwoSchema,
  type PartnerRegisterStepOne,
  type PartnerRegisterStepTwo,
} from '@/lib/auth-schemas';
import { AUTH_LINKS } from '@/lib/site-nav';
import { ApiError } from '@/services/api-client';
import { registerPartner } from '@/services/identity';

import { PartnerRegisterStepOneFields } from './partner-register-step-one';
import { PartnerRegisterStepTwoFields } from './partner-register-step-two';
import { PartnerRegisterStepper } from './partner-register-stepper';

export function PartnerRegisterForm() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const stepOne = useForm<PartnerRegisterStepOne>({
    resolver: zodResolver(partnerRegisterStepOneSchema),
    defaultValues: {
      companyName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
    mode: 'onTouched',
  });

  const stepTwo = useForm<PartnerRegisterStepTwo>({
    resolver: zodResolver(partnerRegisterStepTwoSchema),
    defaultValues: {
      phone: '',
      address: '',
      city: '',
      country: 'Türkiye',
      website: '',
      description: '',
      taxNumber: '',
      role: '',
      termsAccepted: false,
    },
    mode: 'onTouched',
  });

  const isSubmitting = stepTwo.formState.isSubmitting;
  const busy = stepOne.formState.isSubmitting || isSubmitting;

  const goNext = stepOne.handleSubmit(() => {
    setFormError(null);
    setStep(2);
  });

  const goBack = () => {
    if (busy) return;
    setFormError(null);
    setStep(1);
  };

  const onSubmit = stepTwo.handleSubmit(async (values) => {
    if (busy) return;
    setFormError(null);

    const stepOneValid = await stepOne.trigger();
    if (!stepOneValid) {
      setStep(1);
      setFormError('Kurumsal bilgileri tamamlayın ve tekrar deneyin.');
      return;
    }

    const corporate = stepOne.getValues();

    try {
      await registerPartner({
        companyName: corporate.companyName,
        contactEmail: corporate.email,
        contactPhone: values.phone || undefined,
        password: corporate.password,
        taxNumber: values.taxNumber || undefined,
      });
      router.push(
        `/partner-verification?email=${encodeURIComponent(corporate.email)}`,
      );
    } catch (err) {
      setFormError(
        err instanceof ApiError
          ? err.message
          : 'Kayıt sırasında bir hata oluştu. Lütfen tekrar deneyin.',
      );
    }
  });

  return (
    <div className="w-full">
      <p className="mb-5 max-w-prose text-sm leading-relaxed text-neutral-500">
        Bilgileriniz güvenli şekilde iletilir. Hesabınız varsa{' '}
        <Link
          href={AUTH_LINKS.partnerLogin}
          className="font-medium text-neutral-950 underline-offset-2 hover:underline"
        >
          giriş yapın
        </Link>
        .
      </p>

      <PartnerRegisterStepper step={step} />

      {formError ? (
        <div
          role="alert"
          className="mb-5 flex items-start rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-800"
        >
          <AlertCircle className="mr-2 mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <span className="flex-1 leading-tight">{formError}</span>
          <button
            type="button"
            onClick={() => setFormError(null)}
            className="rounded-full p-0.5 text-red-400 hover:bg-red-100"
            aria-label="Kapat"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : null}

      <div className="relative min-h-[28rem]">
        <div
          className={`transition-all duration-300 ease-out ${
            step === 1
              ? 'relative translate-x-0 opacity-100'
              : 'pointer-events-none absolute inset-x-0 top-0 -translate-x-3 opacity-0'
          }`}
          aria-hidden={step !== 1}
          {...(step !== 1 ? { inert: true } : {})}
        >
          <PartnerRegisterStepOneFields
            form={stepOne}
            disabled={busy}
            showPassword={showPassword}
            onTogglePassword={() => setShowPassword((v) => !v)}
            onContinue={goNext}
          />
        </div>

        <div
          className={`transition-all duration-300 ease-out ${
            step === 2
              ? 'relative translate-x-0 opacity-100'
              : 'pointer-events-none absolute inset-x-0 top-0 translate-x-3 opacity-0'
          }`}
          aria-hidden={step !== 2}
          {...(step !== 2 ? { inert: true } : {})}
        >
          <PartnerRegisterStepTwoFields
            form={stepTwo}
            disabled={busy}
            isSubmitting={isSubmitting}
            onBack={goBack}
            onSubmit={onSubmit}
          />
        </div>
      </div>

      <div className="mt-8 rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-center sm:text-left">
        <p className="text-sm font-semibold text-neutral-900">
          Kurumsal destek
        </p>
        <p className="mt-1 text-xs leading-relaxed text-neutral-600">
          Başvuru veya sözleşme sorularınız için acente destek ekibimize yazın.
        </p>
        <MailtoLink
          emailKey="partner"
          subject="Acente başvuru desteği"
          className="mt-3 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-neutral-950 px-4 text-sm font-semibold text-white transition hover:bg-neutral-800"
        >
          <Mail className="h-4 w-4" aria-hidden />
          Acente destek e-postası
        </MailtoLink>
      </div>
    </div>
  );
}
