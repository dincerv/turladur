'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Bus } from 'lucide-react';

import { revalidateOtobusPanel } from '@/app/(bus)/otobus/actions';
import { useAuth } from '@/providers/auth-provider';
import { ApiError } from '@/services/api-client';
import {
  createBusVehicle,
  deleteBusVehicle,
  listBusVehicles,
  updateBusVehicle,
  type BusVehicle,
} from '@/services/availability';
import {
  BUS_LAYOUT_KINDS,
  busLayoutLabel,
  type BusLayoutKindValue,
} from '@/lib/bus-layout-kinds';
import { OTOBUS_ROUTES } from '@/lib/panel-routes';

export default function OtobusAraclarPage() {
  const { accessToken } = useAuth();
  const [vehicles, setVehicles] = useState<BusVehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [plateNumber, setPlateNumber] = useState('');
  const [seatLayoutKind, setSeatLayoutKind] =
    useState<BusLayoutKindValue>('BUS_46_PLUS_1');
  const [modelYear, setModelYear] = useState('');
  const [notes, setNotes] = useState('');
  const [isActive, setIsActive] = useState(true);

  const load = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const data = await listBusVehicles(accessToken);
      setVehicles(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Araçlar yüklenemedi');
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    void load();
  }, [load]);

  function resetForm() {
    setPlateNumber('');
    setSeatLayoutKind('BUS_46_PLUS_1');
    setModelYear('');
    setNotes('');
    setIsActive(true);
    setEditingId(null);
    setShowForm(false);
  }

  function startCreate() {
    resetForm();
    setShowForm(true);
  }

  function startEdit(vehicle: BusVehicle) {
    setEditingId(vehicle.id);
    setPlateNumber(vehicle.plateNumber);
    setSeatLayoutKind(
      (BUS_LAYOUT_KINDS.find((row) => row.kind === vehicle.seatLayoutKind)
        ?.kind ?? 'BUS_46_PLUS_1') as BusLayoutKindValue,
    );
    setModelYear(vehicle.modelYear ? String(vehicle.modelYear) : '');
    setNotes(vehicle.notes ?? '');
    setIsActive(vehicle.isActive);
    setShowForm(true);
    setMessage(null);
    setError(null);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!accessToken) return;
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const year = modelYear.trim() ? Number(modelYear) : undefined;
      if (editingId) {
        await updateBusVehicle(accessToken, editingId, {
          plateNumber: plateNumber.trim(),
          seatLayoutKind,
          modelYear: year ?? null,
          notes: notes.trim() || null,
          isActive,
        });
        setMessage('Araç güncellendi.');
      } else {
        await createBusVehicle(accessToken, {
          plateNumber: plateNumber.trim(),
          seatLayoutKind,
          modelYear: year,
          notes: notes.trim() || undefined,
        });
        setMessage('Araç kaydedildi.');
      }
      resetForm();
      await revalidateOtobusPanel();
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Araç kaydedilemedi');
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(vehicleId: string) {
    if (!accessToken) return;
    if (!window.confirm('Bu aracı silmek istediğinize emin misiniz?')) return;
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      await deleteBusVehicle(accessToken, vehicleId);
      setMessage('Araç silindi.');
      if (editingId === vehicleId) resetForm();
      await revalidateOtobusPanel(vehicleId);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Araç silinemedi');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="mx-auto max-w-3xl space-y-4"
      data-testid="otobus-araclar-page"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Araçlar</h2>
          <p className="mt-1 text-sm text-gray-600">
            Araç tipini seçerek kaydedin; müsaitlik takvimini yönetmek için bir
            araç seçin.
          </p>
        </div>
        {!showForm ? (
          <button
            type="button"
            onClick={startCreate}
            className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
            data-testid="otobus-vehicle-add"
          >
            Araç ekle
          </button>
        ) : null}
      </div>

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
          {message}
        </p>
      ) : null}

      {showForm ? (
        <form
          onSubmit={(event) => void handleSubmit(event)}
          className="space-y-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
          data-testid="otobus-vehicle-form"
        >
          <h3 className="text-sm font-semibold text-gray-900">
            {editingId ? 'Araç düzenle' : 'Yeni araç'}
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm text-gray-700">
              Plaka
              <input
                required
                value={plateNumber}
                onChange={(event) => setPlateNumber(event.target.value)}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="06 ABC 123"
                data-testid="otobus-vehicle-plate"
              />
            </label>
            <label className="block text-sm text-gray-700">
              Araç tipi
              <select
                required
                value={seatLayoutKind}
                onChange={(event) =>
                  setSeatLayoutKind(event.target.value as BusLayoutKindValue)
                }
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                data-testid="otobus-vehicle-layout"
              >
                {BUS_LAYOUT_KINDS.map((row) => (
                  <option key={row.kind} value={row.kind}>
                    {row.label} ({row.passengerSeats} yolcu)
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm text-gray-700">
              Model yılı
              <input
                type="number"
                min={1990}
                max={2100}
                value={modelYear}
                onChange={(event) => setModelYear(event.target.value)}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="2022"
                data-testid="otobus-vehicle-year"
              />
            </label>
            {editingId ? (
              <label className="flex items-center gap-2 self-end pb-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(event) => setIsActive(event.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                Aktif
              </label>
            ) : null}
          </div>
          <label className="block text-sm text-gray-700">
            Not
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={2}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={busy}
              className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              data-testid="otobus-vehicle-submit"
            >
              {editingId ? 'Kaydet' : 'Ekle'}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={resetForm}
              className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              İptal
            </button>
          </div>
        </form>
      ) : null}

      {loading ? <p className="text-sm text-gray-500">Yükleniyor…</p> : null}

      {!loading && vehicles.length === 0 ? (
        <div
          className="rounded-lg border border-dashed border-gray-300 bg-white p-6 text-sm text-gray-500"
          data-testid="otobus-vehicles-empty"
        >
          Kayıtlı araç yok. “Araç ekle” ile tip seçerek kaydedin.
        </div>
      ) : null}

      <ul className="space-y-3" data-testid="otobus-vehicles-list">
        {vehicles.map((vehicle) => (
          <li
            key={vehicle.id}
            className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
            data-testid={`otobus-vehicle-row-${vehicle.id}`}
            data-plate={vehicle.plateNumber}
          >
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                <Bus className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-gray-900">
                  {vehicle.plateNumber}
                </p>
                <p className="text-xs text-gray-500">
                  {busLayoutLabel(vehicle.seatLayoutKind)} · {vehicle.capacity}{' '}
                  yolcu
                  {vehicle.modelYear ? ` · ${vehicle.modelYear}` : ''}
                  {vehicle.isActive ? '' : ' · pasif'}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link
                  href={OTOBUS_ROUTES.vehicleAvailability(vehicle.id)}
                  className="rounded-md border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100"
                  data-testid={`otobus-vehicle-availability-${vehicle.id}`}
                >
                  Müsaitlik
                </Link>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => startEdit(vehicle)}
                  className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                  data-testid={`otobus-vehicle-edit-${vehicle.id}`}
                >
                  Düzenle
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void handleDelete(vehicle.id)}
                  className="rounded-md border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50"
                  data-testid={`otobus-vehicle-delete-${vehicle.id}`}
                >
                  Sil
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
