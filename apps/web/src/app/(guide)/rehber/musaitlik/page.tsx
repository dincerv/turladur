'use client';

import { useCallback, useEffect, useState } from 'react';

import {
  AvailabilityCalendar,
  monthRange,
} from '@/components/features/availability/availability-calendar';
import { revalidateRehberPanel } from '@/app/(guide)/rehber/actions';
import { useAuth } from '@/providers/auth-provider';
import { ApiError } from '@/services/api-client';
import {
  getGuideAvailability,
  setGuideAvailability,
  type AvailabilityDay,
} from '@/services/availability';

export default function RehberMusaitlikPage() {
  const { accessToken } = useAuth();
  const now = new Date();
  const [year, setYear] = useState(now.getUTCFullYear());
  const [monthIndex, setMonthIndex] = useState(now.getUTCMonth());
  const [days, setDays] = useState<AvailabilityDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const { from, to } = monthRange(year, monthIndex);
      const data = await getGuideAvailability(accessToken, from, to);
      setDays(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Müsaitlik yüklenemedi');
    } finally {
      setLoading(false);
    }
  }, [accessToken, year, monthIndex]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleToggle(day: AvailabilityDay) {
    if (!accessToken || day.locked) return;
    setError(null);
    try {
      const updated = await setGuideAvailability(accessToken, {
        date: day.date,
        isAvailable: !day.isAvailable,
      });
      setDays((prev) => {
        if (prev.some((row) => row.date === updated.date)) {
          return prev.map((row) => (row.date === updated.date ? updated : row));
        }
        return [...prev, updated];
      });
      await revalidateRehberPanel();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gün güncellenemedi');
    }
  }

  function shiftMonth(delta: number) {
    const date = new Date(Date.UTC(year, monthIndex + delta, 1));
    setYear(date.getUTCFullYear());
    setMonthIndex(date.getUTCMonth());
  }

  return (
    <div
      className="mx-auto max-w-3xl space-y-4"
      data-testid="rehber-musaitlik-page"
    >
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Müsaitlik</h2>
        <p className="mt-1 text-sm text-gray-600">
          Takvimden gün seçerek müsaitliğinizi açıp kapatın. Atama ile
          kilitlenen günler değiştirilemez.
        </p>
      </div>

      <AvailabilityCalendar
        year={year}
        monthIndex={monthIndex}
        days={days}
        loading={loading}
        error={error}
        onPrevMonth={() => shiftMonth(-1)}
        onNextMonth={() => shiftMonth(1)}
        onToggleDay={(day) => {
          void handleToggle(day);
        }}
      />
    </div>
  );
}
