export type MembershipTier = 'BRONZE' | 'SILVER' | 'GOLD';

export interface ExperienceOperator {
  id: string;
  companyName: string;
  logo: string | null;
  membershipTier?: MembershipTier | null;
}

/** Inclusive participant age bounds; `null` side means unbounded. */
export interface AgeRestriction {
  minAge: number | null;
  maxAge: number | null;
}

export interface Experience {
  id: string;
  title: string;
  description: string;
  imageUrl: string | null;
  featured: boolean;
  location: string;
  duration: string;
  durationHours: number | null;
  rating: number;
  reviewCount: number;
  popularityRate: number;
  price: number | null;
  category: string | null;
  /** Normalized (Turkish-folded) category key, e.g. "Doğa" → "doga". */
  categoryKey: string | null;
  ageRestriction: AgeRestriction | null;
  ageRestrictionLabel: string | null;
  experienceOperator: ExperienceOperator | null;
  /** Pre-folded haystack for search / type matching. */
  searchText: string;
}

/** Raw row as returned by `/experiences` — every field is untrusted. */
export interface ExperienceApiRow {
  id?: string | number;
  title?: string | null;
  description?: string | null;
  coverUrl?: string | null;
  imageUrl?: string | null;
  featured?: boolean | null;
  location?: string | null;
  city?: string | null;
  durationHours?: number | string | null;
  duration?: string | null;
  averageRating?: number | string | null;
  rating?: number | string | null;
  reviewCount?: number | string | null;
  popularityRate?: number | string | null;
  price?: number | string | null;
  category?: string | null;
  experienceType?: string | null;
  ageRestriction?: string | null;
  experienceOperator?: ExperienceOperator | null;
  partner?: ExperienceOperator | null;
}

export type ActivitySortBy =
  'popularity' | 'price_asc' | 'price_desc' | 'rating';

export interface ActivityFilters {
  q: string;
  category: string;
  type: string | null;
  city: string | null;
  minPrice: number | null;
  maxPrice: number | null;
  maxDuration: number | null;
  /** Youngest participant's age. */
  minAge: number | null;
  /** Oldest participant's age. */
  maxAge: number | null;
  sort: ActivitySortBy;
}

export type ActivityFilterChipKey =
  'q' | 'type' | 'city' | 'price' | 'duration' | 'age';

export interface ActivityFilterChip {
  key: ActivityFilterChipKey;
  label: string;
}

export interface ActivityOption {
  id: string;
  name: string;
}

export type CatalogStatus = 'loading' | 'error' | 'ready';
