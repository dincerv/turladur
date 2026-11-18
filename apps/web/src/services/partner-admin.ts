import { apiRequest } from './api-client';

export type PartnerDashboardStatusCounts = {
  pending: number;
  confirmed: number;
  cancelled: number;
  completed: number;
};

export type PartnerDashboardRecentReservation = {
  id: string;
  bookingNumber: string;
  tourId: string | null;
  tourTitle: string | null;
  status: string;
  totalAmount: string;
  currency: string;
  contactEmail: string;
  customerName: string;
  createdAt: string;
};

export type PartnerDashboardPopularTour = {
  id: string;
  title: string;
  category: string;
  price: string;
  currency: string;
  coverUrl: string | null;
  reservationCount: number;
  guestCount: number;
  rating: number;
  reviewCount: number;
};

/** Full agency dashboard overview — permission-sliced on the server. */
export type PartnerStats = {
  tours: {
    total: number;
    published: number;
    pendingReview: number;
  } | null;
  reservations: {
    total: number;
    byStatus: PartnerDashboardStatusCounts;
  } | null;
  revenue: { confirmedTotal: string; currency: string } | null;
  months: Array<{ month: string; total: string }> | null;
  recentReservations: PartnerDashboardRecentReservation[] | null;
  popularTours: PartnerDashboardPopularTour[] | null;
};

export type PartnerTour = {
  id: string;
  title: string;
  slug: string;
  price: string;
  currency: string;
  category: string;
  status: string;
  coverUrl: string | null;
  durationDays: number;
  averageRating?: number;
  reviewCount?: number;
  stayKind?: 'DAY_TRIP' | 'OVERNIGHT';
  destinationScope?: 'DOMESTIC' | 'INTERNATIONAL';
  departureCities?: string[];
  createdAt?: string;
  updatedAt?: string;
};

export type PartnerTourListMeta = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type PartnerTourListResult = {
  items: PartnerTour[];
  meta: PartnerTourListMeta;
};

export type PartnerTourListParams = {
  q?: string;
  status?: 'DRAFT' | 'PENDING_REVIEW' | 'PUBLISHED' | 'ARCHIVED';
  category?:
    'CULTURAL' | 'ADVENTURE' | 'GASTRONOMY' | 'NATURE' | 'CITY' | 'BEACH';
  page?: number;
  pageSize?: number;
};

export type PartnerReservationStatus =
  | 'PENDING'
  | 'PENDING_PAYMENT'
  | 'PAYMENT_FAILED'
  | 'CONFIRMED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'SUSPENDED'
  | 'EXPIRED';

export type PartnerReservation = {
  id: string;
  bookingNumber: string;
  tourId: string | null;
  tourDateId?: string | null;
  experienceId?: string | null;
  activityDateId?: string | null;
  tourTitle: string | null;
  status: PartnerReservationStatus | string;
  paymentStatus?: string;
  totalAmount: string;
  currency: string;
  contactEmail: string;
  contactPhone?: string | null;
  customerName?: string;
  adults: number;
  children: number;
  guestCount?: number;
  seatNumbers?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  createdAt: string;
  updatedAt?: string;
};

export type PartnerReservationListMeta = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type PartnerReservationListResult = {
  items: PartnerReservation[];
  meta: PartnerReservationListMeta;
};

export type PartnerReservationListParams = {
  q?: string;
  status?:
    | 'PENDING'
    | 'CONFIRMED'
    | 'COMPLETED'
    | 'CANCELLED'
    | 'SUSPENDED'
    | 'PENDING_PAYMENT'
    | 'PAYMENT_FAILED';
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
};

function buildReservationListQuery(
  params?: PartnerReservationListParams,
): string {
  if (!params) return '';
  const sp = new URLSearchParams();
  if (params.q?.trim()) sp.set('q', params.q.trim().slice(0, 80));
  if (params.status) sp.set('status', params.status);
  if (params.dateFrom) sp.set('dateFrom', params.dateFrom);
  if (params.dateTo) sp.set('dateTo', params.dateTo);
  if (params.page && params.page > 1) sp.set('page', String(params.page));
  if (params.pageSize) sp.set('pageSize', String(params.pageSize));
  const qs = sp.toString();
  return qs ? `?${qs}` : '';
}

export function normalizePartnerReservationList(
  raw: PartnerReservation[] | PartnerReservationListResult,
  page = 1,
  pageSize = 20,
): PartnerReservationListResult {
  if (Array.isArray(raw)) {
    return {
      items: raw,
      meta: {
        page,
        pageSize,
        total: raw.length,
        totalPages: Math.max(1, Math.ceil(raw.length / pageSize) || 1),
      },
    };
  }
  return {
    items: raw.items ?? [],
    meta: {
      page: raw.meta?.page ?? page,
      pageSize: raw.meta?.pageSize ?? pageSize,
      total: raw.meta?.total ?? raw.items?.length ?? 0,
      totalPages: raw.meta?.totalPages ?? 1,
    },
  };
}

export async function getPartnerStats(token: string) {
  return apiRequest<PartnerStats>('/partner/dashboard/stats', {
    token,
    cache: 'no-store',
  });
}

function buildTourListQuery(params?: PartnerTourListParams): string {
  if (!params) return '';
  const sp = new URLSearchParams();
  if (params.q?.trim()) sp.set('q', params.q.trim().slice(0, 80));
  if (params.status) sp.set('status', params.status);
  if (params.category) sp.set('category', params.category);
  if (params.page && params.page > 1) sp.set('page', String(params.page));
  if (params.pageSize) sp.set('pageSize', String(params.pageSize));
  const qs = sp.toString();
  return qs ? `?${qs}` : '';
}

