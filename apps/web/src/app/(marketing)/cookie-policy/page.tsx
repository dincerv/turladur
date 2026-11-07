import type { Metadata } from 'next';

import { LegalPage } from '@/components/legal/legal-page';

export const metadata: Metadata = {
  title: 'Çerez Politikası',
  description: 'turta çerez politikası.',
};

export default function CookiePolicyPage() {
  return (
    <LegalPage title="Çerez Politikası" updated="Kasım 2026">
      <p>
        Site, oturumunuzu açık tutmak, güvenliği sağlamak ve temel analitiği
        çalıştırmak için çerez ve benzeri teknolojiler kullanır.
      </p>
      <h2>Zorunlu çerezler</h2>
      <p>
        Giriş, rezervasyon ve güvenlik için gereklidir. Bunlar olmadan site
        düzgün çalışmaz.
      </p>
      <h2>İsteğe bağlı</h2>
      <p>
        Performans ve pazarlama çerezleri, izin verdiğiniz ölçüde kullanılır.
        Tarayıcı ayarlarından çerezleri silebilirsiniz; bazı özellikler
        kısıtlanabilir.
      </p>
    </LegalPage>
  );
}
