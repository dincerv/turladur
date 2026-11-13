'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ArrowRight,
  Building2,
  ChevronLeft,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  MapPin,
  Phone,
  UserPlus,
  AlertCircle,
  X,
} from 'lucide-react';

import { BrandLogo } from '@/components/brand/brand-logo';
import { MailtoLink } from '@/components/ui/mailto-link';
import {
  CUSTOMER_PASSWORD_HINT,
  partnerRegisterStepOneSchema,
  partnerRegisterStepTwoSchema,
  type PartnerRegisterStepOne,
  type PartnerRegisterStepTwo,
} from '@/lib/auth-schemas';
import { AUTH_LINKS } from '@/lib/site-nav';
import { ApiError } from '@/services/api-client';
import { registerPartner } from '@/services/identity';

const PARTNER_REGISTER_VISUAL =
  'https://images.unsplash.com/photo-1551632436-cbf8dd35adfa?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80';

const INPUT =
  'block w-full rounded-lg border border-neutral-300 py-2.5 pl-9 pr-4 text-sm text-neutral-900 placeholder-neutral-400 shadow-sm transition focus:border-neutral-950 focus:outline-none focus:ring-1 focus:ring-neutral-300 disabled:opacity-60';
const INPUT_ERR = 'border-red-300 focus:border-red-500 focus:ring-red-300';
const LABEL = 'mb-1.5 block text-xs font-medium text-neutral-700';
const FIELD_ERR = 'mt-1.5 text-xs font-medium text-red-600';

type StepOneValues = PartnerRegisterStepOne;
type StepTwoValues = PartnerRegisterStepTwo;

