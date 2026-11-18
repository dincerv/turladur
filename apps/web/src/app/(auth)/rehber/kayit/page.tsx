'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';

import { BrandLogo } from '@/components/brand/brand-logo';
import { useAuth } from '@/providers/auth-provider';
import { ApiError } from '@/services/api-client';
import { registerGuide } from '@/services/identity';
import { REHBER_DASHBOARD, REHBER_LOGIN } from '@/lib/panel-routes';

export default function RehberKayitPage() {
  const router = useRouter();
  const { loginGuidePanel } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    identityNumber: '',
    languages: 'tr',
    oda: '',
    sicilNo: '',
    ruhsatNo: '',
    ruhsatExpiresAt: '',
    birthDate: '',
    phone: '',
    city: '',
  });

  function update(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await registerGuide({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        password: form.password,
        identityNumber: form.identityNumber.trim(),
        languages: form.languages
          .split(',')
          .map((lang) => lang.trim())
          .filter(Boolean),
        oda: form.oda.trim(),
        sicilNo: form.sicilNo.trim(),
        ruhsatNo: form.ruhsatNo.trim(),
        ruhsatExpiresAt: form.ruhsatExpiresAt,
        birthDate: form.birthDate || undefined,
        phone: form.phone.trim() || undefined,
        city: form.city.trim() || undefined,
      });
      await loginGuidePanel(form.email.trim(), form.password);
      router.replace(REHBER_DASHBOARD);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Kayıt başarısız',
      );
    } finally {
      setLoading(false);
    }
  }

  const fieldClass =
    'mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm shadow-sm focus:border-neutral-950 focus:outline-none focus:ring-1 focus:ring-neutral-300';

  return (
    <div className="min-h-screen bg-neutral-50 px-4 py-8">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 flex items-center justify-between">
          <BrandLogo href="/" />
          <Link
            href={REHBER_LOGIN}
            className="text-sm font-medium text-neutral-700 hover:underline"
          >
            Giriş yap
          </Link>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">
          <h1 className="text-xl font-semibold text-neutral-900">
            Rehber üyeliği
          </h1>
          <p className="mt-1 text-sm text-neutral-600">
            TUREB kart bilgilerinizi girin. Başvurunuz admin onayından sonra
            acente atamalarında görünür.
          </p>

          {error ? (
            <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          ) : null}

          <form
            className="mt-6 grid gap-4 sm:grid-cols-2"
            onSubmit={handleSubmit}
            data-testid="rehber-kayit-form"
          >
            <label className="text-sm">
              Ad *
              <input
                required
                className={fieldClass}
                value={form.firstName}
                onChange={(e) => update('firstName', e.target.value)}
                data-testid="rehber-kayit-firstName"
              />
            </label>
            <label className="text-sm">
              Soyad *
              <input
                required
                className={fieldClass}
                value={form.lastName}
                onChange={(e) => update('lastName', e.target.value)}
                data-testid="rehber-kayit-lastName"
              />
            </label>
            <label className="text-sm sm:col-span-2">
              E-posta *
              <input
                required
                type="email"
                className={fieldClass}
                value={form.email}
                onChange={(e) => update('email', e.target.value)}
                data-testid="rehber-kayit-email"
              />
            </label>
            <label className="text-sm sm:col-span-2">
              Şifre *
              <input
                required
                type="password"
                minLength={8}
                className={fieldClass}
                value={form.password}
                onChange={(e) => update('password', e.target.value)}
                data-testid="rehber-kayit-password"
              />
            </label>
            <label className="text-sm">
              TCKN *
              <input
                required
                inputMode="numeric"
                pattern="\d{11}"
                maxLength={11}
                className={fieldClass}
                value={form.identityNumber}
                onChange={(e) => update('identityNumber', e.target.value)}
                data-testid="rehber-kayit-tckn"
              />
            </label>
            <label className="text-sm">
              Doğum tarihi
              <input
                type="date"
                className={fieldClass}
                value={form.birthDate}
                onChange={(e) => update('birthDate', e.target.value)}
              />
            </label>
            <label className="text-sm sm:col-span-2">
              Diller * (virgülle)
              <input
                required
                className={fieldClass}
                placeholder="tr, en, de"
                value={form.languages}
                onChange={(e) => update('languages', e.target.value)}
                data-testid="rehber-kayit-languages"
              />
            </label>
            <label className="text-sm">
              Oda *
              <input
                required
                className={fieldClass}
                value={form.oda}
                onChange={(e) => update('oda', e.target.value)}
                data-testid="rehber-kayit-oda"
              />
            </label>
            <label className="text-sm">
              Sicil no *
              <input
                required
                className={fieldClass}
                value={form.sicilNo}
                onChange={(e) => update('sicilNo', e.target.value)}
                data-testid="rehber-kayit-sicil"
              />
            </label>
            <label className="text-sm">
              Ruhsat no *
              <input
                required
                className={fieldClass}
                value={form.ruhsatNo}
                onChange={(e) => update('ruhsatNo', e.target.value)}
                data-testid="rehber-kayit-ruhsat"
              />
            </label>
            <label className="text-sm">
              Ruhsat geçerlilik *
              <input
                required
                type="date"
                className={fieldClass}
                value={form.ruhsatExpiresAt}
                onChange={(e) => update('ruhsatExpiresAt', e.target.value)}
                data-testid="rehber-kayit-ruhsat-expires"
              />
            </label>
            <label className="text-sm">
              Telefon
              <input
                className={fieldClass}
                value={form.phone}
                onChange={(e) => update('phone', e.target.value)}
              />
            </label>
            <label className="text-sm">
              Şehir
              <input
                className={fieldClass}
                value={form.city}
                onChange={(e) => update('city', e.target.value)}
              />
            </label>

            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-neutral-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-neutral-800 disabled:opacity-60"
                data-testid="rehber-kayit-submit"
              >
                {loading ? 'Kaydediliyor…' : 'Başvuruyu gönder'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