/** Normalizes legacy array responses and new `{ items, meta }` payloads. */
export function normalizePartnerTourList(
  data: PartnerTour[] | PartnerTourListResult,
  fallbackPage = 1,
  fallbackPageSize = 12,
): PartnerTourListResult {
  if (Array.isArray(data)) {
    return {
      items: data,
      meta: {
        page: fallbackPage,
        pageSize: fallbackPageSize,
        total: data.length,
        totalPages: 1,
      },
    };
  }
  return {
    items: Array.isArray(data.items) ? data.items : [],
    meta: {
      page: data.meta?.page ?? fallbackPage,
      pageSize: data.meta?.pageSize ?? fallbackPageSize,
      total: data.meta?.total ?? 0,
      totalPages: Math.max(1, data.meta?.totalPages ?? 1),
    },
  };
}

export async function listPartnerTours(
  token: string,
  params?: PartnerTourListParams,
) {
  const raw = await apiRequest<PartnerTour[] | PartnerTourListResult>(
    `/partner/tours${buildTourListQuery(params)}`,
    { token, cache: 'no-store' },
  );
  return normalizePartnerTourList(
    raw,
    params?.page ?? 1,
    params?.pageSize ?? 12,
  );
}

export type PartnerTourDetail = PartnerTour & {
  description: string;
  galleryUrls: string[];
  extras: Record<string, unknown>;
  stayKind?: string;
  destinationScope?: string;
  departureCities?: string[];
  agencyId?: string;
  agency?: {
    id: string;
    companyName: string;
    logo: string | null;
  };
  partner?: {
    id: string;
    companyName: string;
    logo: string | null;
  };
  createdAt?: string;
  updatedAt?: string;
};

export type PartnerTourDateRow = {
  id: string;
  tourId: string;
  startDate: string;
  endDate: string;
  capacity: number;
  remainingCapacity: number;
  priceOverride: string | null;
  isActive: boolean;
};

export async function getPartnerTourById(id: string, token: string) {
  return apiRequest<PartnerTourDetail>(`/partner/tours/${id}`, {
    token,
    cache: 'no-store',
  });
}

/** Agency-scoped dates (works for DRAFT / PENDING_REVIEW). */
export async function listPartnerTourDates(tourId: string, token: string) {
  return apiRequest<PartnerTourDateRow[]>(`/partner/tours/${tourId}/dates`, {
    token,
    cache: 'no-store',
  });
}

export async function listPartnerReservations(
  token: string,
  params?: PartnerReservationListParams,
) {
  const raw = await apiRequest<
    PartnerReservation[] | PartnerReservationListResult
  >(`/partner/reservations${buildReservationListQuery(params)}`, {
    token,
    cache: 'no-store',
  });
  return normalizePartnerReservationList(
    raw,
    params?.page ?? 1,
    params?.pageSize ?? 20,
  );
}

export async function updatePartnerReservation(
  id: string,
  body: {
    status?: 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'SUSPENDED';
    seatNumbers?: string;
  },
  token: string,
) {
  return apiRequest<PartnerReservation>(`/partner/reservations/${id}`, {
    method: 'PATCH',
    body,
    token,
  });
}

export type AdminReservationRow = {
  id: string;
  bookingNumber: string;
  customerName: string;
  contactEmail: string;
  tourTitle: string | null;
  partnerName: string | null;
  partnerId: string;
  status: string;
  paymentStatus: string;
  guestCount: number;
  totalAmount: string;
  currency: string;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
};

export async function listAdminReservations(token: string) {
  return apiRequest<AdminReservationRow[]>('/admin/reservations', { token });
}

export type AdminStats = {
  users: number;
  partners: { total: number; pending: number };
  tours: { total: number; pendingReview: number };
  experiences: { total: number; pendingReview: number };
  reservations: number;
  paymentsSuccess: number;
};

export async function getAdminStats(token: string) {
  return apiRequest<AdminStats>('/admin/dashboard/stats', { token });
}

export async function listAdminUsers(token: string) {
  return apiRequest<
    Array<{
      id: string;
      email: string;
      firstName: string | null;
      lastName: string | null;
      role: string;
      isActive: boolean;
      partnerId: string | null;
    }>
  >('/admin/users', { token });
}

export async function updateAdminUser(
  id: string,
  body: { isActive?: boolean; role?: string },
  token: string,
) {
  return apiRequest(`/admin/users/${id}`, {
    method: 'PATCH',
    body,
    token,
  });
}

export async function listAdminPartners(token: string, status?: string) {
  const qs = status ? `?status=${status}` : '';
  return apiRequest<
    Array<{
      id: string;
      companyName: string;
      contactEmail: string;
      status: string;
      verifiedAt: string | null;
    }>
  >(`/admin/partners${qs}`, { token });
}

export async function setPartnerStatus(
  id: string,
  status: 'VERIFIED' | 'REJECTED' | 'SUSPENDED',
  token: string,
) {
  return apiRequest(`/admin/partners/${id}/status`, {
    method: 'PATCH',
    body: { status },
    token,
  });
}

export type AdminGuideRow = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  identityNumber: string;
  phone: string | null;
  city: string | null;
  languages: string[];
  oda: string | null;
  sicilNo: string | null;
  ruhsatNo: string | null;
  ruhsatExpiresAt: string | null;
  birthDate: string | null;
  status: string;
  verifiedAt: string | null;
  createdAt: string;
};

export async function listAdminGuides(token: string, status?: string) {
  const qs = status ? `?status=${status}` : '';
  return apiRequest<AdminGuideRow[]>(`/admin/guides${qs}`, { token });
}

export async function setGuideStatusAdmin(
  id: string,
  status: 'VERIFIED' | 'REJECTED' | 'SUSPENDED',
  token: string,
) {
  return apiRequest(`/admin/guides/${id}/status`, {
    method: 'PATCH',
    body: { status },
    token,
  });
}

export async function listPendingTours(token: string) {
  return apiRequest<
    Array<{
      id: string;
      title: string;
      partnerId: string;
      price: string;
      currency: string;
      category: string;
      status: string;
    }>
  >('/admin/tours/pending', { token });
}

