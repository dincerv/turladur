import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { BlogPostCover } from '@/components/features/blog/blog-post-cover';
import { BlogPostCta } from '@/components/features/blog/blog-post-cta';
import { BlogPostHeader } from '@/components/features/blog/blog-post-header';
import { BlogRichText } from '@/components/features/blog/blog-rich-text';
import {
  toCoverImageUrl,
  toJsonLdScript,
  toPlainExcerpt,
} from '@/components/features/blog/blog.helpers';
import { toBlogPostDetail } from '@/components/features/blog/blog.types';
import { getPostBySlug } from '@/services/content';

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const raw = await getPostBySlug(slug);
    const post = toBlogPostDetail(raw);
    const description = toPlainExcerpt(post.excerpt ?? post.content, 160);
    const cover = toCoverImageUrl(post.coverImage);
    return {
      title: `${post.title} | turta Blog`,
      description,
      openGraph: {
        title: post.title,
        description,
        type: 'article',
        publishedTime: post.publishedAt ?? undefined,
        images: cover ? [{ url: cover }] : undefined,
      },
      alternates: { canonical: `/blog/${post.slug}` },
    };
  } catch {
    return { title: 'Yazı | turta Blog' };
  }
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  let post;
  try {
    post = toBlogPostDetail(await getPostBySlug(slug));
  } catch {
    notFound();
  }

  if (!post.content?.trim()) notFound();

  const cover = toCoverImageUrl(post.coverImage);
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: toPlainExcerpt(post.excerpt, 160) || undefined,
    image: cover ? [cover] : undefined,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt ?? post.publishedAt,
    author: {
      '@type': 'Organization',
      name: post.authorName,
    },
    publisher: {
      '@type': 'Organization',
      name: 'turta',
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `/blog/${post.slug}`,
    },
  };

  return (
    <article className="mx-auto max-w-3xl px-5 pb-16 pt-24 sm:px-6 lg:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: toJsonLdScript(jsonLd) }}
      />

      <BlogPostHeader post={post} />
      <BlogPostCover src={post.coverImage} alt={post.title} />

      <div className="mt-10">
        <BlogRichText content={post.content} />
      </div>

      <BlogPostCta />
    </article>
  );
}
