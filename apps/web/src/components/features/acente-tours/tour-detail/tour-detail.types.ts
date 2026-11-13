import type {
  PartnerTourDateRow,
  PartnerTourDetail,
} from '@/services/partner-admin';

export type TourDetailExtras = {
  includes?: string[];
  excludes?: string[];
  healthPrivileges?: string[];
  itinerary?: { title: string; description: string }[];
  destinations?: Array<string | { city?: string; description?: string }>;
  languages?: string[];
  tags?: string[];
  region?: string;
  transportation?: string;
  tourType?: string;
  accommodationType?: string;
  maxParticipants?: number;
  departureCity?: string | string[];
  ageRestriction?: number;
  discount?: number;
  isPopular?: boolean;
  isLastMinute?: boolean;
  isEarlyBird?: boolean;
  startDate?: string;
  endDate?: string;
};

export type TourDetailViewModel = {
  tour: PartnerTourDetail;
  extras: TourDetailExtras;
  images: string[];
  dates: PartnerTourDateRow[];
};

export type TourDetailTab = 'overview' | 'dates' | 'pricing' | 'media';
