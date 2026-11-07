'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import {
  ArrowRight,
  Building2,
  ChevronLeft,
  FileText,
  Globe,
  Lock,
  Mail,
  MapPin,
  Phone,
  UserPlus,
  X,
} from 'lucide-react';

import { BrandLogo } from '@/components/brand/brand-logo';
import { ApiError } from '@/services/api-client';
import { registerPartner } from '@/services/identity';

const PARTNER_REGISTER_VISUAL =
  'https://images.unsplash.com/photo-1551632436-cbf8dd35adfa?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80';

export default function PartnerRegisterPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    companyName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    address: '',
    city: '',
    country: '',
    website: '',
    description: '',
    termsAccepted: false,
    role: '',
    taxNumber: '',
  });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    if (currentStep !== 2 || !isStepTwoComplete()) {
      setError('Lütfen tüm gerekli alanları doldurun ve şartları kabul edin.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Şifreler eşleşmiyor.');
      return;
    }

    if (!formData.termsAccepted) {
      setError(
        'Devam etmek için İş Ortağı Sözleşmesi ve Gizlilik Politikasını kabul etmelisiniz.',
      );
      return;
    }

    setLoading(true);

    try {
      await registerPartner({
        companyName: formData.companyName,
        contactEmail: formData.email,
        contactPhone: formData.phone || undefined,
        password: formData.password,
        taxNumber: formData.taxNumber || undefined,
      });

      router.push(
        `/partner-verification?email=${encodeURIComponent(formData.email)}`,
      );
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Kayıt sırasında bir hata oluştu. Lütfen tekrar deneyin.';
      setError(message);
      setLoading(false);
    }
  }

  function nextStep() {
    setError('');
    if (currentStep === 1 && isStepOneComplete()) {
      setCurrentStep(currentStep + 1);
    } else if (currentStep === 1 && !isStepOneComplete()) {
      setError('Lütfen bu adımdaki tüm zorunlu alanları doldurun.');
    }
  }

  function prevStep() {
    setError('');
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  }

  function isStepOneComplete() {
    return (
      formData.companyName &&
      formData.email &&
      formData.password &&
      formData.confirmPassword
    );
  }

  function isStepTwoComplete() {
    return (
      formData.phone && formData.address && formData.city && formData.country
    );
  }

  const inputClass =
    'block w-full rounded-lg border border-neutral-300 py-2.5 pl-9 pr-4 text-neutral-900 placeholder-neutral-400 shadow-sm transition duration-200 ease-in-out focus:border-sky-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-sky-300 focus:ring-offset-0 sm:text-sm';

  return (
    <div className="flex min-h-screen bg-neutral-50">
      <div className="relative hidden overflow-hidden lg:block lg:w-1/2">
        <Image
          src={PARTNER_REGISTER_VISUAL}
          alt="İş Ortaklığı Platformu"
          fill
          className="object-cover"
          priority
          sizes="50vw"
        />
        <div className="absolute inset-0 z-10 bg-gradient-to-br from-sky-700/90 via-blue-800/85 to-sky-900/90" />

        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-12 text-center">
          <div className="max-w-lg">
            <h2 className="mb-5 text-4xl font-bold leading-tight tracking-normal text-white xl:text-5xl">
              turta Partner Ağına Katılın
            </h2>
            <p className="mb-10 text-lg font-light text-sky-100/90">
              Binlerce turistin seyahat planlarını yönetin, gelirinizi artırın
              ve işinizi büyütün.
            </p>
          </div>
        </div>
      </div>

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
              <span className="text-sm font-semibold text-sky-600">
                Partner
              </span>
            </Link>
            <h2 className="mb-3 text-2xl font-bold tracking-tight text-neutral-900 md:text-3xl">
              İş Ortağı Hesabı Oluşturun
            </h2>
            <p className="text-sm text-neutral-500">
              turta partner ağına katılarak işinizi büyütün.
            </p>
          </div>

          {error ? (
            <div className="fixed top-4 left-1/2 z-50 mb-5 flex w-full max-w-md -translate-x-1/2 items-start rounded-lg border border-red-200/80 bg-red-50/80 px-4 py-3 text-xs text-red-800 shadow-sm">
              <X className="mr-2 mt-0.5 h-4 w-4 shrink-0 text-red-500" />
              <span className="-mt-0.5 flex-1 leading-tight">{error}</span>
              <button
                type="button"
                onClick={() => setError('')}
                className="-mr-1 ml-2 rounded-full p-0.5 text-red-400 transition-colors hover:bg-red-100/70 hover:text-red-600"
                aria-label="Hata mesajını kapat"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : null}

          <form className="space-y-5" onSubmit={handleSubmit}>
            {currentStep === 1 ? (
              <>
                <div>
                  <label
                    htmlFor="companyName"
                    className="mb-1.5 block text-xs font-medium text-neutral-700"
                  >
                    Şirket Adı
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <Building2 className="h-4 w-4 text-neutral-400" />
                    </div>
                    <input
                      id="companyName"
                      name="companyName"
                      type="text"
                      required
                      value={formData.companyName}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          companyName: e.target.value,
                        })
                      }
                      className={inputClass}
                      placeholder="Şirketinizin adı"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="mb-1.5 block text-xs font-medium text-neutral-700"
                  >
                    E-posta Adresi
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <Mail className="h-4 w-4 text-neutral-400" />
                    </div>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      className={inputClass}
                      placeholder="partner@sirketiniz.com"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="mb-1.5 block text-xs font-medium text-neutral-700"
                  >
                    Şifre
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <Lock className="h-4 w-4 text-neutral-400" />
                    </div>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete="new-password"
                      required
                      minLength={8}
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      className={inputClass}
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="mb-1.5 block text-xs font-medium text-neutral-700"
                  >
                    Şifre Tekrar
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <Lock className="h-4 w-4 text-neutral-400" />
                    </div>
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      autoComplete="new-password"
                      required
                      minLength={8}
                      value={formData.confirmPassword}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          confirmPassword: e.target.value,
                        })
                      }
                      className={inputClass}
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="role"
                    className="mb-1.5 block text-xs font-medium text-neutral-700"
                  >
                    Rol
                  </label>
                  <select
                    id="role"
                    name="role"
                    required
                    value={formData.role}
                    onChange={(e) =>
                      setFormData({ ...formData, role: e.target.value })
                    }
                    className="block w-full rounded-lg border border-neutral-300 py-2.5 pl-3 pr-4 text-neutral-900 placeholder-neutral-400 shadow-sm transition duration-200 ease-in-out focus:border-sky-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-sky-300 focus:ring-offset-0 sm:text-sm"
                  >
                    <option value="">Rol Seçiniz</option>
                    <option value="TOUR_OPERATOR">Tur Operatörü</option>
                    <option value="EXPERIENCE_PROVIDER">
                      Aktivite Operatörü
                    </option>
                  </select>
                </div>
              </>
            ) : (
              <>
                <div>
                  <label
                    htmlFor="phone"
                    className="mb-1.5 block text-xs font-medium text-neutral-700"
                  >
                    Telefon
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <Phone className="h-4 w-4 text-neutral-400" />
                    </div>
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      className={inputClass}
                      placeholder="+90 555 555 55 55"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="address"
                    className="mb-1.5 block text-xs font-medium text-neutral-700"
                  >
                    Adres
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <MapPin className="h-4 w-4 text-neutral-400" />
                    </div>
                    <input
                      id="address"
                      name="address"
                      type="text"
                      required
                      value={formData.address}
                      onChange={(e) =>
                        setFormData({ ...formData, address: e.target.value })
                      }
                      className={inputClass}
                      placeholder="Şirket adresi"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="city"
                      className="mb-1.5 block text-xs font-medium text-neutral-700"
                    >
                      Şehir
                    </label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <MapPin className="h-4 w-4 text-neutral-400" />
                      </div>
                      <input
                        id="city"
                        name="city"
                        type="text"
                        required
                        value={formData.city}
                        onChange={(e) =>
                          setFormData({ ...formData, city: e.target.value })
                        }
                        className={inputClass}
                        placeholder="Şehir"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="country"
                      className="mb-1.5 block text-xs font-medium text-neutral-700"
                    >
                      Ülke
                    </label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <MapPin className="h-4 w-4 text-neutral-400" />
                      </div>
                      <input
                        id="country"
                        name="country"
                        type="text"
                        required
                        value={formData.country}
                        onChange={(e) =>
                          setFormData({ ...formData, country: e.target.value })
                        }
                        className={inputClass}
                        placeholder="Ülke"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="website"
                    className="mb-1.5 block text-xs font-medium text-neutral-700"
                  >
                    Web Sitesi
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <Globe className="h-4 w-4 text-neutral-400" />
                    </div>
                    <input
                      id="website"
                      name="website"
                      type="url"
                      value={formData.website}
                      onChange={(e) =>
                        setFormData({ ...formData, website: e.target.value })
                      }
                      className={inputClass}
                      placeholder="https://www.sirketiniz.com"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="description"
                    className="mb-1.5 block text-xs font-medium text-neutral-700"
                  >
                    Şirket Açıklaması
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-start pl-3 pt-3">
                      <FileText className="h-4 w-4 text-neutral-400" />
                    </div>
                    <textarea
                      id="description"
                      name="description"
                      rows={4}
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        })
                      }
                      className={inputClass}
                      placeholder="Şirketinizi kısaca tanıtın..."
                    />
                  </div>
                </div>

                <div className="flex items-center">
                  <input
                    id="terms"
                    name="terms"
                    type="checkbox"
                    checked={formData.termsAccepted}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        termsAccepted: e.target.checked,
                      })
                    }
                    className="h-4 w-4 rounded border-neutral-300 text-sky-600 focus:ring-sky-500"
                  />
                  <label
                    htmlFor="terms"
                    className="ml-2 block text-xs text-neutral-700"
                  >
                    <span>
                      <Link
                        href="/terms"
                        className="text-sky-600 hover:text-sky-800 hover:underline"
                      >
                        İş Ortağı Sözleşmesi
                      </Link>{' '}
                      ve{' '}
                      <Link
                        href="/privacy"
                        className="text-sky-600 hover:text-sky-800 hover:underline"
                      >
                        Gizlilik Politikası
                      </Link>
                      &apos;nı okudum ve kabul ediyorum.
                    </span>
                  </label>
                </div>
              </>
            )}

            <div className="flex items-center justify-between pt-3">
              {currentStep > 1 ? (
                <button
                  type="button"
                  onClick={prevStep}
                  className="inline-flex items-center justify-center rounded-lg border border-neutral-300 bg-white px-4 py-2 text-xs font-medium text-neutral-700 shadow-sm transition-colors duration-200 hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2"
                >
                  <ChevronLeft className="mr-1.5 h-4 w-4" />
                  Geri
                </button>
              ) : (
                <Link
                  href="/partner-login"
                  className="inline-flex items-center justify-center rounded-lg border border-neutral-300 bg-white px-4 py-2 text-xs font-medium text-neutral-700 shadow-sm transition-colors duration-200 hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2"
                >
                  Giriş Yap
                </Link>
              )}

              {currentStep === 1 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="inline-flex items-center justify-center rounded-lg border border-transparent bg-sky-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2"
                >
                  Devam Et
                  <ArrowRight className="ml-1.5 h-4 w-4" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center justify-center rounded-lg border border-transparent bg-sky-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? (
                    <svg
                      className="h-4 w-4 animate-spin text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                  ) : (
                    <>
                      <UserPlus className="mr-1.5 h-4 w-4" />
                      Hesap Oluştur
                    </>
                  )}
                </button>
              )}
            </div>
          </form>

          <div className="pt-6 text-center">
            <p className="text-xs text-neutral-500">
              Sorularınız mı var?{' '}
              <a
                href="mailto:partner@turta.com.tr"
                className="font-medium text-sky-600 underline-offset-2 transition-colors duration-150 hover:text-sky-800 hover:underline"
              >
                Destek ile iletişime geçin
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
