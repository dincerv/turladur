'use client';

import { useEffect, useMemo, useState } from 'react';
import { Search, Users } from 'lucide-react';

import { listPartnerReservations } from '@/services/partner-admin';
import { useAuth } from '@/providers/auth-provider';

type CustomerRow = {
  email: string;
  bookings: number;
  totalSpent: number;
  currency: string;
  lastBookingAt: string;
};

export default function PartnerCustomersPage() {
  const { accessToken } = useAuth();
  const [rows, setRows] = useState<CustomerRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!accessToken) return;
    void listPartnerReservations(accessToken, { pageSize: 50 })
      .then((result) => {
        const reservations = result.items;
        const map = new Map<string, CustomerRow>();
        for (const r of reservations) {
          const email = r.contactEmail || 'bilinmiyor';
          const prev = map.get(email);
          const amount = Number(r.totalAmount) || 0;
          if (!prev) {
            map.set(email, {
              email,
              bookings: 1,
              totalSpent: amount,
              currency: r.currency,
              lastBookingAt: r.createdAt,
            });
          } else {
            prev.bookings += 1;
            prev.totalSpent += amount;
            if (new Date(r.createdAt) > new Date(prev.lastBookingAt)) {
              prev.lastBookingAt = r.createdAt;
            }
          }
        }
        setRows(
          Array.from(map.values()).sort((a, b) => b.totalSpent - a.totalSpent),
        );
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [accessToken]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((c) => c.email.toLowerCase().includes(q));
  }, [rows, search]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Müşteriler</h1>
        <p className="mt-1 text-sm text-gray-600">
          Rezervasyonlarınızdaki iletişim bilgilerinden derlenen müşteri
          listesi.
        </p>
      </div>

      <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="relative max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="E-posta ara..."
            className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {error ? (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>
      ) : null}

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 bg-white px-6 py-16 text-center">
          <Users className="mx-auto h-8 w-8 text-gray-400" />
          <p className="mt-3 text-lg font-semibold text-gray-700">
            Müşteri yok
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((c) => (
            <div
              key={c.email}
              className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 font-semibold text-blue-700">
                  {c.email.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-medium text-gray-900">
                    {c.email}
                  </p>
                  <p className="text-xs text-gray-500">
                    Son: {new Date(c.lastBookingAt).toLocaleDateString('tr-TR')}
                  </p>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg bg-gray-50 p-3">
                  <p className="text-xs text-gray-500">Rezervasyon</p>
                  <p className="font-semibold text-gray-900">{c.bookings}</p>
                </div>
                <div className="rounded-lg bg-gray-50 p-3">
                  <p className="text-xs text-gray-500">Harcama</p>
                  <p className="font-semibold text-gray-900">
                    {c.totalSpent.toLocaleString('tr-TR')} {c.currency}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
