'use client';

import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';

interface PartnerForbiddenProps {
  /** Optional first allowed path for CTA */
  fallbackHref?: string;
}

export function PartnerForbidden({
  fallbackHref = '/acente/dashboard',
}: PartnerForbiddenProps) {
  return (
    <div
      className="flex min-h-[50vh] flex-col items-center justify-center px-4 text-center"
      data-testid="partner-forbidden"
    >
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600">
        <ShieldAlert className="h-7 w-7" />
      </div>
      <h1 className="text-xl font-semibold text-gray-900">Yetkiniz yok</h1>
      <p className="mt-2 max-w-md text-sm text-gray-600">
        Bu sayfayı görüntülemek için hesabınıza tanımlı bir yetki bulunmuyor.
        Gerekli izinler için acente yöneticinizle iletişime geçin.
      </p>
      <Link
        href={fallbackHref}
        className="mt-6 rounded-lg bg-neutral-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-neutral-800"
      >
        Panele dön
      </Link>
    </div>
  );
}
