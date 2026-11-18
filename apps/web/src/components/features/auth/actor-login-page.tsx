'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  Briefcase,
  Clock,
  Eye,
  EyeOff,
  Lock,
  Mail,
  X,
} from 'lucide-react';

import { BrandLogo } from '@/components/brand/brand-logo';
import { ApiError } from '@/services/api-client';

const LOGIN_VISUAL =
  'https://images.unsplash.com/photo-1551632436-cbf8dd35adfa?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80';

type ActorLoginPageProps = {
  portalLabel: string;
  title: string;
  subtitle: string;
  heroTitle: string;
  heroSubtitle: string;
  emailPlaceholder: string;
  dashboardHref: string;
  expectedRole: string;
  login: (email: string, password: string) => Promise<{ role: string }>;
  isAuthenticated: boolean;
  userRole?: string | null;
  registerHref?: string;
  registerLabel?: string;
  /** Prefix for Playwright test ids (e.g. rehber → rehber-login-email). */
  testIdPrefix?: string;
};

export function ActorLoginPage({
  portalLabel,
  title,
  subtitle,
  heroTitle,
  heroSubtitle,
  emailPlaceholder,
  dashboardHref,
  expectedRole,
  login,
  isAuthenticated,
  userRole,
  registerHref,
  registerLabel = 'Hesabınız yok mu? Üye olun',
  testIdPrefix,
}: ActorLoginPageProps) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isAuthenticated && userRole === expectedRole) {
      router.replace(dashboardHref);
    }
  }, [isAuthenticated, userRole, expectedRole, dashboardHref, router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const loggedIn = await login(email, password);
      if (loggedIn.role === expectedRole) {
        router.replace(dashboardHref);
      } else {
        setError('Bu giriş bu panel için geçerli değil.');
      }
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Bir hata oluştu. Lütfen daha sonra tekrar deneyin.',
      );
    } finally {
      setLoading(false);
    }
  }

  if (isAuthenticated && userRole === expectedRole) {
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
          src={LOGIN_VISUAL}
          alt={portalLabel}
          fill
          className="object-cover"
          priority
          sizes="50vw"
        />
        <div className="absolute inset-0 z-10 bg-gradient-to-br from-neutral-900/90 via-neutral-900/85 to-neutral-950/90" />
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-12 text-center">
          <div className="max-w-lg space-y-4">
            <h2 className="mb-5 text-4xl font-bold leading-tight tracking-normal text-white xl:text-5xl">
              {heroTitle}
            </h2>
            <p className="mb-6 text-lg font-light text-neutral-200/90">
              {heroSubtitle}
            </p>
            <div className="space-y-3">
              {[
                {
                  icon: Briefcase,
                  title: 'Görevler',
                  desc: 'Atanan tur tarihlerini ve durumları takip edin.',
                },
                {
                  icon: Clock,
                  title: 'Takvim',
                  desc: 'Müsaitlik ve programınızı yönetin.',
                },
              ].map((feature) => (
                <div
                  key={feature.title}
                  className="group flex items-start rounded-lg border border-white/15 bg-white/10 p-4 text-left shadow-sm backdrop-blur-sm"
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
                {portalLabel}
              </span>
            </Link>
            <h2 className="mb-2 text-2xl font-bold tracking-tight text-neutral-900 md:text-3xl">
              {title}
            </h2>
            <p className="text-sm text-neutral-500">{subtitle}</p>
          </div>

          {error ? (
            <div className="mb-5 flex items-start rounded-lg border border-red-200/80 bg-red-50/80 px-4 py-3 text-xs text-red-800 shadow-sm">
              <AlertCircle className="mr-2 mt-0.5 h-4 w-4 shrink-0 text-red-500" />
              <span className="-mt-0.5 flex-1 leading-tight">{error}</span>
              <button
                type="button"
                onClick={() => setError('')}
                className="-mr-1 ml-2 rounded-full p-0.5 text-red-400 hover:bg-red-100/70"
                aria-label="Hata mesajını kapat"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : null}

          <form
            className="space-y-5"
            onSubmit={handleSubmit}
            data-testid={
              testIdPrefix ? `${testIdPrefix}-login-form` : undefined
            }
            data-ready="true"
          >
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
                  className="block w-full rounded-lg border border-neutral-300 py-2.5 pl-9 pr-4 text-neutral-900 placeholder-neutral-400 shadow-sm focus:border-neutral-950 focus:outline-none focus:ring-1 focus:ring-neutral-300 sm:text-sm"
                  placeholder={emailPlaceholder}
                  data-testid={
                    testIdPrefix ? `${testIdPrefix}-login-email` : undefined
                  }
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
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-lg border border-neutral-300 py-2.5 pl-9 pr-10 text-neutral-900 placeholder-neutral-400 shadow-sm focus:border-neutral-950 focus:outline-none focus:ring-1 focus:ring-neutral-300 sm:text-sm"
                  placeholder="••••••••"
                  data-testid={
                    testIdPrefix ? `${testIdPrefix}-login-password` : undefined
                  }
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-neutral-400 hover:text-neutral-700"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Şifreyi gizle' : 'Şifreyi göster'}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-neutral-950 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-neutral-800 disabled:opacity-60"
              data-testid={
                testIdPrefix ? `${testIdPrefix}-login-submit` : undefined
              }
            >
              {loading ? 'Giriş yapılıyor…' : 'Giriş Yap'}
              {!loading ? <ArrowRight className="h-4 w-4" /> : null}
            </button>
          </form>

          {registerHref ? (
            <p className="mt-4 text-center text-sm text-neutral-600">
              <Link
                href={registerHref}
                className="font-medium text-neutral-950 hover:underline"
              >
                {registerLabel}
              </Link>
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
