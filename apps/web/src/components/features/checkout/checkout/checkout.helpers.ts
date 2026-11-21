/** Split from checkout-client.tsx (Faz 7). */

import type { User } from '@turta/shared-types';
import { SHARED_ADULT_KEY, SHARED_CHILD_KEY } from '@/lib/booking-utils';
import { parsePhoneValue } from '@/components/ui/phone-input';

export type CardBrand = 'visa' | 'mastercard' | 'amex' | 'unknown';

export function digitsOnly(value: string): string {
  return value.replace(/\D/g, '');
}

export function detectCardBrand(cardNumber: string): CardBrand {
  const digits = digitsOnly(cardNumber);
  if (/^4/.test(digits)) return 'visa';
  if (/^3[47]/.test(digits)) return 'amex';
  if (/^5[1-5]/.test(digits) || /^2(2[2-9]|[3-6]\d|7[01])/.test(digits)) {
    return 'mastercard';
  }
  return 'unknown';
}

export function formatCardNumberInput(value: string, brand: CardBrand): string {
  const maxLen = brand === 'amex' ? 15 : 16;
  const digits = digitsOnly(value).slice(0, maxLen);
  if (brand === 'amex') {
    // 4-6-5 grouping
    const parts = [
      digits.slice(0, 4),
      digits.slice(4, 10),
      digits.slice(10, 15),
    ].filter(Boolean);
    return parts.join(' ');
  }
  return digits.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
}

export function formatExpiryInput(value: string): string {
  const digits = digitsOnly(value).slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

export function formatCvcInput(value: string, brand: CardBrand): string {
  const maxLen = brand === 'amex' ? 4 : 3;
  return digitsOnly(value).slice(0, maxLen);
}

export const CARD_BRAND_LABEL: Record<CardBrand, string> = {
  visa: 'Visa',
  mastercard: 'Mastercard',
  amex: 'Amex',
  unknown: '',
};

export type GuestForm = {
  firstName: string;
  lastName: string;
  birthDate: string;
  identityNumber: string;
  phoneDial: string;
  phoneLocal: string;
  email: string;
  address: string;
  role: 'primary' | 'adult' | 'child';
};

export type PaymentMethod = 'bank_transfer' | 'card';

export const STEPS = [
  { id: '01', name: 'Özet', description: 'Rezervasyon detaylarını inceleyin' },
  { id: '02', name: 'Bilgiler', description: 'Katılımcı bilgileri' },
  { id: '03', name: 'Ödeme', description: 'Ödeme yöntemini seçin' },
  { id: '04', name: 'Onay', description: 'Rezervasyonu tamamlayın' },
];

export function formatPrice(price: number) {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
  }).format(price);
}

export function emptyGuest(role: GuestForm['role']): GuestForm {
  return {
    firstName: '',
    lastName: '',
    birthDate: '',
    identityNumber: '',
    phoneDial: '+90',
    phoneLocal: '',
    email: '',
    address: '',
    role,
  };
}

export function parsePartySize(searchParams: URLSearchParams): {
  adults: number;
  children: number;
} {
  const adultsParam = Number(searchParams.get('adults') || '');
  const childrenParam = Number(searchParams.get('children') || '');
  if (Number.isFinite(adultsParam) && adultsParam >= 1) {
    return {
      adults: adultsParam,
      children:
        Number.isFinite(childrenParam) && childrenParam >= 0
          ? childrenParam
          : 0,
    };
  }

  const raw = searchParams.get('participants');
  if (!raw) return { adults: 1, children: 0 };
  try {
    const parsed = JSON.parse(raw) as Record<string, number>;
    if (SHARED_ADULT_KEY in parsed || SHARED_CHILD_KEY in parsed) {
      return {
        adults: Number(parsed[SHARED_ADULT_KEY] || 0) || 1,
        children: Number(parsed[SHARED_CHILD_KEY] || 0) || 0,
      };
    }
    if (typeof parsed.total === 'number' && parsed.total >= 1) {
      return { adults: parsed.total, children: 0 };
    }
    const sum = Object.values(parsed).reduce(
      (acc, value) => acc + (Number(value) || 0),
      0,
    );
    return { adults: Math.max(1, sum), children: 0 };
  } catch {
    return { adults: 1, children: 0 };
  }
}

export function toDateInputValue(value: string | null | undefined): string {
  if (!value?.trim()) return '';
  // Profile API returns YYYY-MM-DD; tolerate ISO datetime. Clamp year to 4 digits.
  const match = value.trim().match(/^(\d+)-(\d{2})-(\d{2})/);
  if (!match) return '';
  return `${match[1].slice(0, 4)}-${match[2]}-${match[3]}`;
}

export function clampBirthDateInput(raw: string): string {
  if (!raw) return '';
  const match = /^(\d+)-(\d{1,2})-(\d{1,2})$/.exec(raw);
  if (!match) return raw.slice(0, 10);
  const year = match[1].slice(0, 4);
  const month = match[2].padStart(2, '0').slice(0, 2);
  const day = match[3].padStart(2, '0').slice(0, 2);
  return `${year}-${month}-${day}`;
}

export function applyProfileToPrimaryGuest(
  primary: GuestForm,
  profile: User,
): GuestForm {
  const parsedPhone = parsePhoneValue(profile.phone ?? '');
  return {
    ...primary,
    firstName: profile.firstName ?? '',
    lastName: profile.lastName ?? '',
    email: profile.email ?? '',
    phoneDial: parsedPhone.countryCode,
    phoneLocal: parsedPhone.localNumber,
    identityNumber: profile.identityNumber ?? '',
    birthDate: toDateInputValue(profile.birthDate),
    address: profile.address ?? '',
  };
}
