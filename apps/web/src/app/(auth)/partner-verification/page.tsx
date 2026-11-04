'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { ArrowLeft, CheckCircle, Mail } from 'lucide-react';

import { BrandLogo } from '@/components/brand/brand-logo';
import { COMPANY_EMAILS } from '@/config/company';

const PARTNER_VERIFY_VISUAL =
  'https://images.unsplash.com/photo-1551632436-cbf8dd35adfa?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80';

function PartnerApplicationReceivedContent() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');

  useEffect(() => {
    const emailParam = searchParams.get('email');
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [searchParams]);

  return (
    <div className="flex min-h-screen bg-neutral-50">
      <div className="relative hidden overflow-hidden lg:block lg:w-1/2">
        <Image
          src={PARTNER_VERIFY_VISUAL}
          alt="turta iş ortaklığı"
          fill
          className="object-cover"
          priority
          sizes="50vw"
        />
        <div className="absolute inset-0 z-10 bg-gradient-to-br from-neutral-900/90 via-neutral-900/85 to-neutral-950/90" />

        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-12 text-center">
          <div className="max-w-lg">
            <h2 className="mb-5 text-4xl font-bold leading-tight tracking-normal text-white xl:text-5xl">
              turta&apos;ya hoş geldiniz
            </h2>
            <p className="mb-10 text-lg font-light text-neutral-200/90">
              Biz gerekli bilgileri kontrol ederken siz arkanıza yaslanın.
              Hesabınız onaylandığında bir e-posta alacaksınız.
            </p>
          </div>
        </div>
      </div>

      <div className="flex w-full items-center justify-center p-6 sm:p-12 lg:w-1/2 lg:p-16">
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
                Partner
              </span>
            </Link>
            <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100">
              <Mail className="h-8 w-8 text-neutral-950" />
            </div>
            <h2 className="mb-3 text-2xl font-bold tracking-tight text-neutral-900 md:text-3xl">
              Başvurunuzu aldık
            </h2>
            <p className="text-sm leading-relaxed text-neutral-600">
              Biz gerekli bilgileri kontrol ederken siz arkanıza yaslanın,
              turta&apos;ya hoş geldiniz!
            </p>
            <p className="mt-3 text-sm text-neutral-500">
              Hesabınız onaylandığında bir e-posta alacaksınız.
            </p>
            {email ? (
              <p className="mt-3 text-sm text-neutral-500">
                Onay e-postası şu kutuya gelecek:{' '}
                <span className="font-medium text-neutral-800">{email}</span>
              </p>
            ) : null}
          </div>

          <div className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
            <h3 className="mb-3 text-sm font-medium text-neutral-900">
              Bundan sonra
            </h3>
            <ol className="space-y-3 text-sm text-neutral-600">
              <li className="flex items-start">
                <CheckCircle className="mr-2 mt-0.5 h-5 w-5 shrink-0 text-neutral-950" />
                <span>Ekibimiz başvurunuzu inceler</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="mr-2 mt-0.5 h-5 w-5 shrink-0 text-neutral-950" />
                <span>Onay e-postası e-posta kutunuza düşer</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="mr-2 mt-0.5 h-5 w-5 shrink-0 text-neutral-950" />
                <span>Giriş bilgileriyle acente paneline geçersiniz</span>
              </li>
            </ol>
          </div>

          <div className="flex items-center justify-between pt-6">
            <Link
              href="/acente/giris"
              className="inline-flex items-center text-sm font-medium text-neutral-950 hover:text-neutral-800 hover:underline"
            >
              <ArrowLeft className="mr-1.5 h-4 w-4" />
              Giriş sayfasına dön
            </Link>
          </div>

          <div className="pt-6 text-center">
            <p className="text-xs text-neutral-500">
              Sorunuz mu var?{' '}
              <a
                href={`mailto:${COMPANY_EMAILS.partners}`}
                className="font-medium text-neutral-950 underline-offset-2 transition-colors duration-150 hover:text-neutral-800 hover:underline"
              >
                Destek ile iletişime geçin
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PartnerVerificationPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-neutral-50 text-neutral-600">
          Yükleniyor…
        </div>
      }
    >
      <PartnerApplicationReceivedContent />
    </Suspense>
  );
}
