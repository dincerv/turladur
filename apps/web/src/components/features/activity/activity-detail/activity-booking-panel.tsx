'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { CalendarDays, CalendarX2, ChevronRight } from 'lucide-react';
import BottomBookingBar, {
  type ActivityDate as BookingActivityDate,
} from '@/components/booking/bottom-booking-bar';
import { cn } from '@/lib/utils';
import {
  dateKeyToLocalDate,
  formatPrice,
  formatSessionDate,
} from './activity-detail.helpers';
import type { ActivitySession } from './activity-detail.types';

const LOW_SEATS = 5;

interface ActivityBookingPanelProps {
  activityId: string;
  title: string;
  currency: string;
  startingPrice: number | null;
  ageRestrictionLabel: string | null;
  sessions: readonly ActivitySession[];
}

function toBookingDate(s: ActivitySession): BookingActivityDate {
  return {
    id: s.id,
    startDate: dateKeyToLocalDate(s.startDate),
    endDate: dateKeyToLocalDate(s.endDate),
    price: s.price,
    availableSeats: s.availableSeats,
  };
}

/** Desktop: sticky sidebar card. Mobile: in-flow list + fixed bottom CTA. */
export function ActivityBookingPanel({
  activityId,
  title,
  currency,
  startingPrice,
  ageRestrictionLabel,
  sessions,
}: ActivityBookingPanelProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [bookingOpen, setBookingOpen] = useState(false);

  const selected = useMemo(
    () => sessions.find((s) => s.id === selectedId) ?? null,
    [sessions, selectedId],
  );
  const bookingDate = useMemo(
    () => (selected ? toBookingDate(selected) : null),
    [selected],
  );

  const priceLabel = selected
    ? formatPrice(selected.price, currency)
    : startingPrice != null
      ? formatPrice(startingPrice, currency)
      : null;

  const openBooking = () => {
    if (selected) setBookingOpen(true);
  };

  return (
    <>
      <div className="rounded-2xl border border-neutral-200/70 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-end justify-between gap-3 border-b border-neutral-100 pb-4">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
              {selected ? 'Seçili tarih fiyatı' : 'Kişi başı başlayan'}
            </p>
            {priceLabel ? (
              <p className="mt-1 text-2xl font-bold tabular-nums text-neutral-900">
                {priceLabel}
              </p>
            ) : (
              <p className="mt-1 text-base font-semibold text-neutral-700">
                Fiyat sorunuz
              </p>
            )}
          </div>
          <span className="shrink-0 text-xs text-neutral-500">
            {sessions.length > 0 ? `${sessions.length} uygun tarih` : null}
          </span>
        </div>

        <h2 className="mb-3 mt-4 flex items-center gap-2 text-base font-semibold text-neutral-900">
          <CalendarDays aria-hidden className="h-4 w-4 text-sky-600" />
          Tarih seçin
        </h2>

        {sessions.length === 0 ? (
          <div className="flex flex-col items-center rounded-xl bg-neutral-50 px-4 py-8 text-center">
            <CalendarX2 aria-hidden className="mb-2 h-8 w-8 text-neutral-400" />
            <p className="text-sm font-medium text-neutral-700">
              Şu anda planlanmış bir tarih yok.
            </p>
            <Link
              href="/activities"
              className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-sky-700 hover:text-sky-800"
            >
              Diğer aktivitelere göz at
              <ChevronRight aria-hidden className="ml-1 h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div
            role="radiogroup"
            aria-label="Uygun tarihler"
            className="-mr-2 flex max-h-[22rem] flex-col gap-2 overflow-y-auto overscroll-contain pr-2"
          >
            {sessions.map((s) => {
              const active = s.id === selectedId;
              const low = s.availableSeats <= LOW_SEATS;
              return (
                <button
                  key={s.id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setSelectedId(s.id)}
                  className={cn(
                    'flex min-h-14 w-full items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500',
                    active
                      ? 'border-sky-500 bg-sky-50/60 ring-1 ring-sky-500'
                      : 'border-neutral-200 hover:border-sky-300',
                  )}
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-neutral-900">
                      {formatSessionDate(s.startDate)}
                    </span>
                    <span
                      className={cn(
                        'mt-0.5 block text-xs font-medium',
                        low ? 'text-amber-700' : 'text-emerald-700',
                      )}
                    >
                      {low
                        ? `Son ${s.availableSeats} yer`
                        : `${s.availableSeats} kişilik yer`}
                    </span>
                  </span>
                  <span className="shrink-0 text-sm font-bold tabular-nums text-sky-700">
                    {formatPrice(s.price, currency)}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {sessions.length > 0 ? (
          <button
            type="button"
            onClick={openBooking}
            disabled={!selected}
            className="mt-4 hidden min-h-12 w-full items-center justify-center rounded-xl bg-sky-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-neutral-300 lg:inline-flex"
          >
            {selected ? 'Rezervasyona devam et' : 'Önce bir tarih seçin'}
          </button>
        ) : null}
      </div>

      {sessions.length > 0 && !bookingOpen ? (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-neutral-200 bg-white/95 px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] lg:hidden">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-xs text-neutral-500">
                {selected
                  ? formatSessionDate(selected.startDate)
                  : 'Kişi başı başlayan'}
              </p>
              {priceLabel ? (
                <p className="text-lg font-bold tabular-nums text-neutral-900">
                  {priceLabel}
                </p>
              ) : null}
            </div>
            {selected ? (
              <button
                type="button"
                onClick={openBooking}
                className="inline-flex min-h-12 shrink-0 items-center rounded-xl bg-sky-600 px-5 text-sm font-semibold text-white hover:bg-sky-700"
              >
                Devam et
              </button>
            ) : (
              <a
                href="#tarihler"
                className="inline-flex min-h-12 shrink-0 items-center rounded-xl bg-sky-600 px-5 text-sm font-semibold text-white hover:bg-sky-700"
              >
                Tarih seç
              </a>
            )}
          </div>
        </div>
      ) : null}

      {bookingOpen && bookingDate ? (
        <BottomBookingBar
          activity={{
            id: activityId,
            name: title,
            price: bookingDate.price,
            activityDates: [bookingDate],
            ageRestriction: ageRestrictionLabel ?? undefined,
          }}
          selectedDate={bookingDate}
          forceVisible
          isExpanded
          onExpandedChange={(expanded) => setBookingOpen(expanded)}
        />
      ) : null}
    </>
  );
}
