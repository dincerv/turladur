import { z } from 'zod';

import {
  CUSTOMER_PASSWORD_HINT,
  CUSTOMER_PASSWORD_MIN_LENGTH,
  CUSTOMER_PASSWORD_VALIDATION_MESSAGE,
  customerPasswordSchema,
} from '@turta/shared-validators';

export { CUSTOMER_PASSWORD_HINT, CUSTOMER_PASSWORD_VALIDATION_MESSAGE };

export const loginFormSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'E-posta gerekli')
    .email('Geçerli bir e-posta girin'),
  password: z
    .string()
    .min(1, 'Şifre gerekli')
    .min(CUSTOMER_PASSWORD_MIN_LENGTH, 'Şifre en az 8 karakter olmalı'),
  rememberMe: z.boolean().default(false),
});

export type LoginFormValues = z.infer<typeof loginFormSchema>;

export const partnerRegisterStepOneSchema = z
  .object({
    companyName: z
      .string()
      .trim()
      .min(2, 'Şirket adı en az 2 karakter olmalı')
      .max(120, 'Şirket adı çok uzun'),
    email: z
      .string()
      .trim()
      .min(1, 'E-posta gerekli')
      .email('Geçerli bir e-posta girin'),
    password: customerPasswordSchema,
    confirmPassword: z.string().min(1, 'Şifre tekrarı gerekli'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Şifreler eşleşmiyor',
    path: ['confirmPassword'],
  });

export const partnerRegisterStepTwoSchema = z.object({
  phone: z
    .string()
    .trim()
    .min(10, 'Geçerli bir telefon girin')
    .max(20, 'Telefon numarası çok uzun'),
  address: z.string().trim().min(5, 'Adres en az 5 karakter olmalı'),
  city: z.string().trim().min(2, 'Şehir gerekli'),
  country: z.string().trim().min(2, 'Ülke gerekli'),
  website: z
    .union([z.literal(''), z.string().trim().url('Geçerli bir URL girin')])
    .optional(),
  description: z.string().trim().max(1000).optional(),
  taxNumber: z.string().trim().max(32).optional(),
  role: z.string().trim().max(80).optional(),
  termsAccepted: z.boolean().refine((value) => value === true, {
    message: 'İş ortağı sözleşmesini kabul etmelisiniz',
  }),
});

export type PartnerRegisterStepOne = z.infer<
  typeof partnerRegisterStepOneSchema
>;
export type PartnerRegisterStepTwo = z.infer<
  typeof partnerRegisterStepTwoSchema
>;
