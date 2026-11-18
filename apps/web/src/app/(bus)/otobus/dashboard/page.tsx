'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '@/providers/auth-provider';
import { ApiError } from '@/services/api-client';
import { getBusDashboard, type BusDashboardSummary } from '@/services/identity';
import { OTOBUS_ROUTES } from '@/lib/panel-routes';

export default function OtobusDashboardPage() {
  const { accessToken, user } = useAuth();
  const [summary, setSummary] = useState<BusDashboardSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      setSummary(await getBusDashboard(accessToken));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Özet yüklenemedi');
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    void load();
  }, [load]);

  const verified = (summary?.status ?? '').toUpperCase() === 'VERIFIED';

  return (
    <div className="space-y-6" data-testid="otobus-dashboard-page">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">
          Merhaba
          {summary?.companyName
            ? `, ${summary.companyName}`
            : user?.firstName
              ? `, ${user.firstName}`
              : ''}
        </h2>
        <p className="mt-1 text-sm text-gray-600">
          Filo, müsaitlik ve acente taşıma davetlerini buradan yönetin.
        </p>
      </div>

      {error ? (
        <p
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
          data-testid="otobus-dashboard-error"
        >
          {error}
        </p>
      ) : null}

      <div
        className={
          verified
            ? 'rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900'
            : 'rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900'
        }
        data-testid="otobus-dashboard-status"
        data-status={summary?.status ?? 'UNKNOWN'}
      >
        {verified
          ? 'Hesabınız onaylı. Acente davetlerini yanıtlayabilirsiniz.'
          : 'Firma durumu onaylı değil. Seed/admin doğrulaması gerekir.'}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div
          className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
          data-testid="otobus-kpi-vehicles"
        >
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Filo araç
          </p>
          <p className="mt-2 text-2xl font-semibold text-gray-900">
            {loading
              ? '—'
              : `${summary?.activeVehicleCount ?? 0}/${summary?.vehicleCount ?? 0}`}
          </p>
        </div>
        <div
          className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
          data-testid="otobus-kpi-pending"
        >
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Bekleyen davet
          </p>
          <p className="mt-2 text-2xl font-semibold text-gray-900">
            {loading ? '—' : (summary?.pendingAssignments ?? 0)}
          </p>
        </div>
        <div
          className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
          data-testid="otobus-kpi-upcoming"
        >
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Aktif atama
          </p>
          <p className="mt-2 text-2xl font-semibold text-gray-900">
            {loading ? '—' : (summary?.acceptedUpcoming ?? 0)}
          </p>
        </div>
        <div
          className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
          data-testid="otobus-kpi-utilization"
        >
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Doluluk (30g)
          </p>
          <p className="mt-2 text-2xl font-semibold text-gray-900">
            {loading ? '—' : `%${summary?.fleetUtilizationPercent ?? 0}`}
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Link
          href={OTOBUS_ROUTES.vehicles}
          className="rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm font-medium text-blue-700 hover:bg-blue-100"
          data-testid="otobus-dashboard-link-vehicles"
        >
          Araçlar ve müsaitlik →
        </Link>
        <Link
          href={OTOBUS_ROUTES.assignments}
          className="rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm font-medium text-blue-700 hover:bg-blue-100"
          data-testid="otobus-dashboard-link-assignments"
        >
          Atamalara git →
        </Link>
      </div>
    </div>
  );
}
