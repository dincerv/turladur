'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  X,
  AlertCircle,
  ArrowRight,
  Loader2,
} from 'lucide-react';

import { BrandLogo } from '@/components/brand/brand-logo';
import { loginFormSchema, type LoginFormValues } from '@/lib/auth-schemas';
import { AUTH_LINKS } from '@/lib/site-nav';
import { ApiError } from '@/services/api-client';
import { useAuth } from '@/providers/auth-provider';

const LOGIN_VISUAL =
  'https://images.unsplash.com/photo-1522199710521-72d69614c702?q=80&w=2072&auto=format&fit=crop';

const INPUT =
  'block w-full rounded-lg border py-2.5 pl-9 pr-4 text-sm text-neutral-900 placeholder-neutral-400 shadow-sm transition focus:bg-white focus:outline-none focus:ring-1 focus:ring-offset-0';
const INPUT_OK =
  'border-neutral-300 focus:border-neutral-950 focus:ring-neutral-300';
const INPUT_ERR = 'border-red-300 focus:border-red-500 focus:ring-red-300';
const LABEL = 'mb-1.5 block text-xs font-medium text-neutral-700';
const FIELD_ERR = 'mt-1.5 text-xs font-medium text-red-600';

function authErrorMessage(code: string | null): string | null {
  if (!code) return null;
  switch (code) {
    case 'CredentialsSignin':
    case 'AccessDenied':
      return 'E-posta veya şifre hatalı.';
    case 'SessionRequired':
      return 'Devam etmek için giriş yapın.';
    case 'AuthError':
      return 'Oturum doğrulanamadı. Lütfen tekrar giriş yapın.';
    default:
      return 'Giriş sırasında bir sorun oluştu. Lütfen tekrar deneyin.';
  }
}

