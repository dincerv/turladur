'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  AlertCircle,
  ArrowRight,
  Clock,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  ShieldAlert,
  X,
  XCircle,
} from 'lucide-react';

import { MailtoLink } from '@/components/ui/mailto-link';
import {
  partnerLoginFormSchema,
  type PartnerLoginFormValues,
} from '@/lib/auth-schemas';
import { ACENTE_DASHBOARD } from '@/lib/panel-routes';
import { isSellerPanelRole } from '@/lib/partner-permissions';
import { AUTH_LINKS } from '@/lib/site-nav';
import { useAuth } from '@/providers/auth-provider';
import { ApiError } from '@/services/api-client';

const INPUT =
  'block w-full rounded-lg border py-2.5 pl-9 pr-4 text-sm text-neutral-900 placeholder-neutral-400 shadow-sm transition focus:bg-white focus:outline-none focus:ring-1 focus:ring-offset-0 disabled:opacity-60';
const INPUT_OK =
  'border-neutral-300 focus:border-neutral-950 focus:ring-neutral-300';
const INPUT_ERR = 'border-red-300 focus:border-red-500 focus:ring-red-300';
const LABEL = 'mb-1.5 block text-xs font-medium text-neutral-700';
const FIELD_ERR = 'mt-1.5 text-xs font-medium text-red-600';

type AccountStatus = 'PENDING' | 'REJECTED' | 'SUSPENDED' | null;

function resolveAccountStatus(message: string): AccountStatus {
  if (message.includes('onaylanmamış')) return 'PENDING';
  if (message.includes('e-posta') && message.includes('doğrulanmamış')) {
    return 'PENDING';
  }
  if (message.includes('reddedilmiş')) return 'REJECTED';
  if (message.includes('askıya alınmış')) return 'SUSPENDED';
  return null;
}

function statusPresentation(status: AccountStatus) {
  switch (status) {
    case 'PENDING':
      return {
        icon: Clock,
        colorClass: 'text-amber-500',
        boxClass: 'border-amber-200/80 bg-amber-50/80 text-amber-900',
      };
    case 'REJECTED':
      return {
        icon: XCircle,
        colorClass: 'text-red-500',
        boxClass: 'border-red-200/80 bg-red-50/80 text-red-800',
      };
    case 'SUSPENDED':
      return {
        icon: ShieldAlert,
        colorClass: 'text-orange-500',
        boxClass: 'border-orange-200/80 bg-orange-50/80 text-orange-900',
      };
    default:
      return {
        icon: AlertCircle,
        colorClass: 'text-red-500',
        boxClass: 'border-red-200/80 bg-red-50/80 text-red-800',
      };
  }
}

