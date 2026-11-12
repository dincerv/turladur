'use client';

import { useCallback, useId, useMemo } from 'react';
import { AlertCircle, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  ACTIVITY_TYPES,
  AGE_MAX,
  AGE_MIN,
  AGE_PRESETS,
  DURATION_MAX,
  DURATION_MIN,
  PRICE_MAX,
  SORT_OPTIONS,
} from './activities-page.constants';
import { getAgeRangeError } from './activity-age';
import { useActivitiesPage } from './activities-page-context';
import { useDebouncedInput } from './use-debounced-input';
import type { ActivitySortBy } from './activities-page.types';

const controlClass =
  'w-full h-11 md:h-10 rounded-lg border border-neutral-300 bg-white px-3 text-base md:text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200 aria-[invalid=true]:border-rose-400 aria-[invalid=true]:ring-rose-100';
const labelClass = 'mb-1.5 block text-xs font-semibold text-neutral-700';

const SORT_IDS = new Set<string>(SORT_OPTIONS.map((s) => s.id));

function toBoundedInt(raw: string, min: number, max: number): number | null {
  const digits = raw.replace(/\D/g, '');
  if (!digits) return null;
  return Math.min(max, Math.max(min, Number(digits)));
}

interface NumberFieldProps {
  id: string;
  label: string;
  placeholder: string;
  value: number | null;
  min: number;
  max: number;
  onCommit: (value: number | null) => void;
  invalid?: boolean;
  describedBy?: string;
  suffix?: string;
}

