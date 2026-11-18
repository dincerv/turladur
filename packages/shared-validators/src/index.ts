import { z } from 'zod';

/**
 * Shared Zod schemas. Domain schemas (booking, auth, tour, ...)
 * will be added in later sprints.
 */
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.string().optional(),
  order: z.enum(['asc', 'desc']).default('desc'),
});

export type PaginationInput = z.infer<typeof paginationSchema>;

export const bookingGuestSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  birthDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  identityNumber: z.string().min(5).max(20).optional(),
});

export const reservationExtraItemSchema = z.object({
  tourExtraId: z.string().min(1),
  quantity: z.number().int().min(1).max(50),
});

export const createPaidTourExtraSchema = z.object({
  title: z.string().trim().min(2).max(200),
  description: z.string().trim().max(2000).optional(),
  price: z.number().positive(),
  currency: z.string().trim().length(3).optional(),
  isRequired: z.boolean().optional(),
  isActive: z.boolean().optional(),
  dayNumber: z.number().int().min(0).optional(),
  sortOrder: z.number().int().min(0).optional(),
});

export const updatePaidTourExtraSchema = createPaidTourExtraSchema.partial();

export type CreatePaidTourExtraInput = z.infer<
  typeof createPaidTourExtraSchema
>;
export type UpdatePaidTourExtraInput = z.infer<
  typeof updatePaidTourExtraSchema
>;

export const createReservationSchema = z
  .object({
    tourDateId: z.string().min(1).optional(),
    roomId: z.string().min(1).optional(),
    hotelId: z.string().min(1).optional(),
    activityDateId: z.string().min(1).optional(),
    pickupPointId: z.string().min(1).optional(),
    startDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
    endDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
    adults: z.number().int().min(1).max(50),
    children: z.number().int().min(0).max(50).default(0),
    contactEmail: z.string().email(),
    contactPhone: z.string().min(7).max(20).optional(),
    guests: z.array(bookingGuestSchema).min(1),
    extras: z.array(reservationExtraItemSchema).max(50).optional(),
  })
  .superRefine((value, ctx) => {
    const productCount = [
      value.tourDateId,
      value.roomId,
      value.activityDateId,
    ].filter(Boolean).length;
    if (productCount !== 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          'Exactly one of tourDateId, roomId, or activityDateId is required',
      });
    }
    if (value.roomId && (!value.startDate || !value.endDate)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Hotel bookings require startDate and endDate',
        path: ['startDate'],
      });
    }
  });

export type CreateReservationInput = z.infer<typeof createReservationSchema>;

export const checkoutPaymentSchema = z.object({
  reservationId: z.string().min(1),
  cardHolderName: z.string().min(2).max(100),
  cardNumber: z.string().min(15).max(19),
  expireMonth: z.string().regex(/^(0[1-9]|1[0-2])$/),
  expireYear: z.string().regex(/^\d{2}$|^\d{4}$/),
  cvc: z.string().min(3).max(4),
});

