import Link from 'next/link';
import { ArrowRight, MapPin, Mail } from 'lucide-react';

import { COMPANY } from '@/lib/company';

export function CareersPageContent() {
  return (
    <div className="bg-neutral-50 text-neutral-800">
      <section className="bg-gradient-to-b from-white to-sky-50/60 pt-40 pb-24">
        <div className="container mx-auto max-w-3xl px-6 text-center">
          <div className="mb-6 inline-flex items-center rounded-full bg-sky-100 px-3 py-1 text-xs font-medium text-sky-700">
            Kariyer
          </div>
          <h1 className="mb-6 text-4xl font-bold leading-tight text-neutral-900 md:text-5xl">
            Küçük ekip, net iş
          </h1>
          <p className="mb-8 text-lg leading-relaxed text-neutral-600">
            turta Ankara’da kuruluyor. Şu an açık ilan yayınlamıyoruz; birlikte
            çalışmak isterseniz CV ve kısa bir not gönderin.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-neutral-600">
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-sky-600" />
              {COMPANY.city} · {COMPANY.venue}
            </span>
          </div>
        </div>
      </section>

      <section className="bg-white py-20">
        <div className="container mx-auto max-w-xl px-6 text-center">
          <h2 className="mb-4 text-2xl font-bold text-neutral-900">Başvuru</h2>
          <p className="mb-8 text-neutral-600">
            Konu satırına ilgilendiğiniz alanı yazın (ürün, yazılım, operasyon,
            satış). Ofisimiz Çankaya’da; hibrit çalışma mümkün.
          </p>
          <a
            href={`mailto:${COMPANY.emails.info}?subject=Kariyer%20başvurusu`}
            className="inline-flex items-center rounded-lg bg-sky-600 px-6 py-3 text-sm font-medium text-white hover:bg-sky-700"
          >
            <Mail className="mr-2 h-4 w-4" />
            {COMPANY.emails.info}
          </a>
          <div className="mt-10">
            <Link
              href="/about"
              className="inline-flex items-center text-sm font-medium text-sky-700 hover:text-sky-800"
            >
              Hakkımızda
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