export function AcenteLoginForm() {
  const { loginSellerPanel, user, isAuthenticated } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [accountStatus, setAccountStatus] = useState<AccountStatus>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PartnerLoginFormValues>({
    resolver: zodResolver(partnerLoginFormSchema),
    defaultValues: { email: '', password: '', rememberMe: false },
    mode: 'onTouched',
  });

  useEffect(() => {
    if (isAuthenticated && user && isSellerPanelRole(user.role)) {
      // Soft nav can hang after agency-staff login; hard assign is reliable.
      window.location.assign(ACENTE_DASHBOARD);
    }
  }, [isAuthenticated, user]);

  const onSubmit = handleSubmit(async (values) => {
    if (isSubmitting) return;
    setFormError(null);
    setAccountStatus(null);

    try {
      const loggedIn = await loginSellerPanel(values.email, values.password);
      if (!isSellerPanelRole(loggedIn.role)) {
        setFormError(
          'Bu giriş yalnızca iş ortakları / acente personeli içindir.',
        );
        return;
      }
      window.location.assign(ACENTE_DASHBOARD);
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Bir hata oluştu. Lütfen daha sonra tekrar deneyin.';
      setAccountStatus(resolveAccountStatus(message));
      setFormError(message);
    }
  });

  if (isAuthenticated && user && isSellerPanelRole(user.role)) {
    return (
      <div className="flex min-h-[12rem] items-center justify-center">
        <Loader2
          className="h-8 w-8 animate-spin text-neutral-950"
          aria-label="Yönlendiriliyor"
        />
      </div>
    );
  }

  const statusUi = statusPresentation(accountStatus);

  return (
    <div className="w-full">
      {formError ? (
        <div
          role="alert"
          className={`mb-5 flex items-start rounded-lg border px-4 py-3 text-xs shadow-sm ${statusUi.boxClass}`}
        >
          <statusUi.icon
            className={`mr-2 mt-0.5 h-4 w-4 shrink-0 ${statusUi.colorClass}`}
            aria-hidden
          />
          <span className="-mt-0.5 flex-1 leading-tight">{formError}</span>
          <button
            type="button"
            onClick={() => {
              setFormError(null);
              setAccountStatus(null);
            }}
            className="-mr-1 ml-2 rounded-full p-0.5 opacity-70 transition hover:bg-black/5 hover:opacity-100"
            aria-label="Hata mesajını kapat"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : null}

      <form className="space-y-5" onSubmit={onSubmit} noValidate>
        <div>
          <label htmlFor="acente-email" className={LABEL}>
            E-posta Adresi
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Mail className="h-4 w-4 text-neutral-400" aria-hidden />
            </div>
            <input
              id="acente-email"
              type="email"
              autoComplete="email"
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? 'acente-email-error' : undefined}
              disabled={isSubmitting}
              className={`${INPUT} ${errors.email ? INPUT_ERR : INPUT_OK}`}
              placeholder="partner@sirketiniz.com"
              {...register('email')}
            />
          </div>
          {errors.email ? (
            <p id="acente-email-error" className={FIELD_ERR}>
              {errors.email.message}
            </p>
          ) : null}
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label
              htmlFor="acente-password"
              className="block text-xs font-medium text-neutral-700"
            >
              Şifre
            </label>
            <Link
              href={AUTH_LINKS.forgotPassword}
              className="text-xs font-medium text-neutral-950 underline-offset-2 hover:underline"
            >
              Şifrenizi mi unuttunuz?
            </Link>
          </div>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Lock className="h-4 w-4 text-neutral-400" aria-hidden />
            </div>
            <input
              id="acente-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              aria-invalid={Boolean(errors.password)}
              aria-describedby={
                errors.password ? 'acente-password-error' : undefined
              }
              disabled={isSubmitting}
              className={`${INPUT} pr-11 ${errors.password ? INPUT_ERR : INPUT_OK}`}
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
            <p id="acente-password-error" className={FIELD_ERR}>
              {errors.password.message}
            </p>
          ) : null}
        </div>

        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center">
            <input
              id="acente-remember-me"
              type="checkbox"
              disabled={isSubmitting}
              className="h-3.5 w-3.5 rounded border-neutral-300 text-neutral-950 focus:ring-neutral-950 focus:ring-offset-0"
              {...register('rememberMe')}
            />
            <label
              htmlFor="acente-remember-me"
              className="ml-2 block select-none text-xs text-neutral-700"
            >
              Beni hatırla
            </label>
          </div>
          <Link
            href={AUTH_LINKS.partnerRegister}
            className="inline-flex items-center text-xs font-medium text-neutral-950 underline-offset-2 hover:underline"
          >
            Hesabınız yok mu?
            <ArrowRight className="ml-1 h-3.5 w-3.5" aria-hidden />
          </Link>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="flex min-h-11 w-full items-center justify-center rounded-lg border border-transparent bg-neutral-950 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-950 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
              Giriş Yapılıyor...
            </>
          ) : (
            <>
              Giriş Yap
              <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
            </>
          )}
        </button>
      </form>

      <p className="mt-8 text-center text-xs text-neutral-500">
        Sorun mu yaşıyorsunuz?{' '}
        <MailtoLink
          emailKey="partner"
          subject="Acente giriş desteği"
          className="font-medium text-neutral-950 underline-offset-2 hover:underline"
        >
          Destek ile iletişime geçin
        </MailtoLink>
      </p>
    </div>
  );
}
