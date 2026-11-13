import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

import { AboutMedia } from './about-media';
import { ABOUT_HERO_IMAGE } from './about-data';
import { AboutReveal } from './about-reveal';

export function AboutHero() {
  return (
    <header className="relative overflow-hidden bg-gradient-to-b from-white to-sky-50/50 pt-32 pb-16 md:pt-40 md:pb-20">
      <div className="container mx-auto px-5 sm:px-6 lg:px-8">
        <AboutReveal className="mx-auto max-w-3xl text-center">
          <p className="mb-5 inline-flex items-center rounded-full bg-sky-100 px-3 py-1 text-xs font-medium text-sky-700">
            Hakkımızda
          </p>
          <h1 className="mb-5 text-4xl font-bold tracking-tight text-balance text-neutral-900 sm:text-5xl sm:leading-[1.15]">
            Türkiye’deki turları <span className="text-sky-600">tek yerde</span>{' '}
            topluyoruz
          </h1>
          <p className="mx-auto mb-8 max-w-prose text-lg leading-relaxed text-neutral-600">
            turta, gezginlerin acentelerin turlarını karşılaştırıp güvenle
            rezerve ettiği bir pazaryeridir. Ofisimiz Ankara Çankaya’da, Bilkent
            Cyberpark Dikmen Girişim Ofisi’nde.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/contact"
              className="inline-flex items-center rounded-lg bg-sky-600 px-6 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-sky-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2"
            >
              Bize ulaşın
              <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
            </Link>
            <Link
              href="/tours"
              className="inline-flex items-center rounded-lg border border-neutral-200 bg-white px-6 py-3 text-sm font-medium text-sky-600 shadow-sm transition hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2"
            >
              Turları keşfet
            </Link>
          </div>
        </AboutReveal>

        <AboutReveal delay={0.08} className="mx-auto mt-12 max-w-5xl">
          <AboutMedia
            image={ABOUT_HERO_IMAGE}
            sizes="(max-width: 768px) 100vw, 1024px"
            roundedClassName="rounded-2xl"
          />
        </AboutReveal>
      </div>
    </header>
  );
}
