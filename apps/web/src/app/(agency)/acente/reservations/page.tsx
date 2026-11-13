import { Suspense } from 'react';

import { AcenteReservationsPage } from '@/components/features/acente-reservations/acente-reservations-page';

function ReservationsFallback() {
  return (
    <div
      className="animate-pulse space-y-3"
      data-testid="reservations-skeleton"
    >
      <div className="h-8 w-48 rounded bg-neutral-200" />
      <div className="h-28 rounded-xl bg-neutral-100" />
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-20 rounded-xl bg-neutral-100" />
      ))}
    </div>
  );
}

export default function PartnerReservationsPage() {
  return (
    <Suspense fallback={<ReservationsFallback />}>
      <AcenteReservationsPage />
    </Suspense>
  );
}
