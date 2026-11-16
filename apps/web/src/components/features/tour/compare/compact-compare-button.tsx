'use client';

import { Check, GitCompareArrows } from 'lucide-react';
import {
  COMPARE_TOURS_MAX,
  useTourCompareStore,
  type TourCompareSelection,
} from '@/stores/tour-compare-store';

type CompactCompareButtonProps = {
  tour?: TourCompareSelection;
  /** Opens compare drawer; used on AI card header. */
  openOnly?: boolean;
  className?: string;
  testId?: string;
};

export function CompactCompareButton({
  tour,
  openOnly = false,
  className = '',
  testId,
}: CompactCompareButtonProps) {
  const selectedCount = useTourCompareStore((state) => state.selected.length);
  const isSelected = useTourCompareStore((state) =>
    tour ? state.selected.some((item) => item.id === tour.id) : false,
  );
  const canAddMore = selectedCount < COMPARE_TOURS_MAX;
  const toggle = useTourCompareStore((state) => state.toggle);
  const openDrawer = useTourCompareStore((state) => state.openDrawer);

  if (openOnly) {
    const disabled = selectedCount < 1;
    return (
      <button
        type="button"
        data-testid={testId ?? 'compact-compare-btn'}
        aria-label={`Kıyaslamayı aç (${selectedCount}/${COMPARE_TOURS_MAX})`}
        disabled={disabled}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          openDrawer();
        }}
        className={`relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-800 shadow-sm transition-colors hover:bg-neutral-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 disabled:cursor-not-allowed disabled:opacity-40 ${className}`}
      >
        <GitCompareArrows className="h-4 w-4" aria-hidden />
        {selectedCount > 0 ? (
          <span
            data-testid="compact-compare-badge"
            className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-emerald-600 px-1 text-[10px] font-bold text-white"
          >
            {selectedCount}
          </span>
        ) : null}
      </button>
    );
  }

  if (!tour) return null;

  const disabled = !isSelected && !canAddMore;

  return (
    <button
      type="button"
      data-testid={testId ?? `compare-select-${tour.id}`}
      aria-pressed={isSelected}
      aria-label={
        isSelected
          ? `${tour.title} kıyaslamadan çıkar`
          : `${tour.title} kıyaslamaya ekle`
      }
      disabled={disabled}
      title={
        disabled
          ? `En fazla ${COMPARE_TOURS_MAX} tur seçebilirsiniz`
          : 'Kıyasla'
      }
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        toggle(tour);
      }}
      className={`inline-flex h-9 items-center gap-1 rounded-full border px-2.5 text-xs font-semibold shadow-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 ${
        isSelected
          ? 'border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-700'
          : 'border-neutral-200 bg-white/95 text-neutral-800 hover:bg-white'
      } ${className}`}
    >
      {isSelected ? (
        <Check className="h-3.5 w-3.5" aria-hidden />
      ) : (
        <GitCompareArrows className="h-3.5 w-3.5" aria-hidden />
      )}
      <span className="sr-only sm:not-sr-only sm:inline">
        {isSelected ? 'Seçildi' : 'Kıyasla'}
      </span>
    </button>
  );
}
