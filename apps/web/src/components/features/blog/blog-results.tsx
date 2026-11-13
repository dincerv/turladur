import { ApiError } from '@/services/api-client';
import { searchPosts } from '@/services/content';

import { BlogEmptyState, BlogErrorState } from './blog-empty-state';
import { BlogList } from './blog-list';
import { toSafeSearchLabel } from './blog.helpers';
import { toBlogPostListItem } from './blog.types';

type BlogResultsProps = {
  query: string;
  categorySlug?: string;
  page: number;
};

export async function BlogResults({
  query,
  categorySlug,
  page,
}: BlogResultsProps) {
  try {
    const result = await searchPosts({
      q: query || undefined,
      categorySlug: categorySlug || undefined,
      page,
      limit: 18,
    });

    const posts = (result.data ?? []).map(toBlogPostListItem);
    const total = result.meta?.total ?? posts.length;

    if (posts.length === 0) {
      return <BlogEmptyState query={query} categorySlug={categorySlug} />;
    }

    return <BlogList posts={posts} total={total} />;
  } catch (error) {
    const message =
      error instanceof ApiError
        ? error.message
        : error instanceof Error
          ? error.message
          : undefined;
    return (
      <BlogErrorState
        message={message ? toSafeSearchLabel(message, 160) : undefined}
      />
    );
  }
}
