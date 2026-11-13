import Link from 'next/link';

export function BlogPostCta() {
  return (
    <aside className="mt-12 max-w-prose rounded-xl border border-neutral-200 bg-neutral-50 p-5 sm:p-6">
      <p className="font-semibold text-neutral-900">Rotanı şimdi planla</p>
      <p className="mt-1 text-sm leading-relaxed text-neutral-600">
        Yazıdaki destinasyonlara uygun tur ve aktiviteleri turta’da keşfet.
      </p>
      <div className="mt-4 flex flex-wrap gap-3 text-sm">
        <Link
          href="/routes"
          className="inline-flex min-h-11 items-center justify-center rounded-lg bg-neutral-950 px-4 py-2 font-semibold text-white transition hover:bg-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2"
        >
          Rotalar
        </Link>
        <Link
          href="/tours"
          className="inline-flex min-h-11 items-center justify-center rounded-lg border border-neutral-300 bg-white px-4 py-2 font-medium text-neutral-800 transition hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2"
        >
          Turlar
        </Link>
        <Link
          href="/activities"
          className="inline-flex min-h-11 items-center justify-center rounded-lg border border-neutral-300 bg-white px-4 py-2 font-medium text-neutral-800 transition hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2"
        >
          Aktiviteler
        </Link>
      </div>
    </aside>
  );
}
