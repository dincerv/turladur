import Image from 'next/image';
import Link from 'next/link';
import { Suspense } from 'react';

import { AcenteVerificationOtp } from '@/components/features/auth/acente-verification-otp';
import { BrandLogo } from '@/components/brand/brand-logo';

const VISUAL =
  'https://images.unsplash.com/photo-1551632436-cbf8dd35adfa?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80';

/** Server Component — interactive island: AcenteVerificationOtp. */
export default function PartnerVerificationVerifyPage() {
  return (
    <div className="flex min-h-screen bg-neutral-50">
      <aside className="relative hidden overflow-hidden lg:block lg:w-1/2">
        <Image
          src={VISUAL}
          alt=""
          fill
          className="object-cover"
          priority
          sizes="50vw"
        />
        <div className="absolute inset-0 z-10 bg-gradient-to-br from-neutral-900/90 via-neutral-900/85 to-neutral-950/90" />
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-12 text-center">
          <div className="max-w-prose">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-neutral-300">
              Acente Doğrulama
            </p>
            <h1 className="mb-4 text-balance text-4xl font-bold leading-tight tracking-tight text-white xl:text-5xl">
              6 haneli kodunuz
            </h1>
            <p className="text-lg font-light leading-relaxed text-neutral-200/90">
              Güvenli giriş için e-postanızdaki kodu bu ekranda onaylayın.
            </p>
          </div>
        </div>
      </aside>

      <div className="flex w-full items-center justify-center px-6 py-10 sm:px-12 lg:w-1/2 lg:px-16">
        <div className="w-full max-w-md">
          <Link href="/" className="mb-8 inline-flex">
            <BrandLogo variant="wordmark" surface="light" href={null} />
          </Link>
          <Suspense
            fallback={
              <div className="py-16 text-center text-sm text-neutral-500">
                Yükleniyor…
              </div>
            }
          >
            <AcenteVerificationOtp />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
