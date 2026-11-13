import Image from 'next/image';
import Link from 'next/link';
import { Image as ImageIcon } from 'lucide-react';

import { shouldUnoptimizeMedia } from '@/lib/media';

import {
  formatPublishedAt,
  toCoverImageUrl,
  toPlainExcerpt,
} from './blog.helpers';
import type { BlogPostListItem } from './blog.types';

type BlogPostCardProps = {
  post: BlogPostListItem;
  priority?: boolean;
};

export function BlogPostCard({ post, priority = false }: BlogPostCardProps) {
  const href = `/blog/${encodeURIComponent(post.slug)}`;
  const cover = toCoverImageUrl(post.coverImage);
  const excerpt = toPlainExcerpt(post.excerpt, 200);
  const published = formatPublishedAt(post.publishedAt);
  const categoryLabel =
    post.categories.length > 0
      ? post.categories.map((category) => category.name).join(' · ')
      : null;

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-md">
      <Link
        href={href}
        tabIndex={-1}
        aria-hidden
        className="relative aspect-video overflow-hidden bg-neutral-100"
      >
        {cover ? (
          <Image
            src={cover}
            alt=""
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            priority={priority}
            loading={priority ? 'eager' : 'lazy'}
            unoptimized={shouldUnoptimizeMedia(cover)}
            className="object-cover transition duration-500 ease-out group-hover:scale-105"
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-neutral-400">
            <ImageIcon className="h-8 w-8" aria-hidden />
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-2 p-4 sm:p-5">
        <div className="flex min-h-[1.25rem] items-center justify-between gap-2 text-xs font-medium uppercase tracking-wide text-neutral-500">
          <p className="min-w-0 truncate">
            {categoryLabel ? <span className="sr-only">Kategori: </span> : null}
            {categoryLabel ?? '\u00A0'}
          </p>
          {published ? (
            <time dateTime={post.publishedAt ?? undefined} className="shrink-0">
              {published}
            </time>
          ) : null}
        </div>

        <h2 className="line-clamp-2 text-lg font-semibold leading-snug text-neutral-900">
          <Link
            href={href}
            className="transition hover:text-neutral-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2"
          >
            {post.title}
          </Link>
        </h2>

        {excerpt ? (
          <p className="line-clamp-3 text-sm leading-relaxed text-neutral-600">
            {excerpt}
          </p>
        ) : (
          <p className="line-clamp-3 text-sm leading-relaxed text-neutral-400">
            Bu yazı için özet bulunmuyor.
          </p>
        )}

        <Link
          href={href}
          className="mt-auto pt-3 text-sm font-semibold text-neutral-950 transition group-hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2"
        >
          Devamını oku
          <span aria-hidden> →</span>
        </Link>
      </div>
    </article>
  );
}
