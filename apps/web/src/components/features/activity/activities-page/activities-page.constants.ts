import type {
  ActivityFilters,
  ActivityOption,
  ActivitySortBy,
} from './activities-page.types';

export const ITEMS_PER_PAGE = 8;
export const FILTER_DEBOUNCE_MS = 350;
export const CATALOG_FETCH_LIMIT = 100;

export const AGE_MIN = 0;
export const AGE_MAX = 120;
export const PRICE_MAX = 1_000_000;
export const DURATION_MIN = 1;
export const DURATION_MAX = 24;
export const SEARCH_MAX_LENGTH = 80;
export const ADULT_AGE = 18;

export const ALL_CATEGORIES_ID = 'tumu';

export const CATEGORIES: readonly ActivityOption[] = [
  { id: ALL_CATEGORIES_ID, name: 'Tümü' },
  { id: 'doga', name: 'Doğa' },
  { id: 'tarihi', name: 'Tarihi' },
  { id: 'deniz', name: 'Deniz' },
  { id: 'kultur', name: 'Kültür' },
  { id: 'macera', name: 'Macera' },
  { id: 'gastronomi', name: 'Gastronomi' },
  { id: 'spor', name: 'Spor' },
  { id: 'eglence', name: 'Eğlence' },
];

export const VISIBLE_CATEGORY_COUNT = 6;

export interface ActivityTypeOption extends ActivityOption {
  /** Folded keywords matched against title + category + type. */
  keywords: readonly string[];
}

export const ACTIVITY_TYPES: readonly ActivityTypeOption[] = [
  { id: 'balon-turu', name: 'Balon Turu', keywords: ['balon'] },
  { id: 'helikopter-turu', name: 'Helikopter Turu', keywords: ['helikopter'] },
  { id: 'jetski', name: 'Jetski', keywords: ['jetski', 'jet ski'] },
  {
    id: 'parasailing',
    name: 'Parasailing',
    keywords: ['parasailing', 'parasut'],
  },
  { id: 'atv-safari', name: 'ATV Safari', keywords: ['atv', 'safari', 'jeep'] },
  {
    id: 'tekne-turu',
    name: 'Tekne Turu',
    keywords: ['tekne', 'yat turu', 'gulet'],
  },
  { id: 'dalis', name: 'Dalış', keywords: ['dalis', 'tuplu', 'snorkel'] },
  { id: 'zipline', name: 'Zipline', keywords: ['zipline', 'zip line'] },
];

export const SORT_OPTIONS: readonly { id: ActivitySortBy; name: string }[] = [
  { id: 'popularity', name: 'Popülerliğe Göre' },
  { id: 'price_asc', name: 'Fiyata Göre (Artan)' },
  { id: 'price_desc', name: 'Fiyata Göre (Azalan)' },
  { id: 'rating', name: 'Puana Göre (Yüksek)' },
];

export const AGE_PRESETS: readonly {
  label: string;
  minAge: number;
  maxAge: number | null;
}[] = [
  { label: 'Çocuklu (6+)', minAge: 6, maxAge: null },
  { label: 'Genç (12+)', minAge: 12, maxAge: null },
  { label: 'Yetişkin (18+)', minAge: ADULT_AGE, maxAge: null },
  { label: '65+', minAge: 65, maxAge: null },
];

export const DEFAULT_FILTERS: Readonly<ActivityFilters> = {
  q: '',
  category: ALL_CATEGORIES_ID,
  type: null,
  city: null,
  minPrice: null,
  maxPrice: null,
  maxDuration: null,
  minAge: null,
  maxAge: null,
  sort: 'popularity',
};

/** URL query keys — single source of truth for parse/build. */
export const FILTER_PARAM = {
  q: 'q',
  category: 'category',
  type: 'type',
  city: 'city',
  minPrice: 'minPrice',
  maxPrice: 'maxPrice',
  maxDuration: 'maxDuration',
  minAge: 'minAge',
  maxAge: 'maxAge',
  sort: 'sort',
} as const satisfies Record<keyof ActivityFilters, string>;
