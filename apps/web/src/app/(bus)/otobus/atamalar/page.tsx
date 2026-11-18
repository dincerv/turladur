'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

import { revalidateOtobusAssignments } from '@/app/(bus)/otobus/actions';
import { useAuth } from '@/providers/auth-provider';
import { ApiError } from '@/services/api-client';
import { listBusVehicles, type BusVehicle } from '@/services/availability';
import {
  listBusAssignments,
  respondBusAssignment,
  type TourDateAssignmentRow,
} from '@/services/tour-date-assignment';
import { busLayoutLabel } from '@/lib/bus-layout-kinds';
import { OTOBUS_ROUTES } from '@/lib/panel-routes';

function toDay(iso: string): string {
  return iso.slice(0, 10);
}

export default function OtobusAtamalarPage() {
  const { accessToken } = useAuth();
  const [rows, setRows] = useState<TourDateAssignmentRow[]>([]);
  const [vehicles, setVehicles] = useState<BusVehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<
    Record<string, string>
  >({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const [assignmentRows, vehicleRows] = await Promise.all([
        listBusAssignments(accessToken),
        listBusVehicles(accessToken),
      ]);
      setRows(assignmentRows);
      setVehicles(vehicleRows.filter((vehicle) => vehicle.isActive));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Atamalar yüklenemedi');
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleRespond(
    assignmentId: string,
    status: 'ACCEPTED' | 'REJECTED',
  ) {
    if (!accessToken) return;
    setBusyId(assignmentId);
    setError(null);
    try {
      if (status === 'ACCEPTED') {
        const vehicleId = selectedVehicle[assignmentId];
        if (!vehicleId) {
          setError('Kabul için bir araç seçin.');
          return;
        }
        await respondBusAssignment(accessToken, assignmentId, {
          status,
          vehicleId,
        });
      } else {
        await respondBusAssignment(accessToken, assignmentId, { status });
      }
      await revalidateOtobusAssignments();
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Yanıt gönderilemedi');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div
      className="mx-auto max-w-3xl space-y-4"
      data-testid="otobus-atamalar-page"
    >
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Atamalar</h2>
        <p className="mt-1 text-sm text-gray-600">
          Acentelerden gelen sefer davetlerini kabul veya reddedin. Kabulde
          plaka seçimi zorunludur.
        </p>
      </div>

      {loading ? <p className="text-sm text-gray-500">Yükleniyor…</p> : null}
      {error ? (
        <p
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
          data-testid="otobus-assignments-error"
        >
          {error}
        </p>
      ) : null}

      {!loading && vehicles.length === 0 ? (
        <div
          className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"
          data-testid="otobus-assignments-no-fleet"
        >
          Filoda aktif araç yok. Davet kabulü için önce{' '}
          <Link href={OTOBUS_ROUTES.vehicles} className="font-medium underline">
            araç ekleyin
          </Link>
          .
        </div>
      ) : null}

      {!loading && rows.length === 0 ? (
        <div
          className="rounded-lg border border-dashed border-gray-300 bg-white p-6 text-sm text-gray-500"
          data-testid="otobus-assignments-empty"
        >
          Bekleyen veya kabul edilmiş atama yok.
        </div>
      ) : null}

      <ul className="space-y-3" data-testid="otobus-assignments-list">
        {rows.map((row) => {
          const tourTitle = row.tourDate?.tour.title ?? 'Tur';
          const range =
            row.tourDate != null
              ? `${toDay(row.tourDate.startDate)} → ${toDay(row.tourDate.endDate)}`
              : '';
          const assignedPlate = row.tourDate?.vehicle?.plateNumber ?? null;
          return (
            <li
              key={row.id}
              className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
              data-testid={`otobus-assignment-row-${row.id}`}
              data-status={row.status}
            >
              <p className="text-sm font-semibold text-gray-900">{tourTitle}</p>
              <p className="text-xs text-gray-500">{range}</p>
              {row.note ? (
                <p className="mt-1 text-xs text-gray-500">{row.note}</p>
              ) : null}
              <span
                className={
                  row.status === 'PENDING'
                    ? 'mt-2 inline-flex rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800'
                    : row.status === 'REJECTED'
                      ? 'mt-2 inline-flex rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-xs font-medium text-red-800'
                      : 'mt-2 inline-flex rounded-full border border-green-200 bg-green-50 px-2 py-0.5 text-xs font-medium text-green-800'
                }
                data-testid={`otobus-assignment-badge-${row.id}`}
              >
                {row.status === 'PENDING'
                  ? 'Beklemede'
                  : row.status === 'REJECTED'
                    ? 'Reddedildi'
                    : 'Kabul edildi'}
              </span>
              {row.status === 'ACCEPTED' && assignedPlate ? (
                <p
                  className="mt-2 text-xs font-medium text-gray-700"
                  data-testid={`otobus-assignment-plate-${row.id}`}
                >
                  Plaka: {assignedPlate}
                </p>
              ) : null}

              {row.status === 'PENDING' ? (
                <div className="mt-3 space-y-2">
                  <label className="block text-sm text-gray-700">
                    Kabul için araç
                    <select
                      value={selectedVehicle[row.id] ?? ''}
                      onChange={(event) =>
                        setSelectedVehicle((prev) => ({
                          ...prev,
                          [row.id]: event.target.value,
                        }))
                      }
                      className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      data-testid={`otobus-assignment-vehicle-${row.id}`}
                    >
                      <option value="">Araç seçin…</option>
                      {vehicles.map((vehicle) => (
                        <option key={vehicle.id} value={vehicle.id}>
                          {vehicle.plateNumber} ·{' '}
                          {busLayoutLabel(vehicle.seatLayoutKind)} (
                          {vehicle.capacity})
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={busyId === row.id || vehicles.length === 0}
                      onClick={() => void handleRespond(row.id, 'ACCEPTED')}
                      className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                      data-testid={`otobus-assignment-accept-${row.id}`}
                    >
                      Kabul et
                    </button>
                    <button
                      type="button"
                      disabled={busyId === row.id}
                      onClick={() => void handleRespond(row.id, 'REJECTED')}
                      className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                      data-testid={`otobus-assignment-reject-${row.id}`}
                    >
                      Reddet
                    </button>
                  </div>
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
