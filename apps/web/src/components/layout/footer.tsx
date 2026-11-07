'use client';

import Link from 'next/link';
import { Mail, MapPin } from 'lucide-react';

import { BrandLogo } from '@/components/brand/brand-logo';
import { COMPANY, getCompanyAddressLines } from '@/lib/company';

interface FooterProps {
  className?: string;
}

const footerLinks = [
  {
    title: 'Keşfet',
    links: [
      { label: 'Turlar', href: '/tours' },
      { label: 'Rotalar', href: '/routes' },
      { label: 'Aktiviteler', href: '/activities' },
      { label: 'Blog', href: '/blog' },
    ],
  },
  {
    title: 'Şirket',
    links: [
      { label: 'Hakkımızda', href: '/about' },
      { label: 'Kariyer', href: '/careers' },
      { label: 'İletişim', href: '/contact' },
      { label: 'Acente Başvurusu', href: '/partner-register' },
    ],
  },
  {
    title: 'Destek',
    links: [
      { label: 'S.S.S.', href: '/faq' },
      { label: 'Gizlilik Politikası', href: '/privacy' },
      { label: 'Kullanım Şartları', href: '/terms' },
      { label: 'Çerez Politikası', href: '/cookie-policy' },
    ],
  },
];

const legalLinks = [
  { label: 'Kullanım Şartları', href: '/terms' },
  { label: 'Gizlilik Politikası', href: '/privacy' },
  { label: 'Çerez Politikası', href: '/cookie-policy' },
];

export function Footer({ className = '' }: FooterProps) {
  const currentYear = new Date().getFullYear();
  const addressLines = getCompanyAddressLines();

  return (
    <footer
      className={`bg-neutral-900 pt-16 pb-8 text-neutral-400 ${className}`}
    >
      <div className="container mx-auto px-6">
        <div className="mb-16 grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-4">
            <div className="mb-6 flex items-center">
              <Link href="/" className="group flex items-center">
                <BrandLogo variant="wordmark" surface="dark" href={null} />
              </Link>
            </div>
            <p className="mb-4 text-sm leading-relaxed text-neutral-300">
              Keşfet. Deneyimle. Hatırla.
            </p>
            <p className="mb-6 text-sm leading-relaxed text-neutral-400">
              Türkiye&apos;nin tur acentelerini tek platformda buluşturuyoruz.
            </p>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-neutral-500" />
                <div>
                  {addressLines.map((line) => (
                    <p key={line}>{line}</p>
                  ))}
                </div>
              </div>
              <a
                href={`mailto:${COMPANY.emails.info}`}
                className="flex items-center gap-2 transition-colors hover:text-white"
              >
                <Mail className="h-4 w-4 shrink-0 text-neutral-500" />
                {COMPANY.emails.info}
              </a>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 md:grid-cols-3 lg:col-span-8">
            {footerLinks.map((section) => (
              <div key={section.title}>
                <h4 className="mb-4 text-sm font-semibold tracking-wide text-white">
                  {section.title}
                </h4>
                <ul className="space-y-2.5">
                  {section.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="text-sm transition-colors duration-200 hover:text-white"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 border-t border-neutral-800 pt-8">
          <div className="flex flex-col items-center justify-between sm:flex-row">
            <div className="mb-4 text-xs text-neutral-500 sm:mb-0">
              © {currentYear} turta. Tüm hakları saklıdır.
            </div>
            <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs">
              {legalLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="text-neutral-500 transition-colors duration-200 hover:text-white"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
