'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';
import { parseCreateAssignmentInvite } from '@turta/shared-validators';

import { ApiError } from '@/services/api-client';
import {
  listAgencyVehicles,
  type AgencyVehicleCandidate,
} from '@/services/availability';
import {
  listPartnerTourDates,
  listPartnerTours,
  type PartnerTour,
  type PartnerTourDateRow,
} from '@/services/partner-admin';
import {
  inviteBusToTourDate,
  inviteGuideToTourDate,
  listAgencyGuides,
  type AgencyGuideCandidate,
} from '@/services/tour-date-assignment';

type InviteRole = 'GUIDE' | 'BUS';

type InviteAssignmentModalProps = {
  open: boolean;
  accessToken: string;
  onClose: () => void;
  onSuccess: (message: string) => void;
  prefills?: {
    role?: InviteRole;
    tourDateId?: string;
    guideId?: string;
    busCompanyId?: string;
  };
};

function toDay(iso: string): string {
  return iso.slice(0, 10);
}

function formatRange(start: string, end: string): string {
  const from = toDay(start);
  const to = toDay(end);
  return from === to ? from : `${from} → ${to}`;
}

export function InviteAssignmentModal({
  open,
  accessToken,
  onClose,
  onSuccess,
  prefills,
}: InviteAssignmentModalProps) {
  const [role, setRole] = useState<InviteRole>(prefills?.role ?? 'GUIDE');
  const [tours, setTours] = useState<PartnerTour[]>([]);
  const [tourId, setTourId] = useState('');
  const [dates, setDates] = useState<PartnerTourDateRow[]>([]);
  const [tourDateId, setTourDateId] = useState(prefills?.tourDateId ?? '');
  const [search, setSearch] = useState('');
  const [guides, setGuides] = useState<AgencyGuideCandidate[]>([]);
  const [vehicles, setVehicles] = useState<AgencyVehicleCandidate[]>([]);
  const [selectedGuideId, setSelectedGuideId] = useState(
    prefills?.guideId ?? '',
  );
  const [selectedBusCompanyId, setSelectedBusCompanyId] = useState(
    prefills?.busCompanyId ?? '',
  );
  const [selectedPlate, setSelectedPlate] = useState('');
  const [note, setNote] = useState('');
  const [loadingMeta, setLoadingMeta] = useState(false);
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedDate = useMemo(
    () => dates.find((d) => d.id === tourDateId) ?? null,
    [dates, tourDateId],
  );

  const loadTours = useCallback(async () => {
    setLoadingMeta(true);
    setError(null);
    try {
      const result = await listPartnerTours(accessToken, {
        page: 1,
        pageSize: 50,
      });
      setTours(result.items);
      setTourId((prev) => prev || result.items[0]?.id || '');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Turlar yüklenemedi');
    } finally {
      setLoadingMeta(false);
    }
  }, [accessToken]);

  useEffect(() => {
    if (!open) return;
    setRole(prefills?.role ?? 'GUIDE');
    setTourDateId(prefills?.tourDateId ?? '');
    setSelectedGuideId(prefills?.guideId ?? '');
    setSelectedBusCompanyId(prefills?.busCompanyId ?? '');
    setNote('');
    setSearch('');
    setError(null);
    void loadTours();
  }, [open, prefills, loadTours]);

  useEffect(() => {
    if (!open || !tourId) return;
    let cancelled = false;
    (async () => {
      try {
        const rows = await listPartnerTourDates(tourId, accessToken);
        if (cancelled) return;
        const active = rows.filter((r) => r.isActive);
        setDates(active);
        setTourDateId((prev) =>
          prev && active.some((r) => r.id === prev)
            ? prev
            : (active[0]?.id ?? ''),
        );
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof ApiError ? err.message : 'Seferler yüklenemedi',
          );
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, tourId, accessToken]);

  useEffect(() => {
    if (!open || !selectedDate) {
      setGuides([]);
      setVehicles([]);
      return;
    }
    let cancelled = false;
    const from = toDay(selectedDate.startDate);
    const to = toDay(selectedDate.endDate);

    (async () => {
      setLoadingCandidates(true);
      setError(null);
      try {
        if (role === 'GUIDE') {
          const rows = await listAgencyGuides(accessToken, {
            from,
            to,
            q: search || undefined,
            availableOnly: true,
          });
          if (!cancelled) setGuides(rows);
        } else {
          const rows = await listAgencyVehicles(accessToken, {
            from,
            to,
            q: search || undefined,
            availableOnly: true,
          });
          if (!cancelled) setVehicles(rows);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof ApiError ? err.message : 'Aday listesi yüklenemedi',
          );
        }
      } finally {
        if (!cancelled) setLoadingCandidates(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, selectedDate, role, search, accessToken]);

  async function handleSubmit() {
    if (!selectedDate) {
      setError('Sefer seçin');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const payload =
        role === 'GUIDE'
          ? parseCreateAssignmentInvite({
              role: 'GUIDE',
              tourDateId: selectedDate.id,
              guideId: selectedGuideId,
              note: note.trim() || undefined,
            })
          : parseCreateAssignmentInvite({
              role: 'BUS',
              tourDateId: selectedDate.id,
              busCompanyId: selectedBusCompanyId,
              note:
                note.trim() ||
                (selectedPlate
                  ? `Tercih edilen araç: ${selectedPlate}`
                  : undefined),
            });

      if (payload.role === 'GUIDE') {
        await inviteGuideToTourDate(accessToken, payload.tourDateId, {
          guideId: payload.guideId,
          note: payload.note,
        });
        onSuccess('Rehber daveti gönderildi');
      } else {
        await inviteBusToTourDate(accessToken, payload.tourDateId, {
          busCompanyId: payload.busCompanyId,
          note: payload.note,
        });
        onSuccess('Otobüs daveti gönderildi');
      }
      onClose();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Davet gönderilemedi',
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="invite-assignment-title"
      data-testid="invite-assignment-modal"
    >
      <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h2
            id="invite-assignment-title"
            className="text-lg font-semibold text-gray-900"
          >
            Yeni Atama / Davet Gönder
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100"
            aria-label="Kapat"
            data-testid="invite-modal-close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 overflow-y-auto px-5 py-4">
          <div className="flex gap-2" data-testid="invite-role-tabs">
            {(
              [
                ['GUIDE', 'Rehber'],
                ['BUS', 'Otobüs / Araç'],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => {
                  setRole(key);
                  setSearch('');
                  setSelectedGuideId('');
                  setSelectedBusCompanyId('');
                  setSelectedPlate('');
                }}
                data-testid={`invite-role-${key}`}
                className={`rounded-lg border px-3 py-2 text-sm font-medium ${
                  role === key
                    ? 'border-blue-300 bg-blue-50 text-blue-800'
                    : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-gray-700">Tur</span>
              <select
                data-testid="invite-tour-select"
                value={tourId}
                disabled={loadingMeta}
                onChange={(e) => {
                  setTourId(e.target.value);
                  setTourDateId('');
                }}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              >
                {tours.length === 0 ? (
                  <option value="">Tur bulunamadı</option>
                ) : null}
                {tours.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm">
              <span className="mb-1 block font-medium text-gray-700">
                Sefer
              </span>
              <select
                data-testid="invite-tour-date-select"
                value={tourDateId}
                onChange={(e) => setTourDateId(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              >
                {dates.length === 0 ? (
                  <option value="">Aktif sefer yok</option>
                ) : null}
                {dates.map((d) => (
                  <option key={d.id} value={d.id}>
                    {formatRange(d.startDate, d.endDate)}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="block text-sm">
            <span className="mb-1 block font-medium text-gray-700">
              {role === 'GUIDE' ? 'Rehber ara' : 'Araç / firma ara'}
            </span>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                data-testid="invite-search-input"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={
                  role === 'GUIDE'
                    ? 'İsim, e-posta, şehir…'
                    : 'Plaka, firma, şehir…'
                }
                className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm"
              />
            </div>
          </label>

          <div
            className="max-h-56 overflow-y-auto rounded-lg border border-gray-200"
            data-testid="invite-candidate-list"
          >
            {loadingCandidates ? (
              <p className="px-3 py-6 text-center text-sm text-gray-500">
                Yükleniyor…
              </p>
            ) : null}

            {!loadingCandidates && role === 'GUIDE' && guides.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-gray-500">
                Müsait rehber bulunamadı
              </p>
            ) : null}

            {!loadingCandidates && role === 'BUS' && vehicles.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-gray-500">
                Müsait araç bulunamadı
              </p>
            ) : null}

            {role === 'GUIDE'
              ? guides.map((g) => {
                  const label =
                    `${g.firstName} ${g.lastName}`.trim() || g.email;
                  const selected = selectedGuideId === g.id;
                  return (
                    <button
                      key={g.id}
                      type="button"
                      data-testid={`invite-guide-option-${g.id}`}
                      onClick={() => setSelectedGuideId(g.id)}
                      className={`flex w-full items-start justify-between gap-2 border-b border-gray-100 px-3 py-2.5 text-left text-sm last:border-b-0 ${
                        selected
                          ? 'bg-blue-50 text-blue-900'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <span>
                        <span className="font-medium">{label}</span>
                        <span className="mt-0.5 block text-xs text-gray-500">
                          {g.city ?? '—'} · {g.email}
                        </span>
                      </span>
                      {selected ? (
                        <span className="text-xs font-medium text-blue-700">
                          Seçildi
                        </span>
                      ) : null}
                    </button>
                  );
                })
              : vehicles.map((v) => {
                  const selected = selectedBusCompanyId === v.busCompany.id;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      data-testid={`invite-vehicle-option-${v.id}`}
                      onClick={() => {
                        setSelectedBusCompanyId(v.busCompany.id);
                        setSelectedPlate(v.plateNumber);
                      }}
                      className={`flex w-full items-start justify-between gap-2 border-b border-gray-100 px-3 py-2.5 text-left text-sm last:border-b-0 ${
                        selected
                          ? 'bg-blue-50 text-blue-900'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <span>
                        <span className="font-medium">{v.plateNumber}</span>
                        <span className="mt-0.5 block text-xs text-gray-500">
                          {v.busCompany.companyName} · {v.capacity} koltuk
                        </span>
                      </span>
                      {selected ? (
                        <span className="text-xs font-medium text-blue-700">
                          Seçildi
                        </span>
                      ) : null}
                    </button>
                  );
                })}
          </div>

          <label className="block text-sm">
            <span className="mb-1 block font-medium text-gray-700">
              Not (opsiyonel)
            </span>
            <textarea
              data-testid="invite-note-input"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              maxLength={2000}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </label>

          {error ? (
            <p
              className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
              data-testid="invite-modal-error"
            >
              {error}
            </p>
          ) : null}
        </div>

        <div className="flex justify-end gap-2 border-t border-gray-100 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Vazgeç
          </button>
          <button
            type="button"
            data-testid="invite-submit-btn"
            disabled={
              submitting ||
              !tourDateId ||
              (role === 'GUIDE' ? !selectedGuideId : !selectedBusCompanyId)
            }
            onClick={() => void handleSubmit()}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? 'Gönderiliyor…' : 'Davet Gönder'}
          </button>
        </div>
      </div>
    </div>
  );
}
