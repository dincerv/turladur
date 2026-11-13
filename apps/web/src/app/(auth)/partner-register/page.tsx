import Image from 'next/image';
import Link from 'next/link';

import { PartnerRegisterForm } from '@/components/features/auth/partner-register/partner-register-form';
import { BrandLogo } from '@/components/brand/brand-logo';

const PARTNER_REGISTER_VISUAL =
  'https://images.unsplash.com/photo-1551632436-cbf8dd35adfa?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80';

const USPS = [
  'Şeffaf komisyon ve rezervasyon akışı',
  'Operasyon paneli ve destek kanalları',
  'Türkiye genelinde turist erişimi',
] as const;

/** Server Component — interactive island: PartnerRegisterForm. */
export default function PartnerRegisterPage() {
  return (
    <div className="flex min-h-screen bg-neutral-50">
      <aside className="relative hidden overflow-hidden lg:block lg:w-1/2">
        <Image
          src={PARTNER_REGISTER_VISUAL}
          alt=""
          fill
          className="object-cover"
          priority
          sizes="50vw"
        />
        <div className="absolute inset-0 z-10 bg-gradient-to-br from-neutral-900/90 via-neutral-900/85 to-neutral-950/90" />
        <div className="absolute inset-0 z-20 flex flex-col justify-center p-12 text-white">
          <div className="max-w-prose">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-neutral-300">
              B2B Acente
            </p>
            <h1 className="mb-4 text-balance text-4xl font-bold leading-tight tracking-tight xl:text-5xl">
              turta Acente Ağına Katılın
            </h1>
            <p className="mb-8 text-lg font-light leading-relaxed text-neutral-200">
              Kurumsal vitrininiz, rezervasyon yönetimi ve gelir takibi tek
              panelde. Başvurunuz incelendikten sonra yayınlamaya
              başlayabilirsiniz.
            </p>
            <ul className="space-y-2 text-sm leading-relaxed text-neutral-300">
              {USPS.map((item) => (
                <li key={item}>· {item}</li>
              ))}
            </ul>
          </div>
        </div>
      </aside>

      <div className="flex w-full items-center justify-center px-6 py-10 sm:px-12 sm:py-14 lg:w-1/2 lg:px-16 lg:py-16">
        <div className="w-full max-w-md">
          <div className="mb-6 text-center lg:text-left">
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
              <span className="text-sm font-semibold text-neutral-700">
                Partner
              </span>
            </Link>
            <h2 className="mb-2 text-2xl font-bold tracking-tight text-neutral-900 md:text-3xl">
              İş Ortağı Hesabı Oluşturun
            </h2>
            <p className="text-sm leading-relaxed text-neutral-500 lg:hidden">
              İki adımda kurumsal başvurunuzu tamamlayın.
            </p>
          </div>

          <PartnerRegisterForm />
        </div>
      </div>
    </div>
  );
}
