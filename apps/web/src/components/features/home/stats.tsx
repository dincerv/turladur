'use client';

import Link from 'next/link';
import { ArrowRight, BadgeCheck, Mail, Map, Store } from 'lucide-react';

const points = [
  {
    title: 'Onaylı acenteler',
    description:
      'Acenteler başvurur; tur yayınlayabilmeleri için ekibimizin onayından geçerler.',
    icon: BadgeCheck,
  },
  {
    title: 'Turu kimin düzenlediği belli',
    description:
      'Her turda düzenleyen acentenin adı yer alır; kiminle yola çıkacağınızı bilirsiniz.',
    icon: Store,
  },
  {
    title: 'Onay e-postanızda',
    description:
      'Rezervasyonunuz tamamlandığında voucher belgeniz e-posta adresinize gider.',
    icon: Mail,
  },
  {
    title: 'Rotalar tek yerde',
    description:
      'Kapadokya’dan Likya Yolu’na, farklı acentelerin turlarını karşılaştırın.',
    icon: Map,
  },
];

export function Stats() {
  return (
    <section className="bg-white py-20 md:py-28">
      <div className="container mx-auto max-w-7xl px-6">
        <div className="mx-auto mb-14 max-w-3xl text-center">
          <h2 className="mb-4 text-3xl font-bold text-neutral-900 md:text-4xl">
            Güvenle seçin, rahatça yola çıkın
          </h2>
          <p className="text-lg text-neutral-600">
            Türkiye’deki tur acentelerini tek platformda buluşturuyoruz; her
            turun arkasında kimin olduğu açıkça görünür.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {points.map((item) => (
            <div
              key={item.title}
              className="rounded-xl border border-neutral-200/70 bg-white p-6"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-sky-100">
                <item.icon className="h-5 w-5 text-sky-600" />
              </div>
              <h3 className="mb-2 text-base font-semibold text-neutral-900">
                {item.title}
              </h3>
              <p className="text-sm leading-relaxed text-neutral-600">
                {item.description}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link
            href="/tours"
            className="inline-flex items-center rounded-lg bg-neutral-950 px-6 py-3 text-sm font-medium text-white hover:bg-neutral-800"
          >
            Turları keşfet
            <ArrowRight className="ml-1.5 h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

export default Stats;
