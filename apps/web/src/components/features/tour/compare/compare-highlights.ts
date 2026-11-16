import type {
  ComparedTourAvailable,
  ComparedTourColumn,
} from '@turta/shared-types';

export type CompareMetricKey =
  'price' | 'durationDays' | 'hotelStars' | 'averageRating' | 'inclusionsCount';

export type CompareHighlights = Partial<Record<CompareMetricKey, Set<string>>>;

function availableColumns(
  columns: ReadonlyArray<ComparedTourColumn>,
): ComparedTourAvailable[] {
  return columns.filter(
    (column): column is ComparedTourAvailable => column.available === true,
  );
}

function pickExtremeIds(
  rows: ComparedTourAvailable[],
  read: (row: ComparedTourAvailable) => number | null,
  mode: 'min' | 'max',
): Set<string> {
  const scored = rows
    .map((row) => ({ id: row.id, value: read(row) }))
    .filter(
      (entry): entry is { id: string; value: number } =>
        entry.value != null && Number.isFinite(entry.value),
    );

  if (scored.length < 2) return new Set();

  const extreme =
    mode === 'min'
      ? Math.min(...scored.map((entry) => entry.value))
      : Math.max(...scored.map((entry) => entry.value));

  const winners = scored.filter((entry) => entry.value === extreme);
  if (winners.length === scored.length) return new Set();
  return new Set(winners.map((entry) => entry.id));
}

/** Mark advantageous cells (lowest price, highest rating/stars/inclusions). */
export function computeCompareHighlights(
  columns: ReadonlyArray<ComparedTourColumn>,
): CompareHighlights {
  const rows = availableColumns(columns);
  return {
    price: pickExtremeIds(rows, (row) => row.price, 'min'),
    durationDays: pickExtremeIds(rows, (row) => row.durationDays, 'min'),
    hotelStars: pickExtremeIds(rows, (row) => row.hotelStars, 'max'),
    averageRating: pickExtremeIds(rows, (row) => row.averageRating, 'max'),
    inclusionsCount: pickExtremeIds(
      rows,
      (row) => row.inclusions.length,
      'max',
    ),
  };
}

export function isHighlighted(
  highlights: CompareHighlights,
  metric: CompareMetricKey,
  tourId: string,
): boolean {
  return highlights[metric]?.has(tourId) ?? false;
}
