import { z } from 'zod';

const nonEmpty = (msg: string) => z.string().trim().min(1, msg);

export const tourBasicStepSchema = z
  .object({
    stayKind: z.enum(['DAY_TRIP', 'OVERNIGHT'], {
      required_error: 'Turun türünü seçmelisiniz',
    }),
    destinationScope: z.enum(['DOMESTIC', 'INTERNATIONAL']).optional(),
    title: z
      .string()
      .trim()
      .min(5, 'Tur adı en az 5 karakter olmalı')
      .max(100, 'Tur adı en fazla 100 karakter olmalı'),
    description: z.string().trim().min(50, 'Açıklama en az 50 karakter olmalı'),
    price: z
      .string()
      .trim()
      .refine((v) => Number.parseFloat(v) > 0, 'Geçerli bir fiyat giriniz'),
    departureCity: z
      .array(z.string())
      .min(1, 'En az bir kalkış şehri seçmelisiniz')
      .refine(
        (cities) => cities.every((c) => c.trim().length > 0),
        'Tüm kalkış şehirleri için şehir seçimi yapılmalı',
      ),
    destinations: z
      .array(
        z.object({
          city: z.string(),
          description: z.string().optional(),
        }),
      )
      .min(1, 'En az bir destinasyon eklemelisiniz')
      .refine(
        (rows) => rows.every((d) => d.city.trim().length > 0),
        'Tüm destinasyonlar için şehir seçimi yapılmalı',
      ),
    nights: z.string().optional(),
    maxParticipants: z
      .number()
      .int()
      .positive('Maksimum katılımcı sayısı gerekli'),
    transportation: nonEmpty('Ulaşım tipi gerekli'),
    tourType: nonEmpty('Tur tipi gerekli'),
    accommodationType: z.string().optional(),
    images: z.array(z.unknown()).min(1, 'En az bir tur görseli yüklemelisiniz'),
    mainImage: z
      .unknown()
      .nullable()
      .refine((v) => v != null, 'Ana görsel gerekli'),
    galleryImages: z
      .array(z.unknown())
      .min(3, 'En az 3 galeri görseli yüklemelisiniz'),
  })
  .superRefine((data, ctx) => {
    if (data.stayKind && !data.destinationScope) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['destinationScope'],
        message: 'Yurtiçi / yurtdışı seçmelisiniz',
      });
    }
    if (data.stayKind !== 'DAY_TRIP' && !data.nights?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['nights'],
        message: 'Gece sayısı gerekli',
      });
    }
    if (
      data.stayKind !== 'DAY_TRIP' &&
      data.tourType !== 'Günübirlik Tur' &&
      !data.accommodationType?.trim()
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['accommodationType'],
        message: 'Konaklama tipi gerekli',
      });
    }
  });

export const tourDetailsStepSchema = z.object({
  tourDates: z
    .array(
      z.object({
        startDate: nonEmpty('Başlangıç tarihi gerekli'),
        endDate: nonEmpty('Bitiş tarihi gerekli'),
        price: z
          .string()
          .refine(
            (v) => Number.parseFloat(v) > 0,
            'Geçerli bir fiyat girilmeli',
          ),
        availableSeats: z
          .string()
          .refine(
            (v) => Number.parseInt(v, 10) > 0,
            'Geçerli bir kontenjan girilmeli',
          ),
      }),
    )
    .min(1, 'En az bir tur tarihi eklemelisiniz'),
  pickupPoints: z
    .array(
      z.object({
        city: nonEmpty('Şehir bilgisi gerekli'),
        location: nonEmpty('Konum bilgisi gerekli'),
        time: nonEmpty('Saat bilgisi gerekli'),
      }),
    )
    .min(1, 'En az bir yolcu alma noktası eklemelisiniz'),
});

export type TourBasicStepInput = z.infer<typeof tourBasicStepSchema>;
export type TourDetailsStepInput = z.infer<typeof tourDetailsStepSchema>;

/** Parsed numeric payload for API (prices/dates leave the form as typed values). */
export function parseTourSubmitNumbers(input: {
  price: string | number;
  duration?: string | number;
  tourDates: Array<{
    startDate: string | null;
    endDate: string | null;
    availableSeats: string | number;
    price?: string | number;
    ageRanges?: Array<{
      minAge: number;
      maxAge: number | null;
      pricingType: string;
      value?: string | number;
    }>;
  }>;
}) {
  return {
    price: Number(input.price) || 0,
    duration: Number(input.duration) || 1,
    tourDates: input.tourDates.map((date) => ({
      startDate: date.startDate ? date.startDate.slice(0, 10) : null,
      endDate: date.endDate ? date.endDate.slice(0, 10) : null,
      availableSeats: Number(date.availableSeats) || 0,
      price: date.price !== undefined ? Number(date.price) || 0 : undefined,
      ageRanges: (date.ageRanges ?? []).map((range) => ({
        minAge: Number(range.minAge),
        maxAge: range.maxAge == null ? null : Number(range.maxAge),
        pricingType: range.pricingType,
        value: Number(range.value) || 0,
      })),
    })),
  };
}

export function zodErrorsToRecord(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? 'form');
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
