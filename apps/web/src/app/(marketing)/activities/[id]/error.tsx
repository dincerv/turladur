'use client';

import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';

export default function ActivityDetailError({
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 pt-24 text-center">
      <AlertTriangle aria-hidden className="mb-4 h-10 w-10 text-amber-500" />
      <h1 className="text-xl font-semibold text-neutral-900">
        Aktivite şu anda yüklenemedi
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-neutral-600">
        Bağlantı sorunu yaşanmış olabilir. Lütfen tekrar deneyin.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="inline-flex min-h-11 items-center rounded-xl bg-sky-600 px-5 text-sm font-semibold text-white hover:bg-sky-700"
        >
          Tekrar dene
        </button>
        <Link
          href="/activities"
          className="inline-flex min-h-11 items-center rounded-xl border border-neutral-300 px-5 text-sm font-semibold text-neutral-800 hover:bg-neutral-50"
        >
          Tüm aktiviteler
        </Link>
      </div>
    </div>
  );
}
