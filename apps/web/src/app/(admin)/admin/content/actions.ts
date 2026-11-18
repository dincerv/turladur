'use server';

import { revalidatePath } from 'next/cache';

/** After blog draft/publish/delete from admin content panel. */
export async function revalidateBlogContent(slug?: string) {
  revalidatePath('/blog');
  revalidatePath('/admin/content/blog');
  if (slug) {
    revalidatePath(`/blog/${slug}`);
  }
}
