'use server';

import { revalidatePath } from 'next/cache';

import { OTOBUS_ROUTES } from '@/lib/panel-routes';

export async function revalidateOtobusPanel(vehicleId?: string) {
  revalidatePath(OTOBUS_ROUTES.dashboard);
  revalidatePath(OTOBUS_ROUTES.vehicles);
  revalidatePath(OTOBUS_ROUTES.assignments);
  if (vehicleId) {
    revalidatePath(OTOBUS_ROUTES.vehicleAvailability(vehicleId));
  }
}

export async function revalidateOtobusAssignments() {
  revalidatePath(OTOBUS_ROUTES.assignments);
  revalidatePath(OTOBUS_ROUTES.dashboard);
}