export const createReviewSchema = z.object({
  reservationId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(3).max(2000).optional(),
  photoUrls: z.array(z.string().url()).max(5).optional(),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;

export const updateReviewSchema = z.object({
  rating: z.number().int().min(1).max(5).optional(),
  comment: z.string().min(3).max(2000).nullable().optional(),
  photoUrls: z.array(z.string().url()).max(5).optional(),
});

export type UpdateReviewInput = z.infer<typeof updateReviewSchema>;

export const createAgencySchema = z.object({
  name: z.string().min(2).max(200),
  description: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  website: z.string().url().optional(),
  logo: z.string().optional(),
  license: z.string().optional(),
});

export type CreateAgencyInput = z.infer<typeof createAgencySchema>;

export const createPostSchema = z.object({
  title: z.string().min(3).max(300),
  content: z.string().min(10),
  excerpt: z.string().optional(),
  coverImage: z.string().optional(),
  published: z.boolean().optional(),
  categoryIds: z.array(z.string().min(1)).max(10).optional(),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;

export const createCategorySchema = z.object({
  name: z.string().min(2).max(120),
  description: z.string().optional(),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;

export const createCommentSchema = z.object({
  content: z.string().min(2).max(2000),
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>;

/** Matches Nest `RegisterUserDto` / `ResetPasswordDto` password rule (ASCII A–Z + digit). */
const CUSTOMER_PASSWORD_ASCII_UPPERCASE = /[A-Z]/;
const CUSTOMER_PASSWORD_DIGIT = /\d/;

export const CUSTOMER_PASSWORD_MIN_LENGTH = 8;

export const CUSTOMER_PASSWORD_VALIDATION_MESSAGE =
  'Şifre en az 8 karakter, 1 büyük harf ve 1 rakam içermelidir.';

export const CUSTOMER_PASSWORD_HINT =
  'En az 8 karakter, 1 büyük harf (A–Z) ve 1 rakam.';

export function isValidCustomerPassword(password: string): boolean {
  return (
    password.length >= CUSTOMER_PASSWORD_MIN_LENGTH &&
    CUSTOMER_PASSWORD_ASCII_UPPERCASE.test(password) &&
    CUSTOMER_PASSWORD_DIGIT.test(password)
  );
}

export function getCustomerPasswordError(password: string): string | null {
  return isValidCustomerPassword(password)
    ? null
    : CUSTOMER_PASSWORD_VALIDATION_MESSAGE;
}

export const customerPasswordSchema = z
  .string()
  .min(CUSTOMER_PASSWORD_MIN_LENGTH)
  .regex(/^(?=.*[A-Z])(?=.*\d).+$/, {
    message: 'Şifre en az 1 büyük harf ve 1 rakam içermelidir',
  });

/** Public contact form subjects — keep in sync with Nest ContactDto. */
export const CONTACT_SUBJECTS = [
  'reservation',
  'cancellation',
  'support',
  'partnership',
  'other',
] as const;

export type ContactSubject = (typeof CONTACT_SUBJECTS)[number];

export const CONTACT_SUBJECT_LABELS: Record<ContactSubject, string> = {
  reservation: 'Rezervasyon',
  cancellation: 'İptal & İade',
  support: 'Teknik Destek',
  partnership: 'İş Ortaklığı',
  other: 'Diğer',
};

/** Strip HTML tags and control characters from free-text form fields. */
export function sanitizeContactPlainText(value: string): string {
  return value
    .replace(/<[^>]*>/g, ' ')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export const contactMessageSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Ad soyad en az 2 karakter olmalı')
    .max(100, 'Ad soyad en fazla 100 karakter olabilir'),
  email: z
    .string()
    .trim()
    .email('Geçerli bir e-posta adresi girin')
    .max(254, 'E-posta çok uzun'),
  phone: z
    .string()
    .trim()
    .max(30, 'Telefon numarası çok uzun')
    .optional()
    .or(z.literal('')),
  subject: z.enum(CONTACT_SUBJECTS, {
    errorMap: () => ({ message: 'Lütfen bir konu seçin' }),
  }),
  message: z
    .string()
    .trim()
    .min(10, 'Mesaj en az 10 karakter olmalı')
    .max(4000, 'Mesaj en fazla 4000 karakter olabilir'),
  privacy: z.literal(true, {
    errorMap: () => ({ message: 'Aydınlatma metnini kabul etmelisiniz' }),
  }),
});

export type ContactMessageFormValues = z.infer<typeof contactMessageSchema>;

/** Public tour compare — max 4 ids, DoS / UI matrix guard. */
export const COMPARE_TOURS_MAX = 4;

export const compareToursRequestSchema = z.object({
  ids: z
    .array(z.string().trim().min(1).max(64))
    .min(1, 'En az 1 tur seçilmelidir')
    .max(COMPARE_TOURS_MAX, `En fazla ${COMPARE_TOURS_MAX} tur kıyaslanabilir`)
    .superRefine((ids, ctx) => {
      if (new Set(ids).size !== ids.length) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Tekrarlayan tur kimlikleri gönderilemez',
        });
      }
    }),
});

export type CompareToursRequest = z.infer<typeof compareToursRequestSchema>;

export function parseCompareToursRequest(input: unknown): CompareToursRequest {
  return compareToursRequestSchema.parse(input);
}

/** AI conversational search prompt — length + injection surface guard. */
export const AI_SEARCH_PROMPT_MAX = 500;
export const AI_SEARCH_PROMPT_MIN = 3;

export const aiSearchPromptSchema = z.object({
  prompt: z
    .string()
    .trim()
    .min(AI_SEARCH_PROMPT_MIN, 'Lütfen biraz daha detay yazın')
    .max(
      AI_SEARCH_PROMPT_MAX,
      `En fazla ${AI_SEARCH_PROMPT_MAX} karakter yazabilirsiniz`,
    )
    .refine((value) => !/<script|javascript:|on\w+=/i.test(value), {
      message: 'Geçersiz arama metni',
    }),
});

export type AiSearchPromptInput = z.infer<typeof aiSearchPromptSchema>;

export function parseAiSearchPrompt(input: unknown): AiSearchPromptInput {
  return aiSearchPromptSchema.parse(input);
}

export function sanitizeAiSearchPrompt(raw: string): string {
  return raw
    .replace(/<[^>]*>/g, ' ')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, AI_SEARCH_PROMPT_MAX);
}

export const TRAVELER_PERSONAS = [
  'PARTY',
  'CALM',
  'FAMILY',
  'BUDGET',
  'ADVENTURE',
  'CULTURE',
] as const;

export const personaMatchRequestSchema = z.object({
  persona: z.enum(TRAVELER_PERSONAS),
  intent: z
    .string()
    .trim()
    .max(300, 'Tercih metni en fazla 300 karakter olabilir')
    .optional()
    .or(z.literal('')),
});

export type PersonaMatchRequest = z.infer<typeof personaMatchRequestSchema>;

export function parsePersonaMatchRequest(input: unknown): PersonaMatchRequest {
  return personaMatchRequestSchema.parse(input);
}

/** Tour date assignment invites — GUIDE / BUS */
export const ASSIGNMENT_ROLES = ['GUIDE', 'BUS'] as const;
export type AssignmentRole = (typeof ASSIGNMENT_ROLES)[number];

export const inviteGuideAssignmentSchema = z.object({
  guideId: z.string().min(1, 'Rehber ID gerekli'),
  note: z.string().max(2000).optional(),
});

export const inviteBusAssignmentSchema = z.object({
  busCompanyId: z.string().min(1, 'Otobüs firması ID gerekli'),
  note: z.string().max(2000).optional(),
});

export const createAssignmentInviteSchema = z.discriminatedUnion('role', [
  z.object({
    role: z.literal('GUIDE'),
    tourDateId: z.string().min(1, 'Tur tarih ID gerekli'),
    guideId: z.string().min(1, 'Rehber ID gerekli'),
    note: z.string().max(2000).optional(),
  }),
  z.object({
    role: z.literal('BUS'),
    tourDateId: z.string().min(1, 'Tur tarih ID gerekli'),
    busCompanyId: z.string().min(1, 'Otobüs firması ID gerekli'),
    note: z.string().max(2000).optional(),
  }),
]);

export type InviteGuideAssignmentInput = z.infer<
  typeof inviteGuideAssignmentSchema
>;
export type InviteBusAssignmentInput = z.infer<
  typeof inviteBusAssignmentSchema
>;
export type CreateAssignmentInviteInput = z.infer<
  typeof createAssignmentInviteSchema
>;

export function parseInviteGuideAssignment(
  input: unknown,
): InviteGuideAssignmentInput {
  return inviteGuideAssignmentSchema.parse(input);
}

export function parseInviteBusAssignment(
  input: unknown,
): InviteBusAssignmentInput {
  return inviteBusAssignmentSchema.parse(input);
}

export function parseCreateAssignmentInvite(
  input: unknown,
): CreateAssignmentInviteInput {
  return createAssignmentInviteSchema.parse(input);
}

/** Agency CRM — customer list query (?q=&page=&pageSize=) */
export const AGENCY_CUSTOMERS_Q_MAX = 80;
export const AGENCY_CUSTOMERS_PAGE_SIZE_MAX = 50;

export const agencyCustomersQuerySchema = z.object({
  q: z
    .string()
    .trim()
    .max(AGENCY_CUSTOMERS_Q_MAX)
    .optional()
    .default('')
    .transform((v) => v.replace(/[\u0000-\u001F\u007F]/g, '')),
  page: z.coerce.number().int().min(1).max(10_000).optional().default(1),
  pageSize: z.coerce
    .number()
    .int()
    .min(1)
    .max(AGENCY_CUSTOMERS_PAGE_SIZE_MAX)
    .optional()
    .default(20),
});

export type AgencyCustomersQuery = z.infer<typeof agencyCustomersQuerySchema>;

export function parseAgencyCustomersQuery(
  input: unknown,
): AgencyCustomersQuery {
  return agencyCustomersQuerySchema.parse(input);
}

/** Agency reviews — list filters (?q=&rating=&tourId=&page=) */
export const AGENCY_REVIEWS_Q_MAX = 80;
export const AGENCY_REVIEWS_PAGE_SIZE_MAX = 50;
export const AGENCY_REVIEW_RESPONSE_STATUSES = [
  'all',
  'responded',
  'pending',
] as const;
export const AGENCY_REVIEW_SORTS = [
  'newest',
  'oldest',
  'highest',
  'lowest',
] as const;

export const agencyReviewsQuerySchema = z.object({
  q: z
    .string()
    .trim()
    .max(AGENCY_REVIEWS_Q_MAX)
    .optional()
    .default('')
    .transform((v) => v.replace(/[\u0000-\u001F\u007F]/g, '')),
  rating: z.coerce.number().int().min(1).max(5).optional(),
  tourId: z
    .string()
    .trim()
    .max(64)
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined)),
  responseStatus: z
    .enum(AGENCY_REVIEW_RESPONSE_STATUSES)
    .optional()
    .default('all'),
  sort: z.enum(AGENCY_REVIEW_SORTS).optional().default('newest'),
  page: z.coerce.number().int().min(1).max(10_000).optional().default(1),
  pageSize: z.coerce
    .number()
    .int()
    .min(1)
    .max(AGENCY_REVIEWS_PAGE_SIZE_MAX)
    .optional()
    .default(20),
});

export type AgencyReviewsQuery = z.infer<typeof agencyReviewsQuerySchema>;

export function parseAgencyReviewsQuery(input: unknown): AgencyReviewsQuery {
  return agencyReviewsQuerySchema.parse(input);
}

export const agencyReviewReplySchema = z.object({
  reply: z.string().trim().min(2, 'Yanıt en az 2 karakter olmalı').max(2000),
});

export type AgencyReviewReplyInput = z.infer<typeof agencyReviewReplySchema>;

export function parseAgencyReviewReply(input: unknown): AgencyReviewReplyInput {
  return agencyReviewReplySchema.parse(input);
}

/** Agency settings tabs — profile / security / notifications / company */
export const AGENCY_SETTINGS_TABS = [
  'profile',
  'security',
  'notifications',
  'company',
] as const;
export type AgencySettingsTab = (typeof AGENCY_SETTINGS_TABS)[number];

export const agencySettingsTabSchema = z.enum(AGENCY_SETTINGS_TABS);

export function parseAgencySettingsTab(input: unknown): AgencySettingsTab {
  const parsed = agencySettingsTabSchema.safeParse(input);
  return parsed.success ? parsed.data : 'profile';
}

export const agencySettingsProfileSchema = z.object({
  name: z.string().trim().min(2, 'Ad en az 2 karakter olmalı').max(200),
});

export type AgencySettingsProfileInput = z.infer<
  typeof agencySettingsProfileSchema
>;

export function parseAgencySettingsProfile(
  input: unknown,
): AgencySettingsProfileInput {
  return agencySettingsProfileSchema.parse(input);
}

const settingsPasswordStrength = z
  .string()
  .min(8, 'Şifre en az 8 karakter olmalı')
  .max(128)
  .regex(/[A-Z]/, 'Şifrede en az 1 büyük harf olmalı')
  .regex(/\d/, 'Şifrede en az 1 rakam olmalı');

export const agencySettingsPasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Mevcut şifre gerekli'),
    newPassword: settingsPasswordStrength,
    confirmPassword: z.string().min(1, 'Şifre tekrarı gerekli'),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    message: 'Yeni şifreler eşleşmiyor',
    path: ['confirmPassword'],
  })
  .refine((v) => v.currentPassword !== v.newPassword, {
    message: 'Yeni şifre mevcut şifre ile aynı olamaz',
    path: ['newPassword'],
  });

