import type { Metadata } from 'next';
import Link from 'next/link';

import { LegalPage } from '@/components/legal/legal-page';
import { COMPANY } from '@/lib/company';

export const metadata: Metadata = {
  title: 'Gizlilik Politikası',
  description: 'turta gizlilik politikası — kişisel verilerin işlenmesi.',
};

export default function PrivacyPage() {
  return (
    <LegalPage title="Gizlilik Politikası" updated="Kasım 2026">
      <p>
        turta olarak hesap, rezervasyon ve iletişim formlarında paylaştığınız
        kişisel verileri hizmeti sunmak, yasal yükümlülükleri yerine getirmek ve
        güvenliği sağlamak için işleriz.
      </p>
      <h2>Toplanan veriler</h2>
      <ul>
        <li>Kimlik ve iletişim: ad, e-posta, telefon</li>
        <li>
          Rezervasyon ve ödeme işlemi bilgileri (kart verisi ödeme kuruluşunda
          tutulur)
        </li>
        <li>Teknik günlükler: IP, tarayıcı, oturum</li>
      </ul>
      <h2>Haklarınız</h2>
      <p>
        KVKK kapsamındaki erişim, düzeltme ve silme talepleriniz için{' '}
        <a href={`mailto:${COMPANY.emails.info}`}>{COMPANY.emails.info}</a>{' '}
        adresine yazabilirsiniz.
      </p>
      <p>
        Aydınlatma metni ve çerezler:{' '}
        <Link href="/cookie-policy">Çerez Politikası</Link>.
      </p>
    </LegalPage>
  );
}
