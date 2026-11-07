import { TourCategory } from '@turta/shared-constants';

const LABELS: Record<string, string> = {
  [TourCategory.CULTURAL]: 'Kültür',
  [TourCategory.ADVENTURE]: 'Macera',
  [TourCategory.GASTRONOMY]: 'Gastronomi',
  [TourCategory.NATURE]: 'Doğa',
  [TourCategory.CITY]: 'Şehir',
  [TourCategory.BEACH]: 'Deniz',
};

/** Map API enum / raw string to Turkish UI label. Unknown values stay readable. */
export function getTourCategoryLabel(
  category: string | null | undefined,
): string {
  if (!category?.trim()) return 'Tur';
  const key = category.trim().toUpperCase();
  return LABELS[key] ?? category.replace(/_/g, ' ');
}
