import type { Metadata } from 'next';
import { Suspense } from 'react';

import RoutesPageClient from '@/components/features/route/routes-page-client';

export const metadata: Metadata = {
  title: 'Popüler Rotalar',
  description:
    "Türkiye'nin en popüler turizm rotalarını keşfedin. Kapadokya, Likya Yolu, Pamukkale ve daha fazlası.",
};

export default function RoutesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          Yükleniyor...
        </div>
      }
    >
      <RoutesPageClient />
    </Suspense>
  );
}
