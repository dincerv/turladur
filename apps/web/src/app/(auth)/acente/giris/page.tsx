import Image from 'next/image';
import Link from 'next/link';
import { BarChart3, Briefcase, Clock } from 'lucide-react';

import { AcenteLoginForm } from '@/components/features/auth/acente-login-form';
import { BrandLogo } from '@/components/brand/brand-logo';

const PARTNER_LOGIN_VISUAL =
  'https://images.unsplash.com/photo-1551632436-cbf8dd35adfa?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80';

const FEATURES = [
  {
    icon: Briefcase,
    title: 'Rezervasyon Yönetimi',
    desc: 'Tüm rezervasyonları tek panelden takip edin ve yönetin.',
  },
  {
    icon: BarChart3,
    title: 'Gelişmiş Raporlama',
    desc: 'Performans analizi ve finansal özetler tek bakışta.',
  },
  {
    icon: Clock,
    title: 'Kurumsal Destek',
    desc: 'Acente destek ekibimiz iş günü boyunca yanınızda.',
  },
] as const;

/** Server Component — interactive island: AcenteLoginForm. */
export default function PartnerLoginPage() {
  return (
    <div className="flex min-h-screen flex-col bg-neutral-50 lg:flex-row">
      <aside className="relative hidden overflow-hidden lg:block lg:min-h-screen lg:w-1/2">
        <Image
          src={PARTNER_LOGIN_VISUAL}
          alt=""
          fill
          className="object-cover"
          priority
          sizes="50vw"
        />
        <div className="absolute inset-0 z-10 bg-gradient-to-br from-neutral-900/90 via-neutral-900/85 to-neutral-950/90" />
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-12 text-center">
          <div className="max-w-prose space-y-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-300">
              B2B Acente Portalı
            </p>
            <h1 className="text-balance text-4xl font-bold leading-tight tracking-tight text-white xl:text-5xl">
              Acente Portalına Hoş Geldiniz
            </h1>
            <p className="text-lg font-light leading-relaxed text-neutral-200/90">
              turta Acente paneli ile rezervasyonları yönetin, raporları
              inceleyin ve operasyonunuzu tek yerden büyütün.
            </p>
            <div className="space-y-3 pt-2 text-left">
              {FEATURES.map((feature) => (
                <div
                  key={feature.title}
                  className="flex items-start rounded-lg border border-white/15 bg-white/10 p-4 shadow-sm backdrop-blur-sm"
                >
                  <div className="mr-4 mt-0.5 shrink-0 rounded-lg bg-white/20 p-2.5">
                    <feature.icon
                      className="h-5 w-5 text-white opacity-90"
                      aria-hidden
                    />
                  </div>
                  <div>
                    <h2 className="mb-0.5 text-sm font-semibold text-white">
                      {feature.title}
                    </h2>
                    <p className="text-xs leading-snug text-neutral-200/80">
                      {feature.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </aside>

      <div className="flex w-full flex-1 items-center justify-center px-6 py-10 sm:px-12 sm:py-14 lg:w-1/2 lg:px-16 lg:py-16">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center lg:text-left">
            <Link
              href="/"
              className="group mb-6 inline-flex items-center gap-2"
            >
              <BrandLogo
                variant="wordmark"
                surface="light"
                href={null}
                className="transition-opacity group-hover:opacity-90"
              />
              <span className="text-sm font-semibold text-neutral-600">
                Acente
              </span>
            </Link>
            <h2 className="mb-2 text-2xl font-bold tracking-tight text-neutral-900 md:text-3xl">
              Acente Girişi
            </h2>
            <p className="max-w-prose text-sm leading-relaxed text-neutral-500">
              İş ortağı hesabınızla panele güvenli giriş yapın.
            </p>
          </div>

          <AcenteLoginForm />
        </div>
      </div>
    </div>
  );
}