export type AgencySettingsPasswordInput = z.infer<
  typeof agencySettingsPasswordSchema
>;

export function parseAgencySettingsPassword(
  input: unknown,
): AgencySettingsPasswordInput {
  return agencySettingsPasswordSchema.parse(input);
}

export const agencySettingsNotificationsSchema = z.object({
  emailReservations: z.boolean(),
  emailReviews: z.boolean(),
  emailMarketing: z.boolean(),
  emailFinancials: z.boolean(),
  pushEnabled: z.boolean(),
});

export type AgencySettingsNotificationsInput = z.infer<
  typeof agencySettingsNotificationsSchema
>;

export function parseAgencySettingsNotifications(
  input: unknown,
): AgencySettingsNotificationsInput {
  return agencySettingsNotificationsSchema.parse(input);
}

export const DEFAULT_AGENCY_NOTIFICATIONS: AgencySettingsNotificationsInput = {
  emailReservations: true,
  emailReviews: true,
  emailMarketing: false,
  emailFinancials: true,
  pushEnabled: true,
};

const optionalUrl = z
  .union([z.string().trim().url().max(200), z.literal('')])
  .optional()
  .nullable()
  .transform((v) => (v && v.length > 0 ? v : null));

export const agencySettingsCompanySchema = z.object({
  companyName: z.string().trim().min(2).max(200),
  legalTitle: z.string().trim().min(2).max(200),
  taxNumber: z
    .string()
    .trim()
    .regex(/^\d{10,11}$/, 'Vergi numarası 10 veya 11 haneli olmalıdır'),
  contactEmail: z.string().trim().email().max(200),
  contactPhone: z
    .string()
    .trim()
    .max(40)
    .optional()
    .nullable()
    .transform((v) => (v && v.length > 0 ? v : null)),
  address: z.string().trim().min(5).max(500),
  city: z
    .string()
    .trim()
    .max(80)
    .optional()
    .nullable()
    .transform((v) => (v && v.length > 0 ? v : null)),
  country: z
    .string()
    .trim()
    .max(80)
    .optional()
    .nullable()
    .transform((v) => (v && v.length > 0 ? v : null)),
  website: optionalUrl,
  logo: z
    .string()
    .trim()
    .max(500)
    .optional()
    .nullable()
    .transform((v) => (v && v.length > 0 ? v : null)),
});

