import type { Metadata } from 'next';
import { Suspense } from 'react';

import RouteDetailClient from '@/components/features/route/route-detail-client';
import { getRouteById } from '@/services/route';

type PageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  try {
    const data = await getRouteById(id);
    return {
      title: data.route.name,
      description: data.route.description.slice(0, 160),
    };
  } catch {
    return { title: 'Rota' };
  }
}

export default async function RouteDetailPage({ params }: PageProps) {
  const { id } = await params;
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          Yükleniyor...
        </div>
      }
    >
      <RouteDetailClient routeId={id} />
    </Suspense>
  );
}
