export type MembershipTier = 'BRONZE' | 'SILVER' | 'GOLD';

/** Shape expected by the legacy tours listing UI (ModernTourCard). */
export type LegacyTourCard = {
  id: string;
  /** SEO-friendly path segment when present. */
  slug?: string | null;
  name: string;
  description: string;
  price: number;
  rating: number;
  reviewCount: number;
  images: string;
  departureCity: string | string[] | null;
  destinations: string;
  region: string | null;
  /** Days as number or legacy string label from API mapping. */
  duration: string | number | null;
  maxParticipants: number;
  discount: number;
  inclusions: string;
  /** Optional first departure for list sorting (legacy UI). */
  startDate?: string | null;
  isLastMinute?: boolean;
  isEarlyBird?: boolean;
  tourDates: Array<{ startDate: string; endDate: string; price?: number }>;
  tourOperator: {
    id: string;
    companyName: string;
    logo: string | null;
    membershipTier: MembershipTier | null;
  };
};