export type AgencySettingsCompanyInput = z.infer<
  typeof agencySettingsCompanySchema
>;

export function parseAgencySettingsCompany(
  input: unknown,
): AgencySettingsCompanyInput {
  return agencySettingsCompanySchema.parse(input);
}

/** Agency help — support tickets */
export const SUPPORT_TICKET_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH'] as const;
export type SupportTicketPriority = (typeof SUPPORT_TICKET_PRIORITIES)[number];

export const SUPPORT_TICKET_STATUSES = ['OPEN', 'ANSWERED', 'CLOSED'] as const;
export type SupportTicketStatus = (typeof SUPPORT_TICKET_STATUSES)[number];

export const SUPPORT_TICKET_CATEGORIES = [
  'RESERVATIONS',
  'PAYMENTS',
  'ASSIGNMENTS',
  'ACCOUNT',
  'OTHER',
] as const;
export type SupportTicketCategory = (typeof SUPPORT_TICKET_CATEGORIES)[number];

export const agencySupportTicketCreateSchema = z.object({
  subject: z
    .string()
    .trim()
    .min(5, 'Konu en az 5 karakter olmalı')
    .max(200)
    .transform((v) => sanitizeContactPlainText(v)),
  message: z
    .string()
    .trim()
    .min(20, 'Mesaj en az 20 karakter olmalı')
    .max(4000)
    .transform((v) => sanitizeContactPlainText(v)),
  priority: z.enum(SUPPORT_TICKET_PRIORITIES).default('MEDIUM'),
  category: z.enum(SUPPORT_TICKET_CATEGORIES).optional().default('OTHER'),
});

export type AgencySupportTicketCreateInput = z.infer<
  typeof agencySupportTicketCreateSchema
>;

export function parseAgencySupportTicketCreate(
  input: unknown,
): AgencySupportTicketCreateInput {
  return agencySupportTicketCreateSchema.parse(input);
}

export const agencySupportTicketsQuerySchema = z.object({
  status: z.enum(SUPPORT_TICKET_STATUSES).optional(),
  page: z.coerce.number().int().min(1).max(10_000).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(50).optional().default(20),
});

export type AgencySupportTicketsQuery = z.infer<
  typeof agencySupportTicketsQuerySchema
>;

export function parseAgencySupportTicketsQuery(
  input: unknown,
): AgencySupportTicketsQuery {
  return agencySupportTicketsQuerySchema.parse(input);
}

/** Agency reservations — list filters (?q=&status=&page=) */
export const AGENCY_RESERVATIONS_Q_MAX = 80;
export const AGENCY_RESERVATIONS_PAGE_SIZE_MAX = 50;

export const AGENCY_RESERVATION_STATUS_FILTERS = [
  'PENDING',
  'CONFIRMED',
  'COMPLETED',
  'CANCELLED',
  'SUSPENDED',
  'PENDING_PAYMENT',
  'PAYMENT_FAILED',
] as const;
export type AgencyReservationStatusFilter =
  (typeof AGENCY_RESERVATION_STATUS_FILTERS)[number];

