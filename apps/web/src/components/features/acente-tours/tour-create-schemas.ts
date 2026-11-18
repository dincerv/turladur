import { z } from 'zod';
import {
  AGENCY_TOUR_CATEGORIES,
  type AgencyTourCategory,
} from '@turta/shared-validators';

export const TOUR_CREATE_CATEGORIES = AGENCY_TOUR_CATEGORIES;
export type TourCreateCategory = AgencyTourCategory;

export const tourCreateGeneralSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, 'Başlık en az 3 karakter')
    .max(200, 'Başlık en fazla 200 karakter'),
  description: z
    .string()
    .trim()
    .min(10, 'Açıklama en az 10 karakter')
    .max(20_000),
  category: z.enum(AGENCY_TOUR_CATEGORIES, {
    required_error: 'Kategori gerekli',
  }),
  stayKind: z.enum(['DAY_TRIP', 'OVERNIGHT']),
  destinationScope: z.enum(['DOMESTIC', 'INTERNATIONAL']),
  durationDays: z.coerce.number().int().min(1, 'Süre en az 1 gün').max(60),
  departureCity: z.string().trim().min(2, 'Kalkış şehri gerekli').max(80),
});

export const tourCreateDatesPricingSchema = z
  .object({
    price: z.coerce
      .number()
      .finite()
      .min(0, 'Fiyat negatif olamaz')
      .max(1_000_000),
    dateStart: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Geçersiz başlangıç tarihi'),
    dateEnd: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Geçersiz bitiş tarihi'),
    capacity: z.coerce.number().int().min(1, 'Kontenjan en az 1').max(500),
  })
  .superRefine((data, ctx) => {
    if (data.dateEnd < data.dateStart) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['dateEnd'],
        message: 'Bitiş tarihi başlangıçtan önce olamaz',
      });
    }
  });

export const tourCreatePickupPointSchema = z.object({
  city: z.string().trim().min(2, 'Şehir en az 2 karakter').max(100),
  location: z.string().trim().min(2, 'Konum en az 2 karakter').max(200),
  time: z.string().trim().min(4, 'Saat gerekli').max(20),
  description: z.string().trim().max(500).optional().or(z.literal('')),
  latitude: z.number().finite().nullable().optional(),
  longitude: z.number().finite().nullable().optional(),
});

export const tourCreatePickupSchema = z.object({
  pickupPoints: z
    .array(tourCreatePickupPointSchema)
    .min(1, 'En az bir kalkış noktası gerekli')
    .max(20),
});

export const tourCreateMediaSchema = z.object({
  coverUrl: z
    .string()
    .trim()
    .max(2000)
    .optional()
    .or(z.literal(''))
    .or(z.null()),
  galleryUrls: z.array(z.string().trim().min(1).max(2000)).max(12).default([]),
  asDraft: z.boolean().default(false),
});

export type TourCreateGeneralInput = z.infer<typeof tourCreateGeneralSchema>;
export type TourCreateDatesPricingInput = z.infer<
  typeof tourCreateDatesPricingSchema
>;
export type TourCreatePickupInput = z.infer<typeof tourCreatePickupSchema>;
export type TourCreateMediaInput = z.infer<typeof tourCreateMediaSchema>;
export type TourCreatePickupPoint = z.infer<typeof tourCreatePickupPointSchema>;

export function zodErrorsToRecord(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join('.') || '_form';
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
