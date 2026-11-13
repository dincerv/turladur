import { resolveMediaUrl } from '@/lib/media';

import type { BlogCategoryOption } from './blog.types';

export const BLOG_CATEGORY_OPTIONS: readonly BlogCategoryOption[] = [
  { slug: 'yurtici-rotalar', label: 'Yurtiçi Rotalar' },
  { slug: 'yurtdisi-rotalar', label: 'Yurtdışı Rotalar' },
  { slug: 'seyahat-ipuclari', label: 'Seyahat İpuçları' },
  { slug: 'gastronomi', label: 'Gastronomi' },
] as const;

export const BLOG_BANNER_IMAGE =
  'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=2070&q=80';

/** Strip tags / controls before echoing a search term into the UI. */
export function toSafeSearchLabel(raw: string, max = 80): string {
  return raw
    .replace(/<[^>]*>/g, '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}

/** Plain-text excerpt for cards — never render HTML from CMS/API. */
export function toPlainExcerpt(
  raw: string | null | undefined,
  max = 220,
): string {
  if (!raw) return '';
  const plain = raw
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
  if (plain.length <= max) return plain;
  return `${plain.slice(0, max - 1).trimEnd()}…`;
}

export function toCoverImageUrl(raw: string | null | undefined): string | null {
  return resolveMediaUrl(raw);
}

export function formatPublishedAt(
  iso: string | null | undefined,
): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function categoryLabel(slug: string | undefined): string | null {
  if (!slug) return null;
  return (
    BLOG_CATEGORY_OPTIONS.find((option) => option.slug === slug)?.label ??
    toSafeSearchLabel(slug, 64)
  );
}
