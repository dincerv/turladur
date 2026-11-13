'use client';

import { Calendar, Clock } from 'lucide-react';
import Link from 'next/link';

import type { DashboardRecentReservation } from '@/components/features/acente-dashboard/types';
import { ACENTE_ROUTES } from '@/lib/panel-routes';

type RecentReservationsProps = {
  reservations: DashboardRecentReservation[];
};

const statusColors: Record<DashboardRecentReservation['status'], string> = {
  Onaylandı: 'bg-emerald-100 text-emerald-700',
  Beklemede: 'bg-amber-100 text-amber-800',
  'İptal Edildi': 'bg-red-100 text-red-700',
  Tamamlandı: 'bg-neutral-200 text-neutral-800',
  'Ödeme Bekliyor': 'bg-yellow-100 text-yellow-800',
  'Askıya Alındı': 'bg-orange-100 text-orange-800',
};

export function RecentReservations({ reservations }: RecentReservationsProps) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white shadow-sm">
      <div className="border-b border-neutral-200 p-5">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-base font-semibold text-neutral-900">
            Son rezervasyonlar
          </h3>
          <Link
            href={ACENTE_ROUTES.reservations}
            className="shrink-0 text-sm font-medium text-neutral-950 underline-offset-2 hover:underline"
          >
            Tümünü gör
          </Link>
        </div>
      </div>
      <div className="divide-y divide-neutral-100">
        {reservations.length === 0 ? (
          <div className="p-5 text-sm text-neutral-500">
            Henüz rezervasyon bulunmuyor.
          </div>
        ) : (
          reservations.map((reservation) => (
            <div key={reservation.id} className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-sm font-semibold text-neutral-800">
                    {reservation.customerInitials}
                  </div>
                  <div className="ml-3 min-w-0">
                    <p className="truncate text-sm font-medium text-neutral-900">
                      {reservation.customerName}
                    </p>
                    <p className="truncate text-sm text-neutral-500">
                      {reservation.customerEmail}
                    </p>
                  </div>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${statusColors[reservation.status]}`}
                >
                  {reservation.status}
                </span>
              </div>
              <div className="mt-3 min-w-0">
                <h4 className="truncate text-sm font-medium text-neutral-900">
                  {reservation.activity}
                </h4>
                <p className="text-sm text-neutral-500">
                  {reservation.activityType}
                </p>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-neutral-500">
                <div className="inline-flex items-center">
                  <Calendar className="mr-1 h-4 w-4" aria-hidden />
                  {reservation.date}
                </div>
                <div className="inline-flex items-center">
                  <Clock className="mr-1 h-4 w-4" aria-hidden />
                  {reservation.time}
                </div>
                <div className="font-semibold tabular-nums text-neutral-900">
                  {reservation.amount}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default RecentReservations;
