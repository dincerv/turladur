'use client';

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
        Nest <code>/admin/dashboard/stats</code>
      </p>
      {error ? (
        <p className="mt-4 rounded-lg bg-red-50 p-3 text-red-700">{error}</p>
      ) : null}
      {stats ? (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Kullanıcı" value={String(stats.users)} />
          <Stat
            label="Partner"
            value={String(stats.partners.total)}
            hint={`${stats.partners.pending} bekleyen`}
          />
          <Stat
            label="Tur"
            value={String(stats.tours.total)}
            hint={`${stats.tours.pendingReview} incelemede`}
          />
          <Stat
            label="Deneyim"
            value={String(stats.experiences?.total ?? 0)}
            hint={`${stats.experiences?.pendingReview ?? 0} incelemede`}
          />
          <Stat
            label="Rezervasyon"
            value={String(stats.reservations)}
            hint={`${stats.paymentsSuccess} başarılı ödeme`}
          />
        </div>
      ) : (
        !error && <p className="mt-8 text-neutral-600">Yükleniyor…</p>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
        {label}
      </p>
      <p className="mt-2 text-2xl font-bold text-neutral-900">{value}</p>
      {hint ? <p className="mt-1 text-xs text-neutral-500">{hint}</p> : null}
    </div>
  );
}
