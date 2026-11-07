'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { tourCategoryLabel } from '@turta/shared-constants';

import { TourCard } from '@/components/features/partner-dashboard/tour-card';
import { getTourDates, type TourDateRow } from '@/services/catalog';
import {
  cancelPartnerTour,
  cancelPartnerTourDates,
  listPartnerTours,
  TOUR_CANCEL_REASON_OPTIONS,
  type PartnerTour,
  type TourCancelReason,
} from '@/services/partner-admin';
import { useAuth } from '@/providers/auth-provider';

function mapStatus(status: string): 'active' | 'draft' | 'archived' {
  if (status === 'PUBLISHED' || status === 'ACTIVE') return 'active';
  if (status === 'ARCHIVED') return 'archived';
  return 'draft';
}

function formatDateRange(startDate: string, endDate: string): string {
  const fmt = new Intl.DateTimeFormat('tr-TR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const start = fmt.format(new Date(startDate));
  const end = fmt.format(new Date(endDate));
  return start === end ? start : `${start} – ${end}`;
}

export default function PartnerToursPage() {
  const { accessToken } = useAuth();
  const router = useRouter();
  const [tours, setTours] = useState<PartnerTour[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [listView, setListView] = useState(false);

  const [cancelTour, setCancelTour] = useState<PartnerTour | null>(null);
  const [cancelDates, setCancelDates] = useState<TourDateRow[]>([]);
  const [selectedDateIds, setSelectedDateIds] = useState<string[]>([]);
  const [datesLoading, setDatesLoading] = useState(false);
  const [cancelReason, setCancelReason] =
    useState<TourCancelReason>('OPERATIONAL');
  const [cancelNote, setCancelNote] = useState('');
  const [cancelBusy, setCancelBusy] = useState(false);

  async function reload() {
    if (!accessToken) return;
    setTours(await listPartnerTours(accessToken));
  }

  useEffect(() => {
    if (!accessToken) return;
    void reload()
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  useEffect(() => {
    if (!cancelTour) {
      setCancelDates([]);
      setSelectedDateIds([]);
      return;
    }

    let cancelled = false;
    setDatesLoading(true);
    void getTourDates(cancelTour.id)
      .then((dates) => {
        if (cancelled) return;
        setCancelDates(dates);
        setSelectedDateIds(dates.map((d) => d.id));
      })
      .catch((err: Error) => {
        if (!cancelled) {
          setError(err.message);
          setCancelDates([]);
          setSelectedDateIds([]);
        }
      })
      .finally(() => {
        if (!cancelled) setDatesLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [cancelTour]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return tours;
    return tours.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q) ||
        t.status.toLowerCase().includes(q),
    );
  }, [tours, query]);

  function toggleDate(id: string) {
    setSelectedDateIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function toggleAllDates() {
    if (selectedDateIds.length === cancelDates.length) {
      setSelectedDateIds([]);
    } else {
      setSelectedDateIds(cancelDates.map((d) => d.id));
    }
  }

  async function handleConfirmCancel() {
    if (!accessToken || !cancelTour) return;

    if (cancelDates.length > 0 && selectedDateIds.length === 0) {
      setError('İptal için en az bir tarih seçin');
      return;
    }

    setCancelBusy(true);
    setError(null);
    try {
      if (cancelDates.length > 0) {
        await cancelPartnerTourDates(
          cancelTour.id,
          {
            dateIds: selectedDateIds,
            reason: cancelReason,
            note: cancelNote.trim() || undefined,
          },
          accessToken,
        );
      } else {
        await cancelPartnerTour(
          cancelTour.id,
          {
            reason: cancelReason,
            note: cancelNote.trim() || undefined,
          },
          accessToken,
        );
      }
      setCancelTour(null);
      setCancelNote('');
      setCancelReason('OPERATIONAL');
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Tur iptal edilemedi');
    } finally {
      setCancelBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-500" />
      </div>
    );
  }

  const allDatesSelected =
    cancelDates.length > 0 && selectedDateIds.length === cancelDates.length;
  const canSubmit =
    !cancelBusy &&
    !datesLoading &&
    (cancelDates.length === 0 || selectedDateIds.length > 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Turlar</h1>
          <p className="mt-1 text-sm text-gray-600">
            Turlarınızı yönetin. İptal ederken tarih seçin; yalnızca o tarihteki
            rezervasyonlar iptal edilir ve müşterilere bilgilendirme maili
            gider.
          </p>
        </div>
        <Link
          href="/acente/tours/new"
          className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
        >
          <Plus className="mr-1.5 h-4 w-4" />
          Yeni Tur
        </Link>
      </div>

      <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative max-w-md flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tur ara..."
              className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setListView(false)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
                !listView
                  ? 'bg-blue-50 text-blue-700'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              Kart
            </button>
            <button
              type="button"
              onClick={() => setListView(true)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
                listView
                  ? 'bg-blue-50 text-blue-700'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              Liste
            </button>
          </div>
        </div>
      </div>

      {error ? (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>
      ) : null}

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 bg-white px-6 py-16 text-center">
          <p className="text-lg font-semibold text-gray-700">Tur bulunamadı</p>
          <p className="mt-1 text-sm text-gray-500">
            Henüz tur eklemediniz veya aramanız sonuç vermedi.
          </p>
          <Link
            href="/acente/tours/new"
            className="mt-6 inline-flex rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            İlk turu ekle
          </Link>
        </div>
      ) : (
        <div
          className={
            listView
              ? 'space-y-4'
              : 'grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3'
          }
        >
          {filtered.map((tour) => (
            <TourCard
              key={tour.id}
              id={tour.id}
              title={tour.title}
              price={`${Number(tour.price).toLocaleString('tr-TR')} ${tour.currency}`}
              location={tourCategoryLabel(tour.category) || '—'}
              duration={`${tour.durationDays} gün`}
              maxParticipants={20}
              imageUrl={tour.coverUrl || '/brand/mark-on-light.png'}
              status={mapStatus(tour.status)}
              listView={listView}
              onEdit={(id) => router.push(`/acente/tours/${id}/edit`)}
              onDelete={
                mapStatus(tour.status) === 'archived'
                  ? undefined
                  : () => {
                      setError(null);
                      setCancelTour(tour);
                      setCancelReason('OPERATIONAL');
                      setCancelNote('');
                    }
              }
            />
          ))}
        </div>
      )}

      {cancelTour ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold text-gray-900">Turu iptal et</h2>
            <p className="mt-2 text-sm text-gray-600">
              <strong>{cancelTour.title}</strong> için iptal edilecek tarihleri
              seçin. Sadece seçilen tarihlerdeki müşterilere özür içeren
              bilgilendirme maili gider.
              {allDatesSelected && cancelDates.length > 0
                ? ' Tüm tarihler seçilirse tur ilandan kalkar.'
                : ''}
            </p>

            <label className="mt-4 block text-sm font-medium text-gray-700">
              İptal edilecek tarihler <span className="text-red-500">*</span>
            </label>
            {datesLoading ? (
              <p className="mt-2 text-sm text-gray-500">Tarihler yükleniyor…</p>
            ) : cancelDates.length === 0 ? (
              <p className="mt-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
                Bu turda aktif tarih yok. Onaylarsanız tur tamamen ilandan
                kaldırılır.
              </p>
            ) : (
              <div className="mt-2 space-y-2 rounded-lg border border-gray-200 p-3">
                <label className="flex items-center gap-2 border-b border-gray-100 pb-2 text-sm font-medium text-gray-800">
                  <input
                    type="checkbox"
                    checked={allDatesSelected}
                    onChange={toggleAllDates}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600"
                  />
                  Tümünü seç ({cancelDates.length})
                </label>
                {cancelDates.map((date) => {
                  const checked = selectedDateIds.includes(date.id);
                  return (
                    <label
                      key={date.id}
                      className="flex cursor-pointer items-start gap-2 text-sm text-gray-700"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleDate(date.id)}
                        className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600"
                      />
                      <span>
                        <span className="font-medium text-gray-900">
                          {formatDateRange(date.startDate, date.endDate)}
                        </span>
                        <span className="mt-0.5 block text-xs text-gray-500">
                          Kapasite {date.remainingCapacity}/{date.capacity}
                        </span>
                      </span>
                    </label>
                  );
                })}
              </div>
            )}

            <label className="mt-4 block text-sm font-medium text-gray-700">
              İptal nedeni <span className="text-red-500">*</span>
            </label>
            <select
              value={cancelReason}
              onChange={(e) =>
                setCancelReason(e.target.value as TourCancelReason)
              }
              className="mt-1 h-11 w-full rounded-lg border border-gray-300 px-3 text-sm"
            >
              {TOUR_CANCEL_REASON_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <label className="mt-3 block text-sm font-medium text-gray-700">
              Not (opsiyonel)
            </label>
            <textarea
              value={cancelNote}
              onChange={(e) => setCancelNote(e.target.value)}
              rows={3}
              maxLength={500}
              placeholder="İç not / ek açıklama"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                disabled={cancelBusy}
                onClick={() => setCancelTour(null)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Vazgeç
              </button>
              <button
                type="button"
                disabled={!canSubmit}
                onClick={() => void handleConfirmCancel()}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
              >
                {cancelBusy ? 'İptal ediliyor…' : 'İptali onayla'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
