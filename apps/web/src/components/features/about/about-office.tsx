import Link from 'next/link';
import { ArrowRight, MapPin } from 'lucide-react';

import {
  getCompanyAddressLines,
  getCompanyMapsDirectionsUrl,
} from '@/lib/company';

import { ABOUT_OFFICE_IMAGES } from './about-data';
import { AboutMedia } from './about-media';
import { AboutReveal } from './about-reveal';

export function AboutOffice() {
  const addressLines = getCompanyAddressLines();

  return (
    <section
      id="office"
      aria-labelledby="about-office-heading"
      className="scroll-mt-24 bg-white py-16 md:py-24"
    >
      <div className="container mx-auto px-5 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.15fr)] lg:gap-14">
          <AboutReveal className="order-1">
            <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-sky-600">
              Ofisimiz
            </p>
            <h2
              id="about-office-heading"
              className="mb-4 text-3xl font-bold tracking-tight text-neutral-900 md:text-4xl"
            >
              Ankara’dan çalışıyoruz
            </h2>
            <p className="mb-6 max-w-prose text-base leading-relaxed text-neutral-600">
              Bilkent Cyberpark Dikmen Girişim Ofisi’ndeyiz. Ziyaret için lütfen
              önceden randevu alın.
            </p>

            <address className="mb-8 space-y-2 not-italic text-neutral-700">
              {addressLines.map((line) => (
                <p
                  key={line}
                  className="flex items-start gap-2 text-sm leading-relaxed sm:text-base"
                >
                  <MapPin
                    className="mt-1 h-4 w-4 shrink-0 text-sky-600"
                    aria-hidden
                  />
                  <span className="min-w-0 break-words">{line}</span>
                </p>
              ))}
            </address>

            <div className="flex flex-wrap gap-3">
              <a
                href={getCompanyMapsDirectionsUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center rounded-lg bg-sky-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-sky-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2"
              >
                Haritada aç
              </a>
              <Link
                href="/contact"
                className="inline-flex items-center rounded-lg border border-neutral-200 px-5 py-2.5 text-sm font-medium text-sky-700 transition hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2"
              >
                Randevu iste
              </Link>
            </div>

            <aside className="mt-10 rounded-2xl border border-sky-100 bg-sky-50/80 p-6 sm:p-8">
              <h3 className="mb-3 text-xl font-semibold text-neutral-900">
                Acente misiniz?
              </h3>
              <p className="mb-5 max-w-prose text-sm leading-relaxed text-neutral-600">
                Turlarınızı turta’da yayınlayın, yeni gezginlere ulaşın.
                Başvurunuz incelenir, onay sonrası panele erişirsiniz.
              </p>
              <Link
                href="/partner-register"
                className="inline-flex items-center text-sm font-medium text-sky-700 transition hover:text-sky-800"
              >
                Acente başvurusu
                <ArrowRight className="ml-1.5 h-4 w-4" aria-hidden />
              </Link>
            </aside>
          </AboutReveal>

          <AboutReveal delay={0.08} className="order-2">
            <div
              className="grid grid-cols-2 auto-rows-[110px] gap-3 sm:auto-rows-[130px] sm:gap-4 md:auto-rows-[150px]"
              aria-label="Ofis görselleri"
            >
              {ABOUT_OFFICE_IMAGES.map((image, index) => (
                <AboutMedia
                  key={image.src}
                  image={image}
                  sizes={
                    index === 0
                      ? '(max-width: 640px) 100vw, 50vw'
                      : '(max-width: 640px) 50vw, 25vw'
                  }
                  roundedClassName="rounded-xl sm:rounded-2xl"
                />
              ))}
            </div>
          </AboutReveal>
        </div>
      </div>
    </section>
  );
}
