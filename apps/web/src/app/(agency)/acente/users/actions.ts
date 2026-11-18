'use server';

import { revalidatePath } from 'next/cache';

/** Personel CRUD sonrası /acente/users önbelleğini temizle. */
export async function revalidateAgencyUsersPath() {
  revalidatePath('/acente/users');
}
