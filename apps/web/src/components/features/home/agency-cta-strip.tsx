import Link from 'next/link';
import { ArrowRight, Building2 } from 'lucide-react';

/** Footer ile tek koyu blok — arada beyaz boşluk yok, ince ayırıcı çizgi var. */
export function AgencyCtaStrip() {
  return (
    <section
      data-testid="home-agency-cta"
      className="border-b border-zinc-800 bg-zinc-950"
    >
      <div className="container mx-auto flex max-w-7xl flex-col items-start justify-between gap-4 px-6 py-5 sm:flex-row sm:items-center">
        <div className="flex min-w-0 items-start gap-3 text-white sm:items-center">
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 sm:mt-0">
            <Building2 className="h-4 w-4 text-white" aria-hidden />
          </span>
          <p className="text-sm leading-relaxed text-white/90 sm:text-base">
            <span className="font-semibold text-white">
              Tur acenteniz mi var?
            </span>{' '}
            Turlarınızı Turta&apos;da yayınlayın.
          </p>
        </div>
        <Link
          href="/partner-register"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-semibold text-neutral-950 transition hover:bg-neutral-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
        >
          Acente Başvurusu
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>
    </section>
  );
}

export default AgencyCtaStrip;
