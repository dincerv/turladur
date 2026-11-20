'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { getAdminStats, type AdminStats } from '@/services/partner-admin';
import { useAuth } from '@/providers/auth-provider';

export default function AdminDashboardPage() {
  const { accessToken } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    void getAdminStats(accessToken)
      .then(setStats)
      .catch((err: Error) => setError(err.message));
  }, [accessToken]);

  return (
    <div data-testid="admin-dashboard-page">
      <h1 className="text-2xl font-bold text-neutral-900">Admin özeti</h1>
      <p className="mt-1 text-sm text-neutral-600">
        Bekleyen onaylar ve platform metrikleri — aksiyon için karta tıklayın.
      </p>
      {error ? (
        <p className="mt-4 rounded-lg bg-red-50 p-3 text-red-700">{error}</p>
      ) : null}
      {stats ? (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Stat
            label="Partner (bekleyen)"
            value={String(stats.partners.pending)}
            hint={`${stats.partners.total} toplam`}
            href="/admin/agencies"
            testId="admin-stat-partners-pending"
            urgent={stats.partners.pending > 0}
          />
          <Stat
            label="Tur incelemede"
            value={String(stats.tours.pendingReview)}
            hint={`${stats.tours.total} toplam`}
            href="/admin/tours"
            testId="admin-stat-tours-pending"
            urgent={stats.tours.pendingReview > 0}
          />
          <Stat
            label="Deneyim incelemede"
            value={String(stats.experiences?.pendingReview ?? 0)}
            hint={`${stats.experiences?.total ?? 0} toplam`}
            href="/admin/tours"
            testId="admin-stat-experiences-pending"
            urgent={(stats.experiences?.pendingReview ?? 0) > 0}
          />
          <Stat
            label="Kullanıcı"
            value={String(stats.users)}
            href="/admin/users"
          />
          <Stat
            label="Rezervasyon"
            value={String(stats.reservations)}
            hint={`${stats.paymentsSuccess} başarılı ödeme`}
            href="/admin/reservations"
          />
        </div>
      ) : (
        !error && (
          <p
            className="mt-8 text-neutral-600"
            data-testid="admin-dashboard-loading"
          >
            Yükleniyor…
          </p>
        )
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  hint,
  href,
  testId,
  urgent,
}: {
  label: string;
  value: string;
  hint?: string;
  href?: string;
  testId?: string;
  urgent?: boolean;
}) {
  const body = (
    <div
      data-testid={testId}
      className={`rounded-xl border bg-white p-5 shadow-sm transition ${
        urgent ? 'border-amber-300 ring-1 ring-amber-200' : 'border-neutral-200'
      } ${href ? 'hover:border-neutral-400' : ''}`}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
        {label}
      </p>
      <p className="mt-2 text-2xl font-bold text-neutral-900">{value}</p>
      {hint ? <p className="mt-1 text-xs text-neutral-500">{hint}</p> : null}
    </div>
  );
  if (!href) return body;
  return (
    <Link
      href={href}
      className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950"
    >
      {body}
    </Link>
  );
}
