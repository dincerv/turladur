import type { Metadata } from 'next';
import { cache } from 'react';

import TourDetailClient from '@/components/features/tour/tour-detail-client';
import { ApiError } from '@/services/api-client';
import { getTourById } from '@/services/catalog';
import { tourPublicPath } from '@/lib/tours/tour-public-path';

type PageProps = { params: Promise<{ id: string }> };

/** cuid id or kebab slug */
const ID_RE = /^[A-Za-z0-9_-]{1,120}$/;

/** Deduped between metadata + future SSR within one request. */
const loadTour = cache(async (id: string) => {
  if (!ID_RE.test(id)) return null;
  try {
    return await getTourById(id);
  } catch (err) {
    if (err instanceof ApiError && (err.status === 404 || err.status === 400)) {
      return null;
    }
    throw err;
  }
});

function plainExcerpt(raw: string, max = 160): string {
  const text = raw.replace(/\s+/g, ' ').trim();
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).trimEnd()}…`;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  try {
    const tour = await loadTour(id);
    if (!tour) {
      return {
        title: 'Tur Detayı',
        description: 'Tur detayı ve rezervasyon',
      };
    }

    const description = plainExcerpt(tour.description || tour.title);
    const canonical = tourPublicPath(tour);
    const image = tour.coverUrl || tour.galleryUrls?.[0];

    return {
      title: tour.title,
      description,
      alternates: { canonical },
      openGraph: {
        title: tour.title,
        description,
        type: 'website',
        url: canonical,
        images: image ? [{ url: image, alt: tour.title }] : undefined,
      },
      twitter: {
        card: 'summary_large_image',
        title: tour.title,
        description,
        images: image ? [image] : undefined,
      },
    };
  } catch {
    return {
      title: 'Tur Detayı',
      description: 'Tur detayı ve rezervasyon',
    };
  }
}

export default function TourDetailPage() {
  return <TourDetailClient />;
}
