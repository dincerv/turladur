/**
 * Shared API response envelope used by web and api.
 */
export interface ApiError {
  code: string;
  message: string;
}

export interface ApiMeta {
  page: number;
  limit: number;
  total: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: ApiError | null;
  meta?: ApiMeta;
}

export type UserRole =
  | 'CUSTOMER'
  | 'PARTNER'
  | 'PARTNER_STAFF'
  | 'ADMIN'
  | 'SUPER_ADMIN'
  | 'PLATFORM_ADMIN'
  | 'PLATFORM_SUPER_ADMIN'
  | 'AGENCY_OWNER'
  | 'AGENCY_ADMIN'
  | 'AGENCY_STAFF'
  | 'GUIDE'
  | 'BUS_COMPANY';

/** Partner staff (PARTNER_STAFF) permission keys set in /partner/users. */
export type StaffPermissionKey =
  'tours' | 'reservations' | 'customers' | 'reports';

/**
 * Stored as `{ tours: ['read','write'] }` or legacy `{ tours: true }`.
 * Empty array / false / missing = no access.
 */
export type StaffPermissions = Partial<
  Record<StaffPermissionKey, boolean | string[]>
>;

export type PartnerCapability = 'TOURS' | 'EXPERIENCES' | 'HOTELS';

export type MembershipTier = 'BRONZE' | 'SILVER' | 'GOLD';

export type PartnerStatus = 'PENDING' | 'VERIFIED' | 'REJECTED' | 'SUSPENDED';

export type AgencyStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';

/** Marketplace satıcı acente (hedef Agency tablosu). Legacy B2B Agency ayrı. */
export type MarketplaceAgencyStatus =
  'PENDING' | 'VERIFIED' | 'REJECTED' | 'SUSPENDED';

export type AgencyStaffRole = 'AGENCY_OWNER' | 'AGENCY_ADMIN' | 'AGENCY_STAFF';

export type SellerTier = 'BRONZE' | 'SILVER' | 'GOLD';

export type AgencyCapability = 'TOURS';

export interface Agency {
  id: string;
  name: string;
  status: AgencyStatus;
  userId: string;
  email: string | null;
  city: string | null;
}

/** Hedef tüzel satıcı — giriş yok; personel = AgencyStaff. */
export interface MarketplaceAgency {
  id: string;
  companyName: string;
  taxNumber: string;
  legalTitle: string;
  address: string;
  contactEmail: string;
  status: MarketplaceAgencyStatus;
  sellerTier: SellerTier;
  capabilities: AgencyCapability[];
}

export interface AgencyStaff {
  id: string;
  agencyId: string;
  name: string;
  email: string;
  role: AgencyStaffRole;
  status: string;
}

