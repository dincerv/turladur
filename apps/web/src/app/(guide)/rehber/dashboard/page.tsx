'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '@/providers/auth-provider';
import { ApiError } from '@/services/api-client';
import {
  getGuideDashboard,
  type GuideDashboardSummary,
} from '@/services/identity';
import { REHBER_ROUTES } from '@/lib/panel-routes';

export default function RehberDashboardPage() {
  const { accessToken, user } = useAuth();
  const [summary, setSummary] = useState<GuideDashboardSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      setSummary(await getGuideDashboard(accessToken));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Özet yüklenemedi');
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    void load();
  }, [load]);

  const status = summary?.status ?? 'PENDING';
  const verified = status === 'VERIFIED';

  return (
    <div className="space-y-6" data-testid="rehber-dashboard-page">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">
          Merhaba
          {summary?.firstName
            ? `, ${summary.firstName}`
            : user?.firstName
              ? `, ${user.firstName}`
              : ''}
        </h2>
        <p className="mt-1 text-sm text-gray-600">
          Atanan turları ve müsaitlik takviminizi buradan yönetin.
        </p>
      </div>

      {error ? (
        <p
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
          data-testid="rehber-dashboard-error"
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
        data-testid="rehber-dashboard-status"
        data-status={status}
      >
        {verified
          ? 'Hesabınız onaylı. Acentelerden atama alabilirsiniz.'
          : 'Başvurunuz onay bekliyor (PENDING). Admin onayı olmadan atama alamazsınız.'}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div
          className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
          data-testid="rehber-kpi-pending"
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
          data-testid="rehber-kpi-upcoming"
        >
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Yaklaşan tur
          </p>
          <p className="mt-2 text-2xl font-semibold text-gray-900">
            {loading ? '—' : (summary?.acceptedUpcoming ?? 0)}
          </p>
        </div>
        <div
          className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
          data-testid="rehber-kpi-availability"
        >
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Müsait gün (30g)
          </p>
          <p className="mt-2 text-2xl font-semibold text-gray-900">
            {loading ? '—' : (summary?.availableDaysNext30 ?? 0)}
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Link
          href={REHBER_ROUTES.assignments}
          className="rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm font-medium text-blue-700 hover:bg-blue-100"
          data-testid="rehber-dashboard-link-assignments"
        >
          Atamalara git →
        </Link>
        <Link
          href={REHBER_ROUTES.availability}
          className="rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm font-medium text-blue-700 hover:bg-blue-100"
          data-testid="rehber-dashboard-link-availability"
        >
          Müsaitlik takvimine git →
        </Link>
      </div>
    </div>
  );
}
