'use client';

import { useEffect, useState } from 'react';

import { ApiError } from '@/services/api-client';
import {
  sendEmailOtp,
  verifyEmailOtp,
  type OtpPurpose,
} from '@/services/identity';

type EmailOtpPanelProps = {
  email: string;
  purpose: OtpPurpose;
  firstName?: string;
  /** When true, calls verify endpoint (checkout). Register/reset pass code upstream. */
  verifyOnSubmit?: boolean;
  onVerified?: (code: string) => void;
  onCodeChange?: (code: string) => void;
  disabled?: boolean;
};

export function EmailOtpPanel({
  email,
  purpose,
  firstName,
  verifyOnSubmit = false,
  onVerified,
  onCodeChange,
  disabled,
}: EmailOtpPanelProps) {
  const [code, setCode] = useState('');
  const [sent, setSent] = useState(false);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [expiresIn, setExpiresIn] = useState(0);
  const [debugCode, setDebugCode] = useState<string | null>(null);

  useEffect(() => {
    if (expiresIn <= 0) return;
    const id = window.setInterval(() => {
      setExpiresIn((c) => Math.max(0, c - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, [expiresIn]);

  // Reset when email changes
  useEffect(() => {
    setSent(false);
    setVerified(false);
    setCode('');
    setError(null);
    setDebugCode(null);
    onCodeChange?.('');
  }, [email, purpose]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSend() {
    if (!email.trim() || disabled) return;
    setPending(true);
    setError(null);
    try {
      const result = await sendEmailOtp({
        email: email.trim(),
        purpose,
        firstName: firstName?.trim() || undefined,
      });
      setSent(true);
      setVerified(false);
      setExpiresIn(result.expiresInSeconds);
      setDebugCode(result.debugCode ?? null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Kod gönderilemedi');
    } finally {
      setPending(false);
    }
  }

  async function handleVerify() {
    if (code.length !== 6 || disabled) return;
    if (!verifyOnSubmit) {
      onCodeChange?.(code);
      onVerified?.(code);
      setVerified(true);
      return;
    }
    setPending(true);
    setError(null);
    try {
      await verifyEmailOtp({ email: email.trim(), purpose, code });
      setVerified(true);
      onVerified?.(code);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Kod doğrulanamadı');
      setVerified(false);
    } finally {
      setPending(false);
    }
  }

  function updateCode(value: string) {
    const next = value.replace(/\D/g, '').slice(0, 6);
    setCode(next);
    setVerified(false);
    onCodeChange?.(next);
  }

  function formatOtpClock(totalSeconds: number) {
    return `${Math.floor(totalSeconds / 60)}:${String(totalSeconds % 60).padStart(2, '0')}`;
  }

  return (
    <div className="space-y-3 rounded-lg border border-neutral-200 bg-neutral-50/80 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-neutral-900">
            E-posta doğrulama
          </p>
          <p className="text-xs text-neutral-500">
            Kod:{' '}
            <span className="font-medium text-neutral-700">{email || '—'}</span>
          </p>
        </div>
        <button
          type="button"
          data-testid="otp-send-btn"
          disabled={
            disabled || pending || !email.trim() || expiresIn > 0 || verified
          }
          onClick={() => void handleSend()}
          className="rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-xs font-medium text-neutral-900 hover:bg-neutral-100 disabled:opacity-50"
        >
          {expiresIn > 0
            ? `Tekrar gönder (${formatOtpClock(expiresIn)})`
            : sent
              ? 'Tekrar gönder'
              : 'Kod gönder'}
        </button>
      </div>

      {sent ? (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            data-testid="otp-code-input"
            value={code}
            onChange={(e) => updateCode(e.target.value)}
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="6 haneli kod"
            maxLength={6}
            disabled={disabled || verified}
            className="h-10 w-full rounded-lg border border-neutral-300 bg-white px-3 text-center text-sm tracking-[0.3em] sm:max-w-[160px]"
          />
          {verifyOnSubmit ? (
            <button
              type="button"
              data-testid="otp-verify-btn"
              disabled={disabled || pending || code.length !== 6 || verified}
              onClick={() => void handleVerify()}
              className="h-10 rounded-lg bg-neutral-950 px-4 text-xs font-semibold text-white hover:bg-neutral-800 disabled:opacity-50"
            >
              {verified ? 'Doğrulandı' : 'Doğrula'}
            </button>
          ) : null}
          {expiresIn > 0 && !verified ? (
            <p className="text-xs text-neutral-500">
              Süre: {formatOtpClock(expiresIn)}
            </p>
          ) : null}
          {verified ? (
            <p className="text-xs font-medium text-emerald-700">
              E-posta doğrulandı
            </p>
          ) : null}
        </div>
      ) : (
        <p className="text-xs text-neutral-500">
          Devam etmek için e-posta adresinize 6 haneli kod gönderin.
        </p>
      )}

      {debugCode ? (
        <p
          className="rounded bg-amber-50 px-2 py-1 text-xs text-amber-800"
          data-testid="otp-debug-code"
          data-code={debugCode}
        >
          Dev kod: <strong>{debugCode}</strong> (Mailhog: localhost:8025)
        </p>
      ) : null}

      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