export const AGENCY_RESERVATION_STATUS_ACTIONS = [
  'CONFIRMED',
  'CANCELLED',
  'COMPLETED',
  'SUSPENDED',
] as const;
export type AgencyReservationStatusAction =
  (typeof AGENCY_RESERVATION_STATUS_ACTIONS)[number];

const isoDateOptional = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Tarih YYYY-MM-DD olmalı')
  .optional()
  .or(z.literal(''))
  .transform((v) => (v && v.length > 0 ? v : undefined));

export const agencyReservationsQuerySchema = z
  .object({
    q: z
      .string()
      .trim()
      .max(AGENCY_RESERVATIONS_Q_MAX)
      .optional()
      .default('')
      .transform((v) => v.replace(/[\u0000-\u001F\u007F]/g, '')),
    status: z.enum(AGENCY_RESERVATION_STATUS_FILTERS).optional(),
    dateFrom: isoDateOptional,
    dateTo: isoDateOptional,
    page: z.coerce.number().int().min(1).max(10_000).optional().default(1),
    pageSize: z.coerce
      .number()
      .int()
      .min(1)
      .max(AGENCY_RESERVATIONS_PAGE_SIZE_MAX)
      .optional()
      .default(20),
  })
  .superRefine((val, ctx) => {
    if (val.dateFrom && val.dateTo && val.dateFrom > val.dateTo) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'dateFrom dateTo sonrası olamaz',
        path: ['dateFrom'],
      });
    }
  });

export type AgencyReservationsQuery = z.infer<
  typeof agencyReservationsQuerySchema
>;

export function parseAgencyReservationsQuery(
  input: unknown,
): AgencyReservationsQuery {
  return agencyReservationsQuerySchema.parse(input);
}

export const agencyReservationStatusUpdateSchema = z
  .object({
    status: z.enum(AGENCY_RESERVATION_STATUS_ACTIONS).optional(),
    seatNumbers: z.string().trim().max(100).optional(),
  })
  .refine((v) => v.status !== undefined || v.seatNumbers !== undefined, {
    message: 'status veya seatNumbers gerekli',
  });

export type AgencyReservationStatusUpdate = z.infer<
  typeof agencyReservationStatusUpdateSchema
>;

export function parseAgencyReservationStatusUpdate(
  input: unknown,
): AgencyReservationStatusUpdate {
  return agencyReservationStatusUpdateSchema.parse(input);
}

/** Agency tours — list filters (?q=&status=&category=&page=) */
export const AGENCY_TOURS_Q_MAX = 80;
export const AGENCY_TOURS_PAGE_SIZE_MAX = 50;

export const AGENCY_TOUR_STATUS_FILTERS = [
  'DRAFT',
  'PENDING_REVIEW',
  'PUBLISHED',
  'ARCHIVED',
] as const;
export type AgencyTourStatusFilter =
  (typeof AGENCY_TOUR_STATUS_FILTERS)[number];

export const AGENCY_TOUR_CATEGORIES = [
  'CULTURAL',
  'ADVENTURE',
  'GASTRONOMY',
  'NATURE',
  'CITY',
  'BEACH',
] as const;
export type AgencyTourCategory = (typeof AGENCY_TOUR_CATEGORIES)[number];

export const agencyToursQuerySchema = z.object({
  q: z
    .string()
    .trim()
    .max(AGENCY_TOURS_Q_MAX)
    .optional()
    .default('')
    .transform((v) => v.replace(/[\u0000-\u001F\u007F]/g, '')),
  status: z.enum(AGENCY_TOUR_STATUS_FILTERS).optional(),
  category: z.enum(AGENCY_TOUR_CATEGORIES).optional(),
  page: z.coerce.number().int().min(1).max(10_000).optional().default(1),
  pageSize: z.coerce
    .number()
    .int()
    .min(1)
    .max(AGENCY_TOURS_PAGE_SIZE_MAX)
    .optional()
    .default(12),
  view: z.enum(['grid', 'list']).optional().default('list'),
});

export type AgencyToursQuery = z.infer<typeof agencyToursQuerySchema>;

export function parseAgencyToursQuery(input: unknown): AgencyToursQuery {
  return agencyToursQuerySchema.parse(input);
}

export const agencyTourStatusToggleSchema = z.object({
  status: z.enum(['PUBLISHED', 'ARCHIVED']),
});

export type AgencyTourStatusToggle = z.infer<
  typeof agencyTourStatusToggleSchema
>;

export function parseAgencyTourStatusToggle(
  input: unknown,
): AgencyTourStatusToggle {
  return agencyTourStatusToggleSchema.parse(input);
}

/** Agency tour create — API body (JWT binds agencyId; never accept client agencyId). */
const agencyTourCreateDateSchema = z
  .object({
    startDate: z
      .string()
      .trim()
      .regex(/^\d{4}-\d{2}-\d{2}/, 'Geçersiz başlangıç tarihi'),
    endDate: z
      .string()
      .trim()
      .regex(/^\d{4}-\d{2}-\d{2}/, 'Geçersiz bitiş tarihi'),
    capacity: z.coerce.number().int().min(1).max(500),
    priceOverride: z.coerce.number().finite().min(0).max(1_000_000).optional(),
    ageRanges: z
      .array(
        z.object({
          minAge: z.coerce.number().int().min(0).max(120),
          maxAge: z.coerce.number().int().min(0).max(120).nullable().optional(),
          pricingType: z.enum(['FREE', 'HALF', 'PERCENTAGE', 'FIXED']),
          value: z.coerce.number().finite().min(0).max(1_000_000),
        }),
      )
      .max(20)
      .optional()
      .default([]),
  })
  .superRefine((date, ctx) => {
    const start = date.startDate.slice(0, 10);
    const end = date.endDate.slice(0, 10);
    if (end < start) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['endDate'],
        message: 'Bitiş tarihi başlangıçtan önce olamaz',
      });
    }
  });

