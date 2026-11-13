'use server';

import { revalidatePath } from 'next/cache';

/** Invalidate agency tour list + detail/edit after a successful update. */
export async function revalidatePartnerTourPaths(tourId: string) {
  if (!tourId || typeof tourId !== 'string') return;
  revalidatePath('/acente/tours');
  revalidatePath(`/acente/tours/${tourId}`);
  revalidatePath(`/acente/tours/${tourId}/edit`);
}