export async function setTourStatusAdmin(
  id: string,
  status: 'PUBLISHED' | 'ARCHIVED' | 'DRAFT',
  token: string,
) {
  return apiRequest(`/admin/tours/${id}/status`, {
    method: 'PATCH',
    body: { status },
    token,
  });
}

export type CreatePartnerTourBody = {
  title: string;
  description: string;
  price: number;
  category: string;
  durationDays?: number;
  stayKind?: 'DAY_TRIP' | 'OVERNIGHT';
  destinationScope?: 'DOMESTIC' | 'INTERNATIONAL';
  departureCities?: string[];
  coverUrl?: string;
  galleryUrls?: string[];
  extras?: Record<string, unknown>;
  /** true → DRAFT; omit/false → PENDING_REVIEW */
  asDraft?: boolean;
  dates?: Array<{
    startDate: string;
    endDate: string;
    capacity: number;
    priceOverride?: number;
    ageRanges?: Array<{
      minAge: number;
      maxAge?: number | null;
      pricingType: 'FREE' | 'HALF' | 'PERCENTAGE' | 'FIXED';
      value: number;
    }>;
  }>;
  pickupPoints?: Array<{
    city: string;
    location: string;
    time: string;
    description?: string;
    latitude?: number | null;
    longitude?: number | null;
    order?: number;
  }>;
  accommodation?: {
    name: string;
    image: string;
    location: string;
    type: string;
  };
};

export async function createPartnerTour(
  body: CreatePartnerTourBody,
  token: string,
) {
  return apiRequest<{ id: string; title: string; status: string }>(
    '/catalog/tours',
    {
      method: 'POST',
      body,
      token,
    },
  );
}

export type UpdatePartnerTourBody = {
  coverUrl?: string;
  title?: string;
  description?: string;
  price?: number;
  category?: string;
  status?: 'DRAFT' | 'PENDING_REVIEW' | 'PUBLISHED' | 'ARCHIVED';
  durationDays?: number;
  stayKind?: 'DAY_TRIP' | 'OVERNIGHT';
  destinationScope?: 'DOMESTIC' | 'INTERNATIONAL';
  departureCities?: string[];
  galleryUrls?: string[];
  extras?: Record<string, unknown>;
  replacePickupPoints?: boolean;
  dates?: CreatePartnerTourBody['dates'];
  pickupPoints?: CreatePartnerTourBody['pickupPoints'];
  accommodation?: CreatePartnerTourBody['accommodation'];
};

export async function updatePartnerTour(
  id: string,
  body: UpdatePartnerTourBody,
  token: string,
) {
  return apiRequest(`/catalog/tours/${id}`, {
    method: 'PATCH',
    body,
    token,
  });
}

export type PartnerTourEditBundle = {
  tour: PartnerTourDetail;
  dates: Array<
    PartnerTourDateRow & {
      ageRanges: Array<{
        id: string;
        minAge: number;
        maxAge: number | null;
        pricingType: string;
        value: string;
      }>;
    }
  >;
  pickupPoints: Array<{
    id: string;
    tourId: string;
    city: string;
    location: string;
    time: string;
    description: string | null;
    latitude?: number | null;
    longitude?: number | null;
    order: number;
    isActive: boolean;
  }>;
  accommodation: {
    id: string;
    tourId: string;
    name: string;
    image: string;
    location: string;
    type: string;
    rating: number;
    features: unknown;
    description: string | null;
  } | null;
};

export async function getPartnerTourEditBundle(tourId: string, token: string) {
  return apiRequest<PartnerTourEditBundle>(
    `/partner/tours/${tourId}/edit-bundle`,
    { token, cache: 'no-store' },
  );
}

export type TourCancelReason = 'OPERATIONAL' | 'LOW_PARTICIPANTS' | 'WEATHER';

export const TOUR_CANCEL_REASON_OPTIONS: Array<{
  value: TourCancelReason;
  label: string;
}> = [
  { value: 'OPERATIONAL', label: 'Operasyonel nedenler' },
  { value: 'LOW_PARTICIPANTS', label: 'Yetersiz katılımcı sayısı' },
  { value: 'WEATHER', label: 'Hava koşulları' },
];

/** Cancel / delist tour — cancels active bookings and emails all guests. */
export async function cancelPartnerTour(
  id: string,
  body: { reason: TourCancelReason; note?: string },
  token: string,
) {
  return apiRequest<{
    id: string;
    cancelled: boolean;
    reason: string;
    reasonLabel: string;
  }>(`/catalog/tours/${id}/cancel`, {
    method: 'POST',
    body,
    token,
  });
}

/** Cancel selected departure dates — emails only guests booked on those dates. */
export async function cancelPartnerTourDates(
  tourId: string,
  body: {
    dateIds: string[];
    reason: TourCancelReason;
    note?: string;
  },
  token: string,
) {
  return apiRequest<{
    id: string;
    cancelledDateIds: string[];
    cancelledDates: Array<{
      id: string;
      startDate: string;
      endDate: string;
      label: string;
    }>;
    reason: string;
    reasonLabel: string;
    tourArchived: boolean;
  }>(`/catalog/tours/${tourId}/dates/cancel`, {
    method: 'POST',
    body,
    token,
  });
}

export async function getPresignedUpload(
  body: {
    folder: string;
    entityId: string;
    filename: string;
    contentType: string;
  },
  token: string,
) {
  return apiRequest<{
    uploadUrl: string;
    publicUrl: string;
    key: string;
    cdnBase?: string;
    uploadHeaders?: Record<string, string>;
  }>('/storage/presigned-url', {
    method: 'POST',
    body,
    token,
  });
}

export type PartnerExperience = {
  id: string;
  title: string;
  slug: string;
  category: string;
  location: string;
  price: string;
  currency: string;
  status: string;
  imageUrl?: string | null;
  duration?: string;
  ageRestriction?: string | null;
  averageRating: string;
  reviewCount: number;
  createdAt?: string;
  updatedAt?: string;
};

