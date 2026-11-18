'use server';

import { revalidatePath } from 'next/cache';

import { ACENTE_ROUTES } from '@/lib/panel-routes';

export async function revalidateAssignmentsPath() {
  revalidatePath(ACENTE_ROUTES.assignments);
}