export const agencyTourCreateSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(3, 'Tur başlığı en az 3 karakter')
      .max(200)
      .transform((v) => v.replace(/[\u0000-\u001F\u007F]/g, '')),
    description: z
      .string()
      .trim()
      .min(10, 'Açıklama en az 10 karakter')
      .max(20_000)
      .transform((v) => v.replace(/[\u0000-\u001F\u007F]/g, '')),
    price: z.coerce.number().finite().min(0).max(1_000_000),
    currency: z.string().trim().length(3).optional().default('TRY'),
    category: z.enum(AGENCY_TOUR_CATEGORIES),
    durationDays: z.coerce.number().int().min(1).max(60).optional().default(1),
    stayKind: z.enum(['DAY_TRIP', 'OVERNIGHT']).optional().default('OVERNIGHT'),
    destinationScope: z
      .enum(['DOMESTIC', 'INTERNATIONAL'])
      .optional()
      .default('DOMESTIC'),
    departureCities: z
      .array(
        z
          .string()
          .trim()
          .min(1)
          .max(80)
          .transform((v) => v.replace(/[\u0000-\u001F\u007F]/g, '')),
      )
      .max(20)
      .optional()
      .default([]),
    coverUrl: z
      .union([
        z
          .string()
          .trim()
          .min(1)
          .max(2000)
          .refine(
            (v) =>
              v.startsWith('/') ||
              v.startsWith('http://') ||
              v.startsWith('https://'),
            'Geçersiz kapak URL',
          ),
        z.literal(''),
        z.null(),
      ])
      .optional()
      .transform((v) => (v ? v : undefined)),
    galleryUrls: z
      .array(
        z
          .string()
          .trim()
          .min(1)
          .max(2000)
          .refine(
            (v) =>
              v.startsWith('/') ||
              v.startsWith('http://') ||
              v.startsWith('https://'),
            'Geçersiz galeri URL',
          ),
      )
      .max(20)
      .optional()
      .default([]),
    extras: z.record(z.unknown()).optional(),
    asDraft: z.boolean().optional().default(false),
    dates: z.array(agencyTourCreateDateSchema).max(50).optional().default([]),
    pickupPoints: z
      .array(
        z.object({
          city: z.string().trim().min(2).max(100),
          location: z.string().trim().min(2).max(200),
          time: z.string().trim().min(4).max(20),
          description: z.string().trim().max(500).optional(),
          latitude: z.number().finite().nullable().optional(),
          longitude: z.number().finite().nullable().optional(),
          order: z.coerce.number().int().min(0).optional(),
        }),
      )
      .max(50)
      .optional()
      .default([]),
    accommodation: z
      .object({
        name: z.string().trim().min(2).max(200),
        image: z.string().trim().min(1).max(2000),
        location: z.string().trim().min(2).max(120),
        type: z.string().trim().min(2).max(80),
      })
      .optional(),
  })
  .superRefine((data, ctx) => {
    // İncelemeye giden turlar rezervasyon için en az 1 pickup ister.
    if (!data.asDraft && data.pickupPoints.length < 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['pickupPoints'],
        message: 'En az bir kalkış noktası gerekli',
      });
    }
  });

export type AgencyTourCreateInput = z.infer<typeof agencyTourCreateSchema>;

export function parseAgencyTourCreate(input: unknown): AgencyTourCreateInput {
  return agencyTourCreateSchema.parse(input);
}

export function maskEmail(email: string): string {
  const trimmed = email.trim();
  const at = trimmed.indexOf('@');
  if (at <= 0) return '***';
  const local = trimmed.slice(0, at);
  const domain = trimmed.slice(at + 1);
  const visible = local.slice(0, Math.min(1, local.length));
  return `${visible}***@${domain}`;
}

export function maskPhone(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 4) return '***';
  return `${digits.slice(0, 2)}** *** **${digits.slice(-2)}`;
}

