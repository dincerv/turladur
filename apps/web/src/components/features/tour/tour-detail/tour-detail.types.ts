/** Split from tour-detail-client.tsx (Faz 7) — types only. */

import type { OperatorReview } from '@/components/features/tour-operator/OperatorReviewsSection';

export interface TourOperator {
  id: string;
  companyName: string;
  logo: string | null;
  description: string | null;
  rating?: number | null;
  reviewCount?: number;
  membershipTier?: 'BRONZE' | 'SILVER' | 'GOLD' | null;
  reviews?: OperatorReview[];
}

export interface Destination {
  city: string;
  description: string;
}

export type TourDestination = string | Destination;

export interface TourDate {
  id: string;
  startDate: Date;
  endDate: Date;
  price: number;
  availableSeats: number;
  ageRanges: {
    id: string;
    minAge: number;
    maxAge: number | null;
    pricingType: 'free' | 'half' | 'percentage' | 'fixed';
    value: number;
  }[];
  earlyBirdDiscount?: number;
  earlyBirdDeadline?: string;
  lastMinuteDiscount?: number;
  lastMinuteStart?: string;
  minParticipants?: number;
}

export interface Tour {
  id: string;
  slug?: string | null;
  name: string;
  description: string;
  duration: number;
  price: number;
  discount: number | null;
  startDate: Date | null;
  endDate: Date | null;
  maxParticipants: number | null;
  destinations: TourDestination[];
  inclusions: string[];
  exclusions: string[];
  healthPrivileges: string[];
  itinerary: unknown;
  images: string[];
  featured: boolean;
  departureCity: string | null;
  region: string | null;
  transportation: string | null;
  period: string | null;
  rating: number | null;
  /** Doğrulanmış tur yorumu sayısı (acente toplamı değil). */
  reviewCount?: number | null;
  tourType: string | null;
  accommodationType: string | null;
  difficultyLevel: string | null;
  ageRestriction: number | null;
  isPopular: boolean;
  isLastMinute: boolean;
  isEarlyBird: boolean;
  languages: string[];
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  tourOperatorId: string;
  tourOperator: TourOperator;
  tourDates: TourDate[];
  accommodation: {
    name: string;
    image: string;
    location: string;
    type: string;
    rating: number;
    features: string[];
  };
  meetingPoint?: string;
  meetingPointAddress?: string;
  meetingTime?: string;
  pickupPoints?: {
    id: string;
    city: string;
    location: string;
    description?: string;
    time: string;
    isActive: boolean;
    order: number;
    latitude?: number | null;
    longitude?: number | null;
  }[];
  routeStops?: TourRouteStopView[];
}

/** Gezi durağı (tur rotası) — kalkış/biniş noktalarından ayrı. */
export type TourRouteStopView = {
  id: string;
  dayNumber: number;
  order: number;
  name: string;
  description?: string | null;
  latitude: number;
  longitude: number;
  kind: 'VISIT' | 'LODGING';
};

export type ItineraryMealStatus = 'INCLUDED' | 'EXCLUDED' | 'FREE_TIME';

export type ItineraryMealsView = {
  breakfast?: ItineraryMealStatus | null;
  lunch?: ItineraryMealStatus | null;
  dinner?: ItineraryMealStatus | null;
};

export type ItineraryItem = {
  title?: string;
  description?: string;
  activities?: string[];
  highlights?: string[];
  /** Legacy string chips or structured öğün durumu. */
  meals?: string[] | ItineraryMealsView;
  accommodation?: string | null;
  /** Güne atanmış galeri fotoğraf URL’leri. */
  imageUrls?: string[];
  images?: string[] | { url?: string }[];
  schedule?: { time?: string; activity?: string }[];
  distance?: string;
  duration?: string;
};
