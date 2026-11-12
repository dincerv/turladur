import type {
  AgeRestriction,
  MembershipTier,
} from '../activities-page/activities-page.types';

export type ContentBlock =
  { kind: 'paragraph'; text: string } | { kind: 'list'; items: string[] };

export interface ActivityScheduleItem {
  time: string;
  activity: string;
}

export interface ActivityOperator {
  id: string;
  companyName: string;
  logoUrl: string | null;
  membershipTier: MembershipTier | null;
  rating: number;
  reviewCount: number;
}

export interface ActivityMeetingPoint {
  label: string;
  address: string | null;
  /** Always http(s); never a raw partner-supplied href. */
  mapUrl: string;
}

export interface ActivityDetail {
  id: string;
  title: string;
  summary: string;
  longDescription: string;
  category: string | null;
  location: string | null;
  duration: string | null;
  price: number | null;
  currency: string;
  rating: number;
  reviewCount: number;
  ageRestriction: AgeRestriction | null;
  ageRestrictionLabel: string | null;
  images: string[];
  highlights: string[];
  included: string[];
  notIncluded: string[];
  schedule: ActivityScheduleItem[];
  meetingPoint: ActivityMeetingPoint | null;
  operator: ActivityOperator | null;
}

/** Serializable across the RSC boundary (no Date objects). */
export interface ActivitySession {
  id: string;
  /** Local calendar day, `YYYY-MM-DD`. */
  startDate: string;
  endDate: string;
  price: number;
  availableSeats: number;
}
