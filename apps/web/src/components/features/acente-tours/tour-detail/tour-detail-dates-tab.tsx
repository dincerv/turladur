'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { Armchair, CalendarDays } from 'lucide-react';

import { ACENTE_ROUTES } from '@/lib/panel-routes';
import type { PartnerTourDateRow } from '@/services/partner-admin';

import { formatDateRange, formatMoney } from './tour-detail.helpers';

type TourDetailDatesTabProps = {
  tourId: string;
  dates: PartnerTourDateRow[];
  currency: string;
  basePrice: number;
  children?: ReactNode;
};

export function TourDetailDatesTab({
  tourId,
  dates,
  currency,
  basePrice,
  children,
}: TourDetailDatesTabProps) {
  if (dates.length === 0) {
    return (
      <div
        className="rounded-xl border border-dashed border-neutral-300 bg-white px-6 py-12 text-center"
        data-testid="dates-empty-state"
      >
        <CalendarDays
          className="mx-auto h-8 w-8 text-neutral-400"
          aria-hidden
        />
        <p className="mt-3 text-sm font-medium text-neutral-800">
          Henüz tur tarihi yok
        </p>
        <p className="mt-1 text-sm text-neutral-500">
          Düzenle ekranından sefer tarihi ekleyebilirsiniz.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="tour-dates-panel">
      <ul className="space-y-3">
        {dates.map((date) => {
          const override = date.priceOverride
            ? Number(date.priceOverride)
            : null;
          const price =
            override != null && Number.isFinite(override)
              ? override
              : basePrice;

          return (
            <li
              key={date.id}
              className="flex flex-col gap-3 rounded-xl border border-neutral-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
              data-testid={`tour-date-row-${date.id}`}
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-neutral-950">
                  {formatDateRange(date.startDate, date.endDate)}
                </p>
                <p className="mt-1 text-xs text-neutral-500">
                  Kapasite {date.remainingCapacity}/{date.capacity} ·{' '}
                  {formatMoney(price, currency)}
                </p>
              </div>
              <Link
                href={ACENTE_ROUTES.tourDateSeats(tourId, date.id)}
                data-testid={`manage-seats-link-${date.id}`}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-neutral-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2"
              >
                <Armchair className="h-4 w-4" aria-hidden />
                Koltukları Yönet
              </Link>
            </li>
          );
        })}
      </ul>
      {children}
    </div>
  );
}
