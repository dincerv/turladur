'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

import { useAuth } from '@/providers/auth-provider';
import { ApiError } from '@/services/api-client';
import {
  getPartnerCustomerDetail,
  type PartnerCustomerDetail,
} from '@/services/partner-admin';

type CustomerDetailDrawerProps = {
  customerKey: string | null;
  onClose: () => void;
};

function paymentLabel(status: string) {
  if (status === 'PAID') return 'Ödendi';
  if (status === 'REFUNDED') return 'İade';
  if (status === 'PARTIALLY_PAID') return 'Kısmi';
  return 'Ödenmedi';
}

function statusLabel(status: string) {
  if (status === 'CONFIRMED') return 'Onaylandı';
  if (status === 'COMPLETED') return 'Tamamlandı';
  if (status === 'CANCELLED') return 'İptal';
  if (status === 'PENDING' || status === 'PENDING_PAYMENT') return 'Bekliyor';
  return status;
}

export function CustomerDetailDrawer({
  customerKey,
  onClose,
}: CustomerDetailDrawerProps) {
  const { accessToken } = useAuth();
  const [detail, setDetail] = useState<PartnerCustomerDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!customerKey || !accessToken) {
      setDetail(null);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setError(null);

    void (async () => {
      try {
        const data = await getPartnerCustomerDetail(accessToken, customerKey);
        if (!controller.signal.aborted) setDetail(data);
      } catch (err) {
        if (controller.signal.aborted) return;
        setDetail(null);
        setError(
          err instanceof ApiError ? err.message : 'Müşteri detayı yüklenemedi',
        );
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    })();

    return () => controller.abort();
  }, [customerKey, accessToken]);

  useEffect(() => {
    if (!customerKey) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [customerKey, onClose]);

  if (!customerKey) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end"
      data-testid="customer-drawer"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="Çekmeceyi kapat"
        data-testid="customer-drawer-backdrop"
        onClick={onClose}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="customer-drawer-title"
        className="relative flex h-full w-full max-w-md flex-col bg-white shadow-2xl"
        data-testid="customer-drawer-panel"
      >
        <div className="flex items-start justify-between border-b border-gray-100 px-5 py-4">
          <div className="min-w-0">
            <h2
              id="customer-drawer-title"
              className="truncate text-lg font-semibold text-gray-900"
            >
              {detail?.displayName ?? 'Müşteri detayı'}
            </h2>
            {detail ? (
              <p className="mt-1 text-sm text-gray-500">
                {detail.emailMasked} · {detail.phoneMasked ?? 'Telefon yok'}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100"
            aria-label="Kapat"
            data-testid="customer-drawer-close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {loading ? (
            <p
              className="py-10 text-center text-sm text-gray-500"
              data-testid="customer-drawer-loading"
            >
              Yükleniyor…
            </p>
          ) : null}

          {error ? (
            <p
              className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
              data-testid="customer-drawer-error"
            >
              {error}
            </p>
          ) : null}

          {!loading && !error && detail ? (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-gray-50 p-3">
                  <p className="text-xs text-gray-500">Rezervasyon</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {detail.reservationCount}
                  </p>
                </div>
                <div className="rounded-lg bg-gray-50 p-3">
                  <p className="text-xs text-gray-500">Harcama</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {Number(detail.totalSpent).toLocaleString('tr-TR')}{' '}
                    {detail.currency}
                  </p>
                </div>
              </div>

              <section data-testid="customer-tours-section">
                <h3 className="mb-2 text-sm font-semibold text-gray-900">
                  Geçmiş turlar
                </h3>
                {detail.tours.length === 0 ? (
                  <p className="text-sm text-gray-500">Tur kaydı yok</p>
                ) : (
                  <ul className="space-y-2">
                    {detail.tours.map((tour) => (
                      <li
                        key={tour.id}
                        className="rounded-lg border border-gray-100 px-3 py-2.5"
                        data-testid={`customer-tour-${tour.id}`}
                      >
                        <p className="font-medium text-gray-900">
                          {tour.title}
                        </p>
                        <p className="mt-0.5 text-xs text-gray-500">
                          {tour.bookingNumber} · {statusLabel(tour.status)}
                          {tour.startDate
                            ? ` · ${new Date(tour.startDate).toLocaleDateString('tr-TR')}`
                            : ''}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section data-testid="customer-payments-section">
                <h3 className="mb-2 text-sm font-semibold text-gray-900">
                  Ödeme geçmişi
                </h3>
                {detail.payments.length === 0 ? (
                  <p className="text-sm text-gray-500">Ödeme kaydı yok</p>
                ) : (
                  <ul className="space-y-2">
                    {detail.payments.map((p) => (
                      <li
                        key={p.id}
                        className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2.5"
                        data-testid={`customer-payment-${p.id}`}
                      >
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {p.bookingNumber}
                          </p>
                          <p className="text-xs text-gray-500">
                            {paymentLabel(p.paymentStatus)} ·{' '}
                            {new Date(p.createdAt).toLocaleDateString('tr-TR')}
                          </p>
                        </div>
                        <p className="text-sm font-semibold text-gray-900">
                          {Number(p.amount).toLocaleString('tr-TR')}{' '}
                          {p.currency}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>
          ) : null}
        </div>
      </aside>
    </div>
  );
}
