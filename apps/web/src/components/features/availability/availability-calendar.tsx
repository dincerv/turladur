'use client';

import { useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import { cn } from '@/lib/utils';
import type { AvailabilityDay } from '@/services/availability';

const WEEKDAYS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

function monthLabel(year: number, monthIndex: string | number) {
  const date = new Date(Date.UTC(year, Number(monthIndex), 1));
  return new Intl.DateTimeFormat('tr-TR', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

function toIso(year: number, monthIndex: number, day: number) {
  const mm = String(monthIndex + 1).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return `${year}-${mm}-${dd}`;
}

type AvailabilityCalendarProps = {
  year: number;
  monthIndex: number;
  days: AvailabilityDay[];
  loading?: boolean;
  error?: string | null;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onToggleDay: (day: AvailabilityDay) => void;
};

/**
 * Month grid — AgencyShell palette parity (blue-50 / gray).
 * Missing API row = available. locked = assignment block.
 */
export function AvailabilityCalendar({
  year,
  monthIndex,
  days,
  loading,
  error,
  onPrevMonth,
  onNextMonth,
  onToggleDay,
}: AvailabilityCalendarProps) {
  const byDate = useMemo(() => {
    const map = new Map<string, AvailabilityDay>();
    for (const day of days) map.set(day.date, day);
    return map;
  }, [days]);

  const firstWeekday = (() => {
    // Mon=0 … Sun=6
    const js = new Date(Date.UTC(year, monthIndex, 1)).getUTCDay();
    return js === 0 ? 6 : js - 1;
  })();
  const daysInMonth = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();

  const cells: Array<AvailabilityDay | null> = [];
  for (let i = 0; i < firstWeekday; i += 1) cells.push(null);
  for (let day = 1; day <= daysInMonth; day += 1) {
    const iso = toIso(year, monthIndex, day);
    cells.push(
      byDate.get(iso) ?? {
        date: iso,
        isAvailable: true,
        locked: false,
        lockReason: null,
      },
    );
  }

  return (
    <div
      className="rounded-lg border border-gray-200 bg-white shadow-sm"
      data-testid="availability-calendar"
    >
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
        <button
          type="button"
          onClick={onPrevMonth}
          className="rounded-lg p-1.5 text-gray-600 hover:bg-gray-100"
          aria-label="Önceki ay"
          data-testid="availability-prev-month"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h3 className="text-sm font-semibold capitalize text-gray-900">
          {monthLabel(year, monthIndex)}
        </h3>
        <button
          type="button"
          onClick={onNextMonth}
          className="rounded-lg p-1.5 text-gray-600 hover:bg-gray-100"
          aria-label="Sonraki ay"
          data-testid="availability-next-month"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 px-3 pt-3 text-center text-xs font-medium text-gray-500">
        {WEEKDAYS.map((label) => (
          <div key={label} className="py-1">
            {label}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1 p-3">
        {cells.map((cell, index) => {
          if (!cell) {
            return <div key={`empty-${index}`} className="h-11" />;
          }
          const dayNum = Number(cell.date.slice(8, 10));
          const available = cell.isAvailable && !cell.locked;
          const state = cell.locked
            ? 'reserved'
            : available
              ? 'available'
              : 'maintenance';
          return (
            <button
              key={cell.date}
              type="button"
              disabled={cell.locked || loading}
              title={
                cell.locked
                  ? 'Rezerve (atama kilitli)'
                  : available
                    ? 'Müsait — tıkla bakıma al'
                    : 'Bakımda — tıkla müsait yap'
              }
              onClick={() => onToggleDay(cell)}
              data-testid={`availability-day-${cell.date}`}
              data-state={state}
              data-available={available ? 'true' : 'false'}
              className={cn(
                'flex h-11 flex-col items-center justify-center rounded-lg text-sm font-medium transition-colors',
                cell.locked && 'cursor-not-allowed bg-gray-200 text-gray-500',
                !cell.locked &&
                  available &&
                  'bg-blue-50 text-blue-700 hover:bg-blue-100',
                !cell.locked &&
                  !available &&
                  'bg-gray-100 text-gray-600 hover:bg-gray-200',
              )}
            >
              <span>{dayNum}</span>
              <span className="text-[10px] font-normal leading-none">
                {cell.locked ? 'Rezerve' : available ? 'Müsait' : 'Bakım'}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-3 border-t border-gray-100 px-4 py-3 text-xs text-gray-600">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-3 rounded bg-blue-50 ring-1 ring-blue-200" />
          Müsait
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-3 rounded bg-gray-100 ring-1 ring-gray-200" />
          Bakımda
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-3 rounded bg-gray-200 ring-1 ring-gray-300" />
          Rezerve
        </span>
      </div>

      {error ? (
        <p className="border-t border-red-100 px-4 py-2 text-xs text-red-600">
          {error}
        </p>
      ) : null}
      {loading ? (
        <p className="border-t border-gray-100 px-4 py-2 text-xs text-gray-500">
          Yükleniyor…
        </p>
      ) : null}
    </div>
  );
}

export function monthRange(year: number, monthIndex: number) {
  const from = toIso(year, monthIndex, 1);
  const last = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
  const to = toIso(year, monthIndex, last);
  return { from, to };
}
