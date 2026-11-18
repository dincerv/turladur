'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

import {
  AvailabilityCalendar,
  monthRange,
} from '@/components/features/availability/availability-calendar';
import { revalidateOtobusPanel } from '@/app/(bus)/otobus/actions';
import { useAuth } from '@/providers/auth-provider';
import { ApiError } from '@/services/api-client';
import {
  getVehicleAvailability,
  listBusVehicles,
  setVehicleAvailability,
  type AvailabilityDay,
  type BusVehicle,
} from '@/services/availability';
import { OTOBUS_ROUTES } from '@/lib/panel-routes';

export default function OtobusAracMusaitlikPage() {
  const params = useParams<{ id: string }>();
  const vehicleId = params.id;
  const { accessToken } = useAuth();
  const now = new Date();
  const [year, setYear] = useState(now.getUTCFullYear());
  const [monthIndex, setMonthIndex] = useState(now.getUTCMonth());
  const [vehicle, setVehicle] = useState<BusVehicle | null>(null);
  const [days, setDays] = useState<AvailabilityDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!accessToken || !vehicleId) return;
    setLoading(true);
    setError(null);
    try {
      const [vehicles, availability] = await Promise.all([
        listBusVehicles(accessToken),
        getVehicleAvailability(
          accessToken,
          vehicleId,
          monthRange(year, monthIndex).from,
          monthRange(year, monthIndex).to,
        ),
      ]);
      setVehicle(vehicles.find((row) => row.id === vehicleId) ?? null);
      setDays(availability);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Müsaitlik yüklenemedi');
    } finally {
      setLoading(false);
    }
  }, [accessToken, vehicleId, year, monthIndex]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleToggle(day: AvailabilityDay) {
    if (!accessToken || !vehicleId || day.locked) return;
    setError(null);
    try {
      const updated = await setVehicleAvailability(accessToken, vehicleId, {
        date: day.date,
        isAvailable: !day.isAvailable,
      });
      setDays((prev) => {
        if (prev.some((row) => row.date === updated.date)) {
          return prev.map((row) => (row.date === updated.date ? updated : row));
        }
        return [...prev, updated];
      });
      await revalidateOtobusPanel(vehicleId);
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
      data-testid="otobus-musaitlik-page"
      data-vehicle-id={vehicleId}
    >
      <div>
        <Link
          href={OTOBUS_ROUTES.vehicles}
          className="text-xs font-medium text-blue-700 hover:underline"
        >
          ← Araçlar
        </Link>
        <h2 className="mt-2 text-xl font-semibold text-gray-900">
          Araç müsaitliği
          {vehicle ? ` · ${vehicle.plateNumber}` : ''}
        </h2>
        <p className="mt-1 text-sm text-gray-600">
          Gün seçerek aracı müsait / bakımda yapın. Atama ile rezerve günler
          değiştirilemez.
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
