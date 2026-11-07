import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  Eye,
  Globe,
  Heart,
  Lightbulb,
  MapPin,
  ShieldCheck,
  Users,
} from 'lucide-react';

import {
  getCompanyAddressLines,
  getCompanyMapsDirectionsUrl,
} from '@/lib/company';

const values = [
  {
    title: 'Şeffaflık',
    description:
      'Her turun arkasında hangi acentenin olduğu görünür. Fiyat ve koşullar net yazılır.',
    icon: Eye,
  },
  {
    title: 'Güven',
    description:
      'Acenteler başvurur, ekibimiz inceler. Yayınlanan turlar onaylı işletmelerden gelir.',
    icon: ShieldCheck,
  },
  {
    title: 'Yerel ekosistem',
    description:
      'Türkiye’deki tur acentelerini tek yerde buluşturuyoruz; gezgin de acente de kazansın.',
    icon: Globe,
  },
  {
    title: 'Kullanıcı odaklılık',
    description:
      'Arama, karşılaştırma ve rezervasyonu sade tutuyoruz. Gereksiz adım yok.',
    icon: Heart,
  },
  {
    title: 'İş birliği',
    description:
      'Acentelerle birlikte büyüyoruz. Turlarını yayınlasınlar, yeni gezginlere ulaşsınlar.',
    icon: Users,
  },
  {
    title: 'Sade teknoloji',
    description:
      'Gösterişli vaat yerine çalışan ürün: rezervasyon, ödeme ve iletişim tek platformda.',
    icon: Lightbulb,
  },
];

export default function AboutPageContent() {
  const addressLines = getCompanyAddressLines();

  return (
    <div className="bg-neutral-50 text-neutral-800">
      <section className="relative overflow-hidden bg-gradient-to-b from-white to-sky-50/50 pt-40 pb-24 md:pt-48 md:pb-28">
        <div className="container relative z-10 mx-auto px-6">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center rounded-full bg-sky-100 px-3 py-1 text-xs font-medium text-sky-700">
              Hakkımızda
            </div>
            <h1 className="mb-6 text-4xl font-bold leading-tight text-neutral-900 sm:text-5xl">
              Türkiye’deki turları
              <br />
              <span className="text-sky-600">tek yerde</span> topluyoruz
            </h1>
            <p className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-neutral-600">
              turta, gezginlerin acentelerin turlarını karşılaştırıp güvenle
              rezerve ettiği bir pazaryeridir. Ofisimiz Ankara Çankaya’da,
              Bilkent Cyberpark Dikmen Girişim Ofisi’nde.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link
                href="/contact"
                className="inline-flex items-center rounded-lg bg-sky-600 px-6 py-3 text-sm font-medium text-white shadow-sm hover:bg-sky-700"
              >
                Bize ulaşın
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
              <Link
                href="/tours"
                className="inline-flex items-center rounded-lg border border-neutral-200 bg-white px-6 py-3 text-sm font-medium text-sky-600 shadow-sm hover:bg-neutral-50"
              >
                Turları keşfet
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-20 md:py-28" id="profile">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-2 lg:gap-24">
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-neutral-200/50 shadow-xl lg:order-last">
              <Image
                src="https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1600&q=80"
                alt="Seyahat planı"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
            <div className="max-w-xl">
              <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-sky-600">
                Neden turta?
              </p>
              <h2 className="mb-6 text-3xl font-bold text-neutral-900 md:text-4xl">
                Acente belli, fiyat açık, rezervasyon net
              </h2>
              <p className="mb-5 text-base leading-relaxed text-neutral-600">
                Bir turu kimin düzenlediğini görmeden rezervasyon yapmak
                istemezsiniz. turta’da her turda acente adı yer alır; onaylı
                işletmeler yayınlar.
              </p>
              <p className="text-base leading-relaxed text-neutral-600">
                Henüz yolun başındayız: Türkiye’deki turları tek platformda
                topluyor, rezervasyonu sadeleştiriyoruz. Büyük laflar yerine
                çalışan bir ürün kuruyoruz.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-neutral-200/80 bg-neutral-50 py-20 md:py-28">
        <div className="container mx-auto px-6">
          <div className="mx-auto mb-14 max-w-3xl text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-sky-600">
              İlkeler
            </p>
            <h2 className="mb-4 text-3xl font-bold text-neutral-900 md:text-4xl">
              Bizi yönlendiren değerler
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {values.map((value) => (
              <div
                key={value.title}
                className="rounded-xl border border-neutral-200/80 bg-white p-6 shadow-sm"
              >
                <div className="mb-4 flex items-center">
                  <div className="mr-4 flex h-10 w-10 items-center justify-center rounded-lg bg-sky-100">
                    <value.icon className="h-5 w-5 text-sky-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-neutral-900">
                    {value.title}
                  </h3>
                </div>
                <p className="text-sm leading-relaxed text-neutral-600">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-20 md:py-28">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-2">
            <div>
              <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-sky-600">
                Ofis
              </p>
              <h2 className="mb-4 text-3xl font-bold text-neutral-900">
                Ankara’dan çalışıyoruz
              </h2>
              <p className="mb-6 text-neutral-600">
                Ziyaret için lütfen önceden randevu alın.
              </p>
              <div className="space-y-2 text-neutral-700">
                {addressLines.map((line) => (
                  <p key={line} className="flex items-start gap-2">
                    <MapPin className="mt-1 h-4 w-4 shrink-0 text-sky-600" />
                    {line}
                  </p>
                ))}
              </div>
              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href={getCompanyMapsDirectionsUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center rounded-lg bg-sky-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-sky-700"
                >
                  Haritada aç
                </a>
                <Link
                  href="/contact"
                  className="inline-flex items-center rounded-lg border border-neutral-200 px-5 py-2.5 text-sm font-medium text-sky-700 hover:bg-neutral-50"
                >
                  Randevu iste
                </Link>
              </div>
            </div>
            <div className="rounded-2xl border border-sky-100 bg-sky-50/80 p-8">
              <h3 className="mb-3 text-xl font-semibold text-neutral-900">
                Acente misiniz?
              </h3>
              <p className="mb-6 text-sm leading-relaxed text-neutral-600">
                Turlarınızı turta’da yayınlayın, yeni gezginlere ulaşın.
                Başvurunuz incelenir, onay sonrası panele erişirsiniz.
              </p>
              <Link
                href="/partner-register"
                className="inline-flex items-center text-sm font-medium text-sky-700 hover:text-sky-800"
              >
                Acente başvurusu
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
