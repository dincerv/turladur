import Link from 'next/link';
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  MailCheck,
  MapPinned,
} from 'lucide-react';

const pillars = [
  {
    id: 'approved-agencies',
    title: 'Onaylı acenteler',
    description:
      'Acenteler turta’ya başvurur; tur yayınlayabilmeleri için ekibimizin onayından geçerler.',
    icon: BadgeCheck,
  },
  {
    id: 'visible-operator',
    title: 'Turu kimin düzenlediği belli',
    description:
      'Her turda düzenleyen acentenin adı ve logosu yer alır; kiminle yola çıkacağınızı bilirsiniz.',
    icon: Building2,
  },
  {
    id: 'voucher-email',
    title: 'Onay e-postanızda',
    description:
      'Rezervasyonunuz tamamlandığında voucher belgeniz e-posta adresinize gönderilir.',
    icon: MailCheck,
  },
  {
    id: 'routes',
    title: 'Türkiye’nin rotaları tek yerde',
    description:
      'Kapadokya’dan Likya Yolu’na, farklı acentelerin turlarını rota bazında karşılaştırın.',
    icon: MapPinned,
  },
];

export function Trust() {
  return (
    <section className="border-y border-neutral-200/60 bg-white py-20 md:py-28">
      <div className="container mx-auto max-w-7xl px-6">
        <div className="mx-auto mb-14 max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center justify-center rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-800">
            Neden turta?
          </div>
          <h2 className="mb-4 text-3xl font-bold text-neutral-900 md:text-4xl">
            Güvenle seçin, rahatça yola çıkın
          </h2>
          <p className="text-lg text-neutral-600">
            Türkiye’deki tur acentelerini tek platformda buluşturuyoruz; her
            turun arkasında kimin olduğu açıkça görünür.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:gap-8 lg:grid-cols-4">
          {pillars.map((pillar) => {
            const Icon = pillar.icon;
            return (
              <div
                key={pillar.id}
                className="rounded-xl border border-neutral-200/70 bg-white p-6 transition-all duration-300 ease-out hover:border-neutral-300 hover:shadow-sm"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-100">
                  <Icon className="h-5 w-5 text-neutral-950" />
                </div>
                <h3 className="mb-1.5 text-base font-semibold text-neutral-900">
                  {pillar.title}
                </h3>
                <p className="text-sm leading-relaxed text-neutral-600">
                  {pillar.description}
                </p>
              </div>
            );
          })}
        </div>

        <div className="mx-auto mt-16 flex max-w-4xl flex-col items-center justify-between gap-5 rounded-2xl bg-neutral-950 px-8 py-8 text-center md:mt-20 md:flex-row md:text-left">
          <div>
            <p className="text-lg font-semibold text-white">
              Tur acentesi misiniz?
            </p>
            <p className="mt-1 text-sm text-neutral-300">
              Turlarınızı turta’da yayınlayın, yeni gezginlere ulaşın.
            </p>
          </div>
          <Link
            href="/partner-register"
            className="inline-flex shrink-0 items-center justify-center rounded-lg bg-white px-6 py-3 text-sm font-medium text-neutral-950 transition-colors duration-200 hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-neutral-950"
          >
            Acente başvurusu
            <ArrowRight className="ml-1.5 h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

export default Trust;
