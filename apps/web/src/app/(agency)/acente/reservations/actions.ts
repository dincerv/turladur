'use server';

import { revalidatePath } from 'next/cache';

export async function revalidatePartnerReservationPaths(tourId?: string) {
  revalidatePath('/acente/reservations');
  revalidatePath('/acente');
  if (tourId && typeof tourId === 'string') {
    revalidatePath(`/acente/tours/${tourId}`);
    revalidatePath(`/acente/tours/${tourId}/dates`);
  }
}
