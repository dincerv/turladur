import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';

import { BlogFilters } from '@/components/features/blog/blog-filters';
import { BlogHero } from '@/components/features/blog/blog-hero';
import { BlogResults } from '@/components/features/blog/blog-results';
import { BlogSkeletonGrid } from '@/components/features/blog/blog-skeleton';
import { FaqSection } from '@/components/features/faq/faq-section';
import { toSafeSearchLabel } from '@/components/features/blog/blog.helpers';

export const metadata: Metadata = {
  title: 'Blog | turta — Yurtiçi & Yurtdışı Rota Rehberleri',
  description:
    'Kapadokya, Karadeniz, Ege, Balkanlar, İtalya, İspanya ve daha fazlası: popüler tur rotaları, gastronomi ve seyahat ipuçları.',
  openGraph: {
    title: 'turta Blog — Rota ve Seyahat Rehberleri',
    description:
      'Yurtiçi ve yurtdışı popüler rotalar, sürdürülebilir seyahat ve gastronomi yazıları.',
    type: 'website',
  },
  alternates: { canonical: '/blog' },
};

type PageProps = {
  searchParams: Promise<{ q?: string; category?: string; page?: string }>;
};

export default async function BlogPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const query = toSafeSearchLabel(params.q ?? '', 120);
  const rawCategory = params.category?.trim() ?? '';
  const categorySlug = /^[a-z0-9-]{1,64}$/.test(rawCategory)
    ? rawCategory
    : undefined;
  const page = Math.max(1, Number(params.page ?? '1') || 1);
  const suspenseKey = `${query}|${categorySlug ?? ''}|${page}`;

  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-800">
      <BlogHero />

      <div className="mx-auto max-w-6xl px-5 py-12 sm:px-6 md:py-16">
        <BlogFilters query={query} categorySlug={categorySlug} />

        <Suspense key={suspenseKey} fallback={<BlogSkeletonGrid />}>
          <BlogResults query={query} categorySlug={categorySlug} page={page} />
        </Suspense>

        <p className="mt-12 text-center text-sm text-neutral-500">
          <Link href="/routes" className="text-neutral-950 hover:underline">
            Rotaları keşfet
          </Link>
          {' · '}
          <Link href="/tours" className="text-neutral-950 hover:underline">
            Turlara bak
          </Link>
        </p>
      </div>

      <FaqSection contactHref="/contact" />
    </main>
  );
}
