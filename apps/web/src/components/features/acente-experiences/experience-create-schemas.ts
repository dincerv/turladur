import { z } from 'zod';

const nonEmpty = (msg: string) => z.string().trim().min(1, msg);

export const experienceBasicSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, 'Başlık en az 3 karakter')
    .max(200, 'Başlık en fazla 200 karakter'),
  description: z
    .string()
    .trim()
    .min(10, 'Kısa açıklama en az 10 karakter')
    .max(2000),
  longDescription: z
    .string()
    .trim()
    .min(10, 'Detay açıklama en az 10 karakter')
    .max(20_000),
  category: nonEmpty('Kategori gerekli').max(120),
  location: nonEmpty('Lokasyon gerekli').max(200),
  duration: nonEmpty('Süre gerekli').max(80),
  meetingPoint: z.string().trim().max(300).optional().or(z.literal('')),
  ageRestriction: z.enum(['everyone', '12+', '18+']).default('everyone'),
});

export const experienceContentSchema = z.object({
  included: z.array(z.string().trim().min(1).max(200)).max(50).default([]),
  notIncluded: z.array(z.string().trim().min(1).max(200)).max(50).default([]),
  highlights: z.array(z.string().trim().min(1).max(200)).max(30).default([]),
});

export const experienceMediaPricingSchema = z
  .object({
    price: z.coerce
      .number()
      .finite()
      .min(0, 'Fiyat negatif olamaz')
      .max(1_000_000),
    imageUrl: z
      .string()
      .trim()
      .max(2000)
      .optional()
      .or(z.literal(''))
      .or(z.null()),
    gallery: z.array(z.string().trim().min(1).max(2000)).max(10).default([]),
    dateStart: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Geçersiz tarih')
      .optional()
      .or(z.literal('')),
    dateEnd: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Geçersiz tarih')
      .optional()
      .or(z.literal('')),
    dateSeats: z.coerce.number().int().min(1).max(500).default(12),
  })
  .superRefine((data, ctx) => {
    if (data.dateStart && data.dateEnd && data.dateEnd < data.dateStart) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['dateEnd'],
        message: 'Bitiş tarihi başlangıçtan önce olamaz',
      });
    }
    if (
      (data.dateStart && !data.dateEnd) ||
      (!data.dateStart && data.dateEnd)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['dateStart'],
        message: 'Başlangıç ve bitiş birlikte girilmeli',
      });
    }
  });

export type ExperienceBasicInput = z.infer<typeof experienceBasicSchema>;
export type ExperienceContentInput = z.infer<typeof experienceContentSchema>;
export type ExperienceMediaPricingInput = z.infer<
  typeof experienceMediaPricingSchema
>;

export function zodErrorsToRecord(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join('.') || '_form';
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
