'use server';

import { revalidatePath } from 'next/cache';

/** Invalidate agency experience list + edit after status/delete mutations. */
export async function revalidatePartnerExperiencePaths(experienceId?: string) {
  revalidatePath('/acente/experiences');
  if (experienceId && typeof experienceId === 'string') {
    revalidatePath(`/acente/experiences/${experienceId}`);
    revalidatePath(`/acente/experiences/${experienceId}/edit`);
  }
}