function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: { email: '', password: '', rememberMe: false },
    mode: 'onTouched',
  });

  useEffect(() => {
    const fromQuery = authErrorMessage(searchParams.get('error'));
    if (fromQuery) setFormError(fromQuery);
  }, [searchParams]);

  const onSubmit = handleSubmit(async (values) => {
    if (isSubmitting) return;
    setFormError(null);
    try {
      const user = await login(values.email, values.password);
      const rawCallback = searchParams.get('callbackUrl');
      const safeCallback =
        rawCallback &&
        rawCallback.startsWith('/') &&
        !rawCallback.startsWith('//')
          ? rawCallback
          : null;

      if (safeCallback) {
        router.push(safeCallback);
      } else if (
        user.role === 'ADMIN' ||
        user.role === 'SUPER_ADMIN' ||
        user.role === 'PLATFORM_ADMIN' ||
        user.role === 'PLATFORM_SUPER_ADMIN'
      ) {
        router.push('/admin/dashboard');
      } else if (user.role === 'PARTNER' || user.role === 'PARTNER_STAFF') {
        router.push('/acente/dashboard');
      } else {
        router.push('/tours');
      }
    } catch (err) {
      setFormError(
        err instanceof ApiError ? err.message : 'Giriş başarısız oldu',
      );
    }
  });

  return (
    <div className="flex min-h-screen bg-neutral-50">
      <div className="relative hidden lg:block lg:w-1/2">
        <Image
          src={LOGIN_VISUAL}
          alt=""
          fill
          priority
          className="object-cover"
          sizes="50vw"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-neutral-900/85 via-neutral-900/80 to-neutral-950/85" />
        <div className="absolute bottom-0 left-0 z-10 p-12 text-white">
          <h1 className="mb-3 text-4xl font-bold leading-tight tracking-normal text-white">
            Seyahatinizi
            <br />
            Teknolojiyle Buluşturun.
          </h1>
          <p className="max-w-prose text-lg font-light leading-relaxed text-neutral-200/90">
            turta platformuna giriş yaparak tüm seyahat yönetimi araçlarınıza
            erişin.
          </p>
        </div>
      </div>

      <div className="flex w-full items-center justify-center bg-white p-6 sm:p-12 lg:w-1/2 lg:p-16">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center lg:text-left">
            <Link href="/" className="group mb-6 inline-flex">
              <BrandLogo
                variant="wordmark"
                surface="light"
                href={null}
                className="transition-opacity group-hover:opacity-90"
              />
            </Link>
            <h2 className="mb-2 text-2xl font-bold tracking-tight text-neutral-900 md:text-3xl">
              Hesabınıza Giriş Yapın
            </h2>
            <p className="text-xs text-neutral-500">
              Hesabın yok mu?{' '}
              <Link
                href={AUTH_LINKS.register}
                className="font-medium text-neutral-950 underline-offset-2 transition-colors hover:text-neutral-800 hover:underline"
              >
                Hemen Oluştur
              </Link>
            </p>
          </div>

          <form className="space-y-5" onSubmit={onSubmit} noValidate>
            {formError ? (
              <div
                role="alert"
                className="flex items-start rounded-lg border border-red-200/80 bg-red-50/80 px-4 py-3 text-xs text-red-800 shadow-sm"
              >
                <AlertCircle className="mr-2 mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                <span className="-mt-0.5 flex-1 leading-tight">
                  {formError}
                </span>
                <button
                  type="button"
                  onClick={() => setFormError(null)}
                  className="-mr-1 ml-2 rounded-full p-0.5 text-red-400 hover:bg-red-100/70 hover:text-red-600"
                  aria-label="Hata mesajını kapat"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : null}

            <div>
              <label htmlFor="email" className={LABEL}>
                E-posta Adresi
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Mail className="h-4 w-4 text-neutral-400" aria-hidden />
                </div>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby={errors.email ? 'email-error' : undefined}
                  disabled={isSubmitting}
                  className={`${INPUT} ${errors.email ? INPUT_ERR : INPUT_OK}`}
                  placeholder="ornek@mail.com"
                  {...register('email')}
                />
              </div>
              {errors.email ? (
                <p id="email-error" className={FIELD_ERR}>
                  {errors.email.message}
                </p>
              ) : null}
            </div>

            <div>
              <label htmlFor="password" className={LABEL}>
                Şifre
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Lock className="h-4 w-4 text-neutral-400" aria-hidden />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  aria-invalid={Boolean(errors.password)}
                  aria-describedby={
                    errors.password ? 'password-error' : undefined
                  }
                  disabled={isSubmitting}
                  className={`${INPUT} pr-10 ${errors.password ? INPUT_ERR : INPUT_OK}`}
                  placeholder="••••••••"
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 right-0 flex min-w-11 items-center justify-center rounded-r-lg px-3 text-neutral-400 hover:text-neutral-600"
                  aria-label={showPassword ? 'Şifreyi gizle' : 'Şifreyi göster'}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {errors.password ? (
                <p id="password-error" className={FIELD_ERR}>
                  {errors.password.message}
                </p>
              ) : null}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  type="checkbox"
                  disabled={isSubmitting}
                  className="h-3.5 w-3.5 rounded border-neutral-300 text-neutral-950 focus:ring-neutral-950 focus:ring-offset-0"
                  {...register('rememberMe')}
                />
                <label
                  htmlFor="remember-me"
                  className="ml-2 block select-none text-xs text-neutral-700"
                >
                  Beni hatırla
                </label>
              </div>
              <Link
                href={AUTH_LINKS.forgotPassword}
                className="text-xs font-medium text-neutral-950 underline-offset-2 hover:underline"
              >
                Şifremi Unuttum?
              </Link>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex min-h-11 w-full items-center justify-center rounded-lg border border-transparent bg-neutral-950 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-950 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? (
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
              ) : (
                'Giriş Yap'
              )}
            </button>
          </form>

          <div className="mt-6">
            <Link
              href={AUTH_LINKS.partnerLogin}
              className="flex min-h-11 items-center justify-center rounded-md bg-neutral-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-800"
            >
              Partner Portalına Git
              <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-neutral-50 text-neutral-600">
          Yükleniyor…
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
