'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Armchair, RefreshCw, Save } from 'lucide-react';

import {
  BUS_LAYOUT_KINDS,
  busLayoutLabel,
  type BusLayoutKindValue,
} from '@/lib/bus-layout-kinds';
import { useAuth } from '@/providers/auth-provider';
import { ApiError } from '@/services/api-client';
import {
  assignSeatsBulk,
  autoFifoSeats,
  getTourDateSeatMap,
  SeatGender,
  SeatUiStatus,
  setTourDateBusLayout,
  unassignSeat,
  type SeatMapCell,
  type SeatMapData,
  type UnassignedGuest,
} from '@/services/seat-assignment';

type AssignmentMode = 'MANUAL' | 'AUTO';

type BusSeatMapPanelProps = {
  tourDateId: string;
  tourId: string;
};

type PendingAssign = {
  seatCode: string;
  reservationGuestId: string;
  guestName: string;
};

function cellKey(cell: SeatMapCell) {
  return `${cell.row}-${cell.col}-${cell.code}`;
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

function resolveStatus(
  cell: SeatMapCell,
  pendingSeatCodes: Set<string>,
): SeatUiStatus {
  if (pendingSeatCodes.has(cell.code)) return SeatUiStatus.RESERVED;
  if (cell.status) return cell.status;
  if (cell.type === 'AISLE') return SeatUiStatus.AISLE;
  if (cell.type === 'CREW') return SeatUiStatus.CREW;
  if (cell.type === 'DOOR') return SeatUiStatus.DOOR;
  if (cell.type === 'WC' || cell.type === 'BLOCKED' || !cell.sellable) {
    return SeatUiStatus.BLOCKED;
  }
  return cell.occupancy ? SeatUiStatus.SOLD : SeatUiStatus.AVAILABLE;
}

function seatClassName(status: SeatUiStatus, gender: SeatGender | null) {
  switch (status) {
    case SeatUiStatus.AVAILABLE:
      return 'border-neutral-300 bg-white text-neutral-800 hover:border-neutral-900';
    case SeatUiStatus.RESERVED:
      return 'border-neutral-900 bg-neutral-900 text-white ring-2 ring-neutral-900/30';
    case SeatUiStatus.SOLD:
      if (gender === SeatGender.FEMALE) {
        return 'border-pink-300 bg-pink-100 text-pink-900';
      }
      if (gender === SeatGender.MALE) {
        return 'border-sky-300 bg-sky-100 text-sky-900';
      }
      return 'border-red-300 bg-red-50 text-red-800';
    case SeatUiStatus.CREW:
      return 'border-amber-300 bg-amber-100 text-amber-900';
    case SeatUiStatus.DOOR:
      return 'border-dashed border-slate-400 bg-slate-100 text-slate-600';
    case SeatUiStatus.LOCKED:
    case SeatUiStatus.BLOCKED:
      return 'border-gray-200 bg-gray-100 text-gray-400';
    default:
      return 'border-transparent bg-transparent';
  }
}

function SeatCellButton({
  cell,
  status,
  mode,
  busy,
  selectedGuestId,
  onSeatClick,
}: {
  cell: SeatMapCell;
  status: SeatUiStatus;
  mode: AssignmentMode;
  busy: boolean;
  selectedGuestId: string | null;
  onSeatClick: (cell: SeatMapCell) => void;
}) {
  if (status === SeatUiStatus.AISLE) {
    return (
      <div
        className="flex h-10 w-10 items-center justify-center"
        aria-hidden
        data-testid={`seat-aisle-${cell.row}-${cell.col}`}
      >
        <span className="h-full w-1 rounded-full bg-slate-300" />
      </div>
    );
  }

  if (
    status === SeatUiStatus.CREW ||
    status === SeatUiStatus.DOOR ||
    status === SeatUiStatus.BLOCKED ||
    status === SeatUiStatus.LOCKED
  ) {
    const label =
      status === SeatUiStatus.CREW
        ? 'ŞOF'
        : status === SeatUiStatus.DOOR
          ? 'Kapı'
          : '—';
    return (
      <div
        title={status}
        data-testid={`seat-${cell.code}-${status}`}
        className={`flex h-10 w-10 items-center justify-center rounded border text-[10px] font-semibold ${seatClassName(status, null)}`}
      >
        {label}
      </div>
    );
  }

  const occupied = cell.occupancy;
  const tooltip = occupied
    ? `${occupied.fullName} · PNR ${occupied.bookingNumber}`
    : `Koltuk ${cell.code}`;
  const canPick =
    mode === 'MANUAL' &&
    status === SeatUiStatus.AVAILABLE &&
    Boolean(selectedGuestId);
  const canInteract =
    mode === 'MANUAL' &&
    !busy &&
    (status === SeatUiStatus.SOLD ||
      status === SeatUiStatus.RESERVED ||
      canPick);

  return (
    <button
      type="button"
      disabled={!canInteract}
      title={tooltip}
      aria-label={tooltip}
      data-testid={`seat-${cell.code}-${status}`}
      onClick={() => onSeatClick(cell)}
      className={`group relative flex h-10 w-10 flex-col items-center justify-center rounded border text-[10px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-70 ${seatClassName(
        status,
        occupied?.gender ?? cell.gender,
      )} ${canPick ? 'cursor-pointer' : ''}`}
    >
      <span>{cell.code}</span>
      {occupied ? (
        <span className="leading-none">{initials(occupied.fullName)}</span>
      ) : null}
      {occupied ? (
        <span
          role="tooltip"
          className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 hidden w-max max-w-[12rem] -translate-x-1/2 rounded-md bg-neutral-900 px-2 py-1 text-[10px] font-medium text-white shadow-lg group-hover:block group-focus-visible:block"
        >
          {occupied.fullName}
          <br />
          PNR {occupied.bookingNumber}
        </span>
      ) : null}
    </button>
  );
}

export function BusSeatMapPanel({ tourDateId, tourId }: BusSeatMapPanelProps) {
  const { accessToken } = useAuth();
  const [map, setMap] = useState<SeatMapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [selectedGuestId, setSelectedGuestId] = useState<string | null>(null);
  const [layoutKind, setLayoutKind] = useState<BusLayoutKindValue | ''>('');
  const [needsLayout, setNeedsLayout] = useState(false);
  const [mode, setMode] = useState<AssignmentMode>('MANUAL');
  const [pending, setPending] = useState<PendingAssign[]>([]);
  const [autoPreview, setAutoPreview] = useState(false);
  const [forbidden, setForbidden] = useState(false);

  const pendingSeatCodes = useMemo(
    () => new Set(pending.map((row) => row.seatCode)),
    [pending],
  );

  const load = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    setNeedsLayout(false);
    setForbidden(false);
    try {
      const data = await getTourDateSeatMap(tourDateId, accessToken, tourId);
      if (data.tourId && data.tourId !== tourId) {
        setForbidden(true);
        setMap(null);
        return;
      }
      setMap(data);
      setPending([]);
      setSelectedGuestId((prev) => {
        if (!prev) return null;
        return data.unassignedGuests.some((guest) => guest.id === prev)
          ? prev
          : null;
      });
    } catch (err) {
      setMap(null);
      if (
        err instanceof ApiError &&
        (err.status === 403 || err.status === 404)
      ) {
        setForbidden(true);
      } else if (err instanceof ApiError && err.code === 'LAYOUT_REQUIRED') {
        setNeedsLayout(true);
        setError(null);
      } else {
        setError(
          err instanceof Error ? err.message : 'Koltuk haritası yüklenemedi',
        );
      }
    } finally {
      setLoading(false);
    }
  }, [accessToken, tourDateId, tourId]);

  useEffect(() => {
    void load();
  }, [load]);

  const grid = useMemo(() => {
    const cells = map?.layout.cells ?? [];
    const maxRow = cells.reduce((max, cell) => Math.max(max, cell.row), 0);
    const maxCol = cells.reduce((max, cell) => Math.max(max, cell.col), 0);
    const byPos = new Map(
      cells.map((cell) => [`${cell.row}:${cell.col}`, cell]),
    );
    const rows: Array<Array<SeatMapCell | null>> = [];
    for (let row = 0; row <= maxRow; row += 1) {
      const line: Array<SeatMapCell | null> = [];
      for (let col = 0; col <= maxCol; col += 1) {
        line.push(byPos.get(`${row}:${col}`) ?? null);
      }
      rows.push(line);
    }
    return rows;
  }, [map]);

  async function handleBindLayout() {
    if (!accessToken || !layoutKind) return;
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      await setTourDateBusLayout(tourDateId, layoutKind, accessToken);
      setMessage('Oturma planı bağlandı');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Plan bağlanamadı');
    } finally {
      setBusy(false);
    }
  }

  function handleSeatClick(cell: SeatMapCell) {
    if (mode !== 'MANUAL' || busy) return;
    const status = resolveStatus(cell, pendingSeatCodes);

    if (status === SeatUiStatus.SOLD && cell.occupancy) {
      void (async () => {
        if (!accessToken) return;
        setBusy(true);
        setError(null);
        try {
          await unassignSeat(cell.occupancy!.assignmentId, accessToken);
          setMessage(`Koltuk ${cell.code} boşaltıldı`);
          await load();
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Boşaltılamadı');
        } finally {
          setBusy(false);
        }
      })();
      return;
    }

    if (status === SeatUiStatus.RESERVED) {
      setPending((prev) => prev.filter((row) => row.seatCode !== cell.code));
      return;
    }

    if (status !== SeatUiStatus.AVAILABLE || !selectedGuestId || !map) return;
    const guest = map.unassignedGuests.find((g) => g.id === selectedGuestId);
    if (!guest) return;

    setPending((prev) => {
      const withoutGuest = prev.filter(
        (row) => row.reservationGuestId !== selectedGuestId,
      );
      return [
        ...withoutGuest.filter((row) => row.seatCode !== cell.code),
        {
          seatCode: cell.code,
          reservationGuestId: selectedGuestId,
          guestName: guest.fullName,
        },
      ];
    });
  }

  async function handleSave() {
    if (!accessToken) return;
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      if (mode === 'AUTO') {
        setAutoPreview(true);
        await autoFifoSeats(tourDateId, accessToken, tourId);
        setMessage('AUTO atama tamamlandı');
        setAutoPreview(false);
        await load();
        return;
      }

      if (pending.length === 0) {
        setError('Kaydetmek için en az bir koltuk seçin');
        return;
      }

      await assignSeatsBulk(
        tourDateId,
        {
          tourId,
          assignments: pending.map((row) => ({
            seatCode: row.seatCode,
            reservationGuestId: row.reservationGuestId,
          })),
        },
        accessToken,
      );
      setMessage(`${pending.length} koltuk başarıyla atandı`);
      setPending([]);
      setSelectedGuestId(null);
      await load();
    } catch (err) {
      setAutoPreview(false);
      setError(err instanceof Error ? err.message : 'Kayıt başarısız');
    } finally {
      setBusy(false);
    }
  }

  const guests: UnassignedGuest[] = map?.unassignedGuests ?? [];

  if (forbidden) {
    return (
      <div
        className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-800"
        data-testid="seats-forbidden"
      >
        Bu sefer koltuk haritasına erişim yetkiniz yok.
      </div>
    );
  }

  return (
    <div className="space-y-4" data-testid="bus-seat-map-panel">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Koltuk haritası
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            MANUAL: misafir seç → koltuk seç → Kaydet. AUTO: sistem FIFO +
            cinsiyet kuralı ile yerleştirir.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div
            className="inline-flex rounded-full border border-neutral-200 bg-white p-1"
            role="group"
            aria-label="Atama modu"
            data-testid="seat-mode-toggle"
          >
            <button
              type="button"
              data-testid="mode-manual-btn"
              aria-pressed={mode === 'MANUAL'}
              onClick={() => {
                setMode('MANUAL');
                setAutoPreview(false);
              }}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                mode === 'MANUAL'
                  ? 'bg-neutral-950 text-white'
                  : 'text-neutral-600 hover:bg-neutral-50'
              }`}
            >
              MANUAL
            </button>
            <button
              type="button"
              data-testid="mode-auto-btn"
              aria-pressed={mode === 'AUTO'}
              onClick={() => {
                setMode('AUTO');
                setPending([]);
                setSelectedGuestId(null);
              }}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                mode === 'AUTO'
                  ? 'bg-neutral-950 text-white'
                  : 'text-neutral-600 hover:bg-neutral-50'
              }`}
            >
              AUTO
            </button>
          </div>
          <button
            type="button"
            data-testid="seats-refresh-btn"
            onClick={() => void load()}
            disabled={loading || busy}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
          >
            <RefreshCw className="h-4 w-4" />
            Yenile
          </button>
          <button
            type="button"
            data-testid="save-seats-btn"
            disabled={busy || (mode === 'MANUAL' && pending.length === 0)}
            onClick={() => void handleSave()}
            className="inline-flex items-center gap-1.5 rounded-lg bg-neutral-950 px-4 py-2 text-xs font-semibold text-white hover:bg-neutral-800 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {busy ? 'Kaydediliyor…' : 'Kaydet'}
          </button>
        </div>
      </div>

      {error ? (
        <p
          role="alert"
          data-testid="seats-error"
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {error}
        </p>
      ) : null}
      {message ? (
        <p
          role="status"
          data-testid="seats-success-toast"
          className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800"
        >
          {message}
        </p>
      ) : null}

      {needsLayout ? (
        <div
          className="rounded-xl border border-amber-200 bg-amber-50 p-4"
          data-testid="seats-layout-required"
        >
          <p className="text-sm font-medium text-amber-900">
            Bu sefer için oturma planı henüz seçilmedi.
          </p>
          <div className="mt-3 flex flex-wrap items-end gap-2">
            <label className="block text-sm text-gray-700">
              Araç tipi
              <select
                data-testid="layout-kind-select"
                value={layoutKind}
                onChange={(event) =>
                  setLayoutKind(event.target.value as BusLayoutKindValue | '')
                }
                className="mt-1 block w-48 rounded-md border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="">Seçin…</option>
                {BUS_LAYOUT_KINDS.map((row) => (
                  <option key={row.kind} value={row.kind}>
                    {row.label}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              data-testid="bind-layout-btn"
              disabled={!layoutKind || busy}
              onClick={() => void handleBindLayout()}
              className="rounded-lg bg-neutral-950 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              Planı bağla
            </button>
          </div>
        </div>
      ) : null}

      {loading ? (
        <div
          className="flex h-40 items-center justify-center"
          data-testid="seats-skeleton"
        >
          <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-neutral-900" />
        </div>
      ) : null}

      {!loading && map ? (
        <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
          <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Atanmamış misafirler
            </p>
            {mode === 'AUTO' ? (
              <p className="mt-3 text-sm text-gray-500" data-testid="auto-hint">
                AUTO modunda harita salt okunur. Kaydet ile FIFO atama çalışır.
              </p>
            ) : guests.length === 0 ? (
              <p className="mt-3 text-sm text-gray-500">
                Tüm onaylı misafirlere koltuk atanmış.
              </p>
            ) : (
              <ul
                className="mt-3 space-y-2"
                data-testid="unassigned-guest-list"
              >
                {guests.map((guest) => {
                  const active = guest.id === selectedGuestId;
                  const staged = pending.some(
                    (row) => row.reservationGuestId === guest.id,
                  );
                  return (
                    <li key={guest.id}>
                      <button
                        type="button"
                        data-testid={`guest-${guest.id}`}
                        onClick={() =>
                          setSelectedGuestId(active ? null : guest.id)
                        }
                        className={`w-full rounded-lg border px-3 py-2 text-left text-sm ${
                          active
                            ? 'border-neutral-900 bg-neutral-950 text-white'
                            : staged
                              ? 'border-amber-300 bg-amber-50 text-amber-950'
                              : 'border-gray-200 bg-white text-gray-800 hover:bg-gray-50'
                        }`}
                      >
                        <span className="font-medium">{guest.fullName}</span>
                        <span className="mt-0.5 block text-xs opacity-80">
                          {guest.bookingNumber}
                          {guest.gender !== SeatGender.UNKNOWN
                            ? ` · ${guest.gender === SeatGender.FEMALE ? 'K' : 'E'}`
                            : ''}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
            {pending.length > 0 ? (
              <p
                className="mt-3 text-xs text-neutral-600"
                data-testid="pending-count"
              >
                Bekleyen seçim: {pending.length}
              </p>
            ) : null}
          </div>

          <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <p className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-800">
                <Armchair className="h-4 w-4 text-gray-500" />
                {busLayoutLabel(map.layout.kind)} · {map.layout.passengerSeats}{' '}
                yolcu
                <span className="ml-2 text-xs text-gray-500">
                  v{map.layoutVersion}
                </span>
              </p>
              <div
                className="flex flex-wrap gap-2 text-[11px] text-gray-600"
                data-testid="seat-legend"
              >
                <span className="inline-flex items-center gap-1">
                  <span className="h-3 w-3 rounded border border-neutral-300 bg-white" />{' '}
                  Boş
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="h-3 w-3 rounded border border-pink-300 bg-pink-100" />{' '}
                  Dolu K
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="h-3 w-3 rounded border border-sky-300 bg-sky-100" />{' '}
                  Dolu E
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="h-3 w-3 rounded border border-neutral-900 bg-neutral-900" />{' '}
                  Seçili
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="h-3 w-3 rounded border border-amber-300 bg-amber-100" />{' '}
                  Şoför
                </span>
              </div>
            </div>

            <div className="mb-2 rounded-md bg-slate-800 px-3 py-1.5 text-center text-xs font-semibold tracking-wide text-white">
              ÖN · ŞOFÖR SOL · KORİDOR ORTA · 1. KAPİ SAĞ
            </div>

            <div
              className={`overflow-x-auto overscroll-x-contain touch-pan-x ${
                mode === 'AUTO' ? 'opacity-90' : ''
              } ${autoPreview ? 'animate-pulse' : ''}`}
              data-testid="seat-map-scroll"
            >
              <div
                className="inline-flex min-w-max flex-col gap-1.5 p-1"
                data-testid="seat-map-grid"
              >
                {grid.map((line, rowIndex) => (
                  <div key={`row-${rowIndex}`} className="flex gap-1.5">
                    {line.map((cell, colIndex) =>
                      cell ? (
                        <SeatCellButton
                          key={cellKey(cell)}
                          cell={cell}
                          status={resolveStatus(cell, pendingSeatCodes)}
                          mode={mode}
                          busy={busy}
                          selectedGuestId={selectedGuestId}
                          onSeatClick={handleSeatClick}
                        />
                      ) : (
                        <div
                          key={`empty-${rowIndex}-${colIndex}`}
                          className="h-10 w-10"
                          aria-hidden
                        />
                      ),
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
