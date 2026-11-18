'use client';

import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { CalendarDays, ChevronRight, MapPin, Users } from 'lucide-react';

import { useCheckoutUi } from './checkout-context';

/** Split from checkout-client.tsx (Faz 7) — CheckoutStepSummary; UI unchanged. */
export function CheckoutStepSummary() {
  const { title, startDate, endDate, party, setCurrentStep } = useCheckoutUi();

  return (
    <div className="rounded-xl border border-neutral-200/70 bg-white p-6 shadow-sm sm:p-8">
      <h2 className="mb-6 text-xl font-bold text-neutral-900">
        Rezervasyon Özeti
      </h2>
      <div className="space-y-4">
        <div className="flex gap-4 rounded-lg border border-neutral-100 bg-neutral-50 p-4">
          <CalendarDays className="mt-0.5 h-5 w-5 shrink-0 text-neutral-950" />
          <div>
            <p className="text-sm font-medium text-neutral-700">Tarih</p>
            <p className="font-semibold text-neutral-900">
              {startDate
                ? format(new Date(startDate), 'd MMMM yyyy', {
                    locale: tr,
                  })
                : '—'}
              {endDate
                ? ` – ${format(new Date(endDate), 'd MMMM yyyy', { locale: tr })}`
                : ''}
            </p>
          </div>
        </div>
        <div className="flex gap-4 rounded-lg border border-neutral-100 bg-neutral-50 p-4">
          <Users className="mt-0.5 h-5 w-5 shrink-0 text-neutral-950" />
          <div>
            <p className="text-sm font-medium text-neutral-700">Katılımcılar</p>
            <p className="font-semibold text-neutral-900">
              {party.adults} yetişkin
              {party.children > 0 ? `, ${party.children} çocuk` : ''}
            </p>
          </div>
        </div>
        <div className="flex gap-4 rounded-lg border border-neutral-100 bg-neutral-50 p-4">
          <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-neutral-950" />
          <div>
            <p className="text-sm font-medium text-neutral-700">Ürün</p>
            <p className="font-semibold text-neutral-900">{title}</p>
          </div>
        </div>
      </div>
      <div className="mt-8 flex justify-end">
        <button
          type="button"
          data-testid="checkout-summary-next"
          onClick={() => setCurrentStep(1)}
          className="inline-flex items-center gap-2 rounded-lg bg-neutral-950 px-5 py-2.5 text-sm font-semibold text-white hover:bg-neutral-800"
        >
          Devam et
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