export type PartnerExperienceListMeta = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type PartnerExperienceListResult = {
  items: PartnerExperience[];
  meta: PartnerExperienceListMeta;
};

export type PartnerExperienceListParams = {
  q?: string;
  status?: 'DRAFT' | 'PENDING_REVIEW' | 'PUBLISHED' | 'ARCHIVED';
  category?: string;
  page?: number;
  pageSize?: number;
};

export type CreateExperienceBody = {
  title: string;
  description: string;
  longDescription: string;
  category: string;
  location: string;
  duration: string;
  price: number;
  currency?: string;
  ageRestriction?: string;
  imageUrl?: string;
  meetingPoint?: string;
  gallery?: string[];
  included?: string[];
  notIncluded?: string[];
  highlights?: string[];
  dateStart?: string;
  dateEnd?: string;
  dateSeats?: number;
};

function buildExperienceListQuery(
  params?: PartnerExperienceListParams,
): string {
  if (!params) return '';
  const sp = new URLSearchParams();
  if (params.q?.trim()) sp.set('q', params.q.trim().slice(0, 80));
  if (params.status) sp.set('status', params.status);
  if (params.category?.trim())
    sp.set('category', params.category.trim().slice(0, 120));
  if (params.page && params.page > 1) sp.set('page', String(params.page));
  if (params.pageSize) sp.set('pageSize', String(params.pageSize));
  const qs = sp.toString();
  return qs ? `?${qs}` : '';
}

export function normalizePartnerExperienceList(
  data: PartnerExperience[] | PartnerExperienceListResult,
  fallbackPage = 1,
  fallbackPageSize = 12,
): PartnerExperienceListResult {
  if (Array.isArray(data)) {
    return {
      items: data,
      meta: {
        page: fallbackPage,
        pageSize: fallbackPageSize,
        total: data.length,
        totalPages: 1,
      },
    };
  }
  return {
    items: Array.isArray(data.items) ? data.items : [],
    meta: {
      page: data.meta?.page ?? fallbackPage,
      pageSize: data.meta?.pageSize ?? fallbackPageSize,
      total: data.meta?.total ?? 0,
      totalPages: Math.max(1, data.meta?.totalPages ?? 1),
    },
  };
}

export async function listPartnerExperiences(
  token: string,
  params?: PartnerExperienceListParams,
) {
  const raw = await apiRequest<
    PartnerExperience[] | PartnerExperienceListResult
  >(`/partner/experiences${buildExperienceListQuery(params)}`, {
    token,
    cache: 'no-store',
  });
  return normalizePartnerExperienceList(
    raw,
    params?.page ?? 1,
    params?.pageSize ?? 12,
  );
}

export async function createPartnerExperience(
  body: CreateExperienceBody,
  token: string,
) {
  return apiRequest<{ id: string; title: string; status: string }>(
    '/catalog/experiences',
    { method: 'POST', body, token },
  );
}

export async function getExperienceDetail(id: string, token?: string) {
  return apiRequest<
    PartnerExperience & {
      description: string;
      longDescription: string;
      meetingPoint: string | null;
      ageRestriction: string | null;
      duration: string;
      imageUrl: string | null;
    }
  >(`/catalog/experiences/${id}`, token ? { token } : {});
}

export type PartnerExperienceEditBundle = {
  experience: PartnerExperience & {
    description: string;
    longDescription: string;
    meetingPoint: string | null;
    ageRestriction: string | null;
    gallery: string[];
    included: string[];
    notIncluded: string[];
    highlights: string[];
  };
  dates: Array<{
    id: string;
    startDate: string;
    endDate: string;
    price: string;
    availableSeats: number;
    remainingCapacity: number | null;
    isActive: boolean;
  }>;
};

/** Agency-owned edit bootstrap (all statuses) — IDOR via JWT agencyId. */
export async function getPartnerExperienceEditBundle(
  experienceId: string,
  token: string,
) {
  return apiRequest<PartnerExperienceEditBundle>(
    `/partner/experiences/${experienceId}/edit-bundle`,
    { token, cache: 'no-store' },
  );
}

export async function updatePartnerExperience(
  id: string,
  body: Partial<CreateExperienceBody> & { status?: string },
  token: string,
) {
  return apiRequest(`/catalog/experiences/${id}`, {
    method: 'PATCH',
    body,
    token,
  });
}

export async function deletePartnerExperience(id: string, token: string) {
  return apiRequest(`/catalog/experiences/${id}`, {
    method: 'DELETE',
    token,
  });
}

export async function listExperienceDates(id: string, token?: string) {
  return apiRequest<
    Array<{
      id: string;
      startDate: string;
      endDate: string;
      price: string;
      availableSeats: number;
      isActive: boolean;
    }>
  >(`/catalog/experiences/${id}/dates`, token ? { token } : {});
}

export async function createExperienceDate(
  experienceId: string,
  body: {
    startDate: string;
    endDate: string;
    price: number;
    availableSeats: number;
  },
  token: string,
) {
  return apiRequest(`/catalog/experiences/${experienceId}/dates`, {
    method: 'POST',
    body,
    token,
  });
}

export async function deleteExperienceDate(
  experienceId: string,
  dateId: string,
  token: string,
) {
  return apiRequest(`/catalog/experiences/${experienceId}/dates/${dateId}`, {
    method: 'DELETE',
    token,
  });
}

export type PartnerCompanyProfile = {
  id: string;
  companyName: string;
  legalTitle?: string;
  taxNumber: string | null;
  contactEmail: string;
  contactPhone: string | null;
  status: string;
  capabilities?: string[];
  membershipTier?: 'BRONZE' | 'SILVER' | 'GOLD' | null;
  averageRating?: string;
  reviewCount?: number;
  address: string | null;
  city: string | null;
  country: string | null;
  website: string | null;
  logo: string | null;
};

export type PartnerNotificationPrefs = {
  emailReservations: boolean;
  emailReviews: boolean;
  emailMarketing: boolean;
  emailFinancials: boolean;
  pushEnabled: boolean;
};

