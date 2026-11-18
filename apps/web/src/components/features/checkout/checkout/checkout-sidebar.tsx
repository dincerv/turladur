'use client';

import Image from 'next/image';

import { useCheckoutUi } from './checkout-context';
import { formatPrice } from './checkout.helpers';

/** Split from checkout-client.tsx (Faz 7) — CheckoutSidebar; UI unchanged. */
export function CheckoutSidebar() {
  const { title, image, party, unitPrice, extrasTotal, totalPrice } =
    useCheckoutUi();

  return (
    <aside className="lg:col-span-1">
      <div className="sticky top-24 overflow-hidden rounded-xl border border-neutral-200/70 bg-white shadow-sm">
        <div className="relative aspect-[16/10] bg-neutral-200">
          {image ? (
            <Image
              src={image}
              alt={title}
              fill
              className="object-cover"
              sizes="320px"
            />
          ) : null}
        </div>
        <div className="space-y-3 p-5">
          <h3 className="text-lg font-bold text-neutral-900">{title}</h3>
          <p className="text-sm text-neutral-600">
            {party.adults} yetişkin
            {party.children > 0 ? ` · ${party.children} çocuk` : ''}
          </p>
          <div className="border-t border-neutral-100 pt-3">
            <div className="flex justify-between text-sm">
              <span className="text-neutral-600">Birim</span>
              <span>{formatPrice(unitPrice)}</span>
            </div>
            {extrasTotal > 0 ? (
              <div
                className="mt-2 flex justify-between text-sm"
                data-testid="checkout-sidebar-extras"
              >
                <span className="text-neutral-600">Ekstralar</span>
                <span>{formatPrice(extrasTotal)}</span>
              </div>
            ) : null}
            <div
              className="mt-2 flex justify-between text-base font-bold"
              data-testid="checkout-sidebar-total"
            >
              <span>Toplam</span>
              <span>{formatPrice(totalPrice)}</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
