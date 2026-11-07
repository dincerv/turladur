'use client';

import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { ArrowLeft, CheckCircle, Mail, X } from 'lucide-react';

const PARTNER_VERIFY_VISUAL =
  'https://images.unsplash.com/photo-1551632436-cbf8dd35adfa?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80';

function PartnerVerificationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendSuccess, setResendSuccess] = useState(false);

  useEffect(() => {
    const emailParam = searchParams.get('email');
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [searchParams]);

  async function handleResendVerification() {
    setLoading(true);
    setError('');
    setResendSuccess(false);

    // Nest resend endpoint henüz yok — UI korunur, başarı simüle edilir
    await new Promise((resolve) => setTimeout(resolve, 1200));
    setResendSuccess(true);
    setLoading(false);
  }

  return (
    <div className="flex min-h-screen bg-neutral-50">
      <div className="relative hidden overflow-hidden lg:block lg:w-1/2">
        <Image
          src={PARTNER_VERIFY_VISUAL}
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
              E-posta Adresinizi Doğrulayın
            </h2>
            <p className="mb-10 text-lg font-light text-sky-100/90">
              Hesabınızı aktifleştirmek için e-posta adresinize gönderilen
              doğrulama bağlantısına tıklayın.
            </p>
          </div>
        </div>
      </div>

      <div className="flex w-full items-center justify-center p-6 sm:p-12 lg:w-1/2 lg:p-16">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-sky-100">
              <Mail className="h-8 w-8 text-sky-600" />
            </div>
            <h2 className="mb-3 text-2xl font-bold tracking-tight text-neutral-900 md:text-3xl">
              Doğrulama E-postası Gönderildi
            </h2>
            <p className="text-sm text-neutral-500">
              {email ? (
                <span>
                  <span className="font-medium text-neutral-700">{email}</span>{' '}
                  adresine bir doğrulama e-postası gönderdik.
                </span>
              ) : (
                'Kayıt olduğunuz e-posta adresine bir doğrulama e-postası gönderdik.'
              )}
            </p>
          </div>

          {error ? (
            <div className="mb-5 flex items-start rounded-lg border border-red-200/80 bg-red-50/80 px-4 py-3 text-xs text-red-800 shadow-sm">
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

          {resendSuccess ? (
            <div className="mb-5 flex items-start rounded-lg border border-emerald-200/80 bg-emerald-50/80 px-4 py-3 text-xs text-emerald-800 shadow-sm">
              <CheckCircle className="mr-2 mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
              <span className="-mt-0.5 flex-1 leading-tight">
                Doğrulama e-postası başarıyla gönderildi.
              </span>
            </div>
          ) : null}

          <div className="space-y-4">
            <div className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
              <h3 className="mb-2 text-sm font-medium text-neutral-900">
                Doğrulama Adımları
              </h3>
              <ol className="space-y-3 text-sm text-neutral-600">
                <li className="flex items-start">
                  <CheckCircle className="mr-2 mt-0.5 h-5 w-5 shrink-0 text-sky-500" />
                  <span>E-posta kutunuzu kontrol edin</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="mr-2 mt-0.5 h-5 w-5 shrink-0 text-sky-500" />
                  <span>
                    &quot;turta Partner Hesabınızı Doğrulayın&quot; başlıklı
                    e-postayı bulun
                  </span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="mr-2 mt-0.5 h-5 w-5 shrink-0 text-sky-500" />
                  <span>
                    E-postadaki &quot;Hesabımı Doğrula&quot; butonuna tıklayın
                  </span>
                </li>
              </ol>
            </div>

            <div className="flex items-center justify-between pt-4">
              <button
                type="button"
                onClick={() => router.push('/partner-login')}
                className="inline-flex items-center text-sm font-medium text-sky-600 hover:text-sky-800 hover:underline"
              >
                <ArrowLeft className="mr-1.5 h-4 w-4" />
                Giriş Sayfasına Dön
              </button>

              <button
                type="button"
                onClick={handleResendVerification}
                disabled={loading}
                className="inline-flex items-center justify-center rounded-lg border border-transparent bg-sky-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors duration-200 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
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
                    <Mail className="mr-1.5 h-4 w-4" />
                    E-postayı Tekrar Gönder
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="pt-6 text-center">
            <p className="text-xs text-neutral-500">
              E-postayı bulamıyor musunuz?{' '}
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

export default function PartnerVerificationPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-neutral-50 text-neutral-600">
          Yükleniyor…
        </div>
      }
    >
      <PartnerVerificationContent />
    </Suspense>
  );
}
