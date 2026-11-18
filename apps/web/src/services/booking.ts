import type { Reservation } from '@turta/shared-types';

import { apiRequest } from './api-client';

export type CreateReservationInput = {
  tourDateId?: string;
  activityDateId?: string;
  pickupPointId?: string;
  adults: number;
  children?: number;
  contactEmail: string;
  contactPhone: string;
  guests: Array<{
    firstName: string;
    lastName: string;
    birthDate?: string;
    identityNumber: string;
    phone?: string;
    email?: string;
    address?: string;
  }>;
  extras?: Array<{ tourExtraId: string; quantity: number }>;
  billing: {
    fullName?: string;
    line1: string;
    line2?: string;
    city: string;
    state?: string;
    postalCode?: string;
    country: string;
    taxId?: string;
    companyName?: string;
  };
  specialRequests?: string;
};

export async function createReservation(
  input: CreateReservationInput,
  token: string,
) {
  return apiRequest<Reservation>('/booking/reservations', {
    method: 'POST',
    body: input,
    token,
  });
}

export async function listReservations(token: string) {
  return apiRequest<Reservation[]>('/booking/reservations', { token });
}

export async function getReservationVoucher(
  reservationId: string,
  token: string,
) {
  return apiRequest<{
    bookingNumber: string;
    html: string;
    fragmentHtml?: string;
  }>(`/booking/reservations/${reservationId}/voucher`, { token });
}

export function downloadVoucherHtml(bookingNumber: string, html: string): void {
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `voucher-${bookingNumber}.html`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function openVoucherPrintWindow(html: string): void {
  const win = window.open('', '_blank');
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.focus();
  win.print();
}

export async function checkoutPayment(
  input: {
    reservationId: string;
    cardHolderName: string;
    cardNumber: string;
    expireMonth: string;
    expireYear: string;
    cvc: string;
  },
  token: string,
) {
  return apiRequest<{
    id: string;
    status: string;
    reservationId: string;
    requires3ds?: boolean;
    threeDSHtmlContent?: string | null;
  }>('/payment/checkout', {
    method: 'POST',
    body: input,
    token,
  });
}
