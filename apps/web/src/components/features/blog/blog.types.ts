import type { Category, Post } from '@turta/shared-types';

/** Card / list shape — never trust optional HTML in excerpt. */
export type BlogPostListItem = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  coverImage: string | null;
  publishedAt: string | null;
  categories: Array<{ name: string; slug: string }>;
};

export type BlogCategoryOption = {
  slug: string;
  label: string;
};

export type BlogSearchParams = {
  q?: string;
  category?: string;
  page?: string;
};

export type BlogListResult = {
  posts: BlogPostListItem[];
  total: number;
};

/** Normalize API Post → list item (plain-text excerpt, safe categories). */
export function toBlogPostListItem(
  post: Post & {
    coverImage?: string | null;
    categories?: Category[];
  },
): BlogPostListItem {
  return {
    id: post.id,
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    coverImage: post.coverImage ?? null,
    publishedAt: post.publishedAt,
    categories: (post.categories ?? []).map((category) => ({
      name: category.name,
      slug: category.slug,
    })),
  };
}