export type PartnerSettingsBootstrap = {
  staff: {
    id: string;
    name: string;
    email: string;
    role: string;
    uiRole: string;
  } | null;
  company: PartnerCompanyProfile;
  notifications: PartnerNotificationPrefs;
};

export async function getPartnerProfile(token: string) {
  return apiRequest<PartnerCompanyProfile>('/partner/me', {
    token,
    cache: 'no-store',
  });
}

export async function getPartnerSettings(token: string) {
  return apiRequest<PartnerSettingsBootstrap>('/partner/settings', {
    token,
    cache: 'no-store',
  });
}

export async function updatePartnerStaffProfile(
  body: { name: string },
  token: string,
) {
  return apiRequest<{ id: string; name: string; email: string }>(
    '/partner/settings/profile',
    { method: 'PATCH', body, token },
  );
}

export async function changePartnerStaffPassword(
  body: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  },
  token: string,
) {
  return apiRequest<{ updated: boolean }>('/partner/settings/password', {
    method: 'POST',
    body,
    token,
  });
}

export async function updatePartnerNotifications(
  body: PartnerNotificationPrefs,
  token: string,
) {
  return apiRequest<{ notifications: PartnerNotificationPrefs }>(
    '/partner/settings/notifications',
    { method: 'PATCH', body, token },
  );
}

export async function updatePartnerProfile(
  body: {
    companyName: string;
    legalTitle: string;
    taxNumber: string;
    contactEmail: string;
    contactPhone?: string | null;
    address: string;
    city?: string | null;
    country?: string | null;
    website?: string | null;
    logo?: string | null;
  },
  token: string,
) {
  return apiRequest('/partner/me', { method: 'PATCH', body, token });
}

export async function updatePartnerCompanyLogo(
  logo: string | null,
  token: string,
) {
  return apiRequest<{ id: string; logo: string | null }>(
    '/partner/settings/company/logo',
    { method: 'PATCH', body: { logo }, token },
  );
}