export interface User {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  /** TC Kimlik No (11 digits). */
  identityNumber: string | null;
  birthDate: string | null;
  address: string | null;
  billingLine1: string | null;
  billingLine2: string | null;
  billingCity: string | null;
  billingState: string | null;
  billingPostalCode: string | null;
  billingCountry: string | null;
  role: UserRole;
  partnerId: string | null;
  /**
   * PARTNER_STAFF only. Partner owners (PARTNER) ignore this — full access.
   */
  permissions: StaffPermissions | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Partner {
  id: string;
  companyName: string;
  contactEmail: string;
  status: PartnerStatus;
  capabilities: PartnerCapability[];
  membershipTier: MembershipTier;
  averageRating: string;
  reviewCount: number;
}

export interface SubUser {
  id: string;
  partnerId: string;
  name: string;
  email: string;
  role: string;
  /** UI: OWNER | MANAGER | AGENT */
  uiRole?: string;
  status: string;
  permissions: Record<string, unknown>;
  lastLoginAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export type TourCategory =
  'CULTURAL' | 'ADVENTURE' | 'GASTRONOMY' | 'NATURE' | 'CITY' | 'BEACH';

export type TourStatus = 'DRAFT' | 'PENDING_REVIEW' | 'PUBLISHED' | 'ARCHIVED';

export type TourStayKind = 'DAY_TRIP' | 'OVERNIGHT';

export type TourDestinationScope = 'DOMESTIC' | 'INTERNATIONAL';

export type ExperienceStatus =
  'DRAFT' | 'PENDING_REVIEW' | 'PUBLISHED' | 'ARCHIVED';

export type HotelType =
  | 'HOTEL'
  | 'BOUTIQUE_HOTEL'
  | 'RESORT'
  | 'HOSTEL'
  | 'APARTMENT'
  | 'VILLA'
  | 'GUESTHOUSE';

export type AgePricingType = 'FREE' | 'HALF' | 'PERCENTAGE' | 'FIXED';

export interface TourPartnerSummary {
  id: string;
  companyName: string;
  logo: string | null;
  membershipTier: 'BRONZE' | 'SILVER' | 'GOLD';
  averageRating: string;
  reviewCount: number;
}

export interface Tour {
  id: string;
  title: string;
  slug: string;
  description: string;
  coverUrl: string | null;
  galleryUrls?: string[];
  extras?: Record<string, unknown>;
  price: string;
  currency: string;
  category: TourCategory;
  status: TourStatus;
  durationDays: number;
  stayKind?: TourStayKind;
  destinationScope?: TourDestinationScope;
  departureCities?: string[];
  /** Geographic TR region (Marmara, Ege, …) — public /tours Bölge filter. */
  region?: string | null;
  /** Curated catalog route ids (kapadokya, istanbul, …). */
  routeKeys?: string[];
  featured: boolean;
  averageRating: string;
  reviewCount: number;
  partnerId: string;
  agencyId?: string;
  partner?: TourPartnerSummary;
  createdAt: string;
  updatedAt: string;
}

export interface TourDate {
  id: string;
  tourId: string;
  startDate: string;
  endDate: string;
  capacity: number;
  remainingCapacity: number;
  priceOverride: string | null;
  isActive: boolean;
}

export interface Hotel {
  id: string;
  name: string;
  slug: string;
  city: string;
  country: string;
  type: HotelType;
  partnerId: string;
  agencyId?: string;
  stars: number | null;
}

/** @deprecated Room DROP — otel satışı yok. Tip wire uyumu için tutuluyor. */
export interface Room {
  id: string;
  hotelId: string;
  name: string;
  capacity: number;
  price: string;
  available: boolean;
}

export interface Experience {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  location: string;
  duration: string;
  price: string;
  status: ExperienceStatus;
  partnerId: string;
  agencyId?: string;
  averageRating: string;
  reviewCount: number;
  /** Free-form partner text, e.g. "18+", "7-65", "12 yaş üstü". */
  ageRestriction?: string | null;
  imageUrl?: string | null;
  featured?: boolean;
  popularityRate?: number;
}

export interface ExperienceScheduleItem {
  time: string;
  activity: string;
}

export interface ExperienceOperatorSummary {
  id: string;
  companyName: string;
  logo: string | null;
  membershipTier: MembershipTier | null;
  averageRating: string;
  reviewCount: number;
}

/** `GET /catalog/experiences/:id` — list endpoint stays lean. */
export interface ExperienceDetail extends Experience {
  longDescription: string;
  currency: string;
  gallery: string[];
  included: string[];
  notIncluded: string[];
  highlights: string[];
  schedule: ExperienceScheduleItem[];
  meetingPoint: string | null;
  meetingPointAddress: string | null;
  operator: ExperienceOperatorSummary | null;
}

export interface ActivityDate {
  id: string;
  experienceId: string;
  startDate: string;
  endDate: string;
  price: string;
  availableSeats: number;
  isActive: boolean;
}

export interface TourSearchResponse {
  items: Tour[];
  meta: ApiMeta;
}

/** Normalized column for side-by-side tour comparison matrix. */
export type ComparedTourUnavailable = {
  id: string;
  available: false;
  message: string;
};

/** Tour vibe / entertainment tempo for comparison matrix. */
export type EntertainmentLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export type ComparedTourAvailable = {
  id: string;
  available: true;
  title: string;
  slug: string;
  coverUrl: string | null;
  price: number;
  currency: string;
  durationDays: number;
  averageRating: number;
  reviewCount: number;
  hotelStars: number | null;
  accommodationName: string | null;
  accommodationType: string | null;
  transportation: string | null;
  cancellationPolicy: string | null;
  inclusions: string[];
  partnerName: string | null;
  entertainmentLevel: EntertainmentLevel | null;
  entertainmentLabel: string | null;
};

export type ComparedTourColumn =
  ComparedTourAvailable | ComparedTourUnavailable;

export type CompareToursResponse = {
  columns: ComparedTourColumn[];
};

/** Structured filters extracted from natural-language AI search. */
export type AiSearchFilters = {
  q: string | null;
  departureCity: string | null;
  stayKind: TourStayKind | null;
  destinationScope: TourDestinationScope | null;
  durationDays: number | null;
  duration: '1' | '2-3' | '4-6' | '7+' | null;
  nights: number | null;
  region: string | null;
  destinations: string[];
  featured: boolean;
};

export type AiSearchSummaryPill = {
  id: string;
  label: string;
  kind:
    | 'departure'
    | 'region'
    | 'destination'
    | 'duration'
    | 'stay'
    | 'scope'
    | 'featured'
    | 'query';
};

export type AiSearchPersonaBadge = {
  persona: TravelerPersona;
  fitScore: number;
  tone: 'aligned' | 'conflict' | 'neutral';
  label: string;
};

/** Curated shortlist roles for conversational tour picks. */
export type AiSearchPickRole = 'TOP_RATED' | 'BEST_PRICE' | 'BEST_VALUE';

export type AiSearchTourHit = {
  id: string;
  title: string;
  slug: string;
  coverUrl: string | null;
  price: string;
  currency: string;
  durationDays: number;
  averageRating: string;
  reviewCount: number;
  departureCities: string[];
  partnerName: string | null;
  /** Present when NL prompt implies a traveler persona. */
  personaBadge: AiSearchPersonaBadge | null;
  /** Curated pick role when response mode is curated/persona shortlist. */
  pickRole: AiSearchPickRole | null;
  pickLabel: string | null;
};

export type AiSearchResponse = {
  reply: string;
  filters: AiSearchFilters;
  summaryPills: AiSearchSummaryPill[];
  tours: AiSearchTourHit[];
  /**
   * `curated` = top rated / best price / best value trio.
   * `persona` = same shortlist + review persona matching for specific intent.
   */
  mode: 'curated' | 'persona';
  /** `heuristic` today; reserved for future LLM-backed parse. */
  parser: 'heuristic' | 'llm';
  empty: boolean;
};

/** Persona tags inferred from review text (LLM-ready contract). */
export type ReviewPersonaTag =
  | 'gece-hayati'
  | 'sakin-dinlenme'
  | 'cocuklu-aile'
  | 'butce-dostu'
  | 'macera'
  | 'kultur';

export type TravelerPersona =
  'PARTY' | 'CALM' | 'FAMILY' | 'BUDGET' | 'ADVENTURE' | 'CULTURE';

export type PersonaAlignment = 'positive' | 'negative' | 'neutral';

export type PersonaMatchedReview = {
  id: string;
  rating: number;
  comment: string | null;
  tags: ReviewPersonaTag[];
  alignment: PersonaAlignment;
  createdAt: string;
};

export type TourPersonaMatchResponse = {
  tourId: string;
  persona: TravelerPersona;
  fitScore: number;
  summary: string;
  alignedTags: ReviewPersonaTag[];
  conflictTags: ReviewPersonaTag[];
  warnings: string[];
  highlights: PersonaMatchedReview[];
  reviewCount: number;
  parser: 'heuristic' | 'llm';
};

export type BookingStatus =
  | 'PENDING'
  | 'PENDING_PAYMENT'
  | 'CONFIRMED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'SUSPENDED'
  | 'PAYMENT_FAILED'
  | 'EXPIRED';

export interface BookingGuest {
  firstName: string;
  lastName: string;
  birthDate?: string;
  identityNumber: string;
  phone?: string;
  email?: string;
  /** Required for primary buyer; optional for other party members. */
  address?: string;
}

export interface Reservation {
  id: string;
  bookingNumber: string;
  userId: string;
  tourId: string | null;
  tourDateId: string | null;
  hotelId: string | null;
  roomId: string | null;
  experienceId: string | null;
  activityDateId: string | null;
  partnerId: string;
  agencyId?: string;
  status: BookingStatus;
  paymentStatus?: string;
  adults: number;
  children: number;
  totalAmount: string;
  currency: string;
  contactEmail: string;
  contactPhone: string | null;
  guests: BookingGuest[];
  metadata?: Record<string, unknown> | null;
  startDate?: string | null;
  endDate?: string | null;
  /** PENDING_PAYMENT seat hold deadline (ISO). */
  holdExpiresAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type PaymentStatus =
  'PENDING' | 'AWAITING_3DS' | 'SUCCESS' | 'FAILED' | 'REFUNDED';

export interface PaymentTransaction {
  id: string;
  reservationId: string;
  amount: string;
  currency: string;
  status: PaymentStatus;
  provider: 'IYZICO' | 'MOCK';
  conversationId: string;
  providerPaymentId: string | null;
  paidAt: string | null;
}

export type ReviewTargetType = 'TOUR' | 'EXPERIENCE' | 'HOTEL' | 'PARTNER';

export interface Review {
  id: string;
  tourId: string | null;
  experienceId: string | null;
  hotelId: string | null;
  reservationId: string;
  userId: string;
  partnerId: string;
  agencyId?: string;
  rating: number;
  comment: string | null;
  photoUrls: string[];
  partnerReply: string | null;
  partnerRepliedAt: string | null;
  /** Denormalized / enriched title for profile lists. */
  targetTitle?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Post {
  id: string;
  title: string;
  slug: string;
  content?: string;
  excerpt: string | null;
  coverImage?: string | null;
  published: boolean;
  authorId: string;
  publishedAt: string | null;
  createdAt?: string;
  updatedAt?: string;
  categories?: Category[];
}

export interface Category {
  id: string;
  name: string;
  slug: string;
}

export interface SitePageCover {
  key: string;
  enabled: boolean;
  headline: string | null;
  subtitle: string | null;
}

/** Admin-editable SEO/copy overlay for a curated catalog route. */
export interface RoutePageOverlay {
  routeKey: string;
  exists: boolean;
  seoTitle: string | null;
  seoDescription: string | null;
  summary: string | null;
  body: string | null;
}

export type NotificationType =
  | 'BOOKING_CONFIRMED'
  | 'BOOKING_COMPLETED'
  | 'REVIEW_RECEIVED'
  | 'REVIEW_REQUEST'
  | 'WELCOME'
  | 'GENERIC';

export interface AppNotification {
  id: string;
  userId: string;
  type: NotificationType | string;
  title: string;
  body: string;
  data: Record<string, unknown> | null;
  readAt: string | null;
  createdAt: string;
}
