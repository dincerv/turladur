'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Loader2,
  Mail,
  X,
} from 'lucide-react';

import { MailtoLink } from '@/components/ui/mailto-link';
import { AUTH_LINKS } from '@/lib/site-nav';

const RESEND_COOLDOWN_SEC = 60;

function safeEmailParam(raw: string | null): string {
  if (!raw) return '';
  const trimmed = raw.trim().slice(0, 254);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return '';
  return trimmed;
}

export function AcenteVerificationPending() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = safeEmailParam(searchParams.get('email'));

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SEC);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = window.setInterval(() => {
      setCooldown((c) => Math.max(0, c - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, [cooldown]);

  async function handleResend() {
    if (loading || cooldown > 0) return;
    setLoading(true);
    setError(null);
    setResendSuccess(false);
    try {
      // Nest resend endpoint henüz yok — UI cooldown korunur
      await new Promise((resolve) => setTimeout(resolve, 800));
      setResendSuccess(true);
      setCooldown(RESEND_COOLDOWN_SEC);
    } catch {
      setError('E-posta yeniden gönderilemedi. Lütfen daha sonra deneyin.');
    } finally {
      setLoading(false);
    }
  }

  const verifyHref = email
    ? `/partner-verification/verify?email=${encodeURIComponent(email)}`
    : '/partner-verification/verify';

  return (
    <div className="w-full max-w-md">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-neutral-100 ring-8 ring-neutral-50">
          <Mail className="h-9 w-9 text-neutral-800" aria-hidden />
        </div>
        <h2 className="mb-3 text-2xl font-bold tracking-tight text-neutral-900 md:text-3xl">
          Gelen kutunuzu kontrol edin
        </h2>
        <p className="mx-auto max-w-prose text-sm leading-relaxed text-neutral-500">
          {email ? (
            <>
              <span className="font-medium text-neutral-800">{email}</span>{' '}
              adresine acente hesabınızı doğrulamak için bir e-posta gönderdik.
            </>
          ) : (
            'Kayıt olduğunuz e-posta adresine acente hesabınızı doğrulamak için bir ileti gönderdik.'
          )}
        </p>
      </div>

      {error ? (
        <div
          role="alert"
          className="mb-5 flex items-start rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-800"
        >
          <X className="mr-2 mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <span className="flex-1 leading-tight">{error}</span>
          <button
            type="button"
            onClick={() => setError(null)}
            className="rounded-full p-0.5 hover:bg-red-100"
            aria-label="Kapat"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : null}

      {resendSuccess ? (
        <div
          role="status"
          className="mb-5 flex items-start rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-800"
        >
          <CheckCircle className="mr-2 mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <span className="leading-tight">
            Doğrulama e-postası yeniden gönderildi.
          </span>
        </div>
      ) : null}

      <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
        <h3 className="mb-3 text-sm font-semibold text-neutral-900">
          Doğrulama adımları
        </h3>
        <ol className="space-y-3 text-sm leading-relaxed text-neutral-600">
          <li className="flex items-start gap-2">
            <CheckCircle
              className="mt-0.5 h-4 w-4 shrink-0 text-neutral-800"
              aria-hidden
            />
            E-posta kutunuzu (ve spam klasörünü) kontrol edin
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle
              className="mt-0.5 h-4 w-4 shrink-0 text-neutral-800"
              aria-hidden
            />
            “turta Acente hesabınızı doğrulayın” başlıklı iletiyi açın
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle
              className="mt-0.5 h-4 w-4 shrink-0 text-neutral-800"
              aria-hidden
            />
            Bağlantıya tıklayın veya 6 haneli kodu girin
          </li>
        </ol>
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={() => router.push(AUTH_LINKS.partnerLogin)}
          className="inline-flex min-h-11 items-center justify-center text-sm font-medium text-neutral-700 hover:text-neutral-950"
        >
          <ArrowLeft className="mr-1.5 h-4 w-4" aria-hidden />
          Acente girişine dön
        </button>

        <button
          type="button"
          onClick={() => void handleResend()}
          disabled={loading || cooldown > 0}
          className="inline-flex min-h-11 items-center justify-center rounded-lg bg-neutral-950 px-4 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : cooldown > 0 ? (
            `Tekrar gönder (${cooldown}sn)`
          ) : (
            <>
              <Mail className="mr-1.5 h-4 w-4" aria-hidden />
              Tekrar gönder
            </>
          )}
        </button>
      </div>

      <Link
        href={verifyHref}
        className="mt-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-neutral-300 bg-white px-4 text-sm font-semibold text-neutral-900 transition hover:bg-neutral-50"
      >
        Kod ile doğrula
        <ArrowRight className="h-4 w-4" aria-hidden />
      </Link>

      <p className="mt-6 text-center text-xs text-neutral-500">
        E-postayı bulamıyor musunuz?{' '}
        <MailtoLink
          emailKey="partner"
          subject="Acente doğrulama desteği"
          className="font-medium text-neutral-950 underline-offset-2 hover:underline"
        >
          Destek ile iletişime geçin
        </MailtoLink>
      </p>
    </div>
  );
}
