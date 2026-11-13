import Link from 'next/link';

import { estimateReadingMinutes, toPlainExcerpt } from './blog.helpers';
import type { BlogPostDetail } from './blog.types';

type BlogPostHeaderProps = {
  post: BlogPostDetail;
};

function formatDetailDate(iso: string | null): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function BlogPostHeader({ post }: BlogPostHeaderProps) {
  const published = formatDetailDate(post.publishedAt);
  const readingMinutes = estimateReadingMinutes(post.content);
  const excerpt = toPlainExcerpt(post.excerpt, 220);
  const tags = post.tags.length > 0 ? post.tags : post.categories;

  return (
    <header className="max-w-prose">
      <p className="text-sm text-neutral-500">
        <Link
          href="/blog"
          className="font-medium text-neutral-800 transition hover:text-neutral-950 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2"
        >
          ← Blog
        </Link>
        {tags.length > 0 ? (
          <>
            <span aria-hidden className="mx-1.5">
              ·
            </span>
            <span className="text-neutral-600">
              {tags.map((tag) => tag.name).join(' · ')}
            </span>
          </>
        ) : null}
      </p>

      <h1 className="mt-4 font-[family-name:var(--font-montserrat)] text-3xl font-bold tracking-tight text-balance text-neutral-900 sm:text-4xl">
        {post.title}
      </h1>

      {excerpt ? (
        <p className="mt-4 text-lg leading-relaxed text-neutral-600">
          {excerpt}
        </p>
      ) : null}

      <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-neutral-500">
        <span className="font-medium text-neutral-700">{post.authorName}</span>
        {published && post.publishedAt ? (
          <>
            <span aria-hidden>·</span>
            <time dateTime={post.publishedAt}>{published}</time>
          </>
        ) : null}
        <span aria-hidden>·</span>
        <span>{readingMinutes} dk okuma</span>
      </div>
    </header>
  );
}
