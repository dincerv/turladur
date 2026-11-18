'use server';

import { revalidatePath } from 'next/cache';

import { REHBER_ROUTES } from '@/lib/panel-routes';

/** After assignment respond / availability / profile mutations. */
export async function revalidateRehberPanel() {
  revalidatePath(REHBER_ROUTES.dashboard);
  revalidatePath(REHBER_ROUTES.assignments);
  revalidatePath(REHBER_ROUTES.availability);
  revalidatePath(REHBER_ROUTES.profile);
}

export async function revalidateRehberAssignments() {
  revalidatePath(REHBER_ROUTES.assignments);
  revalidatePath(REHBER_ROUTES.dashboard);
}
