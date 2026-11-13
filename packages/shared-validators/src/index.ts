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

export const createReservationSchema = z
  .object({
    tourDateId: z.string().min(1).optional(),
    roomId: z.string().min(1).optional(),
    hotelId: z.string().min(1).optional(),
    activityDateId: z.string().min(1).optional(),
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