/** Text input with numeric keyboard — avoids `type=number` quirks ("e", "-", scroll-to-change). */
function DebouncedNumberField({
  id,
  label,
  placeholder,
  value,
  min,
  max,
  onCommit,
  invalid,
  describedBy,
  suffix,
}: NumberFieldProps) {
  const normalize = useCallback(
    (raw: string) => {
      const n = toBoundedInt(raw, min, max);
      return n == null ? '' : String(n);
    },
    [min, max],
  );
  const { draft, setDraft, flush } = useDebouncedInput(
    value == null ? '' : String(value),
    (raw) => onCommit(toBoundedInt(raw, min, max)),
    { normalize },
  );
  const maxLength = String(max).length;

  return (
    <div className="min-w-0 flex-1">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete="off"
          enterKeyHint="done"
          maxLength={maxLength}
          placeholder={placeholder}
          value={draft}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          onChange={(e) =>
            setDraft(e.target.value.replace(/\D/g, '').slice(0, maxLength))
          }
          onBlur={() => {
            flush();
            setDraft(normalize(draft));
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') flush();
          }}
          className={cn(controlClass, 'tabular-nums', suffix && 'pr-10')}
        />
        {suffix && (
          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-neutral-400">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

function AgeFields() {
  const { filters, patchFilters } = useActivitiesPage();
  const baseId = useId();
  const errorId = `${baseId}-age-error`;
  const hintId = `${baseId}-age-hint`;
  const error = getAgeRangeError(filters.minAge, filters.maxAge);

  return (
    <fieldset className="min-w-0">
      <legend className={cn(labelClass, 'flex items-center gap-1.5')}>
        <Users aria-hidden className="h-3.5 w-3.5 text-sky-600" />
        Katılımcı Yaşı
      </legend>
      <p id={hintId} className="mb-2 text-[11px] leading-snug text-neutral-500">
        Gruptaki en küçük ve en büyük kişinin yaşını girin; yalnızca herkesin
        katılabileceği aktiviteler listelenir.
      </p>
      <div className="flex items-center gap-2">
        <DebouncedNumberField
          id={`${baseId}-min-age`}
          label="En küçük katılımcının yaşı"
          placeholder="En küçük"
          value={filters.minAge}
          min={AGE_MIN}
          max={AGE_MAX}
          suffix="yaş"
          invalid={Boolean(error)}
          describedBy={error ? errorId : hintId}
          onCommit={(minAge) => patchFilters({ minAge })}
        />
        <span aria-hidden className="text-neutral-400">
          –
        </span>
        <DebouncedNumberField
          id={`${baseId}-max-age`}
          label="En büyük katılımcının yaşı"
          placeholder="En büyük"
          value={filters.maxAge}
          min={AGE_MIN}
          max={AGE_MAX}
          suffix="yaş"
          invalid={Boolean(error)}
          describedBy={error ? errorId : hintId}
          onCommit={(maxAge) => patchFilters({ maxAge })}
        />
      </div>
      {error && (
        <p
          id={errorId}
          role="alert"
          className="mt-1.5 flex items-center gap-1 text-xs text-rose-600"
        >
          <AlertCircle aria-hidden className="h-3.5 w-3.5 shrink-0" />
          {error}
        </p>
      )}
      <div
        className="mt-2.5 flex flex-wrap gap-2"
        role="group"
        aria-label="Hızlı yaş seçimi"
      >
        {AGE_PRESETS.map((preset) => {
          const active =
            filters.minAge === preset.minAge &&
            filters.maxAge === preset.maxAge;
          return (
            <button
              key={preset.label}
              type="button"
              aria-pressed={active}
              onClick={() =>
                patchFilters(
                  active
                    ? { minAge: null, maxAge: null }
                    : { minAge: preset.minAge, maxAge: preset.maxAge },
                )
              }
              className={cn(
                'min-h-11 rounded-full border px-3.5 text-xs font-semibold transition-colors md:min-h-9',
                active
                  ? 'border-sky-600 bg-sky-600 text-white'
                  : 'border-neutral-300 bg-white text-neutral-700 hover:border-sky-400 hover:text-sky-700',
              )}
            >
              {preset.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

function DurationField() {
  const { filters, setFilter } = useActivitiesPage();
  const id = useId();
  const { draft, setDraft, flush } = useDebouncedInput(
    String(filters.maxDuration ?? DURATION_MAX),
    (raw) => {
      const n = toBoundedInt(raw, DURATION_MIN, DURATION_MAX);
      setFilter('maxDuration', n == null || n >= DURATION_MAX ? null : n);
    },
  );
  const current = Number(draft);

  return (
    <div>
      <label htmlFor={id} className={labelClass}>
        Maksimum Süre
      </label>
      <div className="flex items-center">
        <input
          id={id}
          type="range"
          min={DURATION_MIN}
          max={DURATION_MAX}
          step={1}
          value={current}
          aria-valuetext={
            current >= DURATION_MAX ? 'Sınırsız' : `${current} saat`
          }
          onChange={(e) => setDraft(e.target.value)}
          onPointerUp={flush}
          onKeyUp={flush}
          className="h-11 w-full cursor-pointer accent-sky-600 md:h-9"
        />
      </div>
      <div className="flex justify-between text-xs text-neutral-500">
        <span>{DURATION_MIN} sa</span>
        <span className="font-semibold text-neutral-700">
          {current >= DURATION_MAX ? 'Sınırsız' : `${current} sa`}
        </span>
      </div>
    </div>
  );
}

export function ActivitiesFilterFields() {
  const { filters, setFilter, patchFilters, locationOptions } =
    useActivitiesPage();
  const baseId = useId();

  const cities = useMemo(() => {
    if (filters.city && !locationOptions.includes(filters.city)) {
      return [filters.city, ...locationOptions];
    }
    return locationOptions;
  }, [filters.city, locationOptions]);

  return (
    <div className="space-y-5">
      <div>
        <label htmlFor={`${baseId}-sort`} className={labelClass}>
          Sırala
        </label>
        <select
          id={`${baseId}-sort`}
          value={filters.sort}
          onChange={(e) => {
            if (SORT_IDS.has(e.target.value))
              setFilter('sort', e.target.value as ActivitySortBy);
          }}
          className={controlClass}
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name}
            </option>
          ))}
        </select>
      </div>

      <AgeFields />

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="min-w-0">
          <label htmlFor={`${baseId}-type`} className={labelClass}>
            Aktivite Türü
          </label>
          <select
            id={`${baseId}-type`}
            value={filters.type ?? ''}
            onChange={(e) => setFilter('type', e.target.value || null)}
            className={controlClass}
          >
            <option value="">Tüm Türler</option>
            {ACTIVITY_TYPES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
        <div className="min-w-0">
          <label htmlFor={`${baseId}-city`} className={labelClass}>
            Konum
          </label>
          <select
            id={`${baseId}-city`}
            value={filters.city ?? ''}
            onChange={(e) => setFilter('city', e.target.value || null)}
            className={controlClass}
          >
            <option value="">Tüm Konumlar</option>
            {cities.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      <fieldset className="min-w-0">
        <legend className={labelClass}>Fiyat Aralığı (₺)</legend>
        <div className="flex items-center gap-2">
          <DebouncedNumberField
            id={`${baseId}-min-price`}
            label="Minimum fiyat"
            placeholder="Min"
            value={filters.minPrice}
            min={0}
            max={PRICE_MAX}
            suffix="₺"
            onCommit={(minPrice) => patchFilters({ minPrice })}
          />
          <span aria-hidden className="text-neutral-400">
            –
          </span>
          <DebouncedNumberField
            id={`${baseId}-max-price`}
            label="Maksimum fiyat"
            placeholder="Max"
            value={filters.maxPrice}
            min={0}
            max={PRICE_MAX}
            suffix="₺"
            onCommit={(maxPrice) => patchFilters({ maxPrice })}
          />
        </div>
      </fieldset>

      <DurationField />
    </div>
  );
}
