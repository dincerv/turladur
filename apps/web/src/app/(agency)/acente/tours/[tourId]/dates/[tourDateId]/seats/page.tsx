'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

import { BusSeatMapPanel } from '@/components/features/partner-dashboard/bus-seat-map-panel';
import { ACENTE_ROUTES } from '@/lib/panel-routes';

export default function TourDateSeatsPage() {
  const params = useParams<{ tourId: string; tourDateId: string }>();
  const tourId = params.tourId;
  const tourDateId = params.tourDateId;

  return (
    <div className="space-y-6" data-testid="tour-date-seats-page">
      <div className="flex items-center gap-3">
        <Link
          href={`${ACENTE_ROUTES.tours}/${tourId}`}
          data-testid="seats-back-to-tour"
          className="inline-flex min-h-11 items-center text-sm font-medium text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Tur detayına dön
        </Link>
      </div>
      <BusSeatMapPanel tourDateId={tourDateId} tourId={tourId} />
    </div>
  );
}