export default function PartnerRegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [stepOneData, setStepOneData] = useState<StepOneValues | null>(null);

  const stepOne = useForm<StepOneValues>({
    resolver: zodResolver(partnerRegisterStepOneSchema),
    defaultValues: {
      companyName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
    mode: 'onTouched',
  });

  const stepTwo = useForm<StepTwoValues>({
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

  const busy = stepOne.formState.isSubmitting || stepTwo.formState.isSubmitting;

  const goNext = stepOne.handleSubmit((values) => {
    setFormError(null);
    setStepOneData(values);
    setStep(2);
  });

  const onSubmit = stepTwo.handleSubmit(async (values) => {
    if (!stepOneData || busy) return;
    setFormError(null);
    try {
      await registerPartner({
        companyName: stepOneData.companyName,
        contactEmail: stepOneData.email,
        contactPhone: values.phone || undefined,
        password: stepOneData.password,
        taxNumber: values.taxNumber || undefined,
      });
      router.push(
        `/partner-verification?email=${encodeURIComponent(stepOneData.email)}`,
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
    <div className="flex min-h-screen bg-neutral-50">
      <aside className="relative hidden overflow-hidden lg:block lg:w-1/2">
        <Image
          src={PARTNER_REGISTER_VISUAL}
          alt=""
          fill
          className="object-cover"
          priority
          sizes="50vw"
        />
        <div className="absolute inset-0 z-10 bg-gradient-to-br from-neutral-900/90 via-neutral-900/85 to-neutral-950/90" />
        <div className="absolute inset-0 z-20 flex flex-col justify-center p-12 text-white">
          <div className="max-w-prose">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-neutral-300">
              B2B Partner
            </p>
            <h1 className="mb-4 text-4xl font-bold leading-tight tracking-tight text-balance xl:text-5xl">
              turta Partner Ağına Katılın
            </h1>
            <p className="mb-8 text-lg font-light leading-relaxed text-neutral-200">
              Kurumsal vitrininiz, rezervasyon yönetimi ve gelir takibi tek
              panelde. Başvurunuz incelendikten sonra yayınlamaya
              başlayabilirsiniz.
            </p>
            <ul className="space-y-2 text-sm leading-relaxed text-neutral-300">
              <li>· Şeffaf komisyon ve rezervasyon akışı</li>
              <li>· Operasyon paneli ve destek kanalları</li>
              <li>· Türkiye genelinde turist erişimi</li>
            </ul>
          </div>
        </div>
      </aside>

      <div className="flex w-full items-center justify-center p-6 sm:p-12 lg:w-1/2 lg:p-16">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center lg:text-left">
            <Link
              href="/"
              className="group mb-6 inline-flex items-center gap-2"
            >
              <BrandLogo
                variant="wordmark"
                surface="light"
                href={null}
                className="transition-opacity group-hover:opacity-90"
              />
              <span className="text-sm font-semibold text-neutral-700">
                Partner
              </span>
            </Link>
            <h2 className="mb-2 text-2xl font-bold tracking-tight text-neutral-900 md:text-3xl">
              İş Ortağı Hesabı Oluşturun
            </h2>
            <p className="max-w-prose text-sm leading-relaxed text-neutral-500">
              Adım {step}/2 — bilgileriniz güvenli şekilde iletilir. Hesabınız
              varsa{' '}
              <Link
                href={AUTH_LINKS.partnerLogin}
                className="font-medium text-neutral-950 underline-offset-2 hover:underline"
              >
                giriş yapın
              </Link>
              .
            </p>
          </div>

          {formError ? (
            <div
              role="alert"
              className="mb-5 flex items-start rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-800"
            >
              <AlertCircle className="mr-2 mt-0.5 h-4 w-4 shrink-0" />
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

          {step === 1 ? (
            <form className="space-y-4" onSubmit={goNext} noValidate>
              <div>
                <label htmlFor="companyName" className={LABEL}>
                  Şirket Adı
                </label>
                <div className="relative">
                  <Building2 className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                  <input
                    id="companyName"
                    className={`${INPUT} ${stepOne.formState.errors.companyName ? INPUT_ERR : ''}`}
                    placeholder="Şirketinizin unvanı"
                    disabled={busy}
                    {...stepOne.register('companyName')}
                  />
                </div>
                {stepOne.formState.errors.companyName ? (
                  <p className={FIELD_ERR}>
                    {stepOne.formState.errors.companyName.message}
                  </p>
                ) : null}
              </div>

              <div>
                <label htmlFor="email" className={LABEL}>
                  İş e-postası
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    className={`${INPUT} ${stepOne.formState.errors.email ? INPUT_ERR : ''}`}
                    placeholder="partner@sirketiniz.com"
                    disabled={busy}
                    {...stepOne.register('email')}
                  />
                </div>
                {stepOne.formState.errors.email ? (
                  <p className={FIELD_ERR}>
                    {stepOne.formState.errors.email.message}
                  </p>
                ) : null}
              </div>

              <div>
                <label htmlFor="password" className={LABEL}>
                  Şifre
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    className={`${INPUT} pr-11 ${stepOne.formState.errors.password ? INPUT_ERR : ''}`}
                    disabled={busy}
                    {...stepOne.register('password')}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 flex min-w-11 items-center justify-center text-neutral-400"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={
                      showPassword ? 'Şifreyi gizle' : 'Şifreyi göster'
                    }
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
                {stepOne.formState.errors.password ? (
                  <p className={FIELD_ERR}>
                    {stepOne.formState.errors.password.message}
                  </p>
                ) : null}
              </div>

              <div>
                <label htmlFor="confirmPassword" className={LABEL}>
                  Şifre tekrarı
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                  <input
                    id="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    className={`${INPUT} ${stepOne.formState.errors.confirmPassword ? INPUT_ERR : ''}`}
                    disabled={busy}
                    {...stepOne.register('confirmPassword')}
                  />
                </div>
                {stepOne.formState.errors.confirmPassword ? (
                  <p className={FIELD_ERR}>
                    {stepOne.formState.errors.confirmPassword.message}
                  </p>
                ) : null}
              </div>

              <button
                type="submit"
                disabled={busy}
                className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-neutral-950 px-4 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:opacity-60"
              >
                Devam Et
                <ArrowRight className="ml-1.5 h-4 w-4" aria-hidden />
              </button>
            </form>
          ) : (
            <form className="space-y-4" onSubmit={onSubmit} noValidate>
              <div>
                <label htmlFor="phone" className={LABEL}>
                  Telefon
                </label>
                <div className="relative">
                  <Phone className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                  <input
                    id="phone"
                    className={`${INPUT} ${stepTwo.formState.errors.phone ? INPUT_ERR : ''}`}
                    placeholder="+90 5xx xxx xx xx"
                    disabled={busy}
                    {...stepTwo.register('phone')}
                  />
                </div>
                {stepTwo.formState.errors.phone ? (
                  <p className={FIELD_ERR}>
                    {stepTwo.formState.errors.phone.message}
                  </p>
                ) : null}
              </div>

              <div>
                <label htmlFor="address" className={LABEL}>
                  Adres
                </label>
                <div className="relative">
                  <MapPin className="pointer-events-none absolute top-3 left-3 h-4 w-4 text-neutral-400" />
                  <textarea
                    id="address"
                    rows={2}
                    className={`${INPUT} ${stepTwo.formState.errors.address ? INPUT_ERR : ''}`}
                    disabled={busy}
                    {...stepTwo.register('address')}
                  />
                </div>
                {stepTwo.formState.errors.address ? (
                  <p className={FIELD_ERR}>
                    {stepTwo.formState.errors.address.message}
                  </p>
                ) : null}
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="city" className={LABEL}>
                    Şehir
                  </label>
                  <input
                    id="city"
                    className={`${INPUT} pl-4 ${stepTwo.formState.errors.city ? INPUT_ERR : ''}`}
                    disabled={busy}
                    {...stepTwo.register('city')}
                  />
                  {stepTwo.formState.errors.city ? (
                    <p className={FIELD_ERR}>
                      {stepTwo.formState.errors.city.message}
                    </p>
                  ) : null}
                </div>
                <div>
                  <label htmlFor="country" className={LABEL}>
                    Ülke
                  </label>
                  <input
                    id="country"
                    className={`${INPUT} pl-4 ${stepTwo.formState.errors.country ? INPUT_ERR : ''}`}
                    disabled={busy}
                    {...stepTwo.register('country')}
                  />
                  {stepTwo.formState.errors.country ? (
                    <p className={FIELD_ERR}>
                      {stepTwo.formState.errors.country.message}
                    </p>
                  ) : null}
                </div>
              </div>

              <div>
                <label htmlFor="taxNumber" className={LABEL}>
                  Vergi no (opsiyonel)
                </label>
                <input
                  id="taxNumber"
                  className={`${INPUT} pl-4`}
                  disabled={busy}
                  {...stepTwo.register('taxNumber')}
                />
              </div>

              <label className="flex items-start gap-2 text-xs text-neutral-600">
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 rounded border-neutral-300"
                  disabled={busy}
                  {...stepTwo.register('termsAccepted')}
                />
                <span>
                  <Link href="/terms" className="underline underline-offset-2">
                    Kullanım Şartları
                  </Link>{' '}
                  ve{' '}
                  <Link
                    href="/privacy"
                    className="underline underline-offset-2"
                  >
                    Gizlilik Politikası
                  </Link>
                  ’nı kabul ediyorum.
                </span>
              </label>
              {stepTwo.formState.errors.termsAccepted ? (
                <p className={FIELD_ERR}>
                  {stepTwo.formState.errors.termsAccepted.message}
                </p>
              ) : null}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setFormError(null);
                    setStep(1);
                  }}
                  disabled={busy}
                  className="inline-flex min-h-11 flex-1 items-center justify-center rounded-lg border border-neutral-300 bg-white px-4 text-sm font-semibold text-neutral-800 hover:bg-neutral-50 disabled:opacity-60"
                >
                  <ChevronLeft className="mr-1 h-4 w-4" aria-hidden />
                  Geri
                </button>
                <button
                  type="submit"
                  disabled={busy}
                  className="inline-flex min-h-11 flex-[1.4] items-center justify-center rounded-lg bg-neutral-950 px-4 text-sm font-semibold text-white hover:bg-neutral-800 disabled:opacity-60"
                >
                  {busy ? (
                    <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
                  ) : (
                    <>
                      <UserPlus className="mr-1.5 h-4 w-4" aria-hidden />
                      Hesap Oluştur
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          <div className="mt-8 rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-center sm:text-left">
            <p className="text-sm font-semibold text-neutral-900">
              Kurumsal destek
            </p>
            <p className="mt-1 text-xs leading-relaxed text-neutral-600">
              Başvuru veya sözleşme sorularınız için partner ekibimize yazın.
            </p>
            <MailtoLink
              emailKey="partner"
              subject="Partner başvuru desteği"
              className="mt-3 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-neutral-950 px-4 text-sm font-semibold text-white transition hover:bg-neutral-800"
            >
              <Mail className="h-4 w-4" aria-hidden />
              Partner destek e-postası
            </MailtoLink>
          </div>
        </div>
      </div>
    </div>
  );
}