/** Browser + Node isomorphic (btoa/atob; no Buffer → no @types/node). */
function toBase64Url(utf8: string): string {
  const bytes = new TextEncoder().encode(utf8);
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function fromBase64Url(key: string): string {
  const padded =
    key.replace(/-/g, '+').replace(/_/g, '/') +
    '='.repeat((4 - (key.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export function encodeCustomerKey(email: string): string {
  return toBase64Url(email.trim().toLowerCase());
}

/** Agency financials — ledger filters */
export const FINANCIAL_PAYMENT_STATUSES = [
  'PAID',
  'PENDING',
  'OVERDUE',
  'REFUNDED',
] as const;
export type FinancialPaymentStatus =
  (typeof FINANCIAL_PAYMENT_STATUSES)[number];

export const AGENCY_FINANCIALS_Q_MAX = 80;
export const AGENCY_FINANCIALS_PAGE_SIZE_MAX = 50;
export const FINANCIAL_OVERDUE_DAYS = 30;

const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Tarih YYYY-MM-DD olmalı');

export const agencyFinancialsQuerySchema = z
  .object({
    startDate: isoDateSchema.optional(),
    endDate: isoDateSchema.optional(),
    status: z.enum(FINANCIAL_PAYMENT_STATUSES).optional(),
    q: z
      .string()
      .trim()
      .max(AGENCY_FINANCIALS_Q_MAX)
      .optional()
      .default('')
      .transform((v) => v.replace(/[\u0000-\u001F\u007F]/g, '')),
    page: z.coerce.number().int().min(1).max(10_000).optional().default(1),
    pageSize: z.coerce
      .number()
      .int()
      .min(1)
      .max(AGENCY_FINANCIALS_PAGE_SIZE_MAX)
      .optional()
      .default(20),
    format: z.enum(['csv', 'pdf']).optional(),
  })
  .superRefine((val, ctx) => {
    if (val.startDate && val.endDate && val.startDate > val.endDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'startDate endDate sonrası olamaz',
        path: ['startDate'],
      });
    }
  });

export type AgencyFinancialsQuery = z.infer<typeof agencyFinancialsQuerySchema>;

export function parseAgencyFinancialsQuery(
  input: unknown,
): AgencyFinancialsQuery {
  return agencyFinancialsQuerySchema.parse(input);
}

/** Agency bank account + payout request */
export const TR_IBAN_REGEX = /^TR[0-9]{24}$/;

export function normalizeIban(raw: string): string {
  return raw.replace(/\s+/g, '').toUpperCase();
}

export const agencyBankAccountCreateSchema = z.object({
  iban: z
    .string()
    .trim()
    .min(15)
    .max(34)
    .transform(normalizeIban)
    .refine((v) => TR_IBAN_REGEX.test(v), {
      message: 'IBAN TR ile başlamalı ve 26 karakter olmalı',
    }),
  accountName: z
    .string()
    .trim()
    .min(2, 'Hesap sahibi gerekli')
    .max(200)
    .transform((v) => v.replace(/[\u0000-\u001F\u007F]/g, '')),
  bankName: z
    .string()
    .trim()
    .max(120)
    .optional()
    .or(z.literal(''))
    .transform((v) =>
      v ? v.replace(/[\u0000-\u001F\u007F]/g, '') : undefined,
    ),
  isDefault: z.boolean().optional().default(false),
});

export type AgencyBankAccountCreate = z.infer<
  typeof agencyBankAccountCreateSchema
>;

export function parseAgencyBankAccountCreate(
  input: unknown,
): AgencyBankAccountCreate {
  return agencyBankAccountCreateSchema.parse(input);
}

export const AGENCY_PAYOUT_STATUSES = [
  'PENDING',
  'APPROVED',
  'REJECTED',
  'COMPLETED',
  'PAID',
  'FAILED',
] as const;
export type AgencyPayoutStatus = (typeof AGENCY_PAYOUT_STATUSES)[number];

export const agencyPayoutRequestSchema = z.object({
  amount: z.coerce
    .number()
    .finite()
    .min(1, 'Tutar en az 1 TL olmalı')
    .max(10_000_000, 'Tutar üst sınırı aşıldı'),
  bankInfoId: z.string().trim().min(1, 'Banka hesabı gerekli').max(64),
  note: z
    .string()
    .trim()
    .max(500)
    .optional()
    .or(z.literal(''))
    .transform((v) =>
      v ? v.replace(/[\u0000-\u001F\u007F]/g, '') : undefined,
    ),
});

export type AgencyPayoutRequest = z.infer<typeof agencyPayoutRequestSchema>;

export function parseAgencyPayoutRequest(input: unknown): AgencyPayoutRequest {
  return agencyPayoutRequestSchema.parse(input);
}

/** Agency reports — period + date range query */
export const REPORT_DATE_RANGE_IDS = [
  'today',
  'yesterday',
  'thisWeek',
  'lastWeek',
  'thisMonth',
  'lastMonth',
  'last3Months',
  'lastYear',
  'thisYear',
  'custom',
] as const;

export const agencyReportsQuerySchema = z
  .object({
    period: z.enum(['monthly', 'yearly']).optional(),
    dateRange: z.enum(REPORT_DATE_RANGE_IDS).optional(),
    startDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Tarih YYYY-MM-DD olmalı')
      .optional(),
    endDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Tarih YYYY-MM-DD olmalı')
      .optional(),
  })
  .superRefine((val, ctx) => {
    if (val.startDate && val.endDate && val.startDate > val.endDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'startDate endDate sonrası olamaz',
        path: ['startDate'],
      });
    }
  });

export type AgencyReportsQuery = z.infer<typeof agencyReportsQuerySchema>;

export function parseAgencyReportsQuery(input: unknown): AgencyReportsQuery {
  return agencyReportsQuerySchema.parse(input);
}

export const agencySalesGoalUpsertSchema = z.object({
  period: z.enum(['monthly', 'yearly']),
  metric: z.enum(['reservations', 'revenue', 'occupancy', 'completion']),
  targetValue: z.coerce.number().positive().max(1_000_000_000),
  year: z.coerce.number().int().min(2020).max(2100),
  month: z.coerce.number().int().min(1).max(12).optional().nullable(),
});

export type AgencySalesGoalUpsert = z.infer<typeof agencySalesGoalUpsertSchema>;

export function parseAgencySalesGoalUpsert(
  input: unknown,
): AgencySalesGoalUpsert {
  return agencySalesGoalUpsertSchema.parse(input);
}

/** Agency staff / users management (UI roles → DB AgencyStaffRole) */
export const AGENCY_STAFF_UI_ROLES = ['OWNER', 'MANAGER', 'AGENT'] as const;
export type AgencyStaffUiRole = (typeof AGENCY_STAFF_UI_ROLES)[number];

export const AGENCY_STAFF_STATUSES = ['ACTIVE', 'INACTIVE'] as const;
export type AgencyStaffStatus = (typeof AGENCY_STAFF_STATUSES)[number];

export function mapUiRoleToAgencyStaffRole(
  role: string,
): 'AGENCY_OWNER' | 'AGENCY_ADMIN' | 'AGENCY_STAFF' {
  const normalized = role.trim().toUpperCase();
  if (normalized === 'OWNER' || normalized === 'AGENCY_OWNER') {
    return 'AGENCY_OWNER';
  }
  if (
    normalized === 'MANAGER' ||
    normalized === 'AGENCY_ADMIN' ||
    normalized === 'ADMIN'
  ) {
    return 'AGENCY_ADMIN';
  }
  return 'AGENCY_STAFF';
}

export function mapAgencyStaffRoleToUi(role: string): AgencyStaffUiRole {
  if (role === 'AGENCY_OWNER') return 'OWNER';
  if (role === 'AGENCY_ADMIN') return 'MANAGER';
  return 'AGENT';
}

const agencyStaffPasswordSchema = z
  .string()
  .min(8, 'Şifre en az 8 karakter olmalı')
  .max(128)
  .regex(/[A-Z]/, 'Şifrede en az 1 büyük harf olmalı')
  .regex(/\d/, 'Şifrede en az 1 rakam olmalı');

export const STAFF_PERMISSION_MODULE_KEYS = [
  'tours',
  'reservations',
  'customers',
  'reports',
  'financials',
  'settings',
] as const;

export const staffModuleAccessSchema = z.object({
  read: z.boolean(),
  write: z.boolean(),
});

export const staffPermissionsSchema = z
  .record(z.string(), staffModuleAccessSchema)
  .optional();

export type StaffModuleAccessInput = z.infer<typeof staffModuleAccessSchema>;
export type StaffPermissionsInput = z.infer<typeof staffPermissionsSchema>;

/** Normalize any stored permission value → { read, write }. */
export function normalizeStaffModuleAccess(value: unknown): {
  read: boolean;
  write: boolean;
} {
  if (value === true) return { read: true, write: true };
  if (value === false || value == null) return { read: false, write: false };
  if (Array.isArray(value)) {
    const set = new Set(value.map((v) => String(v).toLowerCase()));
    const write = set.has('write');
    const read = write || set.has('read');
    return { read, write };
  }
  if (typeof value === 'object') {
    const row = value as Record<string, unknown>;
    const write = Boolean(row.write);
    const read = Boolean(row.read) || write;
    return { read, write };
  }
  return { read: false, write: false };
}

export function hasStaffModuleAccess(
  permissions: unknown,
  key: string,
  mode: 'read' | 'write' | 'any' = 'any',
): boolean {
  if (
    !permissions ||
    typeof permissions !== 'object' ||
    Array.isArray(permissions)
  ) {
    return false;
  }
  const access = normalizeStaffModuleAccess(
    (permissions as Record<string, unknown>)[key],
  );
  if (mode === 'write') return access.write;
  if (mode === 'read') return access.read;
  return access.read || access.write;
}

export const createAgencyStaffSchema = z.object({
  name: z.string().trim().min(2).max(200),
  email: z.string().trim().email().max(200),
  password: agencyStaffPasswordSchema,
  role: z.enum(AGENCY_STAFF_UI_ROLES).default('AGENT'),
  status: z.enum(AGENCY_STAFF_STATUSES).optional().default('ACTIVE'),
  permissions: staffPermissionsSchema,
});

export const updateAgencyStaffSchema = z
  .object({
    name: z.string().trim().min(2).max(200).optional(),
    role: z.enum(AGENCY_STAFF_UI_ROLES).optional(),
    status: z.enum(AGENCY_STAFF_STATUSES).optional(),
    password: agencyStaffPasswordSchema.optional(),
    permissions: staffPermissionsSchema,
  })
  .refine(
    (v) =>
      v.name !== undefined ||
      v.role !== undefined ||
      v.status !== undefined ||
      v.password !== undefined ||
      v.permissions !== undefined,
    { message: 'Güncellenecek alan gerekli' },
  );

export type CreateAgencyStaffInput = z.infer<typeof createAgencyStaffSchema>;
export type UpdateAgencyStaffInput = z.infer<typeof updateAgencyStaffSchema>;

export function parseCreateAgencyStaff(input: unknown): CreateAgencyStaffInput {
  return createAgencyStaffSchema.parse(input);
}

export function parseUpdateAgencyStaff(input: unknown): UpdateAgencyStaffInput {
  return updateAgencyStaffSchema.parse(input);
}

export function decodeCustomerKey(key: string): string {
  const decoded = fromBase64Url(key).trim();
  if (!decoded || !decoded.includes('@')) {
    throw new Error('Invalid customer key');
  }
  return decoded.toLowerCase();
}

export type ContactMessagePayload = {
  name: string;
  email: string;
  phone?: string;
  subject: ContactSubject;
  message: string;
  /** Honeypot — always empty for humans. */
  website?: string;
};

export function toContactMessagePayload(
  values: ContactMessageFormValues,
  honeypot = '',
): ContactMessagePayload {
  const phone = sanitizeContactPlainText(values.phone ?? '');
  return {
    name: sanitizeContactPlainText(values.name),
    email: values.email.trim().toLowerCase(),
    phone: phone || undefined,
    subject: values.subject,
    message: sanitizeContactPlainText(values.message),
    website: honeypot,
  };
}
