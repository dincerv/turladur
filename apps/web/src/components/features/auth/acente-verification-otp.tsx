'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, Loader2, ShieldCheck } from 'lucide-react';

import { OtpInput } from '@/components/ui/otp-input';
import { AUTH_LINKS } from '@/lib/site-nav';
import { ApiError } from '@/services/api-client';
import { verifyPartner } from '@/services/identity';

const RESEND_COOLDOWN_SEC = 60;

function safeEmailParam(raw: string | null): string {
  if (!raw) return '';
  const trimmed = raw.trim().slice(0, 254);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return '';
  return trimmed;
}

export function AcenteVerificationOtp() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = safeEmailParam(searchParams.get('email'));
  const urlToken = (searchParams.get('token') ?? '').trim().slice(0, 128);

  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const submittingRef = useRef(false);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = window.setInterval(() => {
      setCooldown((c) => Math.max(0, c - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, [cooldown]);

  const submitCode = useCallback(
    async (raw: string) => {
      const token = raw.trim();
      if (token.length !== 6 || submittingRef.current) return;
      submittingRef.current = true;
      setPending(true);
      setError(null);
      try {
        await verifyPartner(token);
        router.replace(AUTH_LINKS.partnerLogin);
      } catch (err) {
        setError(
          err instanceof ApiError
            ? err.message
            : 'Kod doğrulanamadı. Lütfen tekrar deneyin.',
        );
        setCode('');
      } finally {
        setPending(false);
        submittingRef.current = false;
      }
    },
    [router],
  );

  useEffect(() => {
    if (urlToken.length === 6 && /^\d{6}$/.test(urlToken)) {
      void submitCode(urlToken);
    }
  }, [urlToken, submitCode]);

  async function handleResend() {
    if (pending || cooldown > 0) return;
    setPending(true);
    setError(null);
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      setCooldown(RESEND_COOLDOWN_SEC);
    } catch {
      setError('Kod yeniden gönderilemedi.');
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-neutral-100 ring-8 ring-neutral-50">
          <ShieldCheck className="h-9 w-9 text-neutral-800" aria-hidden />
        </div>
        <h2 className="mb-3 text-2xl font-bold tracking-tight text-neutral-900 md:text-3xl">
          Doğrulama kodunu girin
        </h2>
        <p className="mx-auto max-w-prose text-sm leading-relaxed text-neutral-500">
          {email ? (
            <>
              <span className="font-medium text-neutral-800">{email}</span>{' '}
              adresine gönderilen 6 haneli kodu girin.
            </>
          ) : (
            'E-postanıza gelen 6 haneli acente doğrulama kodunu girin.'
          )}
        </p>
      </div>

      {error ? (
        <p
          role="alert"
          className="mb-4 text-center text-xs font-medium text-red-600"
        >
          {error}
        </p>
      ) : null}

      <OtpInput
        value={code}
        onChange={setCode}
        disabled={pending}
        autoFocus
        onComplete={(value) => void submitCode(value)}
      />

      <button
        type="button"
        disabled={pending || code.length !== 6}
        onClick={() => void submitCode(code)}
        className="mt-6 flex min-h-11 w-full items-center justify-center rounded-lg bg-neutral-950 px-4 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
            Doğrulanıyor...
          </>
        ) : (
          'Kodu doğrula'
        )}
      </button>

      <div className="mt-5 flex flex-col items-center gap-3 text-sm">
        <button
          type="button"
          disabled={pending || cooldown > 0}
          onClick={() => void handleResend()}
          className="font-medium text-neutral-950 underline-offset-2 hover:underline disabled:cursor-not-allowed disabled:opacity-50 disabled:no-underline"
        >
          {cooldown > 0 ? `Yeni kod iste (${cooldown}sn)` : 'Yeni kod gönder'}
        </button>
        <Link
          href={
            email
              ? `/partner-verification?email=${encodeURIComponent(email)}`
              : '/partner-verification'
          }
          className="inline-flex items-center text-neutral-600 hover:text-neutral-950"
        >
          <ArrowLeft className="mr-1.5 h-4 w-4" aria-hidden />
          Bekleme ekranına dön
        </Link>
      </div>
    </div>
  );
}
