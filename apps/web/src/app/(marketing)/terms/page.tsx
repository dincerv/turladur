import type { Metadata } from 'next';
import Link from 'next/link';

import { LegalPage } from '@/components/legal/legal-page';
import { COMPANY } from '@/lib/company';

export const metadata: Metadata = {
  title: 'Kullanım Şartları',
  description: 'turta platform kullanım şartları.',
};

export default function TermsPage() {
  return (
    <LegalPage title="Kullanım Şartları" updated="Kasım 2026">
      <p>
        turta, gezginler ile onaylı tur acentelerini bir araya getiren bir
        pazaryeridir. Sitedeki turlar ilgili acente tarafından yayınlanır;
        rezervasyon sözleşmesinin tarafı acente ile misafirdir.
      </p>
      <h2>Hesap</h2>
      <p>
        Hesap bilgilerinizin doğruluğundan siz sorumlusunuz. Yetkisiz kullanımı
        derhal bize bildirin.
      </p>
      <h2>Rezervasyon ve iptal</h2>
      <p>
        Fiyat, müsaitlik ve iptal koşulları tur sayfasında ve rezervasyon
        onayında belirtilir. Ödeme, anlaşmalı ödeme kuruluşu üzerinden alınır.
      </p>
      <h2>İletişim</h2>
      <p>
        Sorularınız için <Link href="/contact">iletişim</Link> sayfası veya{' '}
        <a href={`mailto:${COMPANY.emails.info}`}>{COMPANY.emails.info}</a>.
      </p>
    </LegalPage>
  );
}
