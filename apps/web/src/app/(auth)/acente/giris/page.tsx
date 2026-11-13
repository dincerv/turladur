'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  Briefcase,
  BarChart3,
  Clock,
  Eye,
  EyeOff,
  Lock,
  Mail,
  ShieldAlert,
  X,
  XCircle,
} from 'lucide-react';

import { BrandLogo } from '@/components/brand/brand-logo';
import { getCompanyMailto } from '@/lib/company';
import { useAuth } from '@/providers/auth-provider';
import { ApiError } from '@/services/api-client';
import { isSellerPanelRole } from '@/lib/partner-permissions';

const PARTNER_LOGIN_VISUAL =
  'https://images.unsplash.com/photo-1551632436-cbf8dd35adfa?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80';

type AccountStatus = 'PENDING' | 'REJECTED' | 'SUSPENDED' | null;

export default function PartnerLoginPage() {
  const { loginSellerPanel, user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [accountStatus, setAccountStatus] = useState<AccountStatus>(null);
  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user && isSellerPanelRole(user.role)) {
      router.replace('/acente/dashboard');
    }
  }, [isAuthenticated, user, router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setAccountStatus(null);
    setLoading(true);

    try {
      const loggedIn = await loginSellerPanel(email, password);
      if (isSellerPanelRole(loggedIn.role)) {
        router.replace('/acente/dashboard');
      } else {
        setError('Bu giriş yalnızca iş ortakları / acente personeli içindir.');
      }
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Bir hata oluştu. Lütfen daha sonra tekrar deneyin.';

      if (message.includes('onaylanmamış')) {
        setAccountStatus('PENDING');
      } else if (
        message.includes('e-posta') &&
        message.includes('doğrulanmamış')
      ) {
        setAccountStatus('PENDING');
      } else if (message.includes('reddedilmiş')) {
        setAccountStatus('REJECTED');
      } else if (message.includes('askıya alınmış')) {
        setAccountStatus('SUSPENDED');
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  function getStatusMessage() {
    switch (accountStatus) {
      case 'PENDING':
        return {
          icon: Clock,
          colorClass: 'text-yellow-500',
          message:
            'Hesabınız onay bekliyor. Editör onayından sonra giriş yapabilirsiniz.',
        };
      case 'REJECTED':
        return {
          icon: XCircle,
          colorClass: 'text-red-500',
          message:
            'Hesabınız reddedilmiş. Daha fazla bilgi için lütfen bizimle iletişime geçin.',
        };
      case 'SUSPENDED':
        return {
          icon: ShieldAlert,
          colorClass: 'text-orange-500',
          message:
            'Hesabınız askıya alınmış. Daha fazla bilgi için lütfen bizimle iletişime geçin.',
        };
      default:
        return null;
    }
  }

  const statusInfo = getStatusMessage();

  if (
    isAuthenticated &&
    user &&
    (user.role === 'PARTNER' || user.role === 'PARTNER_STAFF')
  ) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="h-10 w-10 animate-spin rounded-full border-t-2 border-b-2 border-neutral-950" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-neutral-50 lg:flex-row">
      <div className="relative hidden min-h-[420px] overflow-hidden lg:block lg:min-h-screen lg:w-1/2">
        <Image
          src={PARTNER_LOGIN_VISUAL}
          alt="İş Ortaklığı Platformu"
          fill
          className="object-cover"
          priority
          sizes="50vw"
        />
        <div className="absolute inset-0 z-10 bg-gradient-to-br from-neutral-900/90 via-neutral-900/85 to-neutral-950/90" />

        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-12 text-center">
          <div className="max-w-lg space-y-4">
            <h2 className="mb-5 text-4xl font-bold leading-tight tracking-normal text-white xl:text-5xl">
              Acente Portalına Hoş Geldiniz
            </h2>
            <p className="mb-6 text-lg font-light text-neutral-200/90">
              turta Acente portalı ile tüm işlemlerinizi kolayca yönetin,
              rezervasyonları takip edin ve gelirlerinizi artırın.
            </p>

            <div className="space-y-3">
              {[
                {
                  icon: Briefcase,
                  title: 'Rezervasyon Yönetimi',
                  desc: 'Tüm rezervasyonları tek bir yerden kolayca yönetin.',
                },
                {
                  icon: BarChart3,
                  title: 'Gelişmiş Raporlama',
                  desc: 'Detaylı performans analizleri ve finansal raporlar.',
                },
                {
                  icon: Clock,
                  title: '7/24 Destek',
                  desc: 'Uzman ekibimizden ihtiyacınız olduğunda destek alın.',
                },
              ].map((feature) => (
                <div
                  key={feature.title}
                  className="group flex items-start rounded-lg border border-white/15 bg-white/10 p-4 text-left shadow-sm backdrop-blur-sm transition-all duration-200 ease-out hover:border-white/25 hover:bg-white/15"
                >
                  <div className="mr-4 mt-0.5 flex-shrink-0 rounded-lg bg-white/20 p-2.5 shadow-sm">
                    <feature.icon className="h-5 w-5 text-white opacity-90" />
                  </div>
                  <div>
                    <h3 className="mb-0.5 text-sm font-semibold text-white">
                      {feature.title}
                    </h3>
                    <p className="text-xs leading-snug text-neutral-200/80">
                      {feature.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex w-full flex-1 items-center justify-center p-6 sm:p-12 lg:w-1/2 lg:p-16">
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
              <span className="text-sm font-semibold text-neutral-600">
                Acente
              </span>
            </Link>
            <h2 className="mb-2 text-2xl font-bold tracking-tight text-neutral-900 md:text-3xl">
              Acente Girişi
            </h2>
            <p className="text-sm text-neutral-500">
              Hesabınıza giriş yaparak acente paneline erişin.
            </p>
          </div>

          {error ? (
            <div
              className={`mb-5 flex items-start rounded-lg border px-4 py-3 text-xs shadow-sm ${
                accountStatus === 'PENDING'
                  ? 'border-yellow-200/80 bg-yellow-50/80 text-yellow-800'
                  : accountStatus === 'REJECTED'
                    ? 'border-red-200/80 bg-red-50/80 text-red-800'
                    : accountStatus === 'SUSPENDED'
                      ? 'border-orange-200/80 bg-orange-50/80 text-orange-800'
                      : 'border-red-200/80 bg-red-50/80 text-red-800'
              }`}
            >
              {statusInfo ? (
                <statusInfo.icon
                  className={`mr-2 mt-0.5 h-4 w-4 shrink-0 ${statusInfo.colorClass}`}
                />
              ) : (
                <AlertCircle className="mr-2 mt-0.5 h-4 w-4 shrink-0 text-red-500" />
              )}
              <span className="-mt-0.5 flex-1 leading-tight">{error}</span>
              <button
                type="button"
                onClick={() => {
                  setError('');
                  setAccountStatus(null);
                }}
                className="-mr-1 ml-2 rounded-full p-0.5 text-red-400 transition-colors hover:bg-red-100/70 hover:text-red-600"
                aria-label="Hata mesajını kapat"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : null}

          <form className="space-y-5" onSubmit={handleSubmit}>
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
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`block w-full rounded-lg border py-2.5 pl-9 pr-4 text-neutral-900 placeholder-neutral-400 shadow-sm transition duration-200 ease-in-out focus:bg-white focus:outline-none focus:ring-1 focus:ring-offset-0 sm:text-sm ${
                    error
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-300'
                      : 'border-neutral-300 focus:border-neutral-950 focus:ring-neutral-300'
                  }`}
                  placeholder="partner@sirketiniz.com"
                />
              </div>
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="block text-xs font-medium text-neutral-700"
                >
                  Şifre
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs font-medium text-neutral-950 underline-offset-2 transition-colors duration-150 hover:text-neutral-800 hover:underline"
                >
                  Şifrenizi mi unuttunuz?
                </Link>
              </div>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Lock className="h-4 w-4 text-neutral-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`block w-full rounded-lg border py-2.5 pl-9 pr-10 text-neutral-900 placeholder-neutral-400 shadow-sm transition duration-200 ease-in-out focus:bg-white focus:outline-none focus:ring-1 focus:ring-offset-0 sm:text-sm ${
                    error
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-300'
                      : 'border-neutral-300 focus:border-neutral-950 focus:ring-neutral-300'
                  }`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center rounded-r-lg px-3 text-neutral-400 transition-colors hover:text-neutral-600"
                  aria-label={showPassword ? 'Şifreyi gizle' : 'Şifreyi göster'}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-3.5 w-3.5 rounded border-neutral-300 text-neutral-950 focus:ring-neutral-950 focus:ring-offset-0"
                />
                <label
                  htmlFor="remember-me"
                  className="ml-2 block select-none text-xs text-neutral-700"
                >
                  Beni hatırla
                </label>
              </div>
              <Link
                href="/partner-register"
                className="flex items-center text-xs font-medium text-neutral-950 underline-offset-2 transition-colors duration-150 hover:text-neutral-800 hover:underline"
              >
                Hesabınız yok mu?
                <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`flex w-full items-center justify-center rounded-lg border border-transparent px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-neutral-950 focus:ring-offset-2 ${
                loading
                  ? 'cursor-not-allowed bg-neutral-400'
                  : 'bg-neutral-950 hover:bg-neutral-800'
              }`}
            >
              {loading ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-t-2 border-b-2 border-white" />
                  Giriş yapılıyor...
                </>
              ) : (
                <>
                  Giriş Yap
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6">
            <div className="relative my-6">
              <div
                className="absolute inset-0 flex items-center"
                aria-hidden="true"
              >
                <div className="w-full border-t border-neutral-300" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white px-2 uppercase tracking-wide text-neutral-500">
                  Veya
                </span>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button
                type="button"
                className="inline-flex w-full items-center justify-center rounded-lg border border-neutral-300 bg-white px-4 py-2.5 text-xs font-medium text-neutral-700 shadow-sm transition-colors duration-150 hover:bg-neutral-50"
              >
                <svg className="mr-2 h-4 w-4" viewBox="0 0 48 48">
                  <path
                    fill="#EA4335"
                    d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                  />
                  <path
                    fill="#4285F4"
                    d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                  />
                  <path
                    fill="#34A853"
                    d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                  />
                  <path fill="none" d="M0 0h48v48H0z" />
                </svg>
                Google ile Devam Et
              </button>
              <button
                type="button"
                className="inline-flex w-full items-center justify-center rounded-lg border border-neutral-300 bg-white px-4 py-2.5 text-xs font-medium text-neutral-700 shadow-sm transition-colors duration-150 hover:bg-neutral-50"
              >
                <svg
                  className="mr-2 h-4 w-4"
                  fill="#1877F2"
                  viewBox="0 0 24 24"
                >
                  <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z" />
                </svg>
                Facebook ile Devam Et
              </button>
            </div>

            <div className="pt-6 text-center">
              <p className="text-xs text-neutral-500">
                Sorun mu yaşıyorsunuz?{' '}
                <a
                  href={getCompanyMailto('partner', 'Acente giriş desteği')}
                  className="font-medium text-neutral-950 underline-offset-2 transition-colors duration-150 hover:text-neutral-800 hover:underline"
                >
                  Destek ile iletişime geçin
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
