import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { cache } from 'react';

import { mapExperienceRows } from '@/components/features/activity/activities-page/activities-page.helpers';
import type { Experience } from '@/components/features/activity/activities-page/activities-page.types';
import { ActivityDetailView } from '@/components/features/activity/activity-detail/activity-detail-view';
import {
  buildActivityJsonLd,
  normalizeActivityDetail,
  normalizeActivitySessions,
} from '@/components/features/activity/activity-detail/activity-detail.helpers';
import type {
  ActivityDetail,
  ActivitySession,
} from '@/components/features/activity/activity-detail/activity-detail.types';
import {
  getExperienceById,
  getExperienceDates,
  searchExperiences,
} from '@/services/activity';
import { ApiError } from '@/services/api-client';

type PageProps = { params: Promise<{ id: string }> };

const ID_RE = /^[A-Za-z0-9_-]{1,64}$/;
const RELATED_LIMIT = 4;

/** Deduped between `generateMetadata` and the page within one request. */
const loadActivity = cache(
  async (id: string): Promise<ActivityDetail | null> => {
    if (!ID_RE.test(id)) return null;
    try {
      return normalizeActivityDetail(await getExperienceById(id));
    } catch (err) {
      if (
        err instanceof ApiError &&
        (err.status === 404 || err.status === 400)
      ) {
        return null;
      }
      throw err;
    }
  },
);

async function loadSessions(id: string): Promise<ActivitySession[]> {
  try {
    return normalizeActivitySessions(await getExperienceDates(id));
  } catch {
    return [];
  }
}

async function loadRelated(activity: ActivityDetail): Promise<Experience[]> {
  const pick = (rows: readonly unknown[]) =>
    mapExperienceRows(rows).filter((e) => e.id !== activity.id);
  try {
    let items = activity.category
      ? pick(
          (await searchExperiences({ category: activity.category, limit: 12 }))
            .data,
        )
      : [];
    if (items.length < RELATED_LIMIT) {
      const extra = pick((await searchExperiences({ limit: 12 })).data);
      const seen = new Set(items.map((e) => e.id));
      items = [...items, ...extra.filter((e) => !seen.has(e.id))];
    }
    return items.slice(0, RELATED_LIMIT);
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const activity = await loadActivity(id).catch(() => null);
  if (!activity)
    return { title: 'Aktivite bulunamadı', robots: { index: false } };

  const description = (activity.summary || activity.longDescription).slice(
    0,
    160,
  );
  const canonical = `/activities/${encodeURIComponent(activity.id)}`;
  return {
    title: activity.title,
    description: description || undefined,
    alternates: { canonical },
    openGraph: {
      title: activity.title,
      description: description || undefined,
      type: 'website',
      url: canonical,
      images: activity.images[0] ? [{ url: activity.images[0] }] : undefined,
    },
  };
}

export default async function ActivityDetailPage({ params }: PageProps) {
  const { id } = await params;
  const activity = await loadActivity(id);
  if (!activity) notFound();

  const [sessions, related] = await Promise.all([
    loadSessions(activity.id),
    loadRelated(activity),
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        // JSON-LD only: built from normalized plain text, `<` escaped in the builder.
        dangerouslySetInnerHTML={{
          __html: buildActivityJsonLd(
            activity,
            sessions,
            `/activities/${encodeURIComponent(activity.id)}`,
          ),
        }}
      />
      <ActivityDetailView
        activity={activity}
        sessions={sessions}
        related={related}
      />
    </>
  );
}
