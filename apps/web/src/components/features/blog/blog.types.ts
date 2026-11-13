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

/** Detail page shape — content is sanitized / parsed before render. */
export type BlogPostDetail = BlogPostListItem & {
  content: string;
  authorId: string;
  authorName: string;
  updatedAt: string | null;
  tags: Array<{ name: string; slug: string }>;
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

export function toBlogPostDetail(
  post: Post & {
    content: string;
    coverImage?: string | null;
    categories?: Category[];
  },
): BlogPostDetail {
  const categories = (post.categories ?? []).map((category) => ({
    name: category.name,
    slug: category.slug,
  }));
  return {
    ...toBlogPostListItem(post),
    content: post.content,
    authorId: post.authorId,
    authorName: 'turta',
    updatedAt: post.updatedAt ?? null,
    tags: categories,
  };
}
