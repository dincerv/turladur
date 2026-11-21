'use client';

import Image from 'next/image';
import { useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { shouldUnoptimizeMedia } from '@/lib/media';
import {
  MEAL_STATUS_LABELS,
  MEAL_STATUSES,
  syncItineraryDays,
  type ItineraryDayInput,
  type MealStatus,
} from '@/lib/tours/itinerary-day';
import { cn } from '@/lib/utils';

type Props = {
  days: ItineraryDayInput[];
  durationDays: number;
  stayKind?: 'DAY_TRIP' | 'OVERNIGHT';
  onChange: (days: ItineraryDayInput[]) => void;
  /** Tur galerisinden güne atanabilecek URL’ler. */
  availableImageUrls?: string[];
  testIdPrefix?: string;
};

function MealSelect({
  label,
  value,
  onChange,
  testId,
}: {
  label: string;
  value: MealStatus | null | undefined;
  onChange: (v: MealStatus) => void;
  testId: string;
}) {
  return (
    <label className="block min-w-0 flex-1 text-xs font-medium text-neutral-700">
      {label}
      <select
        data-testid={testId}
        value={value ?? 'EXCLUDED'}
        onChange={(e) => onChange(e.target.value as MealStatus)}
        className="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-2.5 py-2 text-sm text-neutral-900"
      >
        {MEAL_STATUSES.map((status) => (
          <option key={status} value={status}>
            {MEAL_STATUS_LABELS[status]}
          </option>
        ))}
      </select>
    </label>
  );
}

/** Acente tur formu — süreye göre günlük program kartları. */
export function ItineraryProgramForm({
  days,
  durationDays,
  stayKind = 'OVERNIGHT',
  onChange,
  availableImageUrls = [],
  testIdPrefix = 'itinerary',
}: Props) {
  const isDayTrip = stayKind === 'DAY_TRIP' || durationDays <= 1;
  const galleryPool = [
    ...new Set(availableImageUrls.filter((url) => Boolean(url?.trim()))),
  ].slice(0, 12);

  useEffect(() => {
    const synced = syncItineraryDays(days, durationDays, {
      clearAccommodation: isDayTrip,
    });
    const sameLength = synced.length === days.length;
    const sameAcc =
      !isDayTrip || days.every((d) => !(d.accommodation ?? '').trim());
    if (!sameLength || !sameAcc) {
      onChange(synced);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only resync on duration/stay
  }, [durationDays, isDayTrip]);

  function patchDay(index: number, patch: Partial<ItineraryDayInput>) {
    onChange(days.map((day, i) => (i === index ? { ...day, ...patch } : day)));
  }

  function patchMeal(
    index: number,
    key: keyof NonNullable<ItineraryDayInput['meals']>,
    value: MealStatus,
  ) {
    const day = days[index];
    patchDay(index, {
      meals: { ...(day.meals ?? {}), [key]: value },
    });
  }

  function setHighlights(index: number, raw: string) {
    const highlights = raw
      .split(/[,;\n]/)
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 12);
    patchDay(index, { highlights });
  }

  function toggleDayImage(index: number, url: string) {
    const day = days[index];
    const current = day.images ?? [];
    const exists = current.some((img) => img.url === url);
    const next = exists
      ? current.filter((img) => img.url !== url)
      : [...current, { url, file: null as File | null }].slice(0, 8);
    patchDay(index, { images: next });
  }

  return (
    <div className="space-y-4" data-testid={`${testIdPrefix}-program-form`}>
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-neutral-900">
            Günlük Tur Programı
          </h3>
          <p className="mt-0.5 text-xs text-neutral-500">
            {durationDays} gün için kartlar otomatik oluşur. Harita durakları
            ayrıca eklenebilir.
          </p>
        </div>
      </div>

      {days.map((day, index) => {
        const dayNumber = day.dayNumber ?? index + 1;
        return (
          <div
            key={`day-card-${index}`}
            className="space-y-3 rounded-xl border border-neutral-200 bg-white p-4 shadow-sm"
            data-testid={`${testIdPrefix}-day-${dayNumber}`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-neutral-950 text-xs font-bold text-white">
                {dayNumber}
              </span>
              <input
                data-testid={`${testIdPrefix}-day-${dayNumber}-title`}
                value={day.title}
                onChange={(e) => patchDay(index, { title: e.target.value })}
                className="min-w-0 flex-1 rounded-lg border border-neutral-300 px-3 py-2 text-sm font-semibold text-neutral-900"
                placeholder={`${dayNumber}. Gün başlığı — örn. Tarihi Yarımada ve Boğaz`}
              />
              {days.length > 1 ? (
                <button
                  type="button"
                  aria-label={`${dayNumber}. günü sil`}
                  onClick={() => onChange(days.filter((_, i) => i !== index))}
                  className="rounded-lg p-2 text-neutral-400 hover:bg-neutral-50 hover:text-rose-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              ) : null}
            </div>

            <label className="block text-xs font-medium text-neutral-700">
              Detaylı gün akışı
              <textarea
                data-testid={`${testIdPrefix}-day-${dayNumber}-description`}
                value={day.description}
                onChange={(e) =>
                  patchDay(index, { description: e.target.value })
                }
                rows={4}
                className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-900"
                placeholder="Sabah toplanma, öğle gezisi, akşam dönüş… (zengin metin)"
              />
            </label>

            <div className="grid gap-2 sm:grid-cols-3">
              <MealSelect
                label="Kahvaltı"
                testId={`${testIdPrefix}-day-${dayNumber}-meal-breakfast`}
                value={day.meals?.breakfast}
                onChange={(v) => patchMeal(index, 'breakfast', v)}
              />
              <MealSelect
                label="Öğle Yemeği"
                testId={`${testIdPrefix}-day-${dayNumber}-meal-lunch`}
                value={day.meals?.lunch}
                onChange={(v) => patchMeal(index, 'lunch', v)}
              />
              <MealSelect
                label="Akşam Yemeği"
                testId={`${testIdPrefix}-day-${dayNumber}-meal-dinner`}
                value={day.meals?.dinner}
                onChange={(v) => patchMeal(index, 'dinner', v)}
              />
            </div>

            {!isDayTrip ? (
              <label className="block text-xs font-medium text-neutral-700">
                Konaklama notu
                <input
                  data-testid={`${testIdPrefix}-day-${dayNumber}-accommodation`}
                  value={day.accommodation ?? ''}
                  onChange={(e) =>
                    patchDay(index, { accommodation: e.target.value })
                  }
                  className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-900"
                  placeholder="Örn. Uzungöl dağ evi — kahvaltı dahil"
                />
              </label>
            ) : null}

            <label className="block text-xs font-medium text-neutral-700">
              Öne çıkan noktalar (virgülle)
              <input
                data-testid={`${testIdPrefix}-day-${dayNumber}-highlights`}
                value={(day.highlights ?? []).join(', ')}
                onChange={(e) => setHighlights(index, e.target.value)}
                className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-900"
                placeholder="Sümela, Uzungöl, yayla yürüyüşü"
              />
            </label>

            {galleryPool.length > 0 ? (
              <div
                data-testid={`${testIdPrefix}-day-${dayNumber}-images`}
                className="space-y-2"
              >
                <p className="text-xs font-medium text-neutral-700">
                  Gün fotoğrafları (galeriden seç — opsiyonel)
                </p>
                <div className="flex flex-wrap gap-2">
                  {galleryPool.map((url) => {
                    const selected = (day.images ?? []).some(
                      (img) => img.url === url,
                    );
                    return (
                      <button
                        key={`${dayNumber}-${url}`}
                        type="button"
                        onClick={() => toggleDayImage(index, url)}
                        aria-pressed={selected}
                        className={cn(
                          'relative h-16 w-24 overflow-hidden rounded-lg border-2 transition',
                          selected
                            ? 'border-neutral-950 ring-2 ring-neutral-950/20'
                            : 'border-neutral-200 opacity-80 hover:opacity-100',
                        )}
                      >
                        <Image
                          src={url}
                          alt=""
                          fill
                          sizes="96px"
                          unoptimized={shouldUnoptimizeMedia(url)}
                          className="object-cover"
                        />
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>
        );
      })}

      {days.length < Math.max(durationDays, 1) ? (
        <button
          type="button"
          onClick={() =>
            onChange(
              syncItineraryDays(days, days.length + 1, {
                clearAccommodation: isDayTrip,
              }),
            )
          }
          className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-50"
        >
          <Plus className="h-4 w-4" />
          Gün ekle
        </button>
      ) : null}
    </div>
  );
}
