'use client';

import { useEffect, useState } from 'react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { getTourDates, type TourDateRow } from '@/services/catalog';
import {
  TOUR_CANCEL_REASON_OPTIONS,
  type PartnerTour,
  type TourCancelReason,
} from '@/services/partner-admin';
import { ApiError } from '@/services/api-client';

import { sanitizeTourText } from './tours-query';

type TourCancelDialogProps = {
  tour: PartnerTour | null;
  open: boolean;
  busy: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (input: {
    dateIds: string[];
    reason: TourCancelReason;
    note?: string;
    hasDates: boolean;
  }) => Promise<void>;
};

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

export function TourCancelDialog({
  tour,
  open,
  busy,
  onOpenChange,
  onConfirm,
}: TourCancelDialogProps) {
  const [cancelDates, setCancelDates] = useState<TourDateRow[]>([]);
  const [selectedDateIds, setSelectedDateIds] = useState<string[]>([]);
  const [datesLoading, setDatesLoading] = useState(false);
  const [datesLoadFailed, setDatesLoadFailed] = useState(false);
  const [cancelReason, setCancelReason] =
    useState<TourCancelReason>('OPERATIONAL');
  const [cancelNote, setCancelNote] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !tour) {
      setCancelDates([]);
      setSelectedDateIds([]);
      setDatesLoadFailed(false);
      setLocalError(null);
      return;
    }

    let cancelled = false;
    setDatesLoading(true);
    setDatesLoadFailed(false);
    setCancelReason('OPERATIONAL');
    setCancelNote('');
    setLocalError(null);

    void getTourDates(tour.id)
      .then((dates) => {
        if (cancelled) return;
        setCancelDates(dates);
        setSelectedDateIds(dates.map((d) => d.id));
        setDatesLoadFailed(false);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        console.error('[tour-cancel-dialog] dates load failed', {
          code: err instanceof ApiError ? err.code : 'UNKNOWN',
        });
        setLocalError('Tarihler yüklenemedi. Lütfen tekrar deneyin.');
        setDatesLoadFailed(true);
        setCancelDates([]);
        setSelectedDateIds([]);
      })
      .finally(() => {
        if (!cancelled) setDatesLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, tour]);

  const allDatesSelected =
    cancelDates.length > 0 && selectedDateIds.length === cancelDates.length;
  // Tarih yükleme hatasında boş listeyle "tam iptal"e düşmeyi engelle.
  const canSubmit =
    !busy &&
    !datesLoading &&
    !datesLoadFailed &&
    (cancelDates.length === 0 || selectedDateIds.length > 0);

  function toggleDate(id: string) {
    setSelectedDateIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function toggleAllDates() {
    if (allDatesSelected) setSelectedDateIds([]);
    else setSelectedDateIds(cancelDates.map((d) => d.id));
  }

  async function handleConfirm() {
    if (!tour || !canSubmit) return;
    if (cancelDates.length > 0 && selectedDateIds.length === 0) {
      setLocalError('İptal için en az bir tarih seçin');
      return;
    }
    setLocalError(null);
    try {
      await onConfirm({
        dateIds: selectedDateIds,
        reason: cancelReason,
        note: cancelNote.trim() || undefined,
        hasDates: cancelDates.length > 0,
      });
    } catch (err) {
      console.error('[tour-cancel-dialog] cancel failed', {
        code: err instanceof ApiError ? err.code : 'UNKNOWN',
      });
      setLocalError('İşlem başarısız. Lütfen tekrar deneyin.');
    }
  }

  const title = sanitizeTourText(tour?.title ?? 'Tur', 80);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[90vh] overflow-y-auto sm:max-w-md"
        showCloseButton={!busy}
      >
        <DialogHeader>
          <DialogTitle>Turu iptal et</DialogTitle>
          <DialogDescription>
            <strong className="text-neutral-900">{title}</strong> için iptal
            edilecek tarihleri seçin. Sadece seçilen tarihlerdeki müşterilere
            bilgilendirme maili gider.
            {allDatesSelected && cancelDates.length > 0
              ? ' Tüm tarihler seçilirse tur ilandan kalkar.'
              : ''}
          </DialogDescription>
        </DialogHeader>

        {localError ? (
          <p
            role="alert"
            className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
          >
            {localError}
          </p>
        ) : null}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700">
              İptal edilecek tarihler <span className="text-red-500">*</span>
            </label>
            {datesLoading ? (
              <p className="mt-2 text-sm text-neutral-500">
                Tarihler yükleniyor…
              </p>
            ) : datesLoadFailed ? (
              <div className="mt-2 space-y-2">
                <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                  Tarihler yüklenemedi. İptal işlemi için tekrar deneyin.
                </p>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    if (!tour) return;
                    setDatesLoading(true);
                    setDatesLoadFailed(false);
                    setLocalError(null);
                    void getTourDates(tour.id)
                      .then((dates) => {
                        setCancelDates(dates);
                        setSelectedDateIds(dates.map((d) => d.id));
                        setDatesLoadFailed(false);
                      })
                      .catch((err: unknown) => {
                        console.error(
                          '[tour-cancel-dialog] dates retry failed',
                          {
                            code:
                              err instanceof ApiError ? err.code : 'UNKNOWN',
                          },
                        );
                        setLocalError(
                          'Tarihler yüklenemedi. Lütfen tekrar deneyin.',
                        );
                        setDatesLoadFailed(true);
                        setCancelDates([]);
                        setSelectedDateIds([]);
                      })
                      .finally(() => setDatesLoading(false));
                  }}
                  className="rounded-lg border border-neutral-300 px-3 py-1.5 text-xs font-semibold text-neutral-800 hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950"
                >
                  Tekrar dene
                </button>
              </div>
            ) : cancelDates.length === 0 ? (
              <p className="mt-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
                Bu turda aktif tarih yok. Onaylarsanız tur tamamen ilandan
                kaldırılır.
              </p>
            ) : (
              <div className="mt-2 max-h-48 space-y-2 overflow-y-auto rounded-lg border border-neutral-200 p-3">
                <label className="flex items-center gap-2 border-b border-neutral-100 pb-2 text-sm font-medium text-neutral-800">
                  <input
                    type="checkbox"
                    checked={allDatesSelected}
                    onChange={toggleAllDates}
                    disabled={busy}
                    className="h-4 w-4 rounded border-neutral-300 text-neutral-950 focus:ring-neutral-950"
                  />
                  Tümünü seç ({cancelDates.length})
                </label>
                {cancelDates.map((date) => (
                  <label
                    key={date.id}
                    className="flex cursor-pointer items-start gap-2 text-sm text-neutral-700"
                  >
                    <input
                      type="checkbox"
                      checked={selectedDateIds.includes(date.id)}
                      onChange={() => toggleDate(date.id)}
                      disabled={busy}
                      className="mt-0.5 h-4 w-4 rounded border-neutral-300 text-neutral-950 focus:ring-neutral-950"
                    />
                    <span>
                      <span className="font-medium text-neutral-900">
                        {formatDateRange(date.startDate, date.endDate)}
                      </span>
                      <span className="mt-0.5 block text-xs text-neutral-500">
                        Kapasite {date.remainingCapacity}/{date.capacity}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div>
            <label
              htmlFor="tour-cancel-reason"
              className="block text-sm font-medium text-neutral-700"
            >
              İptal nedeni <span className="text-red-500">*</span>
            </label>
            <select
              id="tour-cancel-reason"
              value={cancelReason}
              disabled={busy}
              onChange={(e) =>
                setCancelReason(e.target.value as TourCancelReason)
              }
              className="mt-1 h-11 w-full rounded-lg border border-neutral-300 px-3 text-sm focus:border-neutral-950 focus:outline-none focus:ring-1 focus:ring-neutral-950 disabled:opacity-60"
            >
              {TOUR_CANCEL_REASON_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="tour-cancel-note"
              className="block text-sm font-medium text-neutral-700"
            >
              Not (opsiyonel)
            </label>
            <textarea
              id="tour-cancel-note"
              value={cancelNote}
              disabled={busy}
              onChange={(e) => setCancelNote(e.target.value.slice(0, 500))}
              rows={3}
              maxLength={500}
              placeholder="İç not / ek açıklama"
              className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-950 focus:outline-none focus:ring-1 focus:ring-neutral-950 disabled:opacity-60"
            />
          </div>
        </div>

        <DialogFooter>
          <button
            type="button"
            disabled={busy}
            onClick={() => onOpenChange(false)}
            className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2 disabled:opacity-60"
          >
            Vazgeç
          </button>
          <button
            type="button"
            disabled={!canSubmit}
            onClick={() => void handleConfirm()}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? 'İptal ediliyor…' : 'İptali onayla'}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
