import type { Metadata } from 'next';
import Link from 'next/link';

import { LegalPage } from '@/components/legal/legal-page';
import { COMPANY } from '@/lib/company';

export const metadata: Metadata = {
  title: 'Sıkça Sorulan Sorular',
  description: 'turta rezervasyon, iptal ve acente soruları.',
};

const items = [
  {
    q: 'Nasıl rezervasyon yaparım?',
    a: 'Tur sayfasından tarih ve kişi sayısını seçip ödeme adımını tamamlayın. Onay e-posta ile gelir.',
  },
  {
    q: 'İptal nasıl olur?',
    a: 'Rezervasyonlarım üzerinden talep oluşturun. Koşullar tur ve acente politikasına göre değişir.',
  },
  {
    q: 'Ödeme güvenli mi?',
    a: 'Kart bilgisi turta sunucularında saklanmaz; ödeme anlaşmalı kuruluş üzerinden alınır.',
  },
  {
    q: 'Acente olarak nasıl katılırım?',
    a: 'Acente başvurusu sayfasından kayıt olun. Onay sonrası tur yayınlayabilirsiniz.',
  },
];

export default function FaqPage() {
  return (
    <LegalPage title="Sıkça sorulan sorular">
      {items.map((item) => (
        <div key={item.q}>
          <h2>{item.q}</h2>
          <p>{item.a}</p>
        </div>
      ))}
      <p>
        Başka bir sorunuz varsa <Link href="/contact">iletişim formu</Link> veya{' '}
        <a href={`mailto:${COMPANY.emails.support}`}>
          {COMPANY.emails.support}
        </a>
        .
      </p>
    </LegalPage>
  );
}