export type PartnerSupportTicket = {
  id: string;
  agencyId: string;
  userId: string;
  subject: string;
  message: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | string;
  status: 'OPEN' | 'ANSWERED' | 'CLOSED' | string;
  category: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PartnerSupportTicketsResult = {
  items: PartnerSupportTicket[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};

export async function listPartnerSupportTickets(
  token: string,
  params: { status?: string; page?: number; pageSize?: number } = {},
) {
  const sp = new URLSearchParams();
  if (params.status) sp.set('status', params.status);
  if (params.page && params.page > 1) sp.set('page', String(params.page));
  if (params.pageSize && params.pageSize !== 20) {
    sp.set('pageSize', String(params.pageSize));
  }
  const qs = sp.toString();
  return apiRequest<PartnerSupportTicketsResult>(
    `/partner/support-tickets${qs ? `?${qs}` : ''}`,
    { token, cache: 'no-store' },
  );
}

export async function createPartnerSupportTicket(
  body: {
    subject: string;
    message: string;
    priority?: 'LOW' | 'MEDIUM' | 'HIGH';
    category?: string;
  },
  token: string,
) {
  return apiRequest<PartnerSupportTicket>('/partner/support-tickets', {
    method: 'POST',
    body,
    token,
  });
}

export type PartnerFinancialKpis = {
  grossRevenue: string;
  netEarnings: string;
  platformCommission: string;
  pendingReceivables: string;
  completedPayouts: string;
  overdueAmount: string;
  refundedGross: string;
  transactionCount: number;
  pendingCount: number;
  paidCount: number;
  overdueCount: number;
  refundedCount: number;
};

export type PartnerFinancialsOverview = {
  currency: string;
  total: string;
  months: Array<{ month: string; total: string }>;
  kpis: PartnerFinancialKpis;
};

export type PartnerFinancialTransaction = {
  id: string;
  reservationId: string;
  bookingNumber: string;
  contactEmailMasked: string;
  status: 'PAID' | 'PENDING' | 'OVERDUE' | 'REFUNDED' | string;
  earningStatus: string;
  reservationPaymentStatus: string | null;
  reservationStatus: string | null;
  grossAmount: string;
  commissionAmount: string;
  commissionRatePercent: string;
  netAmount: string;
  currency: string;
  tourDate: string | null;
  createdAt: string;
};

export type PartnerFinancialTransactionList = {
  items: PartnerFinancialTransaction[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};

export type PartnerFinancialsParams = {
  startDate?: string;
  endDate?: string;
  status?: 'PAID' | 'PENDING' | 'OVERDUE' | 'REFUNDED';
  q?: string;
  page?: number;
  pageSize?: number;
  format?: 'csv' | 'pdf';
};

function buildFinancialsQuery(params?: PartnerFinancialsParams): string {
  const sp = new URLSearchParams();
  if (params?.startDate) sp.set('startDate', params.startDate);
  if (params?.endDate) sp.set('endDate', params.endDate);
  if (params?.status) sp.set('status', params.status);
  if (params?.q?.trim()) sp.set('q', params.q.trim().slice(0, 80));
  if (params?.page && params.page > 1) sp.set('page', String(params.page));
  if (params?.pageSize) sp.set('pageSize', String(params.pageSize));
  if (params?.format) sp.set('format', params.format);
  const qs = sp.toString();
  return qs ? `?${qs}` : '';
}

export async function getPartnerFinancials(
  token: string,
  params?: Pick<PartnerFinancialsParams, 'startDate' | 'endDate'>,
) {
  return apiRequest<PartnerFinancialsOverview>(
    `/partner/financials${buildFinancialsQuery(params)}`,
    { token, cache: 'no-store' },
  );
}

export async function listPartnerFinancialTransactions(
  token: string,
  params?: PartnerFinancialsParams,
) {
  return apiRequest<PartnerFinancialTransactionList>(
    `/partner/financials/transactions${buildFinancialsQuery(params)}`,
    { token, cache: 'no-store' },
  );
}

export async function exportPartnerFinancials(
  token: string,
  params?: PartnerFinancialsParams,
) {
  return apiRequest<{
    filename: string;
    contentType: string;
    csv: string;
    format: string;
    rowCount: number;
  }>(`/partner/financials/export${buildFinancialsQuery(params)}`, {
    token,
    cache: 'no-store',
  });
}

export type PartnerSubUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  uiRole?: string;
  status: string;
  permissions: unknown;
  lastLoginAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export async function listPartnerSubUsers(token: string) {
  return apiRequest<PartnerSubUser[]>('/partner/users', {
    token,
    cache: 'no-store',
  });
}

export async function createPartnerSubUser(
  partnerId: string,
  body: {
    name: string;
    email: string;
    password: string;
    role?: string;
    permissions?: Record<string, unknown>;
  },
  token: string,
) {
  return apiRequest(`/identity/partners/${partnerId}/users`, {
    method: 'POST',
    body,
    token,
  });
}

export async function updatePartnerSubUser(
  partnerId: string,
  userId: string,
  body: {
    name?: string;
    role?: string;
    status?: string;
    password?: string;
    permissions?: Record<string, unknown>;
  },
  token: string,
) {
  return apiRequest(`/identity/partners/${partnerId}/users/${userId}`, {
    method: 'PATCH',
    body,
    token,
  });
}

export async function deletePartnerSubUser(
  partnerId: string,
  userId: string,
  token: string,
) {
  return apiRequest(`/identity/partners/${partnerId}/users/${userId}`, {
    method: 'DELETE',
    token,
  });
}

export async function createTourDate(
  tourId: string,
  body: {
    startDate: string;
    endDate: string;
    capacity: number;
    priceOverride?: number;
  },
  token: string,
) {
  return apiRequest<{ id: string }>(`/catalog/tours/${tourId}/dates`, {
    method: 'POST',
    body,
    token,
  });
}

export async function listTourDateAgeRanges(
  tourId: string,
  dateId: string,
  token: string,
) {
  return apiRequest<
    Array<{
      id: string;
      minAge: number;
      maxAge: number | null;
      pricingType: string;
      value: string;
    }>
  >(`/catalog/tours/${tourId}/dates/${dateId}/age-ranges`, { token });
}

export async function createTourDateAgeRange(
  tourId: string,
  dateId: string,
  body: {
    minAge: number;
    maxAge?: number | null;
    pricingType: 'FREE' | 'HALF' | 'PERCENTAGE' | 'FIXED';
    value: number;
  },
  token: string,
) {
  return apiRequest(`/catalog/tours/${tourId}/dates/${dateId}/age-ranges`, {
    method: 'POST',
    body,
    token,
  });
}

export async function upsertTourAccommodation(
  tourId: string,
  body: {
    name: string;
    image: string;
    location: string;
    type: string;
    rating?: number;
  },
  token: string,
) {
  return apiRequest(`/catalog/tours/${tourId}/accommodation`, {
    method: 'PUT',
    body,
    token,
  });
}

export async function getTourAccommodation(tourId: string) {
  return apiRequest<{
    name: string;
    image: string;
    location: string;
    type: string;
  } | null>(`/catalog/tours/${tourId}/accommodation`, {});
}

export async function listTourPickupPoints(tourId: string, token: string) {
  return apiRequest<
    Array<{
      id: string;
      city: string;
      location: string;
      time: string;
      description: string | null;
      latitude: number | null;
      longitude: number | null;
      order: number;
    }>
  >(`/catalog/tours/${tourId}/pickup-points`, { token });
}

export async function createTourPickupPoint(
  tourId: string,
  body: {
    city: string;
    location: string;
    time: string;
    description?: string;
    latitude?: number | null;
    longitude?: number | null;
    order?: number;
  },
  token: string,
) {
  return apiRequest(`/catalog/tours/${tourId}/pickup-points`, {
    method: 'POST',
    body: {
      city: body.city,
      location: body.location,
      time: body.time,
      description: body.description,
      latitude: body.latitude ?? undefined,
      longitude: body.longitude ?? undefined,
      order: body.order,
    },
    token,
  });
}

export async function deleteTourPickupPoint(
  tourId: string,
  pointId: string,
  token: string,
) {
  return apiRequest(`/catalog/tours/${tourId}/pickup-points/${pointId}`, {
    method: 'DELETE',
    token,
  });
}

export async function listPendingExperiences(token: string) {
  return apiRequest<
    Array<{
      id: string;
      title: string;
      partnerId: string;
      price: string;
      currency: string;
      category: string;
      location: string;
      status: string;
    }>
  >('/admin/experiences/pending', { token });
}

export async function setExperienceStatusAdmin(
  id: string,
  status: 'PUBLISHED' | 'ARCHIVED' | 'DRAFT',
  token: string,
) {
  return apiRequest(`/admin/experiences/${id}/status`, {
    method: 'PATCH',
    body: { status },
    token,
  });
}

export async function listAdminAgencies(token: string, status?: string) {
  const qs = status ? `?status=${status}` : '';
  return apiRequest<
    Array<{
      id: string;
      name: string;
      status: string;
      email: string | null;
      city: string | null;
    }>
  >(`/admin/agencies${qs}`, { token });
}

export async function setAgencyStatusAdmin(
  id: string,
  status: 'APPROVED' | 'REJECTED' | 'SUSPENDED' | 'PENDING',
  token: string,
) {
  return apiRequest(`/admin/agencies/${id}/status`, {
    method: 'PATCH',
    body: { status },
    token,
  });
}

export async function listAdminContentPosts(token: string) {
  return apiRequest<
    Array<{
      id: string;
      title: string;
      slug: string;
      excerpt: string | null;
      published: boolean;
      publishedAt: string | null;
    }>
  >('/admin/content/posts?includeDrafts=true', { token });
}

export async function createAdminContentPost(
  body: {
    title: string;
    content: string;
    excerpt?: string;
    coverImage?: string;
    published?: boolean;
  },
  token: string,
) {
  return apiRequest('/admin/content/posts', {
    method: 'POST',
    body,
    token,
  });
}

export async function updateAdminContentPost(
  id: string,
  body: {
    title?: string;
    content?: string;
    excerpt?: string;
    coverImage?: string;
    published?: boolean;
  },
  token: string,
) {
  return apiRequest(`/admin/content/posts/${id}`, {
    method: 'PATCH',
    body,
    token,
  });
}

export async function deleteAdminContentPost(id: string, token: string) {
  return apiRequest(`/admin/content/posts/${id}`, {
    method: 'DELETE',
    token,
  });
}

export async function getAdminPageCover(key: string, token: string) {
  return apiRequest<{
    key: string;
    enabled: boolean;
    headline: string | null;
    subtitle: string | null;
  }>(`/admin/content/page-covers/${key}`, { token });
}

export async function updateAdminPageCover(
  key: string,
  body: {
    enabled: boolean;
    headline?: string | null;
    subtitle?: string | null;
  },
  token: string,
) {
  return apiRequest<{
    key: string;
    enabled: boolean;
    headline: string | null;
    subtitle: string | null;
  }>(`/admin/content/page-covers/${key}`, {
    method: 'PATCH',
    body,
    token,
  });
}

export async function listAdminRouteDefinitions(token: string) {
  return apiRequest<
    Array<{
      id: string;
      name: string;
      description: string;
      longDescription: string;
    }>
  >('/catalog/routes/definitions', { token });
}

export async function getAdminRoutePage(routeKey: string, token: string) {
  return apiRequest<{
    routeKey: string;
    exists: boolean;
    seoTitle: string | null;
    seoDescription: string | null;
    summary: string | null;
    body: string | null;
  }>(`/admin/content/route-pages/${routeKey}`, { token });
}

export async function updateAdminRoutePage(
  routeKey: string,
  body: {
    seoTitle?: string | null;
    seoDescription?: string | null;
    summary?: string | null;
    body?: string | null;
  },
  token: string,
) {
  return apiRequest<{
    routeKey: string;
    exists: boolean;
    seoTitle: string | null;
    seoDescription: string | null;
    summary: string | null;
    body: string | null;
  }>(`/admin/content/route-pages/${routeKey}`, {
    method: 'PATCH',
    body,
    token,
  });
}

export type PartnerReviewItem = {
  id: string;
  customerName: string;
  customerImage: string | null;
  tourName: string;
  tourId: string;
  productType: 'tour' | 'experience';
  rating: number;
  categoryRatings?: {
    guideRating: number | null;
    operatorRating: number | null;
    routeRating: number | null;
    foodRating: number | null;
    hotelRating: number | null;
    transportRating: number | null;
  };
  categoryFeedback?: {
    guideFeedback: string | null;
    operatorFeedback: string | null;
    routeFeedback: string | null;
    foodFeedback: string | null;
    hotelFeedback: string | null;
    transportFeedback: string | null;
  };
  reviewDate: string;
  reviewDateRaw: string;
  reviewText: string;
  isResponded: boolean;
  responseText?: string;
};

export type PartnerReviewsMeta = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type PartnerReviewsStats = {
  total: number;
  responded: number;
  pending: number;
  averageRating: number;
  ratingDistribution: Array<{
    rating: number;
    count: number;
    percent: number;
  }>;
};

export type PartnerReviewTourOption = {
  id: string;
  title: string;
  type: 'tour' | 'experience';
};

export type PartnerReviewsResult = {
  items: PartnerReviewItem[];
  meta: PartnerReviewsMeta;
  stats: PartnerReviewsStats;
  tours: PartnerReviewTourOption[];
};

export type ListPartnerReviewsParams = {
  q?: string;
  rating?: number;
  tourId?: string;
  responseStatus?: 'all' | 'responded' | 'pending';
  sort?: 'newest' | 'oldest' | 'highest' | 'lowest';
  page?: number;
  pageSize?: number;
};

function buildReviewsQuery(params: ListPartnerReviewsParams = {}): string {
  const sp = new URLSearchParams();
  if (params.q) sp.set('q', params.q);
  if (params.rating) sp.set('rating', String(params.rating));
  if (params.tourId) sp.set('tourId', params.tourId);
  if (params.responseStatus && params.responseStatus !== 'all') {
    sp.set('responseStatus', params.responseStatus);
  }
  if (params.sort && params.sort !== 'newest') sp.set('sort', params.sort);
  if (params.page && params.page > 1) sp.set('page', String(params.page));
  if (params.pageSize && params.pageSize !== 20) {
    sp.set('pageSize', String(params.pageSize));
  }
  const qs = sp.toString();
  return qs ? `?${qs}` : '';
}

export async function listPartnerReviews(
  token: string,
  params: ListPartnerReviewsParams = {},
) {
  return apiRequest<PartnerReviewsResult>(
    `/partner/reviews${buildReviewsQuery(params)}`,
    { token, cache: 'no-store' },
  );
}

export async function replyPartnerReview(
  reviewId: string,
  reply: string,
  token: string,
) {
  return apiRequest(`/partner/reviews/${reviewId}/reply`, {
    method: 'PATCH',
    body: { reply },
    token,
  });
}

export type PartnerReportsData = {
  dateRange: {
    id: string;
    label: string;
    period?: 'monthly' | 'yearly' | string;
  };
  sales: {
    summary: {
      totalSales: number;
      totalRevenue: number;
      averageOrderValue: number;
      comparedToLastPeriod: number | null;
      increase: boolean | null;
    };
    periodLabel: string;
    periodRangeText: string;
    topSelling: Array<{
      id: string;
      name: string;
      sales: number;
      revenue: number;
      growth: number | null;
    }>;
    bookingSummary: {
      totalReservations: number;
      completedTours: number;
      cancelledReservations: number;
      refundedCount: number;
      averageRating: number;
    };
    trend: Array<{ label: string; sales: number; revenue: number }>;
    occupancy?: {
      capacity: number;
      soldSeats: number;
      occupancyRate: number;
      byTour: Array<{
        id: string;
        name: string;
        capacity: number;
        sold: number;
        occupancyRate: number;
      }>;
    };
  };
  performance: {
    summary: {
      conversionRate: number | null;
      completionRate: number;
      avgBookingValue: number;
      monthlyBookings: number;
      occupancyRate?: number;
    };
    monthlyTrend: Array<{ label: string; count: number }>;
    tourPerformance: Array<{
      id: string;
      name: string;
      bookings: number;
      avgRating: number;
      conversionRate: number | null;
      revenue: number;
      occupancyRate?: number;
    }>;
    goals: Array<{
      id?: string | null;
      metric?: string;
      name: string;
      current: number;
      target: number;
      percentage: number;
      source?: 'stored' | 'baseline';
    }>;
  };
  customer: {
    summary: {
      totalCustomers: number;
      newCustomers: number;
      returningCustomers: number;
      customerLifetimeValue: number;
      percentChange: number | null;
      increase: boolean | null;
    };
    topCustomers: Array<{
      id: string;
      name: string;
      bookings: number;
      spent: number;
      lastBooking: string;
    }>;
    satisfactionDistribution: Array<{ rating: number; percentage: number }>;
  };
  visitors: {
    disclaimer?: string;
    summary: {
      uniqueVisitors: number;
      totalInteractions: number;
      conversionRate: number;
      comparedToLastPeriod: number | null;
      increase: boolean | null;
    };
    trend?: Array<{
      label: string;
      interactions: number;
      uniqueVisitors: number;
    }>;
    tourBreakdown?: Array<{
      id: string;
      name: string;
      interactions: number;
      uniqueVisitors: number;
      conversions: number;
      conversionRate: number;
    }>;
  };
};

export type ReportDateRangeId =
  | 'today'
  | 'yesterday'
  | 'thisWeek'
  | 'lastWeek'
  | 'thisMonth'
  | 'lastMonth'
  | 'last3Months'
  | 'lastYear'
  | 'thisYear'
  | 'custom';

export type PartnerReportsParams = {
  period?: 'monthly' | 'yearly';
  dateRange?: ReportDateRangeId;
  startDate?: string;
  endDate?: string;
};

function buildReportsQuery(params?: PartnerReportsParams): string {
  const sp = new URLSearchParams();
  if (params?.period) sp.set('period', params.period);
  if (params?.dateRange) sp.set('dateRange', params.dateRange);
  if (params?.startDate) sp.set('startDate', params.startDate);
  if (params?.endDate) sp.set('endDate', params.endDate);
  const qs = sp.toString();
  return qs ? `?${qs}` : '';
}

export async function getPartnerReports(
  token: string,
  dateRangeOrParams: string | PartnerReportsParams = 'thisMonth',
) {
  const params: PartnerReportsParams =
    typeof dateRangeOrParams === 'string'
      ? { dateRange: dateRangeOrParams as ReportDateRangeId }
      : dateRangeOrParams;
  return apiRequest<PartnerReportsData>(
    `/partner/reports${buildReportsQuery(params)}`,
    { token, cache: 'no-store' },
  );
}

export async function upsertPartnerSalesGoal(
  token: string,
  body: {
    period: 'monthly' | 'yearly';
    metric: 'reservations' | 'revenue' | 'occupancy' | 'completion';
    targetValue: number;
    year: number;
    month?: number;
  },
) {
  return apiRequest('/partner/reports/goals', {
    method: 'PUT',
    body,
    token,
  });
}

export type PartnerCustomerListItem = {
  id: string;
  displayName: string;
  emailMasked: string;
  phoneMasked: string | null;
  reservationCount: number;
  totalSpent: string;
  currency: string;
  lastTourDate: string | null;
  lastBookingAt: string | null;
};

export type PartnerCustomerListMeta = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type PartnerCustomerListResult = {
  items: PartnerCustomerListItem[];
  meta: PartnerCustomerListMeta;
};

export type PartnerCustomerDetail = {
  id: string;
  displayName: string;
  email: string;
  emailMasked: string;
  phone: string | null;
  phoneMasked: string | null;
  reservationCount: number;
  totalSpent: string;
  currency: string;
  tours: Array<{
    id: string;
    bookingNumber: string;
    title: string;
    status: string;
    paymentStatus: string;
    paymentMethod: string | null;
    totalAmount: string;
    currency: string;
    startDate: string | null;
    endDate: string | null;
    createdAt: string;
  }>;
  payments: Array<{
    id: string;
    bookingNumber: string;
    amount: string;
    currency: string;
    paymentStatus: string;
    paymentMethod: string | null;
    createdAt: string;
  }>;
};

export type PartnerCustomerListParams = {
  q?: string;
  page?: number;
  pageSize?: number;
};

function buildCustomerListQuery(params?: PartnerCustomerListParams): string {
  const sp = new URLSearchParams();
  if (params?.q?.trim()) sp.set('q', params.q.trim().slice(0, 80));
  if (params?.page && params.page > 1) sp.set('page', String(params.page));
  if (params?.pageSize) sp.set('pageSize', String(params.pageSize));
  const qs = sp.toString();
  return qs ? `?${qs}` : '';
}

export async function listPartnerCustomers(
  token: string,
  params?: PartnerCustomerListParams,
) {
  return apiRequest<PartnerCustomerListResult>(
    `/partner/customers${buildCustomerListQuery(params)}`,
    { token, cache: 'no-store' },
  );
}

export async function getPartnerCustomerDetail(
  token: string,
  customerKey: string,
) {
  return apiRequest<PartnerCustomerDetail>(
    `/partner/customers/${encodeURIComponent(customerKey)}`,
    { token, cache: 'no-store' },
  );
}
