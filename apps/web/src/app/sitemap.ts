import type { MetadataRoute } from 'next';

import { searchExperiences } from '@/services/activity';
import { searchTours } from '@/services/catalog';
import { listRoutePageOverlays, searchPosts } from '@/services/content';

export const revalidate = 3600;

function siteOrigin(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    'https://turladur-zjyf.vercel.app'
  ).replace(/\/$/, '');
}

const STATIC_PATHS: Array<{
  path: string;
  changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'];
  priority: number;
}> = [
  { path: '/', changeFrequency: 'daily', priority: 1 },
  { path: '/tours', changeFrequency: 'daily', priority: 0.9 },
  { path: '/activities', changeFrequency: 'daily', priority: 0.8 },
  { path: '/routes', changeFrequency: 'weekly', priority: 0.7 },
  { path: '/blog', changeFrequency: 'daily', priority: 0.7 },
  { path: '/campaigns', changeFrequency: 'weekly', priority: 0.6 },
  { path: '/about', changeFrequency: 'monthly', priority: 0.5 },
  { path: '/contact', changeFrequency: 'monthly', priority: 0.5 },
  { path: '/faq', changeFrequency: 'monthly', priority: 0.4 },
  { path: '/careers', changeFrequency: 'monthly', priority: 0.3 },
  { path: '/privacy', changeFrequency: 'yearly', priority: 0.2 },
  { path: '/privacy-policy', changeFrequency: 'yearly', priority: 0.2 },
  { path: '/terms', changeFrequency: 'yearly', priority: 0.2 },
  { path: '/cookie-policy', changeFrequency: 'yearly', priority: 0.2 },
  { path: '/accessibility', changeFrequency: 'yearly', priority: 0.2 },
];

async function collectPaged<T extends { id?: string; slug?: string }>(
  fetchPage: (
    page: number,
  ) => Promise<{ data: T[]; meta?: { totalPages?: number; total?: number } }>,
  maxPages = 20,
): Promise<T[]> {
  const items: T[] = [];
  for (let page = 1; page <= maxPages; page += 1) {
    const { data } = await fetchPage(page);
    if (!data?.length) break;
    items.push(...data);
    if (data.length < 100) break;
  }
  return items;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = siteOrigin();
  const now = new Date();

  const entries: MetadataRoute.Sitemap = STATIC_PATHS.map(
    ({ path, changeFrequency, priority }) => ({
      url: `${origin}${path}`,
      lastModified: now,
      changeFrequency,
      priority,
    }),
  );

  try {
    const tours = await collectPaged((page) =>
      searchTours({
        page,
        limit: 100,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      }),
    );
    for (const tour of tours) {
      entries.push({
        url: `${origin}/tours/${encodeURIComponent(tour.id)}`,
        lastModified: tour.updatedAt ? new Date(tour.updatedAt) : now,
        changeFrequency: 'daily',
        priority: 0.85,
      });
    }
  } catch {
    // API down → still ship static URLs
  }

  try {
    const experiences = await collectPaged((page) =>
      searchExperiences({ page, limit: 100 }),
    );
    for (const experience of experiences) {
      entries.push({
        url: `${origin}/activities/${encodeURIComponent(experience.id)}`,
        lastModified: now,
        changeFrequency: 'weekly',
        priority: 0.7,
      });
    }
  } catch {
    // ignore
  }

  try {
    const posts = await collectPaged((page) =>
      searchPosts({ page, limit: 100 }),
    );
    for (const post of posts) {
      const slug = post.slug;
      if (!slug) continue;
      entries.push({
        url: `${origin}/blog/${encodeURIComponent(slug)}`,
        lastModified: post.updatedAt
          ? new Date(post.updatedAt)
          : post.publishedAt
            ? new Date(post.publishedAt)
            : now,
        changeFrequency: 'weekly',
        priority: 0.65,
      });
    }
  } catch {
    // ignore
  }

  try {
    const routes = await listRoutePageOverlays();
    for (const route of routes) {
      const key = route.routeKey;
      if (!key) continue;
      entries.push({
        url: `${origin}/routes/${encodeURIComponent(key)}`,
        lastModified: now,
        changeFrequency: 'weekly',
        priority: 0.6,
      });
    }
  } catch {
    // ignore
  }

  return entries;
}
